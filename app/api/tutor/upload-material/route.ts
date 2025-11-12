import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';

// Konfigurasi Cloudinary (pastikan sudah ada di .env.local)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    
    // Keamanan: Hanya tutor yang bisa mengakses endpoint ini
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as DecodedToken;
    if (decoded.role !== 'tutor') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('materialFile') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'File materi diperlukan.' }, { status: 400 });
    }

    await dbConnect();

    // 1. Ubah file menjadi buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Unggah ke Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'raw' }, (error, result) => {
        if (error) reject(error);
        resolve(result);
      }).end(buffer);
    });

    const { secure_url } = uploadResponse as { secure_url: string };

    // 3. Kembalikan URL yang aman
    return NextResponse.json({ success: true, url: secure_url });

  } catch (error) {
    console.error('API Error uploading tutor material file:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
