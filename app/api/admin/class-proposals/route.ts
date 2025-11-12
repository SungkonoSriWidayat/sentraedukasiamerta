// app/api/admin/class-proposals/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClassProposal from '@/models/ClassProposal';
import User from '@/models/User'; // Pastikan User diimpor untuk referensi
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('Akses ditolak');
    const decoded = verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'admin') throw new Error('Akses ditolak');

    await dbConnect();
    
    // PERUBAHAN KUNCI: Tambahkan .populate() untuk mengambil data tutor
    const proposals = await ClassProposal.find({ status: 'pending' })
      .populate({
        path: 'tutorId',
        model: User,
        select: 'nomorWhatsapp' // Hanya ambil field nomorWhatsapp
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: proposals });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
}
