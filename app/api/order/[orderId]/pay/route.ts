import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Class from '@/models/Class';
import { verifyAuth } from '@/lib/auth';
import midtransClient from 'midtrans-client';

// Inisialisasi Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ orderId: string }> } // PERBAIKAN: params sebagai Promise
) {
  try {
    await dbConnect();

    // 1. Verifikasi Pengguna (Sangat Penting)
    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    // PERBAIKAN: Tunggu params dengan await
    const { orderId } = await params;
    const { userId } = authResult;

    // 2. Ambil Detail Order dari Database
    // Populate studentId (User) dan classId (Class) untuk dapat detailnya
    const order = await Order.findById(orderId)
      .populate<{ studentId: { _id: string, namaLengkap: string, email: string, nomorWhatsapp: string } }>('studentId', 'namaLengkap email nomorWhatsapp')
      .populate<{ classId: { _id: string, nama: string } }>('classId', 'nama'); // PERBAIKAN: tambahkan _id

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order tidak ditemukan.' }, { status: 404 });
    }

    // 3. Validasi Kepemilikan Order
    // Pastikan yang bayar adalah pemilik order
    if (order.studentId._id.toString() !== userId) {
      return NextResponse.json({ success: false, message: 'Anda tidak berhak mengakses order ini.' }, { status: 403 });
    }

    // 4. Cek Status Order (Jangan biarkan bayar ulang jika sudah lunas)
    if (order.status === 'paid') {
       return NextResponse.json({ success: false, message: 'Order ini sudah lunas.' }, { status: 400 });
    }

    // 5. Siapkan Parameter Transaksi untuk Midtrans
    const parameter = {
      transaction_details: {
        order_id: order._id.toString(), // Wajib unik
        gross_amount: order.amount,
      },
      customer_details: {
        first_name: order.studentId.namaLengkap,
        email: order.studentId.email,
        phone: order.studentId.nomorWhatsapp,
      },
      item_details: [{
        id: order.classId._id.toString(),
        price: order.amount,
        quantity: 1,
        name: order.classId.nama,
      }],
      callbacks: {
        // URL Webhook Anda (Langkah selanjutnya)
        finish: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/pesanan-saya` 
      }
    };

    // 6. Buat Transaksi di Midtrans
    const transaction = await snap.createTransaction(parameter);
    const transactionToken = transaction.token;

    // 7. Kirim token kembali ke Frontend
    return NextResponse.json({ success: true, token: transactionToken }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating Midtrans transaction:', error);
    return NextResponse.json({ success: false, message: 'Gagal memproses pembayaran.', error: error.message }, { status: 500 });
  }
}