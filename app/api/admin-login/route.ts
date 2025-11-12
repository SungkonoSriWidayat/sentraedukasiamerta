import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

// TAMBAHAN: Gunakan fungsi normalisasi yang sama untuk konsistensi.
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

    // API ini HANYA memeriksa kredensial Super Admin.
    if (
      nomorNormal === process.env.SUPER_ADMIN_USERNAME &&
      password === process.env.SUPER_ADMIN_PASSWORD
    ) {
      const adminPayload = { 
        id: 'superadmin', 
        name: 'Super Admin',
        role: 'admin' 
      };
      
      // PERBAIKAN: Sesi admin dibuat lebih singkat (misal: 8 jam) untuk keamanan.
      const token = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '10d' });
      return NextResponse.json({ success: true, token });
    }
    
    // Jika tidak cocok, langsung gagalkan.
    return NextResponse.json({ success: false, message: 'Kredensial tidak valid.' }, { status: 401 });

  } catch (error) {
    console.error("API Admin Login Error:", error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
