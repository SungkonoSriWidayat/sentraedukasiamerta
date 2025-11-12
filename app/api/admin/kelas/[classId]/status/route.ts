import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import jwt, { JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

// Tipe data untuk status yang valid
const validStatuses = ["kelas belum siap", "kelas siap", "kelas terlalu banyak siswa"];

export async function PUT(req: NextRequest, { params }: { params: { classId: string } }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Token autentikasi tidak ditemukan.' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    // 1. Verifikasi Admin
    const decoded = jwt.verify(token, secret!) as JwtPayload;
    if (decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Rute ini hanya untuk admin.' }, { status: 403 });
    }

    // 2. Ambil Data dari Body
    const { adminStatus } = await req.json();
    const { classId } = params;

    // 3. Validasi Input
    if (!adminStatus || !validStatuses.includes(adminStatus)) {
      return NextResponse.json({ success: false, message: 'Nilai status tidak valid.' }, { status: 400 });
    }

    // 4. Hubungkan ke DB dan Update
    await dbConnect();

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { $set: { adminStatus: adminStatus } },
      { new: true } // Mengembalikan dokumen yang sudah diperbarui
    );

    if (!updatedClass) {
      return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan.' }, { status: 404 });
    }

    // 5. Kirim Respons Sukses
    return NextResponse.json({ 
      success: true, 
      message: 'Status kelas berhasil diperbarui.',
      data: { adminStatus: updatedClass.adminStatus } 
    }, { status: 200 });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
    }
    console.error("Error saat update status kelas:", error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
