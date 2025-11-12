// Lokasi file: models/Test.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

// Skema untuk Pertanyaan (QuestionSchema) tidak perlu diubah.
const QuestionSchema = new Schema({
    tipeSoal: { type: String, enum: ['Pilihan Ganda', 'Listening', 'Speaking', 'Writing'], required: true },
    pertanyaan: { type: String, required: true },
    audioSrc: { type: String, default: null },
    pilihan: { type: [String] },
    jawabanBenar: { type: String }
});

// Skema untuk Sesi (SectionSchema) diubah sedikit.
const SectionSchema = new Schema({
    tipeSesi: { type: String, enum: ['Reading', 'Listening', 'Speaking', 'Writing'], required: true },
    judul: { type: String, required: true },
    instruksi: { type: String, required: true },
    // --- DIGANTI ---
    // Nama field diubah dari 'konten' menjadi 'passage' agar konsisten.
    passage: { type: String }, 
    durasi: { type: Number, required: true },
    questions: [QuestionSchema]
});

// Skema utama Test (TestSchema) juga di-upgrade.
export interface ITest extends Document {
    classId: mongoose.Schema.Types.ObjectId;
    judul: string;
    tipe: 'Pre-Test' | 'Post-Test';// --- DITAMBAHKAN ---
    isEnglishTest: boolean;
    instructions: string; 
    sections: any[];
}

const TestSchema: Schema<ITest> = new Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    judul: { type: String, required: true },
    tipe: { type: String, enum: ['Pre-Test', 'Post-Test'], required: true },
    // --- DITAMBAHKAN ---
    // Field untuk menyimpan instruksi umum tes dari Tiptap Editor.
    instructions: { type: String },
    isEnglishTest: { type: Boolean, default: false },
    sections: [SectionSchema]
}, { timestamps: true });

const Test: Model<ITest> = mongoose.models.Test || mongoose.model<ITest>('Test', TestSchema);

export default Test;