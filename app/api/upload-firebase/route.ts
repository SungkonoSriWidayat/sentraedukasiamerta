import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase'; // Impor storage dari file konfigurasi kita
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import jwt, { JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req: NextRequest) {
  // Verifikasi token untuk memastikan hanya user yang login yang bisa upload
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret!) as JwtPayload;
    if (decoded.role !== 'tutor' && decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });
    }

    // Ambil data file dari request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const classId = formData.get('classId') as string;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    // Buat path penyimpanan yang unik untuk setiap file
    // Contoh: materi/ID_KELAS/1677654321-namafile.pdf
    const filePath = `materi/${classId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    // Unggah file ke Firebase Storage
    await uploadBytes(storageRef, file);

    // Dapatkan URL download publik dari file yang baru diunggah
    const downloadURL = await getDownloadURL(storageRef);

    // Kirim kembali URL tersebut ke frontend
    return NextResponse.json({ success: true, url: downloadURL }, { status: 200 });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
    }
    console.error('Error saat unggah ke Firebase:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
