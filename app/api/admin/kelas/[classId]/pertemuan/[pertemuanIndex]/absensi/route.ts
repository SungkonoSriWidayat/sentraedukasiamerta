import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import User from '@/models/User';
import Attendance from '@/models/Attendance'; // Menggunakan model Attendance Anda
import jwt, { JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest, { params }: { params: { classId: string, pertemuanIndex: string } }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret!) as JwtPayload;
    if (decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });
    }

    await dbConnect();
    
    const { classId, pertemuanIndex } = params;
    const index = parseInt(pertemuanIndex, 10); // Ini adalah 'pertemuan' (misal: 0, 1, 2)

    // 1. Ambil data kelas dan siswa terdaftar
    const kelas = await Class.findById(classId)
      .select('enrolledStudents') // Hanya perlu daftar siswa
      .populate({
        path: 'enrolledStudents',
        model: User,
        select: 'namaLengkap email',
      });

    if (!kelas) {
      return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan.' }, { status: 404 });
    }
    
    // 2. Ambil semua data absensi untuk kelas DAN pertemuan tersebut
    // Menggunakan 'pertemuan: index' sesuai model Anda
    const attendanceRecords = await Attendance.find({ 
      classId: classId,
      pertemuan: index 
    });

    // 4. Gabungkan data siswa dengan data absensi
    const studentsWithAttendance = kelas.enrolledStudents.map(student => {
      // student may be a populated User document (with toObject) or just an ObjectId;
      // normalize to a plain object safely.
      const studentObj: any = (student && typeof (student as any).toObject === 'function')
        ? (student as any).toObject()
        : (typeof student === 'object' ? student : { _id: student });

      const attendanceRecord = attendanceRecords.find(
        (record) => record.studentId.toString() === studentObj._id.toString()
      );

      return {
        ...studentObj,
        // Statusnya sekarang 'Hadir', 'Berlangsung', atau 'Belum Absen'
        attendanceStatus: attendanceRecord ? attendanceRecord.status : 'Belum Absen',
      };
    });
    
    return NextResponse.json({ success: true, data: studentsWithAttendance });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
    }
    console.error("Error API Cek Absensi Admin:", error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

