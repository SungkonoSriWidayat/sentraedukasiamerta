import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Class from '@/models/Class';

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

// Definisikan tipe data untuk hasil query .lean()
interface LeanClass {
  _id: mongoose.Types.ObjectId;
  harga: number;
  tutorId: mongoose.Types.ObjectId;
}

interface LeanOrder {
  _id: mongoose.Types.ObjectId;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Token tidak ditemukan' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: DecodedToken;

    try {
      const decodedPayload = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
      if (typeof decodedPayload === 'string' || !decodedPayload.id) {
        throw new Error('Invalid token payload');
      }
      decoded = decodedPayload as DecodedToken;
    } catch (error) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Token tidak valid' }, { status: 401 });
    }

    if (decoded.role !== 'user') {
      return NextResponse.json({ success: false, message: 'Forbidden: Hanya pengguna terdaftar yang bisa mendaftar kelas.' }, { status: 403 });
    }

    await dbConnect();
    const { classId } = await req.json();

    if (!classId) {
      return NextResponse.json({ success: false, message: 'Class ID diperlukan.' }, { status: 400 });
    }

    const kelas = await Class.findById(classId).select('harga tutorId').lean<LeanClass>();
    if (!kelas) {
      return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan.' }, { status: 404 });
    }

    if (!kelas.tutorId) {
      console.error(`Data Error: Kelas dengan ID ${classId} tidak memiliki tutorId.`);
      return NextResponse.json({
        success: false,
        message: 'Kelas ini belum siap untuk pendaftaran karena belum ada tutor yang ditugaskan.'
      }, { status: 400 });
    }

    const existingOrder = await Order.findOne({
      classId: classId,
      studentId: decoded.id, // Sesuai dengan model Order Anda
    }).lean<LeanOrder>();

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        isNew: false,
        message: 'Anda sudah pernah mendaftar kelas ini.',
        orderId: existingOrder._id,
      }, { status: 200 });
    }

    const newOrder = new Order({
      studentId: decoded.id,  // Sesuai dengan model Order Anda
      tutorId: kelas.tutorId,   // Sesuai dengan model Order Anda
      classId: classId,         // Sesuai dengan model Order Anda
      amount: kelas.harga,      // Sesuai dengan model Order Anda
    });

    await newOrder.save();

    return NextResponse.json({
      success: true,
      isNew: true,
      message: 'Pendaftaran kelas berhasil!',
      orderId: newOrder._id,
    }, { status: 201 });

  } catch (error) {
    console.error('API Error creating order:', error);
    return NextResponse.json({
        success: false,
        message: 'Terjadi kesalahan internal pada server.',
        error: (error as Error).message
    }, { status: 500 });
  }
}
