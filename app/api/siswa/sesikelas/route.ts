import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SesiKelas from '@/models/SesiKelas';
import { verify, JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
    // Ambil token dari header Authorization
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        // Verifikasi token JWT
        const decoded = verify(token, secret!) as JwtPayload;
        const studentId = decoded.id;

        // Validasi studentId
        if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
            return NextResponse.json({ success: false, message: 'ID siswa tidak valid' }, { status: 400 });
        }

        // Koneksi ke database
        await dbConnect();

        // Cari semua sesi yang cocok dengan studentId
        const allSessions = await SesiKelas.find({
            siswaId: new mongoose.Types.ObjectId(studentId),
        })
            .populate({
                path: 'classId',
                select: 'nama materi', // Pilih hanya field yang diperlukan
            })
            .sort({ tanggalSesi: 1 })
            .lean();

        // Saring sesi yang data kelasnya mungkin sudah terhapus
        const validSessions = allSessions.filter(
            (session) => session.classId && typeof session.classId === 'object'
        );

        // Format data untuk frontend
        const formattedSessions = validSessions.map((session) => {
            const classData = session.classId as any;
            const materiArray = Array.isArray(classData?.materi) ? classData.materi : [];

            const materiInfo = materiArray.find(
                (m: any) =>
                    m &&
                    m._id &&
                    session.materiId &&
                    m._id.toString() === session.materiId.toString()
            );

            return {
                _id: session._id,
                tanggalSesi: session.tanggalSesi,
                className: classData?.nama || 'Kelas tidak ditemukan',
                materiTitle: materiInfo ? materiInfo.judul : 'Materi tidak ditemukan',
            };
        });

        // Jika tidak ada sesi yang ditemukan
        if (formattedSessions.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'Tidak ada sesi yang ditemukan.',
            });
        }

        // Kembalikan data sesi yang diformat
        return NextResponse.json({ success: true, data: formattedSessions });
    } catch (error: any) {
        console.error('Error mengambil semua sesi siswa:', error.message);
        return NextResponse.json(
            { success: false, message: error.message || 'Terjadi kesalahan pada server.' },
            { status: 500 }
        );
    }
}