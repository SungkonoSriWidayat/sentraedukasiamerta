import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import '@/models/User';
import '@/models/Class';

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as DecodedToken;

    if (decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const orders = await Order.find({})
      .populate({ path: 'studentId', model: 'User', select: 'namaLengkap' })
      .populate({ path: 'classId', model: 'Class', select: 'nama' })
      .sort({ createdAt: -1 }) // Menampilkan order terbaru di atas
      .lean();

    return NextResponse.json({ success: true, data: orders });

  } catch (error) {
    console.error('API Error fetching admin orders:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
