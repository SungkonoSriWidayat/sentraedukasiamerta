import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verify, JwtPayload } from 'jsonwebtoken';
import Test from '@/models/Test';
import TestResult from '@/models/TestResult';
import mongoose from 'mongoose';

const secret = process.env.NEXTAUTH_SECRET;

interface DecodedToken extends JwtPayload {
  id: string;
}

export async function GET(
    req: NextRequest,
    { params }: { params: { classId: string } }
) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        const decoded = verify(token, secret!) as DecodedToken;
        const studentId = decoded.id;
        const { classId } = params;

        // --- PERBAIKAN UTAMA: Mencegah crash jika ID tidak valid ---
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return NextResponse.json({ success: false, message: 'ID Kelas tidak valid untuk status-tes.' }, { status: 400 });
        }

        await dbConnect();

        // Cari Pre-Test yang aktif untuk kelas ini
        const preTest = await Test.findOne({ 
            classId: new mongoose.Types.ObjectId(classId), 
            tipe: 'Pre-Test' 
        }) as (mongoose.Document & { _id: mongoose.Types.ObjectId });

        if (!preTest) {
            // Jika tidak ada pre-test, siswa bisa langsung belajar
            return NextResponse.json({
                success: true,
                data: { preTestRequired: false }
            });
        }

        // Cek apakah siswa sudah mengerjakan pre-test
        const testResult = await TestResult.findOne({
            testId: preTest._id,
            studentId: new mongoose.Types.ObjectId(studentId)
        });

        // Menggabungkan logika untuk respons yang lebih bersih
        return NextResponse.json({
            success: true,
            data: {
                preTestRequired: true,
                preTestTaken: !!testResult, // true jika 'testResult' tidak null
                testId: preTest._id.toString()
            }
        });

    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
            return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
        }
        console.error("Error saat cek status tes:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}

