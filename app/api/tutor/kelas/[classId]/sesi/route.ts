import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt, { JwtPayload } from 'jsonwebtoken';
import SesiKelas from '@/models/SesiKelas'; // Menggunakan model SesiKelas Anda
import mongoose from 'mongoose';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

// Handler untuk GET: Mengambil semua sesi untuk sebuah kelas
export async function GET(
  req: NextRequest, 
  context: { params: Promise<{ classId: string }> } // PERBAIKAN: params sebagai Promise
) {
    try {
        // Otentikasi dan Otorisasi
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
        const { classId } = await context.params;
        await dbConnect();

        // Mengambil data dari model SesiKelas
        const sessions = await SesiKelas.find({ classId: classId }).sort({ tanggalSesi: 1 });
        return NextResponse.json({ success: true, data: sessions });

    } catch (error) {
        console.error("API Error fetching sessions:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}

// Handler untuk POST: Membuat sesi baru
export async function POST(
  req: NextRequest, 
  context: { params: Promise<{ classId: string }> } // PERBAIKAN: params sebagai Promise
) {
  try {
    // Otentikasi dan Otorisasi
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
    const { classId } = await context.params;
    const { tanggalSesi, materiId, siswaId } = await req.json();

    if (!tanggalSesi || !materiId || !siswaId) {
        return NextResponse.json({ success: false, message: 'Data tidak lengkap.' }, { status: 400 });
    }

    await dbConnect();

    // Membuat entri baru di model SesiKelas
    const newSesi = new SesiKelas({
        classId: new mongoose.Types.ObjectId(classId),
        tanggalSesi,
        materiId: new mongoose.Types.ObjectId(materiId),
        siswaId: new mongoose.Types.ObjectId(siswaId),
        status: 'Nonaktif' // Status default saat dibuat
    });

    await newSesi.save();

    return NextResponse.json({ success: true, data: newSesi });

  } catch (error) {
    console.error("API Error creating session:", error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}