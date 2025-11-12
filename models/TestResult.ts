import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface untuk setiap jawaban dari siswa
export interface IAnswer extends Document {
    questionId: mongoose.Schema.Types.ObjectId; // ID dari pertanyaan asli di dalam Test
    studentAnswer: string; // Jawaban siswa (bisa pilihan A, B, C atau teks esai)
    isCorrect?: boolean; // Untuk Pilihan Ganda, diisi otomatis
    score?: number; // Untuk Esai & Speaking, diisi manual oleh tutor
}

const AnswerSchema: Schema<IAnswer> = new Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    studentAnswer: { type: String, required: true },
    isCorrect: { type: Boolean },
    score: { type: Number, default: 0 }
});

// Interface untuk skor Speaking
export interface ISpeakingScores {
    fluency: number;
    grammar: number;
    pronunciation: number;
    diction: number;
}

const SpeakingScoresSchema: Schema<ISpeakingScores> = new Schema({
    fluency: { type: Number, min: 0, max: 5, default: 0 },
    grammar: { type: Number, min: 0, max: 5, default: 0 },
    pronunciation: { type: Number, min: 0, max: 5, default: 0 },
    diction: { type: Number, min: 0, max: 5, default: 0 }
}, { _id: false });


// Interface untuk dokumen utama TestResult
export interface ITestResult extends Document {
    testId: mongoose.Schema.Types.ObjectId;
    classId: mongoose.Schema.Types.ObjectId;
    studentId: mongoose.Schema.Types.ObjectId;
    tipe: 'Pre-Test' | 'Post-Test';
    answers: IAnswer[];
    speakingScores?: ISpeakingScores;
    totalScore: number;
    status: 'Dikerjakan' | 'Dinilai';
    submittedAt: Date;
}

const TestResultSchema: Schema<ITestResult> = new Schema({
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tipe: { type: String, enum: ['Pre-Test', 'Post-Test'] },
    answers: [AnswerSchema],
    speakingScores: SpeakingScoresSchema,
    totalScore: { type: Number, default: 0 },
    status: { type: String, enum: ['Dikerjakan', 'Dinilai'], default: 'Dikerjakan' },
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const TestResult: Model<ITestResult> = mongoose.models.TestResult || mongoose.model<ITestResult>('TestResult', TestResultSchema);

export default TestResult;
