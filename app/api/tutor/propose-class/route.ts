// app/api/tutor/propose-class/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClassProposal from '@/models/ClassProposal';
import { verify } from 'jsonwebtoken';
import Pusher from 'pusher';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});

interface DecodedToken {
  id: string;
  name: string;
  role: string;
}

export async function POST(request: Request) {
  try {
    // 1. Verifikasi bahwa yang mengakses adalah tutor
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('Akses ditolak');
    const decoded = verify(token, JWT_SECRET) as DecodedToken;
    if (decoded.role !== 'tutor') throw new Error('Hanya tutor yang bisa mengajukan kelas');

    await dbConnect();
    const body = await request.json();

    // 2. Buat pengajuan baru
    const newProposal = new ClassProposal({
      ...body,
      tutorId: decoded.id,
      tutorName: decoded.name,
      status: 'pending'
    });
    await newProposal.save();

    // 3. Kirim notifikasi ke admin
    await pusher.trigger(
      'admin-notifications',
      'new-class-proposal', // Event baru
      { message: `Pengajuan kelas baru dari ${decoded.name}: "${body.namaKelas}"` }
    );

    return NextResponse.json({ success: true, message: 'Pengajuan kelas berhasil dikirim.' });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
}
