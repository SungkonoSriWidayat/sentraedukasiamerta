import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
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
            return NextResponse.json({ success: false, message: 'Data tidak lengkap.' }, { status: 400 });
        }

        await dbConnect();

        // Cari sesi absensi yang sedang berlangsung untuk siswa dan pertemuan ini
        const attendanceRecord = await Attendance.findOne({
            classId: new mongoose.Types.ObjectId(classId),
            studentId: new mongoose.Types.ObjectId(studentId),
            pertemuan: pertemuan + 1, // Sesuaikan dengan zero-based index dari frontend
            status: 'Berlangsung',
        });

        if (!attendanceRecord) {
            return NextResponse.json({ success: false, message: 'Sesi absensi tidak ditemukan atau sudah selesai.' }, { status: 404 });
        }

        // Update status menjadi 'Hadir'
        attendanceRecord.status = 'Hadir';
        await attendanceRecord.save();

        return NextResponse.json({ success: true, message: 'Kehadiran berhasil dikonfirmasi!' });

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
        }
        console.error('Error saat konfirmasi absensi:', error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}
