import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult, { IAnswer } from '@/models/TestResult'; // <-- 1. Impor IAnswer
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

interface TokenPayload extends JwtPayload { id: string; role: string; }
interface ScorePayload { answerId: string; score: number; }
interface GradePayload { testResultId: string; scores?: ScorePayload[]; speakingScores?: any; }

export async function POST(request: Request) {
    try {
        await dbConnect();
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Token tidak valid' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as TokenPayload;
        if (decoded.role !== 'tutor') {
            return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
        }

        const payload: GradePayload[] = await request.json();

        for (const grade of payload) {
            const testResult = await TestResult.findById(grade.testResultId);
            if (!testResult) continue;

            if (grade.scores) {
                grade.scores.forEach(scoreUpdate => {
                    // --- 2. Terapkan tipe IAnswer pada parameter 'ans' ---
                    const answer = testResult.answers.find(
                        (ans: IAnswer) => ans.id.toString() === scoreUpdate.answerId
                    );
                    if (answer) {
                        answer.score = scoreUpdate.score;
                    }
                });
            }

            if (grade.speakingScores) {
                testResult.speakingScores = grade.speakingScores;
            }

            let newTotalScore = 0;
            newTotalScore += testResult.answers.filter(a => a.isCorrect).length;
            testResult.answers.forEach(a => {
                if (a.score && a.score > 0) newTotalScore += a.score;
            });
            if (testResult.speakingScores) {
                newTotalScore += Object.values(testResult.speakingScores).reduce((sum: number, score: any) => sum + (score || 0), 0);
            }
            testResult.totalScore = newTotalScore;
            
            testResult.status = 'Dinilai';

            await testResult.save();
        }

        return NextResponse.json({ success: true, message: 'Penilaian berhasil disimpan!' });

    } catch (error) {
        console.error("Error saat menyimpan penilaian:", error);
        return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}

