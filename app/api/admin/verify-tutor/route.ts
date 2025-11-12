// app/api/admin/verify-tutor/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verify } from 'jsonwebtoken'; // Verifikasi token admin

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function POST(request: Request) {
  try {
    // 1. Verifikasi bahwa yang mengakses adalah admin
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('Akses ditolak');
    const decoded = verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'admin') throw new Error('Akses ditolak');

    // 2. Lakukan aksi
    await dbConnect();
    const { tutorId, action, rejectionReason } = await request.json(); // action bisa 'approve' atau 'reject'

    let updateData;
    if (action === 'approve') {
      updateData = { status: 'approved' };
    } else if (action === 'reject') {
      updateData = { status: 'rejected', rejectionReason };
    } else {
      throw new Error('Aksi tidak valid');
    }
    
    await User.findByIdAndUpdate(tutorId, updateData);
    
    return NextResponse.json({ success: true, message: `Tutor berhasil di-${action}` });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 }); // 403 Forbidden
  }
}