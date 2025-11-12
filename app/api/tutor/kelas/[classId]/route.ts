import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Kelas from '@/models/Class';
import Message from '@/models/Message';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(req: NextRequest, context: { params: { classId: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Token tidak ditemukan atau format salah.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    let decoded: JwtPayload & { id: string; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { id: string; role: string };
    } catch (error) {
      return NextResponse.json({ success: false, message: 'Sesi tidak valid atau telah berakhir.' }, { status: 401 });
    }

    if (decoded.role?.trim() !== 'tutor') {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Peran tidak sesuai.' }, { status: 403 });
    }
    const tutorId = decoded.id;

    const pertemuanParam = req.nextUrl.searchParams.get('pertemuan');
    const pertemuanKe = pertemuanParam ? parseInt(pertemuanParam, 10) : null;
    
    if (pertemuanParam && (isNaN(pertemuanKe!) || pertemuanKe! < 0)) {
      return NextResponse.json({ success: false, message: 'Nomor pertemuan tidak valid.' }, { status: 400 });
    }

    await dbConnect();
    
    User.name;

    const { classId } = context.params;

    const kelas = await Kelas.findById(classId)
      .populate('enrolledStudents', 'namaLengkap')
      .lean();

    if (!kelas) {
      return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan.' }, { status: 404 });
    }
    
    const enrolledStudentsWithDetails = await Promise.all(
      (kelas.enrolledStudents as any[]).map(async (student) => {
        const lastMessage = await Message.findOne({
          classId: new mongoose.Types.ObjectId(classId),
          $or: [
            { senderId: new mongoose.Types.ObjectId(tutorId), receiverId: new mongoose.Types.ObjectId(student._id) },
            { senderId: new mongoose.Types.ObjectId(student._id), receiverId: new mongoose.Types.ObjectId(tutorId) }
          ]
        }).sort({ timestamp: -1 }).lean();

        let attendanceStatus: string | null = null;
        if (pertemuanKe !== null && kelas.materi && kelas.materi[pertemuanKe]) {
          const attendanceRecord = await Attendance.findOne({
            classId: new mongoose.Types.ObjectId(classId),
            studentId: new mongoose.Types.ObjectId(student._id),
            pertemuan: pertemuanKe + 1
          }).lean();

          if (attendanceRecord) {
            attendanceStatus = attendanceRecord.status;
          } else {
            attendanceStatus = 'Belum Absen';
          }
        }

        return {
          ...student,
          lastMessage: lastMessage ? lastMessage.content : "",
          attendanceStatus: attendanceStatus 
        };
      })
    );

    const responseData = { ...kelas, enrolledStudents: enrolledStudentsWithDetails };

    return NextResponse.json({ success: true, data: responseData });

  } catch (error) {
    console.error('Error saat mengambil detail kelas tutor:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

