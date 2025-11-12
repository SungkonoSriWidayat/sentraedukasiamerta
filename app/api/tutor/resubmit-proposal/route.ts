// app/api/tutor/resubmit-proposal/route.ts
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

interface DecodedToken { id: string; name: string; role: string; }

export async function PUT(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('Akses ditolak');
    const decoded = verify(token, JWT_SECRET) as DecodedToken;
    if (decoded.role !== 'tutor') throw new Error('Akses ditolak');

    await dbConnect();
    const { proposalId, ...updateData } = await request.json();

    const proposal = await ClassProposal.findById(proposalId);
    if (!proposal) throw new Error('Pengajuan tidak ditemukan');
    if (proposal.tutorId.toString() !== decoded.id) throw new Error('Anda tidak memiliki izin untuk mengedit pengajuan ini');

    // Update data proposal dengan data baru dari form
    Object.assign(proposal, updateData);
    // Set status kembali ke 'pending' untuk ditinjau ulang oleh admin
    proposal.status = 'pending';
    await proposal.save();

    // Kirim notifikasi lagi ke admin
    await pusher.trigger(
      'admin-notifications',
      'new-class-proposal',
      { message: `Tutor ${decoded.name} mengajukan ulang kelas: "${proposal.namaKelas}"` }
    );

    return NextResponse.json({ success: true, message: 'Pengajuan berhasil dikirim ulang.' });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
}
