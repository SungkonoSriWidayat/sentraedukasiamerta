import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

// Fungsi normalisasi nomor WhatsApp
function normalizeWhatsapp(nomor: string): string {
    let nomorBersih = nomor.replace(/\D/g, '');
    if (nomorBersih.startsWith('62')) {
        nomorBersih = '0' + nomorBersih.substring(2);
    }
    return nomorBersih;
}

export async function POST(request: Request) {
  try {
    const { nomorWhatsapp, password } = await request.json();
    const nomorNormal = normalizeWhatsapp(nomorWhatsapp);

    await dbConnect();
    
    // API ini sekarang hanya mencari pengguna di database
    const user = await User.findOne({ nomorWhatsapp: nomorNormal });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Nomor WhatsApp atau kata sandi salah' }, { status: 401 });
    }

    // Mencegah peran lain login melalui form ini
    if (user.role === 'tutor' || user.role === 'admin') {
      return NextResponse.json({ success: false, message: 'Silakan login melalui halaman khusus peran Anda.' }, { status: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Nomor WhatsApp atau kata sandi salah' }, { status: 401 });
    }
    
    // Buat token dengan data pengguna (termasuk peran 'siswa')
    const userPayload = { 
      id: user._id, 
      name: user.namaLengkap,
      role: user.role 
    };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '10d' });

    return NextResponse.json({ success: true, token });

  } catch (error) {
    console.error("API Login Siswa Error:", error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

