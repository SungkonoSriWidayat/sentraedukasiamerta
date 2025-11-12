import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Class from '@/models/Class';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret!) as JwtPayload;
    if (decoded.role !== 'user') {
        return NextResponse.json({ success: false, message: 'Akses ditolak. Hanya untuk siswa.' }, { status: 403 });
    }
    const studentId = decoded.id;

    const { classId, pertemuan } = await req.json();

    if (!classId || pertemuan === undefined) {
        return NextResponse.json({ success: false, message: 'Data tidak lengkap (classId dan pertemuan diperlukan).' }, { status: 400 });
    }

    await dbConnect();

    const kelas = await Class.findById(classId).lean();
    if (!kelas) {
        return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan.' }, { status: 404 });
    }

    const existingAttendance = await Attendance.findOne({
        classId: new mongoose.Types.ObjectId(classId),
        studentId: new mongoose.Types.ObjectId(studentId),
        pertemuan: pertemuan + 1,
    });

    if (existingAttendance) {
        return NextResponse.json({ success: false, message: 'Anda sudah memulai sesi untuk pertemuan ini.' }, { status: 409 });
    }

    const newAttendance = new Attendance({
        classId: new mongoose.Types.ObjectId(classId),
        studentId: new mongoose.Types.ObjectId(studentId),
        tutorId: kelas.tutorId,
        pertemuan: pertemuan + 1,
        status: 'Berlangsung',
        sessionStartTime: new Date(),
    });

    await newAttendance.save();

    return NextResponse.json({ success: true, message: 'Sesi berhasil dimulai.', data: newAttendance });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
    }
    console.error('Error saat memulai sesi absensi:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

