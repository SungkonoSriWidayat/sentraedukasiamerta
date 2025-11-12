import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';

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
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as DecodedToken;
    if (decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { classId, materialId, fileUrl } = await req.json();
    if (!classId || !materialId || !fileUrl) {
      return NextResponse.json({ success: false, message: 'Informasi lengkap diperlukan.' }, { status: 400 });
    }

    // 1. Hapus file dari Cloudinary
    const publicId = fileUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

    // 2. Hapus URL dari database
    await dbConnect();
    await Class.updateOne(
      { _id: classId, 'materi._id': materialId },
      { $unset: { 'materi.$.pdfFileUrl': '' } }
    );

    return NextResponse.json({ success: true, message: 'File materi berhasil dihapus.' });

  } catch (error) {
    console.error('API Error deleting material file:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
