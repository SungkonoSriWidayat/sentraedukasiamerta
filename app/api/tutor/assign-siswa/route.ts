import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SesiKelas from '@/models/SesiKelas'; // Impor model SesiKelas
import { verify, JwtPayload } from 'jsonwebtoken'; // PERBAIKAN: Menggunakan jsonwebtoken langsung

const secret = process.env.NEXTAUTH_SECRET;

export async function PUT(req: NextRequest, { params }: { params: { classId: string, sesiId: string } }) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }
    
    try {
        // PERBAIKAN: Memverifikasi token langsung di sini
        const decoded = verify(token, secret!) as JwtPayload;
        if (!decoded || (decoded as any).role !== 'tutor') {
            return NextResponse.json({ success: false, message: 'Akses tidak sah' }, { status: 403 });
        }

        await dbConnect();
        
        const { sesiId } = params;
        const { siswaId } = await req.json();

        if (!siswaId) {
            return NextResponse.json({ success: false, message: 'ID Siswa dibutuhkan' }, { status: 400 });
        }

        // Cari sesi berdasarkan ID dan perbarui field siswaId
        const updatedSesi = await SesiKelas.findByIdAndUpdate(
            sesiId,
            { siswaId },
            { new: true } // Opsi ini akan mengembalikan dokumen yang sudah diperbarui
        );

        if (!updatedSesi) {
            return NextResponse.json({ success: false, message: 'Sesi tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedSesi });

    } catch (error: any) {
        // Menambahkan penanganan error spesifik untuk token yang tidak valid
        if (error.name === 'JsonWebTokenError') {
            return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
        }
        console.error("Error meng-assign siswa:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}

