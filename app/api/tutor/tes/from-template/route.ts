import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Test from '@/models/Test';
import TestTemplate from '@/models/TestTemplate';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

interface TokenPayload {
    id: string;
    role: string;
}

export async function POST(request: Request) {
    try {
        // --- Autentikasi Tutor ---
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Token tidak valid' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as TokenPayload;
        if (decoded.role !== 'tutor') {
            return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
        }

        const { templateId, classId, tipe } = await request.json();

        // Validasi input
        if (!templateId || !classId || !tipe) {
            return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
        }
        if (tipe !== 'Pre-Test' && tipe !== 'Post-Test') {
            return NextResponse.json({ message: 'Tipe tes tidak valid.' }, { status: 400 });
        }

        await connectDB();

        // 1. Cari template berdasarkan ID
        const template = await TestTemplate.findById(templateId).lean(); // Gunakan .lean() untuk performa lebih baik
        if (!template) {
            return NextResponse.json({ message: 'Template tidak ditemukan.' }, { status: 404 });
        }
        
        // 2. Cek apakah tes dengan tipe yang sama sudah ada di kelas ini
        const existingTest = await Test.findOne({ classId, tipe });
        if (existingTest) {
            return NextResponse.json({ message: `Kelas ini sudah memiliki ${tipe}.` }, { status: 409 });
        }

        // ======================== PERBAIKAN DI SINI ========================
        // 3. Siapkan data tes baru dari template dengan membuat salinan data yang bersih
        const newTestData = {
            judul: template.judul,
            instructions: template.instructions,
            isEnglishTest: template.isEnglishTest,
            // Buat salinan (deep copy) dari sections, bukan referensi langsung
            sections: JSON.parse(JSON.stringify(template.sections)),
            classId: new mongoose.Types.ObjectId(classId),
            tipe: tipe,
        };
        // =================================================================

        // 4. Simpan sebagai dokumen baru di koleksi 'tests'
        const newTest = new Test(newTestData);
        await newTest.save();

        return NextResponse.json({
            message: `${tipe} berhasil dibuat dari template!`,
            data: newTest,
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating test from template:", error);
        return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}