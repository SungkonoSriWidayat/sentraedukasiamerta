import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Pusher from 'pusher';

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Konfigurasi Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
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
    if (decoded.role !== 'user') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get('paymentProof') as File | null;
    const orderId = formData.get('orderId') as string;

    if (!file || !orderId) {
      return NextResponse.json({ success: false, message: 'File bukti pembayaran dan ID order diperlukan.' }, { status: 400 });
    }

    await dbConnect();

    // 1. Ubah file menjadi buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Unggah ke Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) reject(error);
        resolve(result);
      }).end(buffer);
    });

    const { secure_url } = uploadResponse as { secure_url: string };

    // 3. Perbarui dokumen Order di database
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentProofUrl: secure_url,
        status: 'pending_verification',
      },
      { new: true }
    ).populate('studentId', 'namaLengkap').populate('classId', 'nama');

    if (!updatedOrder) {
      return NextResponse.json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });
    }

    // --- PERBAIKAN: LOGIKA NOTIFIKASI DENGAN PENANGANAN EROR ---
    try {
      console.log('[Pusher] Mencoba mengirim notifikasi...');
      const studentName = (updatedOrder.studentId as any)?.namaLengkap || 'Seorang siswa';
      const className = (updatedOrder.classId as any)?.nama || 'sebuah kelas';
      const message = `Pembayaran baru dari ${studentName} untuk kelas "${className}" perlu diverifikasi.`;

      // Kirim notifikasi ke channel admin
      await pusher.trigger('admin-notifications', 'new-payment', { message });
      console.log('[Pusher] Notifikasi admin terkirim.');

      // Kirim notifikasi ke channel tutor yang bersangkutan
      if (updatedOrder.tutorId) {
        const tutorChannel = `tutor-notifications-${updatedOrder.tutorId.toString()}`;
        await pusher.trigger(tutorChannel, 'new-payment', { message });
        console.log(`[Pusher] Notifikasi tutor terkirim ke channel: ${tutorChannel}`);
      }
    } catch (pusherError) {
      console.error('[Pusher] GAGAL MENGIRIM NOTIFIKASI:', pusherError);
      // Jangan hentikan proses meskipun Pusher gagal, cukup catat erornya.
    }
    // -----------------------------------------------------------

    return NextResponse.json({ success: true, message: 'Bukti pembayaran berhasil diunggah.' });

  } catch (error) {
    console.error('API Error uploading proof:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
