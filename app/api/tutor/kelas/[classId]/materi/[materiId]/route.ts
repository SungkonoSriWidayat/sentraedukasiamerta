import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import { verify, JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

const secret = process.env.NEXTAUTH_SECRET;

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

// Handler untuk PATCH: Memperbarui field spesifik pada satu materi
export async function PATCH(
    req: NextRequest,
    { params }: { params: { classId: string; materiId: string } }
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

        const { classId, materiId } = params;
        const body = await req.json();

        // Validasi dasar: pastikan body tidak kosong
        if (Object.keys(body).length === 0) {
            return NextResponse.json({ success: false, message: 'Tidak ada data untuk diperbarui.' }, { status: 400 });
        }

        await dbConnect();

        // Buat objek update yang menargetkan elemen array spesifik
        // Contoh: { "materi.$.linkPdf": "http://example.com/file.pdf" }
        const updateFields: { [key: string]: any } = {};
        for (const key in body) {
            if (Object.prototype.hasOwnProperty.call(body, key)) {
                updateFields[`materi.$.${key}`] = body[key];
            }
        }

        // Gunakan findOneAndUpdate dengan positional operator ($)
        // Ini akan mencari kelas berdasarkan classId DAN materi di dalamnya berdasarkan materiId
        const updatedClass = await Class.findOneAndUpdate(
            { 
                _id: new mongoose.Types.ObjectId(classId), 
                "materi._id": new mongoose.Types.ObjectId(materiId) 
            },
            { $set: updateFields },
            { new: true } // Mengembalikan dokumen yang sudah diperbarui
        );

        if (!updatedClass) {
            return NextResponse.json({ success: false, message: 'Kelas atau materi tidak ditemukan.' }, { status: 404 });
        }

        // Temukan materi yang baru saja diupdate untuk dikembalikan sebagai respons
        const updatedMateri = updatedClass.materi.find(
            (m: any) => m._id.toString() === materiId
        );

        return NextResponse.json({ success: true, message: 'Materi berhasil diperbarui.', data: updatedMateri });

    } catch (error: any) {
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
        }
        console.error("API Error - Update Single Material:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}
