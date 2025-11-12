// app/api/settings/registration-status/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';

export async function GET() {
    try {
        await dbConnect();
        const setting = await Setting.findOne({ key: 'tutorRegistration' });
        const isOpen = setting ? setting.value.isOpen : true; // Default terbuka
        return NextResponse.json({ success: true, data: { isOpen } });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Gagal mengambil status pendaftaran.' }, { status: 500 });
    }
}
