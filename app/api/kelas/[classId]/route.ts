// app/api/kelas/[classId]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import { verify } from 'jsonwebtoken';
import mongoose from 'mongoose'; // <-- PERBAIKAN: Tambahkan import ini

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

interface DecodedToken {
  id: string;
  role: string;
}

export async function GET(request: Request, { params }: { params: { classId: string } }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('Akses ditolak: Token tidak ditemukan');
    const decoded = verify(token, JWT_SECRET) as DecodedToken;

    await dbConnect();
    const { classId } = params;
    
    // Pastikan classId adalah string yang valid untuk ObjectId
    if (!mongoose.Types.ObjectId.isValid(classId)) {
        return NextResponse.json({ success: false, message: 'ID Kelas tidak valid.' }, { status: 400 });
    }

    const kelas = await Class.findById(classId);

    if (!kelas) {
      return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan.' }, { status: 404 });
    }

    // LOGIKA OTORISASI (PENJAGA GERBANG)
    const isEnrolled = kelas.enrolledStudents.some(studentId => studentId.toString() === decoded.id);
    const isTutor = kelas.tutorId.toString() === decoded.id;
    const isAdmin = decoded.role === 'admin';

    if (!isEnrolled && !isTutor && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Anda tidak memiliki izin untuk mengakses kelas ini.' }, { status: 403 });
    }

    // Jika lolos, kirim data kelas
    return NextResponse.json({ success: true, data: kelas });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
}
