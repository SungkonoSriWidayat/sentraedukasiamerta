import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verify, JwtPayload } from 'jsonwebtoken';
import Class from '@/models/Class';
import Attendance from '@/models/Attendance';
import Test from '@/models/Test';
import TestResult from '@/models/TestResult';
import Message from '@/models/Message'; // Impor model Message
import Order from '@/models/Order';
import mongoose, { Types } from 'mongoose';

const secret = process.env.NEXTAUTH_SECRET;

interface DecodedToken extends JwtPayload {
  id: string; // Pastikan ini sesuai dengan payload token Anda
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ classId: string }> } // PERBAIKAN: params sebagai Promise
) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak: Token tidak ditemukan' }, { status: 401 });
    }

    try {
        const decoded = verify(token, secret!) as DecodedToken;
        const studentId = decoded.id; // Ambil ID siswa dari token
        
        // PERBAIKAN: Tunggu params dengan await
        const { classId } = await params;

        // Validasi ID
        if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(studentId)) {
             return NextResponse.json({ success: false, message: 'Class ID atau Student ID tidak valid' }, { status: 400 });
        }

        const studentObjectId = new mongoose.Types.ObjectId(studentId);
        const classObjectId = new mongoose.Types.ObjectId(classId);

        await dbConnect();

        console.log(`[Leave API] Attempting to remove student ${studentId} from class ${classId}`);

        // Cari ID semua Tes yang terkait dengan kelas ini
        const testsInClass = await Test.find({ classId: classObjectId }).select('_id').lean();
        const testIds = testsInClass.map(test => test._id);
        console.log(`[Leave API] Found ${testIds.length} tests for class ${classId}`);

        // Hapus semua data terkait secara berurutan (atau gunakan transaction jika prefer)
        const deleteAttendances = await Attendance.deleteMany({ studentId: studentObjectId, classId: classObjectId });
        console.log(`[Leave API] Deleted ${deleteAttendances.deletedCount} attendance records.`);

        // --- AKTIFKAN HAPUS MESSAGES ---
        // Query ini sesuai dengan model Message Anda
        const deleteMessages = await Message.deleteMany({ classId: classObjectId, $or: [{ senderId: studentObjectId }, { receiverId: studentObjectId }] });
        console.log(`[Leave API] Deleted ${deleteMessages.deletedCount} message records.`);
        // --- AKHIR HAPUS MESSAGES ---

        // Hapus Test Results berdasarkan testIds
        const deleteTestResults = await TestResult.deleteMany({ studentId: studentObjectId, testId: { $in: testIds } });
        console.log(`[Leave API] Deleted ${deleteTestResults.deletedCount} test result records.`);

        // Hapus data Order
        const deleteOrders = await Order.deleteMany({ studentId: studentObjectId, classId: classObjectId });
        console.log(`[Leave API] Deleted ${deleteOrders.deletedCount} order records.`);

        // Hapus siswa dari array enrolledStudents di Class
        const updateClass = await Class.updateOne(
            { _id: classObjectId },
            { $pull: { enrolledStudents: studentObjectId } }
        );
        console.log(`[Leave API] Updated class enrollment: ${updateClass.modifiedCount > 0 ? 'Success' : 'Student not found or already removed'}.`);


        return NextResponse.json({ success: true, message: 'Berhasil meninggalkan kelas dan menghapus data terkait.' });

    } catch (error: any) {
        console.error("[Leave API] Error processing leave request:", error);
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
             return NextResponse.json({ success: false, message: 'Token tidak valid' }, { status: 401 });
        }
        // Tangani error spesifik Mongoose jika perlu
        // else if (error instanceof mongoose.Error) { ... }

         return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server saat memproses permintaan.' }, { status: 500 });
    }
}