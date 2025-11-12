// app/api/admin/get-classes/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class'; // Gunakan model Class resmi
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(request: Request) {
  try {
    // 1. Verifikasi bahwa yang mengakses adalah admin
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('Akses ditolak');
    const decoded = verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'admin') throw new Error('Akses ditolak');

    await dbConnect();
    
    // 2. Ambil semua kelas dari koleksi 'classes'
    const classes = await Class.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: classes });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
}
