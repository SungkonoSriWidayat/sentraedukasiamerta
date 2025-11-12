import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as DecodedToken;
    if (!['admin', 'tutor'].includes(decoded.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ success: false, message: 'Order ID diperlukan' }, { status: 400 });

    await dbConnect();

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });

    // Verifikasi bahwa tutor hanya bisa menghapus order kelasnya sendiri
    if (decoded.role === 'tutor' && order.tutorId.toString() !== decoded.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await Order.findByIdAndDelete(orderId);

    return NextResponse.json({ success: true, message: 'Order berhasil dihapus.' });

  } catch (error) {
    console.error('API Error deleting order:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
