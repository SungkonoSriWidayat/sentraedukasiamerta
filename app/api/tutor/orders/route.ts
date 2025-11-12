import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import '@/models/User';
import '@/models/Class';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Jika tidak ada header Authorization sama sekali
      return NextResponse.json({ success: false, message: 'Token tidak ditemukan atau format salah.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    let decoded: DecodedToken;
    // --- BLOK PERBAIKAN UTAMA ---
    // Kita isolasi verifikasi token di dalam try...catch-nya sendiri.
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (error) {
      // Jika jwt.verify GAGAL (karena token expired, tidak valid, dll),
      // kita tangkap errornya di sini dan kirim respons 401.
      // Inilah sinyal yang ditunggu oleh apiClient di front-end!
      console.log("Sesi tidak valid:", (error as Error).name); // Log nama errornya (misal: TokenExpiredError)
      return NextResponse.json({ success: false, message: 'Sesi tidak valid atau telah berakhir.' }, { status: 401 });
    }
    // --- AKHIR BLOK PERBAIKAN ---

    // Jika kode sampai di sini, artinya token VALID.
    // Sekarang kita periksa perannya (role).
    if (decoded.role !== 'tutor') {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Peran tidak sesuai.' }, { status: 403 });
    }

    await dbConnect();

    // Logika bisnis Anda untuk mengambil data order (sudah benar)
    const orders = await Order.find({ tutorId: decoded.id })
      .populate({ path: 'studentId', model: 'User', select: 'namaLengkap' })
      .populate({ path: 'classId', model: 'Class', select: 'nama' })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: orders });

  } catch (error) {
    // Blok catch ini sekarang hanya akan menangani error tak terduga
    // yang terjadi SETELAH token berhasil diverifikasi (misal: error database).
    console.error('API Error fetching tutor orders:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
