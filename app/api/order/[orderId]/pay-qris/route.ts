import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyAuth } from '@/lib/auth';
import midtransClient from 'midtrans-client'; // Impor package

// Inisialisasi Midtrans CORE API
// Kita tidak pakai Snap, tapi CoreApi
const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

export async function POST(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    await dbConnect();

    // 1. Verifikasi Pengguna
    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    const { orderId } = params;
    const { userId } = authResult;

    // 2. Ambil Detail Order
    // (Populate studentId untuk data email/nama, tidak perlu populate classId)
    const order = await Order.findById(orderId)
      .populate<{ studentId: { _id: string, namaLengkap: string, email: string, nomorWhatsapp: string } }>('studentId', 'namaLengkap email nomorWhatsapp');

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order tidak ditemukan.' }, { status: 404 });
    }

    // 3. Validasi Kepemilikan & Status
    if (order.studentId._id.toString() !== userId) {
      return NextResponse.json({ success: false, message: 'Anda tidak berhak mengakses order ini.' }, { status: 403 });
    }
    if (order.status !== 'pending_payment') {
       return NextResponse.json({ success: false, message: 'Order ini tidak dapat dibayar (Status: ' + order.status + ').' }, { status: 400 });
    }

    // 4. Siapkan Parameter Transaksi untuk Midtrans Core API
    const parameter = {
      payment_type: 'qris', // Spesifik minta QRIS
      transaction_details: {
        order_id: order._id.toString(), 
        gross_amount: order.amount,
      },
      customer_details: {
        first_name: order.studentId.namaLengkap,
        email: order.studentId.email,
        phone: order.studentId.nomorWhatsapp,
      },
      // QRIS (GoPay) butuh `gopay` atau `qris` spesifik
      qris: {
        // Jika Anda ingin QRIS dinamis yang berlaku untuk SEMUA e-wallet
        // (GoPay, OVO, Dana, ShopeePay, dll.)
        "acquirer": "gopay" // Midtrans menggunakan 'gopay' untuk QRIS dinamis
      }
    };

    // 5. Buat Transaksi (Charge) di Midtrans
    // Ini berbeda dari 'snap.createTransactionToken'
    const chargeResponse = await coreApi.charge(parameter);

    // 6. Dapatkan URL QR Code dari Respons
    // Untuk QRIS, URL-nya ada di 'actions[0].url'
    const qrCodeUrl = chargeResponse.actions?.find((action: { name: string }) => action.name === 'generate-qr-code')?.url;

    if (!qrCodeUrl) {
      console.error("Midtrans tidak mengembalikan QR Code URL:", chargeResponse);
      throw new Error("Gagal mendapatkan QR Code dari Midtrans.");
    }

    // 7. Kirim URL QR Code kembali ke Frontend
    return NextResponse.json({ success: true, qrCodeUrl: qrCodeUrl }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating Midtrans QRIS transaction:', error);
    // Tangani jika error berasal dari Midtrans
    if (error.response) {
      return NextResponse.json({ success: false, message: error.response.data.status_message || 'Gagal memproses pembayaran.', error: error.response.data }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: 'Gagal memproses pembayaran.', error: error.message }, { status: 500 });
  }
}
