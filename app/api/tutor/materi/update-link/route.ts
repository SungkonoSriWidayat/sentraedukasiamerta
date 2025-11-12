import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class'; // Pastikan path ke model Class Anda benar

export async function PATCH(request: Request) {
  try {
    await dbConnect();
    const { kelasId, pertemuanId, linkPdf, namaPdf } = await request.json();

    if (!kelasId || !pertemuanId || !linkPdf || !namaPdf) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Cari kelas berdasarkan ID
    const kelas = await Class.findById(kelasId);
    if (!kelas) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    // Cari pertemuan (materi) di dalam kelas berdasarkan ID-nya
    const pertemuanIndex = kelas.materi.findIndex(
      (p: any) => p._id.toString() === pertemuanId
    );

    if (pertemuanIndex === -1) {
      return NextResponse.json({ error: 'Pertemuan tidak ditemukan' }, { status: 404 });
    }

    // Update linkPdf dan namaPdf untuk pertemuan tersebut
    kelas.materi[pertemuanIndex].linkPdf = linkPdf;
    kelas.materi[pertemuanIndex].namaPdf = namaPdf;

    // Simpan perubahan ke database
    await kelas.save();

    return NextResponse.json({ success: true, message: 'Materi berhasil ditautkan.' });

  } catch (error) {
    console.error('Error updating material link:', error);
    return NextResponse.json({ error: 'Gagal menautkan materi' }, { status: 500 });
  }
}