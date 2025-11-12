import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class, { IClass } from '@/models/Class'; // Impor IClass
import { FilterQuery } from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // --- PERBAIKAN DI SINI ---
    // Hapus filter "status: 'Approved'"
    // Kita hanya mencari kelas yang sudah disetel "kelas siap" oleh admin
    const query: FilterQuery<IClass> = {
      adminStatus: 'kelas siap', 
    };
    // --- AKHIR PERBAIKAN ---

    const classes = await Class.find(query)
      .select('nama deskripsi jadwal harga tutorName jumlahPertemuan _id') // Ambil field yang relevan
      .lean();

    return NextResponse.json({
      success: true,
      data: classes,
    }, { status: 200 });

  } catch (error) {
    console.error('API Error fetching public classes:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data kelas. Silakan coba lagi nanti.',
      error: (error as Error).message,
    }, { status: 500 });
  }
}

