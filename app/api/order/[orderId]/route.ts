import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import '@/models/User'; // Memastikan model User ter-load
import '@/models/Class'; // Memastikan model Class ter-load

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

// PERBAIKAN: Membuat interface yang lebih detail untuk hasil populate
interface IPopulatedOrder {
  _id: mongoose.Types.ObjectId;
  studentId: {
    _id: mongoose.Types.ObjectId;
    namaLengkap: string;
    nomorWhatsapp: string;
  };
  classId: {
    _id: mongoose.Types.ObjectId;
    nama: string;
    jadwal: string;
  };
  tutorId: {
    _id: mongoose.Types.ObjectId;
    namaLengkap: string;
  };
  status: string;
  amount: number;
  // Tambahkan field lain dari model Order jika diperlukan
}

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ orderId: string }> } // PERBAIKAN: params sebagai Promise
) {
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

    await dbConnect();
    
    // PERBAIKAN: Tunggu params dengan await
    const { orderId } = await params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: 'ID Order tidak valid' }, { status: 400 });
    }

    // PERBAIKAN: Memberi tahu TypeScript tipe data yang benar
    const order = await Order.findById(orderId)
      .populate({
        path: 'studentId',
        model: 'User',
        select: 'namaLengkap nomorWhatsapp'
      })
      .populate({
        path: 'classId',
        model: 'Class',
        select: 'nama jadwal'
      })
      .populate({
        path: 'tutorId',
        model: 'User',
        select: 'namaLengkap'
      })
      .lean<IPopulatedOrder>();

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });
    }
    
    // Pengecekan keamanan (sekarang tidak akan eror)
    const studentIdString = order.studentId._id.toString();

    if (decoded.role === 'user' && studentIdString !== decoded.id) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: order }, { status: 200 });

  } catch (error) {
    console.error('API Error fetching order details:', error);
    return NextResponse.json({
        success: false,
        message: 'Terjadi kesalahan internal pada server.',
        error: (error as Error).message
    }, { status: 500 });
  }
}