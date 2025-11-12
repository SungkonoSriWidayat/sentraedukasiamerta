import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface untuk status absensi
export interface IAttendanceState {
  status: 'Terkunci' | 'Aktif' | 'Selesai';
  windowExpires?: Date | null;
}

export interface IMateri {
  _id?: string;
  judul?: string; 
  deskripsi?: string;
  linkGoogleMeet?: string;
  linkVideo?: string;
  linkPdf?: string;
  namaPdf?: string;
  absensi: IAttendanceState; 
  kehadiranSiswa?: string;
}

// Interface utama untuk Class
export interface IClass extends Document {
  nama: string;
  deskripsi?: string; 
  tutorId: mongoose.Schema.Types.ObjectId;
  tutorName: string;
  harga?: number;
  status?: 'Pending' | 'Approved' | 'Rejected';
  jumlahPertemuan: number;
  waktuPerPertemuan?: number;
  jadwal?: string; 
  enrolledStudents: mongoose.Schema.Types.ObjectId[];
  materi: IMateri[];
  // --- TAMBAHAN BARU ---
  adminStatus: 'kelas belum siap' | 'kelas siap' | 'kelas terlalu banyak siswa';
  // --- AKHIR TAMBAHAN ---
}

// Skema untuk sub-dokumen Materi
const MateriSchema: Schema<IMateri> = new Schema({
  judul: { type: String }, 
  deskripsi: { type: String },
  linkGoogleMeet: { type: String, default: '' },
  linkVideo: { type: String, default: '' },
  linkPdf: { type: String, default: '' },
  namaPdf: { type: String, default: '' },
  absensi: {
    status: {
      type: String,
      enum: ['Terkunci', 'Aktif', 'Selesai'],
      default: 'Terkunci',
    },
    windowExpires: {
      type: Date,
      default: null,
    }
  }
});

// Skema utama untuk Class
const ClassSchema: Schema<IClass> = new Schema({
  nama: { type: String, required: true, trim: true },
  deskripsi: { type: String, trim: true }, 
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutorName: { type: String, required: true },
  harga: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
  },
  // --- TAMBAHAN BARU ---
  adminStatus: {
    type: String,
    enum: ['kelas belum siap', 'kelas siap', 'kelas terlalu banyak siswa'],
    default: 'kelas belum siap',
  },
  // --- AKHIR TAMBAHAN ---
  jumlahPertemuan: { type: Number, required: true },
  waktuPerPertemuan: { type: Number },
  jadwal: { type: String }, 
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  materi: [MateriSchema],
}, { timestamps: true });

// Membuat dan mengekspor model
const Class: Model<IClass> = mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);

export default Class;
