import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import User from '@/models/User'; // Wajib di-import untuk populate
import jwt, { JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, secret!) as JwtPayload & { id: string };

        if (!decoded || decoded.role !== 'user') {
            return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });
        }

        await dbConnect();

        // --- PERBAIKAN UTAMA DI SINI ---
        const enrolledClasses = await Class.find({ 
            enrolledStudents: decoded.id,
        })
        // 1. Ambil field yang dibutuhkan, TERMASUK _id
        .select('_id nama deskripsi tutorId')
        // 2. Populate data tutor agar sesuai dengan frontend
        .populate({
            path: 'tutorId',
            select: 'namaLengkap',
            model: User
        })
        .lean(); // Gunakan .lean() untuk performa lebih baik

        return NextResponse.json({ success: true, data: enrolledClasses }, { status: 200 });

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
        }
        console.error('Error saat mengambil daftar kelas siswa:', error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}

