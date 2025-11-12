// Lokasi: app/api/tutor/tes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

interface TokenPayload extends JwtPayload {
    id: string;
    role: string;
}

// --- FUNGSI GET (Mengambil data tes) ---
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // --- BLOK AUTENTIKASI YANG DIPERBAIKI ---
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, message: 'Akses ditolak: Token tidak disediakan.' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as TokenPayload;

        // Pemeriksaan yang lebih aman
        if (!decoded || typeof decoded !== 'object' || decoded.role !== 'tutor') {
            return NextResponse.json({ success: false, message: 'Akses tidak sah: Anda bukan tutor.' }, { status: 403 });
        }
        // --- AKHIR BLOK AUTENTIKASI ---

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('classId');

        if (!classId) {
            return NextResponse.json({ success: false, message: 'Class ID diperlukan' }, { status: 400 });
        }
        
        const tests = await Test.find({ classId: classId });
        return NextResponse.json({ success: true, data: tests });

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
             return NextResponse.json({ success: false, message: `Token tidak valid: ${error.message}` }, { status: 401 });
        }
        console.error("Error saat mengambil data tes:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}

// --- FUNGSI POST (Menyimpan tes baru) ---
export async function POST(req: Request) {
    try {
        await dbConnect();
        
        // --- BLOK AUTENTIKASI YANG DIPERBAIKI ---
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, message: 'Akses ditolak: Token tidak disediakan.' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as TokenPayload;

        if (!decoded || typeof decoded !== 'object' || decoded.role !== 'tutor') {
            return NextResponse.json({ success: false, message: 'Akses tidak sah: Anda bukan tutor.' }, { status: 403 });
        }
        // --- AKHIR BLOK AUTENTIKASI ---

        const testData = await req.json();

        if (!testData.classId || !testData.judul || !testData.sections) {
            return NextResponse.json({ success: false, message: 'Data yang dikirim tidak lengkap.' }, { status: 400 });
        }

        const newTest = new Test(testData);
        await newTest.save();
        return NextResponse.json({ success: true, message: 'Tes berhasil disimpan!', data: newTest }, { status: 201 });

    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            const firstError = Object.values(error.errors)[0].message;
            return NextResponse.json({ message: `Validasi gagal: ${firstError}` }, { status: 400 });
        }
        if (error instanceof jwt.JsonWebTokenError) {
             return NextResponse.json({ success: false, message: `Token tidak valid: ${error.message}` }, { status: 401 });
        }
        console.error("Error saat menyimpan tes:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}