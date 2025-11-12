// app/api/tutor/delete-proposal/[proposalId]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClassProposal from '@/models/ClassProposal';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

interface DecodedToken {
  id: string;
  role: string;
}

export async function DELETE(request: Request, { params }: { params: { proposalId: string } }) {
  try {
    // 1. Verifikasi bahwa yang mengakses adalah tutor
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('Akses ditolak');
    const decoded = verify(token, JWT_SECRET) as DecodedToken;
    if (decoded.role !== 'tutor') throw new Error('Akses ditolak');

    await dbConnect();
    const { proposalId } = params;

    const proposal = await ClassProposal.findById(proposalId);

    if (!proposal) {
      return NextResponse.json({ success: false, message: 'Pengajuan tidak ditemukan.' }, { status: 404 });
    }

    // 2. Keamanan: Pastikan tutor hanya bisa menghapus proposal miliknya sendiri
    if (proposal.tutorId.toString() !== decoded.id) {
      return NextResponse.json({ success: false, message: 'Anda tidak memiliki izin untuk menghapus pengajuan ini.' }, { status: 403 });
    }

    // 3. Hapus proposal dari database
    await ClassProposal.findByIdAndDelete(proposalId);

    return NextResponse.json({ success: true, message: 'Pengajuan berhasil dihapus.' });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
