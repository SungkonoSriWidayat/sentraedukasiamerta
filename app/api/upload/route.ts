// Lokasi file: app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/app/lib/firebaseAdmin'; // Sesuaikan path jika berbeda
import { verify, JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req: NextRequest) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        const decoded = verify(token, secret!) as JwtPayload;
        if (decoded.role !== 'tutor') {
            return NextResponse.json({ success: false, message: 'Akses tidak sah' }, { status: 403 });
        }

        // 1. Ambil data form dari request
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, message: 'Tidak ada file yang diunggah.' }, { status: 400 });
        }

        // 2. Siapkan file untuk diunggah
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Buat nama file yang unik untuk menghindari penimpaan file
        const uniqueFilename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;

        // 3. Dapatkan bucket Firebase Storage
        const bucket = storage.bucket();
        const fileRef = bucket.file(`audio-soal/${uniqueFilename}`); // Simpan di dalam folder 'audio-soal'

        // 4. Unggah buffer file ke Firebase Storage
        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        // 5. Buat file menjadi dapat diakses publik
        await fileRef.makePublic();

        // 6. Dapatkan URL publik dari file tersebut
        const publicUrl = fileRef.publicUrl();

        // 7. Kirim kembali URL sebagai respons
        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error) {
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
        }
        console.error("Error saat mengunggah file:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}