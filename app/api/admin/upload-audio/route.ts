// app/api/admin/upload-audio/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';

// Membuat ID unik untuk nama file
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Dapatkan filename dari URL parameter, contoh: /api/admin/upload-audio?filename=lagu.mp3
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: 'Filename and file body are required.' }, { status: 400 });
  }

  // 2. Ekstrak ekstensi file dan buat nama file baru yang unik
  const fileExtension = filename.split('.').pop();
  const uniqueFilename = `${nanoid()}.${fileExtension}`;

  try {
    // 3. Upload file ke Vercel Blob
    // request.body adalah file stream yang dikirim dari frontend
    const blob = await put(uniqueFilename, request.body, {
      access: 'public', // 'public' agar file bisa diakses melalui URL
    });

    // 4. Kirim kembali blob object (yang berisi URL) ke frontend
    return NextResponse.json(blob);

  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Upload failed: ${errorMessage}` }, { status: 500 });
  }
}