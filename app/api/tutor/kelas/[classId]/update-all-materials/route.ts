import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class'; // Pastikan path ke model Class Anda benar
import { verify, JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

// Handler untuk PUT: Memperbarui semua materi dalam sebuah kelas
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ classId: string }> } // PERBAIKAN: params sebagai Promise
) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        const decoded = verify(token, secret!) as DecodedToken;
        if (decoded.role !== 'tutor') {
            return NextResponse.json({ success: false, message: 'Akses tidak sah' }, { status: 403 });
        }

        // PERBAIKAN: Tunggu params dengan await
        const { classId } = await params;
        const { materi } = await req.json();

        // Validasi data yang masuk
        if (!Array.isArray(materi)) {
            return NextResponse.json({ success: false, message: 'Data materi harus berupa array.' }, { status: 400 });
        }

        await dbConnect();

        // Cari kelas berdasarkan ID
        const kelasToUpdate = await Class.findById(classId);
        if (!kelasToUpdate) {
            return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan.' }, { status: 404 });
        }

        // Ganti array materi yang lama dengan yang baru
        kelasToUpdate.materi = materi;

        // Simpan perubahan ke database
        await kelasToUpdate.save();

        return NextResponse.json({ success: true, message: 'Semua materi berhasil diperbarui.' });

    } catch (error: any) {
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
        }
        console.error("API Error - Update All Materials:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}