// app/api/admin/settings/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

// Fungsi untuk mengambil status pendaftaran
export async function GET(request: Request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) throw new Error('Akses ditolak');
        const decoded = verify(token, JWT_SECRET) as { role: string };
        if (decoded.role !== 'admin') throw new Error('Akses ditolak');

        await dbConnect();
        const setting = await Setting.findOne({ key: 'tutorRegistration' });
        // Jika belum ada setting, defaultnya adalah terbuka
        const isOpen = setting ? setting.value.isOpen : true;
        return NextResponse.json({ success: true, data: { isOpen } });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
}

// Fungsi untuk mengubah status pendaftaran
export async function POST(request: Request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) throw new Error('Akses ditolak');
        const decoded = verify(token, JWT_SECRET) as { role: string };
        if (decoded.role !== 'admin') throw new Error('Akses ditolak');

        await dbConnect();
        const { isOpen } = await request.json();

        await Setting.findOneAndUpdate(
            { key: 'tutorRegistration' },
            { $set: { value: { isOpen } } },
            { upsert: true, new: true } // upsert: true akan membuat dokumen jika belum ada
        );

        return NextResponse.json({ success: true, message: 'Status pendaftaran berhasil diubah.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
