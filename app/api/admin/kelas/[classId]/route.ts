import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import User from '@/models/User';
import jwt, { JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ classId: string }> } // PERBAIKAN: params sebagai Promise
) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Token autentikasi tidak ditemukan.' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret!) as JwtPayload;
    if (decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Rute ini hanya untuk admin.' }, { status: 403 });
    }

    await dbConnect();
    
    // PERBAIKAN: Tunggu params dengan await
    const { classId } = await params;

    // --- PERUBAHAN DI SINI ---
    // Menambahkan .populate('tutorId', ...) sesuai dengan skema database Anda.
    const kelas = await Class.findById(classId)
      .populate({
        path: 'tutorId', // <-- INI PERBAIKANNYA (menggunakan field 'tutorId')
        model: User,
        select: 'namaLengkap nomorWhatsapp' // Ambil nama & WA tutor
      })
      .populate({
        path: 'enrolledStudents', 
        model: User,
        select: 'namaLengkap email nomorWhatsapp'
      });
    // --- AKHIR PERUBAHAN ---

    if (!kelas) {
      return NextResponse.json({ success: false, message: 'Kelas dengan ID ini tidak ditemukan.' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: kelas }, { status: 200 });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ success: false, message: 'Token tidak valid atau kedaluwarsa.' }, { status: 401 });
    }
    // Tangani error jika populate gagal (misal: field tidak ada)
    if ((error as Error).name === 'StrictPopulateError') {
        console.error("Kesalahan Populate:", error);
        return NextResponse.json({ success: false, message: 'Gagal mengambil data relasi. Periksa skema model.' }, { status: 500 });
    }
    console.error("Kesalahan Internal Server di API Admin:", error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan tak terduga di server.' }, { status: 500 });
  }
}