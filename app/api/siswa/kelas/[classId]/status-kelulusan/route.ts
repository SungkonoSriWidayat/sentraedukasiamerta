import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verify, JwtPayload } from 'jsonwebtoken';
import Class from '@/models/Class';
import Attendance from '@/models/Attendance';
import Test from '@/models/Test';
import TestResult from '@/models/TestResult';
import mongoose from 'mongoose';

const secret = process.env.NEXTAUTH_SECRET;

// Interface untuk token yang sudah di-decode
interface DecodedToken extends JwtPayload {
  id: string;
}

// Interface untuk data yang akan dikirim kembali ke client
interface IGraduationStatus {
    layakPostTest: boolean;
    postTestId: string | null;
    postTestTaken: boolean;
    message: string;
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

        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return NextResponse.json({ success: false, message: 'ID Kelas tidak valid.' }, { status: 400 });
        }

        await dbConnect();

        // --- OPTIMISASI: Jalankan query yang tidak saling bergantung secara paralel ---
        const [kelas, jumlahHadir] = await Promise.all([
            Class.findById(classId).select('jumlahPertemuan').lean(),
            Attendance.countDocuments({
                classId: new mongoose.Types.ObjectId(classId),
                studentId: new mongoose.Types.ObjectId(studentId),
                status: 'Hadir'
            })
        ]);

        if (!kelas) {
            return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan' }, { status: 404 });
        }
        
        const totalPertemuan = kelas.jumlahPertemuan;

        if (jumlahHadir < totalPertemuan) {
            const responseData: IGraduationStatus = {
                layakPostTest: false,
                postTestId: null,
                postTestTaken: false,
                message: `Anda baru menyelesaikan ${jumlahHadir} dari ${totalPertemuan} pertemuan.`
            };
            return NextResponse.json({ success: true, data: responseData });
        }
        
        // --- Siswa sudah memenuhi syarat kehadiran, cek Post-Test ---
        
        const postTest = await Test.findOne<{ _id: mongoose.Types.ObjectId }>({
            classId: new mongoose.Types.ObjectId(classId),
            tipe: 'Post-Test'
        }).lean();
        
        if (!postTest) {
            const responseData: IGraduationStatus = {
                layakPostTest: true,
                postTestId: null,
                postTestTaken: false,
                message: 'Selamat! Anda telah menyelesaikan semua pertemuan. Namun, Post-Test belum ditugaskan untuk kelas ini.'
            };
            return NextResponse.json({ success: true, data: responseData });
        }

        const postTestResult = await TestResult.findOne({
            testId: postTest._id,
            studentId: new mongoose.Types.ObjectId(studentId)
        }).lean();

        const responseData: IGraduationStatus = {
            layakPostTest: true,
            postTestId: postTest._id.toString(),
            postTestTaken: !!postTestResult,
            message: 'Selamat! Anda layak mengerjakan Post-Test.'
        };
        return NextResponse.json({ success: true, data: responseData });

    } catch (error: any) {
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
        }
        console.error("API Error /status-kelulusan:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}