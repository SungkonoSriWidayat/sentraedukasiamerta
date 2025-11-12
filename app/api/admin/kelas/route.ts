import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as DecodedToken;
    if (decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Mengambil semua kelas dari database
    const classes = await Class.find({})
      .sort({ createdAt: -1 }) // Menampilkan yang terbaru di atas
      .lean();

    return NextResponse.json({ success: true, data: classes });

  } catch (error) {
    console.error('API Error fetching all classes for admin:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
