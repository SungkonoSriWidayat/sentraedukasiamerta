import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import { verify, JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ classId: string }> } // PERBAIKAN: params sebagai Promise
) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        const decoded = verify(token, secret!) as JwtPayload & { id: string };
        const studentId = decoded.id;
        
        // PERBAIKAN: Tunggu params dengan await
        const { classId } = await params;

        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return NextResponse.json({ success: false, message: 'ID Kelas tidak valid.' }, { status: 400 });
        }

        await dbConnect();

        // Ambil data kelas dan populate data tutor
        const kelas = await Class.findById(classId)
            .populate({
                path: 'tutorId',
                select: '_id namaLengkap', 
                model: User
            })
            .lean();

        if (!kelas) {
            return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan' }, { status: 404 });
        }

        const attendances = await Attendance.find({ 
            classId: new mongoose.Types.ObjectId(classId), 
            studentId: new mongoose.Types.ObjectId(studentId) 
        }).select('pertemuan status').lean();

        const materiWithAttendance = kelas.materi.map((materi: any, index: number) => {
            const attendanceRecord = attendances.find(att => att.pertemuan === (index + 1));
            return {
                ...materi,
                kehadiranSiswa: attendanceRecord ? attendanceRecord.status : 'Belum Absen'
            };
        });

        // --- PERUBAHAN UTAMA: Kirim data apa adanya ---
        const responseData = {
            ...kelas,
            // 'tutorName' diambil dari objek 'tutorId' yang sudah di-populate
            tutorName: (kelas.tutorId as any)?.namaLengkap || 'Tutor Tidak Ditemukan',
            materi: materiWithAttendance,
            // 'tutorId' tetap dikirim sebagai objek, tidak diubah lagi
        };

        return NextResponse.json({ success: true, data: responseData });

    } catch (error: any) {
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
        }
        console.error("Error saat mengambil detail kelas siswa:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}