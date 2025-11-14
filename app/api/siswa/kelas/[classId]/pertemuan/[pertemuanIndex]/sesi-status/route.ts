import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SesiKelas from '@/models/SesiKelas';
import Kelas from '@/models/Class'; // Import model Kelas
import { verify, JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

const secret = process.env.NEXTAUTH_SECRET;

// PERBAIKAN: Cara menerima `params` diubah sesuai standar Next.js App Router
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ classId: string; pertemuanIndex: string }> } // PERBAIKAN: params sebagai Promise
) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        const decoded = verify(token, secret!) as JwtPayload;
        const studentId = decoded.id;

        // PERBAIKAN: `classId` dan `pertemuanIndex` diambil dari `params` dengan await
        const { classId, pertemuanIndex } = await params;
        const index = parseInt(pertemuanIndex, 10);

        if (isNaN(index)) {
             return NextResponse.json({ success: false, message: 'Index pertemuan tidak valid' }, { status: 400 });
        }

        await dbConnect();

        // Langkah 1: Cari kelas untuk mendapatkan ID materi berdasarkan index
        const kelas = await Kelas.findById(classId).select('materi._id');
        if (!kelas || !kelas.materi || kelas.materi.length <= index) {
            return NextResponse.json({ success: false, message: 'Materi untuk pertemuan ini tidak ditemukan' }, { status: 404 });
        }
        const materiId = kelas.materi[index]._id;

        // Langkah 2: Cari sesi berdasarkan classId, studentId, dan materiId yang sudah didapat
        const sesi = await SesiKelas.findOne({
            classId: new mongoose.Types.ObjectId(classId),
            siswaId: new mongoose.Types.ObjectId(studentId),
            materiId: new mongoose.Types.ObjectId(materiId)
        });

        if (!sesi) {
            return NextResponse.json({ success: true, status: 'BelumDitugaskan' });
        }

        // Kembalikan status dan ID sesi agar bisa digunakan jika perlu
        return NextResponse.json({ 
            success: true, 
            status: sesi.status, // 'Aktif' atau 'Nonaktif'
            sesiId: sesi._id 
        });

    } catch (error: any) {
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
        }
        console.error("Error saat mengecek status sesi:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}