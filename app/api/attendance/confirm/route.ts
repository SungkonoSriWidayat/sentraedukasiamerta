import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import SesiKelas from '@/models/SesiKelas';
import Class from '@/models/Class';
import jwt, { JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req: Request) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, secret!) as JwtPayload;
        const studentId = decoded.id;

        await dbConnect();
        const { classId, tutorId, pertemuan } = await req.json();

        // Cek apakah siswa sudah absen sebelumnya
        const existingAttendance = await Attendance.findOne({ classId, studentId, pertemuan });
        if (existingAttendance) {
            // --- PERBAIKAN 1: Tambahkan `success: false` saat absensi ditolak ---
            return NextResponse.json({ success: false, message: 'Anda sudah absen untuk pertemuan ini' }, { status: 400 });
        }
        
        // Buat absensi baru
        const newAttendance = new Attendance({
            classId,
            studentId,
            tutorId,
            pertemuan,
            status: 'Hadir',
            timestamp: new Date(),
            sessionStartTime: new Date(),
        });
        await newAttendance.save();

        // --- (Logika hapus SesiKelas otomatis Anda tetap di sini) ---
        try {
            const kelas = await Class.findById(classId).select('materi');
            if (!kelas || !kelas.materi || kelas.materi.length < pertemuan) {
                throw new Error(`Kelas atau materi untuk pertemuan ${pertemuan} tidak ditemukan.`);
            }
            const targetMateriId = kelas.materi[pertemuan - 1]._id;
            if (!targetMateriId) {
                throw new Error(`Materi ID untuk pertemuan ${pertemuan} tidak valid.`);
            }
            
            const deletionResult = await SesiKelas.deleteOne({
                classId: classId,
                siswaId: studentId,
                materiId: targetMateriId 
            });

            if (deletionResult.deletedCount > 0) {
                console.log(`Berhasil menghapus ${deletionResult.deletedCount} SesiKelas secara otomatis.`);
            } else {
                console.log('Tidak ada SesiKelas yang sesuai untuk dihapus.');
            }
        } catch (autoDeleteError) {
            console.error('Gagal menghapus SesiKelas secara otomatis:', autoDeleteError);
        }
        // --- LOGIKA HAPUS OTOMATIS SELESAI ---

        // --- PERBAIKAN 2: Tambahkan `success: true` saat absensi berhasil ---
        return NextResponse.json({ success: true, message: 'Kehadiran berhasil dikonfirmasi' }, { status: 201 });

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
        }
        console.error('API Confirm Error:', error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}
