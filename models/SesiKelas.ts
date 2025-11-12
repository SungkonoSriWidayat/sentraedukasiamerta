import mongoose, { Document, Schema, Models, Model, model, models } from 'mongoose';

// Interface ini mendefinisikan tipe data untuk setiap dokumen SesiKelas
export interface ISesiKelas extends Document {
    classId: mongoose.Schema.Types.ObjectId;
    materiId: mongoose.Schema.Types.ObjectId;
    tanggalSesi: Date;
    siswaId: mongoose.Schema.Types.ObjectId | null;
    status: 'Aktif' | 'Nonaktif'; // PERUBAHAN: Disederhanakan menjadi Aktif dan Nonaktif
}

// Skema Mongoose yang akan menjadi struktur collection di MongoDB
const SesiKelasSchema: Schema<ISesiKelas> = new Schema({
    classId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', // Merujuk ke model Kelas Anda
        required: true 
    },
    materiId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Materi', // Sebaiknya merujuk ke model Materi jika ada, jika tidak, ini sudah cukup
        required: true 
    },
    tanggalSesi: { 
        type: Date, 
        required: true 
    },
    siswaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Merujuk ke model User (untuk siswa)
        default: null 
    },
    // PERUBAHAN UTAMA DI SINI
    status: { 
        type: String, 
        enum: ['Aktif', 'Nonaktif'], // PERUBAHAN: Hanya mengizinkan dua nilai ini
        default: 'Nonaktif' // PERUBAHAN: Nilai default sekarang adalah 'Nonaktif'
    },
}, { timestamps: true });

const SesiKelas: Model<ISesiKelas> = mongoose.models.SesiKelas || mongoose.model<ISesiKelas>('SesiKelas', SesiKelasSchema);

export default SesiKelas;

