// Lokasi: app/api/admin/delete-audio/route.ts

import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL file diperlukan.' }, { status: 400 });
    }

    // Fungsi 'del' dari Vercel Blob akan menghapus file berdasarkan URL lengkapnya
    await del(url);

    return NextResponse.json({ success: true, message: 'File berhasil dihapus.' });

  } catch (error) {
    console.error("Error saat menghapus file dari Vercel Blob:", error);
    const errorMessage = (error instanceof Error) ? error.message : 'Error tidak diketahui';
    return NextResponse.json({ error: `Gagal menghapus file: ${errorMessage}` }, { status: 500 });
  }
}