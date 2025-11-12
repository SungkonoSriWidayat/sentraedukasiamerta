import { NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

interface AuthResult {
  success: boolean;
  userId?: string;
  role?: string;
  message: string;
}

/**
 * Fungsi ini berjalan di SERVER.
 * Tugasnya adalah mengambil token dari header, memverifikasinya,
 * dan mengembalikan data pengguna (userId, role).
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
  if (!secret) {
    console.error('Error: NEXTAUTH_SECRET belum di-set di environment.');
    return { success: false, message: 'Kesalahan konfigurasi server.' };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, message: 'Token autentikasi tidak ditemukan.' };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // Pastikan token berisi data yang kita butuhkan
    if (typeof decoded !== 'object' || !decoded.id || !decoded.role) {
      throw new Error('Token tidak valid atau malformed.');
    }

    return {
      success: true,
      userId: decoded.id,
      role: decoded.role,
      message: 'Token berhasil diverifikasi.',
    };

  } catch (error) {
    console.error("Verifikasi token gagal:", error);
    return { success: false, message: 'Token tidak valid atau kedaluwarsa.' };
  }
}
