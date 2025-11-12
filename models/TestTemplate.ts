// Lokasi file: models/TestTemplate.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

const QuestionSchema = new Schema({
    tipeSoal: { type: String, enum: ['Pilihan Ganda', 'Listening', 'Speaking', 'Writing'], required: true },
    pertanyaan: { type: String, required: true },
    audioSrc: { type: String, default: null },
    pilihan: { type: [String] },
    jawabanBenar: { type: String }
});

const SectionSchema = new Schema({
    tipeSesi: { type: String, enum: ['Reading', 'Listening', 'Speaking', 'Writing'], required: true },
    judul: { type: String, required: true },
    instruksi: { type: String, required: true },
    passage: { type: String }, // <-- DIGANTI dari 'konten' menjadi 'passage' agar cocok
    durasi: { type: Number, required: true },
    questions: [QuestionSchema]
});

export interface ITestTemplate extends Document {
    judul: string;
    tipe: 'Pre-Test' | 'Post-Test';
    instructions: string;// <-- DITAMBAHKAN
    isEnglishTest: boolean;
    sections: any[];
}

const TestTemplateSchema: Schema<ITestTemplate> = new Schema({
    judul: { type: String, required: true },
    tipe: { type: String, enum: ['Pre-Test', 'Post-Test'], required: true },
    instructions: { type: String }, // <-- DITAMBAHKAN
    isEnglishTest: { type: Boolean, default: false },
    sections: [SectionSchema]
}, { timestamps: true });

const TestTemplate: Model<ITestTemplate> = mongoose.models.TestTemplate || mongoose.model<ITestTemplate>('TestTemplate', TestTemplateSchema);

export default TestTemplate;