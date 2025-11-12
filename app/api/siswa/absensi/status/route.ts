import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, secret!) as JwtPayload;
        const studentId = decoded.id;
        
        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('classId');
        const pertemuanIndex = parseInt(searchParams.get('pertemuan') as string, 10);

        if (!classId || isNaN(pertemuanIndex)) {
            return NextResponse.json({ success: false, message: 'Data tidak lengkap.' }, { status: 400 });
        }

        await dbConnect();

        const attendance = await Attendance.findOne({
            classId: new mongoose.Types.ObjectId(classId),
            studentId: new mongoose.Types.ObjectId(studentId),
            pertemuan: pertemuanIndex + 1,
        });

        if (!attendance) {
            return NextResponse.json({ success: true, data: { status: 'BelumMulai' } });
        }
        
        // Logika sederhana: hanya mengembalikan apa yang ada di database
        return NextResponse.json({
            success: true,
            data: {
                status: attendance.status,
                // Awalnya tidak ada sessionEndTime, jadi ini akan null
                waktuSelesai: (attendance as any).sessionEndTime ? (attendance as any).sessionEndTime.getTime() : null,
            },
        });

    } catch (error) {
        console.error("Error saat memeriksa status absensi:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}

