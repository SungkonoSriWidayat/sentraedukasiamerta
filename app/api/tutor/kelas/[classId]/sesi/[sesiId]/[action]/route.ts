import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt, { JwtPayload } from 'jsonwebtoken';
import SesiKelas from '@/models/SesiKelas';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

// Handler untuk PUT: Mengaktifkan atau menonaktifkan sesi
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ classId: string; sesiId: string; action: string }> } // PERBAIKAN: params sebagai Promise
) {
    try {
        // Otentikasi dan Otorisasi Tutor
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 401 });
        const token = authHeader.split(' ')[1];
        let decoded: DecodedToken;
        try {
            decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
        } catch (error) {
            return NextResponse.json({ success: false, message: 'Sesi tidak valid.' }, { status: 401 });
        }
        if (decoded.role !== 'tutor') {
            return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });
        }

        // PERBAIKAN: Tunggu params dengan await
        const { sesiId, action } = await params;

        // Validasi aksi yang diperbolehkan
        if (action !== 'activate' && action !== 'deactivate') {
            return NextResponse.json({ success: false, message: 'Aksi tidak valid.' }, { status: 400 });
        }

        const newStatus = action === 'activate' ? 'Aktif' : 'Nonaktif';

        await dbConnect();

        // Cari sesi berdasarkan ID dan perbarui statusnya
        const updatedSesi = await SesiKelas.findByIdAndUpdate(
            sesiId,
            { status: newStatus },
            { new: true } // Opsi ini akan mengembalikan dokumen yang sudah diperbarui
        );

        if (!updatedSesi) {
            return NextResponse.json({ success: false, message: 'Sesi tidak ditemukan.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedSesi });

    } catch (error) {
        if (error instanceof mongoose.Error.CastError) {
            return NextResponse.json({ success: false, message: 'ID Sesi tidak valid.' }, { status: 400 });
        }
        console.error("API Error updating session status:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}