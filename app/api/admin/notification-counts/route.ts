// app/api/admin/notification-counts/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ClassProposal from '@/models/ClassProposal';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('Akses ditolak');
    const decoded = verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'admin') throw new Error('Akses ditolak');

    await dbConnect();
    
    // Hitung dokumen yang relevan, ini sangat cepat
    const pendingTutorCount = await User.countDocuments({ role: 'tutor', status: 'pending' });
    const pendingClassCount = await ClassProposal.countDocuments({ status: 'pending' });

    return NextResponse.json({ 
        success: true, 
        data: {
            pendingTutors: pendingTutorCount,
            pendingClasses: pendingClassCount
        } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
}
