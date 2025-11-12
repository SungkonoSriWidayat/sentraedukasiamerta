import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

interface TokenPayload extends JwtPayload {
    id: string;
    role: string;
}

// Fungsi untuk GET (mengambil satu tes spesifik) - Berguna untuk halaman edit
export async function GET(req: NextRequest, { params }: { params: { testId: string } }) {
    try {
        const { testId } = params;
         // Autentikasi bisa ditambahkan di sini jika perlu
        
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return NextResponse.json({ success: false, message: 'ID tes tidak valid' }, { status: 400 });
        }

        await dbConnect();
        const test = await Test.findById(testId);

        if (!test) {
            return NextResponse.json({ success: false, message: 'Tes tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: test });

    } catch (error) {
        console.error("Error saat mengambil data tes:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}


// Fungsi untuk PUT (memperbarui tes)
export async function PUT(
    req: NextRequest,
    { params }: { params: { testId: string } }
) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as TokenPayload;
        if (decoded.role !== 'tutor') {
            return NextResponse.json({ success: false, message: 'Akses tidak sah' }, { status: 403 });
        }

        const { testId } = params;
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return NextResponse.json({ success: false, message: 'ID tes tidak valid' }, { status: 400 });
        }

        await dbConnect();
        const body = await req.json();

        // Cara yang lebih aman untuk mengecualikan field
        const { _id, classId, tipe, createdAt, updatedAt, ...updateData } = body;

        const updatedTest = await Test.findByIdAndUpdate(
            testId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedTest) {
            return NextResponse.json({ success: false, message: 'Tes tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Tes berhasil diperbarui!', data: updatedTest });

    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
             const firstError = Object.values(error.errors)[0].message;
             return NextResponse.json({ message: `Validasi gagal: ${firstError}` }, { status: 400 });
        }
        if (error instanceof jwt.JsonWebTokenError) {
             return NextResponse.json({ message: `Token tidak valid: ${error.message}` }, { status: 401 });
        }
        console.error("Error saat memperbarui tes:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}

