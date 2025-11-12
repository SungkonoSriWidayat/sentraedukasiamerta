// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  nomorWhatsapp: string;
  namaLengkap: string;
  password?: string;
  role: 'user' | 'tutor' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  fileUrl?: string; // Dibuat opsional karena tidak semua user punya
  rejectionReason?: string;
}

const UserSchema: Schema = new Schema({
  nomorWhatsapp: { 
    type: String, 
    required: [true, 'Nomor WhatsApp wajib diisi.'], 
    unique: true, 
    match: [/^08[0-9]{8,13}$/, 'Format nomor WhatsApp tidak valid.']
  },
  namaLengkap: { 
    type: String, 
    required: [true, 'Nama lengkap wajib diisi.'] 
  },
  password: { 
    type: String, 
    required: [true, 'Kata sandi wajib diisi.'] 
  },
  role: { 
    type: String, 
    enum: ['user', 'tutor', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // <-- PERUBAHAN KUNCI: Default sekarang 'approved'
  },
  fileUrl: {
    type: String,
    // Validasi ini sudah benar, hanya wajib jika rolenya tutor
    required: [function(this: IUser) {
            return this.role === 'tutor';
        }, 'File dokumen wajib diunggah.']
  },
  rejectionReason: {
    type: String,
  }
});

// Middleware hash password tidak perlu diubah
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    return next();
  } catch (err: any) {
    return next(err);
  }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
