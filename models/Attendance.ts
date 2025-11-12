import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface untuk mendefinisikan tipe data Attendance
export interface IAttendance extends Document {
  classId: mongoose.Schema.Types.ObjectId;
  studentId: mongoose.Schema.Types.ObjectId;
  tutorId: mongoose.Schema.Types.ObjectId;
  pertemuan: number;
  // Status untuk melacak proses: sesi dimulai, atau sudah dikonfirmasi.
  status: 'Berlangsung' | 'Hadir'; 
  timestamp?: Date; // Waktu siswa mengkonfirmasi 'Hadir'
  // Waktu siswa menekan tombol "Mulai Sesi"
  sessionStartTime: Date; 
}

// Skema untuk model Attendance
const AttendanceSchema: Schema<IAttendance> = new Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pertemuan: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Berlangsung', 'Hadir'], // Hanya ada 2 status yang disimpan di DB
    required: true,
  },
  timestamp: {
    type: Date,
  },
  sessionStartTime: {
    type: Date,
    required: true,
  }
});

AttendanceSchema.index({ classId: 1, studentId: 1, pertemuan: 1 }, { unique: true });

const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;

