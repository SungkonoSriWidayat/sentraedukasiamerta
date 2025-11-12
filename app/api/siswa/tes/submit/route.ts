import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verify, JwtPayload } from 'jsonwebtoken';
import Test from '@/models/Test';
import TestResult from '@/models/TestResult';
import mongoose from 'mongoose';

const secret = process.env.NEXTAUTH_SECRET;

// Interface untuk token JWT
interface DecodedToken extends JwtPayload {
  id: string;
}

// Interface untuk memastikan tipe data yang kita ambil dari 'Test'
interface IFullTestData {
    _id: mongoose.Types.ObjectId;
    tipe: 'Pre-Test' | 'Post-Test'; // Field 'tipe' sekarang wajib ada
    sections: {
        questions: {
            _id: mongoose.Types.ObjectId;
            jawabanBenar: string;
        }[];
    }[];
}

export async function POST(req: NextRequest) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        const decoded = verify(token, secret!) as DecodedToken;
        const studentId = decoded.id;

        const body = await req.json();
        const { testId, classId, answers } = body;

        if (!testId || !classId || !answers) {
            return NextResponse.json({ success: false, message: 'Data tidak lengkap.' }, { status: 400 });
        }

        await dbConnect();

        // Cari data tes lengkap, termasuk 'tipe'
        const testData = await Test.findById(testId).lean() as IFullTestData | null;
        
        if (!testData || !testData.sections) {
            return NextResponse.json({ success: false, message: 'Tes atau isinya tidak ditemukan.' }, { status: 404 });
        }

        // Cek apakah siswa sudah pernah mengerjakan tes dengan tipe yang sama di kelas ini
        const existingResult = await TestResult.findOne({
            classId: new mongoose.Types.ObjectId(classId),
            studentId: new mongoose.Types.ObjectId(studentId),
            tipe: testData.tipe // Gunakan 'tipe' dari tes yang sedang dikerjakan
        });

        if (existingResult) {
            return NextResponse.json({ success: false, message: `Anda sudah pernah mengerjakan ${testData.tipe} di kelas ini.` }, { status: 409 });
        }
        
        // Kumpulkan semua pertanyaan dari semua seksi menjadi satu array
        const allQuestions = testData.sections.flatMap(section => section.questions ?? []);
        
        let score = 0;
        let correctAnswers = 0;
        const totalQuestions = allQuestions.length;

        for (const question of allQuestions) {
            const questionId = question._id.toString();
            const correctAnswer = question.jawabanBenar;
            const userAnswerEntry = answers.find((a: any) => a.questionId === questionId);
            const userAnswer = userAnswerEntry ? userAnswerEntry.studentAnswer : undefined;

            if (userAnswer === correctAnswer) {
                correctAnswers++;
            }
        }

        if (totalQuestions > 0) {
            score = Math.round((correctAnswers / totalQuestions) * 100);
        }

        // Buat dokumen hasil tes baru
        const newTestResult = new TestResult({
            testId: new mongoose.Types.ObjectId(testId),
            classId: new mongoose.Types.ObjectId(classId),
            studentId: new mongoose.Types.ObjectId(studentId),
            tipe: testData.tipe, // Simpan 'tipe' tes ke dalam hasil
            answers: answers.map((ans: any) => ({ 
                questionId: ans.questionId, 
                studentAnswer: ans.studentAnswer
            })),
            totalScore: score,
        });

        await newTestResult.save();

        return NextResponse.json({ 
            success: true, 
            data: { score },
            message: 'Hasil tes berhasil disimpan.' 
        });

    } catch (error: any) {
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
        }
        console.error("API Error - /api/siswa/tes/submit:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}