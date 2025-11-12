// app/api/tutor-login/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { nomorWhatsapp, password } = await request.json();

        // Cari user berdasarkan nomor DAN peran 'tutor'
        const tutor = await User.findOne({ nomorWhatsapp, role: 'tutor' });
        if (!tutor) {
            return NextResponse.json({ success: false, message: 'Akun tutor tidak ditemukan atau kata sandi salah' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, tutor.password!);
        if (!isMatch) {
            return NextResponse.json({ success: false, message: 'Akun tutor tidak ditemukan atau kata sandi salah' }, { status: 401 });
        }
        
         // ===== PEMERIKSAAN STATUS - KUNCI UTAMA =====
        if (tutor.status !== 'approved') {
        let message = 'Akun Anda sedang dalam peninjauan oleh admin.';
        if (tutor.status === 'pending') {
            message = 'Akun Anda masih menunggu persetujuan admin.';
        } else if (tutor.status === 'rejected') {
            message = 'Pendaftaran Anda telah ditolak. Silakan hubungi admin untuk informasi lebih lanjut.';
        }
        return NextResponse.json({ success: false, message: message }, { status: 403 }); // 403 Forbidden
        }
        // ===========================================

        const tutorPayload = { 
            id: tutor._id, 
            name: tutor.namaLengkap,
            role: tutor.role
        };
        const token = jwt.sign(tutorPayload, JWT_SECRET, { expiresIn: '10d' });

        return NextResponse.json({ success: true, token });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan' }, { status: 500 });
    }
}