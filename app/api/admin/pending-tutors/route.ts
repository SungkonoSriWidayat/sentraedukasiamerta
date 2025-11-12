// app/api/admin/pending-tutors/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(request: Request) {
  try {
    // 1. Verifikasi bahwa yang mengakses adalah admin
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }
    const decoded = verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    // 2. Jika admin, ambil data tutor yang pending
    await dbConnect();
    const pendingTutors = await User.find({ role: 'tutor', status: 'pending' }).select('-password'); // -password agar tidak mengirim hash password

    return NextResponse.json({ success: true, data: pendingTutors });

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
        return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}