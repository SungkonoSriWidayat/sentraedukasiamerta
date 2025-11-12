// app/api/admin/process-proposal/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ClassProposal from '@/models/ClassProposal';
import Class from '@/models/Class'; // Import model Class utama
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('Akses ditolak');
    const decoded = verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'admin') throw new Error('Akses ditolak');

    await dbConnect();
    const { proposalId, action } = await request.json();

    const proposal = await ClassProposal.findById(proposalId);
    if (!proposal) {
      return NextResponse.json({ success: false, message: 'Pengajuan tidak ditemukan.' }, { status: 404 });
    }

    if (action === 'approve') {
      // Buat kelas baru di koleksi 'classes'
      const newClass = new Class({
        nama: proposal.namaKelas,
        harga: proposal.harga,
        jadwal: proposal.jadwal,
        deskripsi: proposal.deskripsi,
        // ======================================================
        // === PERBAIKAN KUNCI: Tambahkan tipe data 'string'  ===
        // ======================================================
        materi: proposal.materi.map((materiTitle: string) => ({ title: materiTitle })),
        // ======================================================
        jumlahPertemuan: proposal.jumlahPertemuan,
        waktuPerPertemuan: proposal.waktuPerPertemuan,
        tutorId: proposal.tutorId,
        tutorName: proposal.tutorName,
      });
      await newClass.save();

      // Update status pengajuan menjadi 'approved'
      proposal.status = 'approved';
      await proposal.save();
      
      return NextResponse.json({ success: true, message: `Kelas "${proposal.namaKelas}" berhasil dibuat.` });

    } else if (action === 'reject') {
      // Cukup update status pengajuan
      proposal.status = 'rejected';
      await proposal.save();
      return NextResponse.json({ success: true, message: 'Pengajuan kelas telah ditolak.' });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak valid.' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
