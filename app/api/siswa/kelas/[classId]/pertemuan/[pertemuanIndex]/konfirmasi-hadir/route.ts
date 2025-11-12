import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import Attendance from '@/models/Attendance';
import jwt, { JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest, { params }: { params: { classId: string } }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret!) as JwtPayload;
    if (decoded.role !== 'user') {
      return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });
    }

    await dbConnect();
    const { classId } = params;

    // --- PERBAIKAN: Menambahkan 'tutorId' ke dalam .select() ---
    const kelas = await Class.findById(classId)
      .select('nama tutorName materi deskripsi jumlahPertemuan enrolledStudents tutorId')
      .lean();

    if (!kelas) {
      return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan.' }, { status: 404 });
    }

    if (!kelas.enrolledStudents || !Array.isArray(kelas.enrolledStudents)) {
      return NextResponse.json({ success: false, message: 'Data siswa di kelas ini tidak valid.' }, { status: 500 });
    }

    const isEnrolled = kelas.enrolledStudents.some(studentId => studentId.toString() === decoded.id);
    if (!isEnrolled) {
      return NextResponse.json({ success: false, message: 'Anda tidak terdaftar di kelas ini.' }, { status: 403 });
    }

    const studentAttendances = await Attendance.find({ classId: classId, studentId: decoded.id });
    const attendanceMap = new Map();
    studentAttendances.forEach(att => {
        attendanceMap.set(att.pertemuan, att.status);
    });

    const materiArray = Array.isArray(kelas.materi) ? kelas.materi : [];
    const materiWithAttendance = materiArray.map((m, index) => ({
      ...m,
      kehadiranSiswa: attendanceMap.get(index + 1) || 'Belum Absen'
    }));

    const responseData = { ...kelas, materi: materiWithAttendance };
    return NextResponse.json({ success: true, data: responseData }, { status: 200 });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
    }
    console.error('Error saat mengambil detail kelas siswa:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
