import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';
import TestResult from '@/models/TestResult';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

interface TokenPayload extends JwtPayload {
    id: string;
    role: string;
}

// --- TIPE DATA BARU UNTUK STRUKTUR PERTANYAAN DARI DB ---
interface IQuestionFromDB {
    jawabanBenar?: string;
    // Tambahkan properti lain dari QuestionSchema jika diperlukan
    [key: string]: any;
}

// Fungsi ini mengambil detail tes lengkap dengan struktur sesinya
export async function GET(request: Request, { params }: { params: { testId: string } }) {
    try {
        await dbConnect();
        const { testId } = params;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as TokenPayload;

        // Cek apakah siswa sudah pernah mengerjakan tes ini
        const existingResult = await TestResult.findOne({ testId, studentId: decoded.id });
        if (existingResult) {
            return NextResponse.json({ success: false, message: 'Anda sudah mengerjakan tes ini.' }, { status: 409 });
        }

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return NextResponse.json({ success: false, message: 'ID Tes tidak valid' }, { status: 400 });
        }

        const test = await Test.findById(testId).lean();
        if (!test) {
            return NextResponse.json({ success: false, message: 'Tes tidak ditemukan' }, { status: 404 });
        }

        // --- LOGIKA BARU YANG BENAR ---
        // Hapus kunci jawaban dari setiap pertanyaan, TAPI TETAP PERTAHANKAN STRUKTUR SESI
        const sanitizedSections = test.sections.map(section => {
            // --- PERBAIKAN DI SINI: Terapkan tipe pada parameter 'question' ---
            const sanitizedQuestions = section.questions.map((question: IQuestionFromDB) => {
                const { jawabanBenar, ...questionData } = question; // Hapus jawaban benar
                return questionData;
            });
            return { ...section, questions: sanitizedQuestions };
        });

        // Kirim seluruh data tes dengan pertanyaan yang sudah disanitasi
        const testForStudent = {
            ...test,
            sections: sanitizedSections,
        };
        
        return NextResponse.json({ success: true, data: testForStudent });

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
             return NextResponse.json({ success: false, message: `Token tidak valid: ${error.message}` }, { status: 401 });
        }
        console.error("API Error - Get Test:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}

