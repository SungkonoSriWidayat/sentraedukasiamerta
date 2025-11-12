// app/api/classes/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import { headers } from 'next/headers'; // Import headers
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

// Fungsi GET yang sudah dilindungi
export async function GET() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verifikasi token
    jwt.verify(token, JWT_SECRET);

    // Jika token valid, lanjutkan ke database
    await dbConnect();
    const classes = await Class.find({});
    return NextResponse.json({ success: true, data: classes });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

// Fungsi POST Anda (juga harus dilindungi dengan cara yang sama)
export async function POST(request: Request) {
  // ... tambahkan logika perlindungan token di sini juga ...
  await dbConnect();
  try {
    const body = await request.json();
    const newClass = await Class.create(body);
    return NextResponse.json({ success: true, data: newClass }, { status: 201});
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400});
  }
}