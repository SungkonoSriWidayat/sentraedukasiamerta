// Di dalam file: app/api/tutor/sesikelas/[sesiId]/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SesiKelas from '@/models/SesiKelas';
import { verify, JwtPayload } from 'jsonwebtoken'; // <-- DIGANTI: Menggunakan import Anda

const secret = process.env.NEXTAUTH_SECRET; // <-- DITAMBAHKAN: Mengambil secret key

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ sesiId: string }> } // PERBAIKAN: params sebagai Promise
) {
    const token = req.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak: Token tidak ada' }, { status: 401 });
    }

    try {
        // --- DIGANTI: Menggunakan metode verifikasi Anda ---
        const decoded = verify(token, secret!) as JwtPayload;

        // Memastikan hanya tutor yang bisa menghapus
        if (decoded.role !== 'tutor') {
            return NextResponse.json({ success: false, message: 'Akses tidak sah' }, { status: 403 });
        }
        // ---------------------------------------------

        await dbConnect();
        
        // PERBAIKAN: Tunggu params dengan await
        const { sesiId } = await params;

        if (!sesiId) {
            return NextResponse.json({ success: false, message: 'ID Sesi diperlukan' }, { status: 400 });
        }

        const deletedSesi = await SesiKelas.findByIdAndDelete(sesiId);

        if (!deletedSesi) {
            return NextResponse.json({ success: false, message: 'Sesi tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Sesi berhasil dihapus' });

    } catch (error) {
        // Menangani jika token tidak valid/error
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
        }
        
        console.error('Error saat menghapus sesi:', error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}