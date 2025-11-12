// app/api/register/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Fungsi untuk normalisasi nomor WhatsApp
function normalizeWhatsapp(nomor: string): string {
  // Hapus karakter selain angka
  let nomorBersih = nomor.replace(/\D/g, '');

  // Jika diawali dengan '62', ganti dengan '0'
  if (nomorBersih.startsWith('62')) {
    nomorBersih = '0' + nomorBersih.substring(2);
  }
  
  // Jika tidak diawali '0', mungkin ada kesalahan, tapi kita coba tambahkan '0'
  // (Anda bisa membuat ini lebih ketat jika perlu)
  if (!nomorBersih.startsWith('0')) {
    nomorBersih = '0' + nomorBersih;
  }
  
  return nomorBersih;
}


export async function POST(request: Request) {
  try {
    await dbConnect();
    let { nomorWhatsapp, namaLengkap, password } = await request.json();

    // Normalisasi nomor sebelum diproses
    const nomorNormal = normalizeWhatsapp(nomorWhatsapp);

    // Cek apakah nomor sudah ada
    const existingUser = await User.findOne({ nomorWhatsapp: nomorNormal });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Nomor WhatsApp sudah terdaftar.' }, { status: 400 });
    }

    // Buat user baru dengan nomor yang sudah dinormalisasi
    const newUser = new User({ 
      nomorWhatsapp: nomorNormal, 
      namaLengkap, 
      password 
    });
    await newUser.save();

    return NextResponse.json({ success: true, message: 'User berhasil dibuat.' }, { status: 201 });

  } catch (error: any) {
    // Menangkap error validasi dari Mongoose
    if (error.name === 'ValidationError') {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}