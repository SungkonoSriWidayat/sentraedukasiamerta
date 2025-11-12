// Lokasi: app/api/admin/test-templates/route.ts

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TestTemplate from '@/models/TestTemplate';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose'; // Impor mongoose untuk mengakses tipe error

// Definisikan tipe untuk payload token Anda agar lebih aman
interface TokenPayload {
    id: string;
    role: string;
}

export async function POST(request: Request) {
    try {
        // --- BLOK AUTENTIKASI (Sudah Benar) ---
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Token autentikasi tidak ditemukan atau format salah.' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as TokenPayload;
        if (decoded.role !== 'admin') {
            return NextResponse.json({ message: 'Akses ditolak: Hanya admin yang dapat membuat template.' }, { status: 403 });
        }

        // Jika lolos autentikasi, lanjutkan proses
        await connectDB();

        const body = await request.json();

        // Validasi awal di server (opsional, karena Mongoose juga akan memvalidasi)
        if (!body.judul || !body.tipe || !body.sections || body.sections.length === 0) {
            return NextResponse.json({ message: 'Data tidak lengkap: Judul, Tipe, dan setidaknya satu Sesi diperlukan.' }, { status: 400 });
        }

        const newTemplate = new TestTemplate(body);
        
        // Mongoose akan otomatis memvalidasi data berdasarkan Schema saat 'save'
        await newTemplate.save();

        return NextResponse.json({ 
            message: 'Template tes berhasil disimpan!', 
            data: newTemplate 
        }, { status: 201 });

    } catch (error) {
        // --- BLOK ERROR HANDLING YANG DISEMPURNAKAN ---
        
        // 1. Tangani Mongoose Validation Error secara spesifik
        if (error instanceof mongoose.Error.ValidationError) {
            // Ambil pesan error validasi pertama yang paling relevan
            const firstError = Object.values(error.errors)[0].message;
            return NextResponse.json({ message: `Validasi gagal: ${firstError}` }, { status: 400 });
        }
        
        // 2. Tangani error token (sudah ada sebelumnya)
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ message: `Token tidak valid: ${error.message}` }, { status: 401 });
        }

        // 3. Tangani error umum lainnya
        console.error("Kesalahan Internal Server:", error);
        return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}
export async function GET(request: Request) {
    try {
        // --- BLOK AUTENTIKASI (PENTING untuk keamanan) ---
        // Kita tidak memerlukan token untuk mengambil data template, karena template ini akan digunakan oleh tutor.
        // Jika Anda ingin mengamankannya hanya untuk admin, aktifkan blok di bawah ini.
        /*
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Token autentikasi tidak ditemukan.', status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as TokenPayload;
        if (decoded.role !== 'admin') {
            return NextResponse.json({ message: 'Akses ditolak.', status: 403 });
        }
        */

        await connectDB();

        // Ambil semua template, urutkan dari yang terbaru diubah
        const templates = await TestTemplate.find({}).sort({ updatedAt: -1 });

        return NextResponse.json({ success: true, data: templates });

    } catch (error) {
        console.error("Kesalahan saat mengambil template:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}