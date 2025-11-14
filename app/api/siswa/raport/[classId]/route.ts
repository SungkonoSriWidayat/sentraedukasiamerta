import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verify, JwtPayload } from 'jsonwebtoken';
import Class from '@/models/Class';
import Attendance from '@/models/Attendance';
import Test from '@/models/Test';
import TestResult from '@/models/TestResult';
import User from '@/models/User';
import mongoose, { Types } from 'mongoose';
// --- PERUBAHAN IMPORT ---
import { calculateMaxScore, getNGainGrade, ITestInfo } from '@/lib/utils';
// (Path diubah ke @/lib/utils)


const secret = process.env.NEXTAUTH_SECRET;

interface DecodedToken extends JwtPayload {
  id: string;
}

// --- Interface Lokal ---
interface IStudentData {
    namaLengkap: string;
}
interface IClassData {
    nama: string;
    jumlahPertemuan: number;
}
interface ITestResultData {
    testId: Types.ObjectId;
    totalScore: number;
    status: string;
    createdAt: Date;
}


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ classId: string }> } // PERBAIKAN: params sebagai Promise
) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        const decoded = verify(token, secret!) as DecodedToken;
        const studentId = decoded.id;
        
        // PERBAIKAN: Tunggu params dengan await
        const { classId } = await params;

        await dbConnect();

        // 1. Ambil data paralel
        const [kelas, student, attendances, tests] = await Promise.all([
            Class.findById(classId).select('nama jumlahPertemuan').lean().exec() as Promise<IClassData | null>,
            User.findById(studentId).select('namaLengkap').lean().exec() as Promise<IStudentData | null>,
            Attendance.countDocuments({
                classId: new mongoose.Types.ObjectId(classId),
                studentId: new mongoose.Types.ObjectId(studentId),
                status: 'Hadir'
            }).exec(),
            // Ambil tes dan sections-nya untuk menghitung maxScore
            Test.find({ classId: new mongoose.Types.ObjectId(classId), tipe: { $in: ['Pre-Test', 'Post-Test'] } })
                .select('_id tipe sections') // Ambil 'sections'
                .lean().exec() as Promise<ITestInfo[]>,
        ]);

        if (!kelas || !student) {
            return NextResponse.json({ success: false, message: 'Data kelas atau siswa tidak ditemukan' }, { status: 404 });
        }

        // 2. Dapatkan Info Tes & Hitung maxScore
        const preTestInfo = tests.find(t => t.tipe === 'Pre-Test');
        const postTestInfo = tests.find(t => t.tipe === 'Post-Test');
        
        // --- MENGGUNAKAN FUNGSI TERPUSAT ---
        if (preTestInfo) {
            preTestInfo.maxScore = calculateMaxScore(preTestInfo);
        }
        if (postTestInfo) {
            postTestInfo.maxScore = calculateMaxScore(postTestInfo);
        }
        // --- SELESAI ---
        
        
        // 3. Ambil hasil tes
        const testResults = await TestResult.find({
            studentId: new mongoose.Types.ObjectId(studentId),
            testId: { $in: [preTestInfo?._id, postTestInfo?._id].filter(id => id) }
        })
        .select('testId totalScore status createdAt') 
        .lean().exec() as unknown as ITestResultData[];

        const preTestResult = testResults.find(r => r.testId.toString() === preTestInfo?._id.toString());
        const postTestResult = testResults.find(r => r.testId.toString() === postTestInfo?._id.toString());
        
        const preTestScore = preTestResult?.totalScore ?? 0;
        // Ambil maxScore yang sudah dihitung
        const preTestMaxScore = preTestInfo?.maxScore ?? 0; 
        const preTestStatus = preTestResult?.status ?? null;

        const postTestScore = postTestResult?.totalScore ?? 0;
        // Ambil maxScore yang sudah dihitung
        const postTestMaxScore = postTestInfo?.maxScore ?? 0;
        const postTestStatus = postTestResult?.status ?? null;
        const postTestCompletionDate = postTestResult?.createdAt ?? null;

        // 4. Hitung Peningkatan
        // --- MENGGUNAKAN FUNGSI TERPUSAT ---
        // Asumsi maxScore bisa berbeda antara Pre dan Post Test, jadi kita gunakan maxScore Post-test sebagai acuan
        const nGainData = getNGainGrade(preTestScore, postTestScore, postTestMaxScore);
        
        // Catatan: Jika maxScore Pre-Test dan Post-Test BISA BERBEDA, logika N-Gain
        // yang membandingkannya harus lebih hati-hati. Saat ini kita asumsikan
        // maxScore untuk N-Gain adalah maxScore dari Post-Test.
        // Jika pre-test punya max 10 dan post-test max 20, kita harus normalisasi keduanya
        // sebelum memanggil getNGainGrade.

        // Mari kita perbaiki logika N-Gain untuk menangani maxScore yang berbeda
        const normalizedPreTestScore = preTestMaxScore > 0 ? (preTestScore / preTestMaxScore) : 0;
        const normalizedPostTestScore = postTestMaxScore > 0 ? (postTestScore / postTestMaxScore) : 0;
        
        // Panggil getNGainGrade dengan skor yang sudah dinormalisasi (0-1)
        // dan maxScore 1.0
        const nGainDataNormalized = getNGainGrade(normalizedPreTestScore, normalizedPostTestScore, 1.0);
        // --- SELESAI ---

        // 5. Susun data final
        const raportData = {
            studentName: student.namaLengkap,
            className: kelas.nama,
            totalMeetings: kelas.jumlahPertemuan,
            attendedMeetings: attendances,
            preTest: {
                score: preTestScore,
                maxScore: preTestMaxScore,
                status: preTestStatus
            },
            postTest: {
                score: postTestScore,
                maxScore: postTestMaxScore,
                status: postTestStatus
            },
            nGainData: nGainDataNormalized, // Kirim objek N-Gain yang sudah dinormalisasi
            postTestCompletionDate: postTestCompletionDate ? postTestCompletionDate.toISOString() : null,
        };

        return NextResponse.json({ success: true, data: raportData });

    } catch (error: any) {
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
        }
        console.error("Error saat mengambil data raport:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}