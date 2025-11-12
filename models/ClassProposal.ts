import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClassProposal extends Document {
  tutorId: Types.ObjectId;
  tutorName: string;
  namaKelas: string;
  deskripsi: string;
  materi: string[]; // <-- PERUBAHAN KUNCI: Harus berupa array string (string[])
  jumlahPertemuan: number;
  waktuPerPertemuan: string;
  harga: number;
  jadwal: string;
  status: 'pending' | 'approved' | 'rejected';
  updatedAt: Date;
}

const ClassProposalSchema: Schema = new Schema({
  tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tutorName: { type: String, required: true },
  namaKelas: { type: String, required: true },
  deskripsi: { type: String, required: true },
  materi: [{ type: String, required: true }], // <-- PERUBAHAN KUNCI: Harus berupa [{ type: String }]
  jumlahPertemuan: { type: Number, required: true },
  waktuPerPertemuan: { type: String, required: true },
  harga: { type: Number, required: true },
  jadwal: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.models.ClassProposal || mongoose.model<IClassProposal>('ClassProposal', ClassProposalSchema);
