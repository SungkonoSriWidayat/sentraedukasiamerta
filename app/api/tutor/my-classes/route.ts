import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import jwt from 'jsonwebtoken'; // Ganti import 'verify' menjadi 'jwt'

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

interface DecodedToken {
  id: string;
  role: string;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      // Jika tidak ada token sama sekali
      return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 401 });
    }

    // Blok try...catch khusus untuk verifikasi JWT
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (err) {
      // Tangani semua error terkait JWT (expired, invalid, dll)
      // Ini akan mengembalikan error 401 yang akan ditangkap interceptor
      return NextResponse.json({ success: false, message: 'Sesi tidak valid atau telah berakhir.' }, { status: 401 });
    }
    
    // Pengecekan peran (role), ini yang seharusnya mengembalikan 403
    if (decoded.role?.trim() !== 'tutor') {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Peran tidak sesuai.' }, { status: 403 });
    }

    await dbConnect();
    
    const myClasses = await Class.find({ tutorId: decoded.id }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: myClasses });

  } catch (error: any) {
    // Tangani error lain yang tidak terduga (misal: masalah database)
    console.error("Internal Server Error in my-classes:", error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server.' }, 
      { status: 500 } // Gunakan status 500 untuk error server
    );
  }
}
