// app/api/tutor-register/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { v2 as cloudinary } from 'cloudinary';
import Pusher from 'pusher';

// Konfigurasi Cloudinary
// Pastikan variabel environment ada sebelum mengkonfigurasi
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.error("Cloudinary environment variables are not set!");
}


// Inisialisasi Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});

export async function POST(request: Request) {
  try {
    await dbConnect();
    const formData = await request.formData();

    const namaLengkap = formData.get('namaLengkap') as string;
    const nomorWhatsapp = formData.get('nomorWhatsapp') as string;
    const password = formData.get('password') as string;
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'File wajib diunggah.' }, { status: 400 });
    }

    // Ubah file menjadi buffer untuk diunggah
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Unggah file ke Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'tutor_registrations' },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error); // Log error detail
            reject(error);
          }
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // @ts-ignore
    const fileUrl = uploadResult.secure_url;

    // Simpan user dengan status 'pending' dan URL file
    const newTutor = new User({
      namaLengkap,
      nomorWhatsapp,
      password,
      role: 'tutor',
      status: 'pending',
      fileUrl: fileUrl,
    });

    await newTutor.save();

    // Kirim notifikasi Pusher
    try {
      await pusher.trigger(
        'admin-notifications',
        'new-tutor-registration',
        { message: `Pendaftaran tutor baru: ${newTutor.namaLengkap}` }
      );
    } catch (pusherError) {
      console.error("Pusher trigger failed:", pusherError);
    }

    return NextResponse.json({ success: true, message: 'Pendaftaran Anda sedang ditinjau oleh admin.' }, { status: 201 });

  } catch (error: any) {
    // Memberikan pesan error yang lebih spesifik jika dari Cloudinary
    if (error.message && error.message.includes('Must supply api_key')) {
        return NextResponse.json({ success: false, message: 'Konfigurasi Cloudinary tidak valid di server. Mohon periksa environment variables.' }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
