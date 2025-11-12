import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClassProposal from '@/models/ClassProposal';
import jwt from 'jsonwebtoken'; // Ganti import 'verify' menjadi 'jwt'

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

interface DecodedToken {
  id: string;
  role: string;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      // Jika tidak ada token sama sekali
      return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 401 });
    }

    let decoded: DecodedToken;
    // --- BLOK PERBAIKAN UTAMA ---
    // Isolasi verifikasi token di dalam try...catch-nya sendiri.
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (error) {
      // Jika jwt.verify GAGAL (karena token expired, tidak valid, dll),
      // kita tangkap errornya di sini dan kirim respons 401.
      return NextResponse.json({ success: false, message: 'Sesi tidak valid atau telah berakhir.' }, { status: 401 });
    }
    // --- AKHIR BLOK PERBAIKAN ---

    // Jika token valid, sekarang periksa perannya.
    if (decoded.role !== 'tutor') {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Peran tidak sesuai.' }, { status: 403 });
    }

    await dbConnect();
    
    // Cari semua pengajuan berdasarkan ID tutor dari token
    const proposals = await ClassProposal.find({ tutorId: decoded.id }).sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, data: proposals });

  } catch (error: any) {
    // Blok catch ini sekarang hanya untuk error tak terduga (misal: database)
    console.error("Internal Server Error in my-proposals:", error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server.' }, 
      { status: 500 } // Gunakan status 500 untuk error server
    );
  }
}
