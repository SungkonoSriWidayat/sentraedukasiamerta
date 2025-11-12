// app/api/admin/get-users/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(request: NextRequest) {
  try {
    // Verifikasi bahwa yang mengakses adalah admin
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('Akses ditolak');
    const decoded = verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'admin') throw new Error('Akses ditolak');

    // Ambil parameter 'role' dari URL (contoh: /api/admin/get-users?role=tutor)
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (!role || !['tutor', 'user'].includes(role)) {
      return NextResponse.json({ success: false, message: 'Parameter peran (role) tidak valid.' }, { status: 400 });
    }

    await dbConnect();
    
    // Cari user berdasarkan peran yang diminta dan statusnya sudah 'approved' (untuk tutor)
    const query: any = { role: role };
    if (role === 'tutor') {
      query.status = 'approved';
    }
    
    const users = await User.find(query).select('-password');

    return NextResponse.json({ success: true, data: users });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
}
