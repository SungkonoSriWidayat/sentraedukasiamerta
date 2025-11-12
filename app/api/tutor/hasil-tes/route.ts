import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';
import TestResult, { ITestResult } from '@/models/TestResult';
import User from '@/models/User';
import jwt, { JwtPayload } from 'jsonwebtoken';
// --- PERUBAHAN IMPORT ---
import { calculateMaxScore, ITestInfo } from '@/lib/utils'; 
// (Path diubah ke @/lib/utils)

// Definisikan tipe data yang lebih spesifik untuk Test dari Mongoose
// Gunakan ITestInfo dari utilitas
interface ITestDocument extends ITestInfo {
  // tambahkan properti lain dari skema Test Anda jika ada
}

interface TokenPayload extends JwtPayload {
    id: string;
    role: string;
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Autentikasi Tutor (Tidak berubah)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as TokenPayload;
        if (decoded.role !== 'tutor') {
            return NextResponse.json({ success: false, message: 'Akses tidak sah' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('classId');
        const tipeTes = searchParams.get('tipeTes');

        if (!classId || !tipeTes) {
            return NextResponse.json({ success: false, message: 'Class ID dan Tipe Tes diperlukan' }, { status: 400 });
        }

        // Ambil 'sections' untuk menghitung maxScore
        const testDetails: ITestDocument | null = await Test.findOne({ classId: classId, tipe: tipeTes })
            .select('_id tipe sections') // Ambil sections
            .lean();

        if (!testDetails) {
            return NextResponse.json({ success: true, testDetails: null, results: [] });
        }

        // --- MENGGUNAKAN FUNGSI TERPUSAT ---
        // Hitung dan tambahkan maxScore ke objek
        testDetails.maxScore = calculateMaxScore(testDetails);
        // --- SELESAI ---

        const results = await TestResult.find({ testId: testDetails._id })
            .populate({
                path: 'studentId',
                model: User,
                select: 'namaLengkap'
            });

        let responseData: any = { success: true, testDetails, results };

        if (tipeTes === 'Post-Test') {
            const preTest = await Test.findOne({ classId: classId, tipe: 'Pre-Test' });
            let preTestResults: ITestResult[] = []; 
            if (preTest) {
                preTestResults = await TestResult.find({ testId: preTest._id })
                    .populate({
                        path: 'studentId',
                        model: User,
                        select: 'namaLengkap'
                    });
            }
            responseData.preTestResults = preTestResults;
        }

        return NextResponse.json(responseData);

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
             return NextResponse.json({ success: false, message: `Token tidak valid: ${error.message}` }, { status: 401 });
        }
        console.error("Error saat mengambil hasil tes:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}

