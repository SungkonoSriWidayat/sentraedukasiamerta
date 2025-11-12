import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import mongoose from 'mongoose';
// BARU: Import error spesifik dari jsonwebtoken
import { verify, JwtPayload, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

interface DecodedToken extends JwtPayload {
  id: string;
}

export async function GET(
    req: NextRequest,
    { params }: { params: { classId: string; userId: string } } 
) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 401 });
    }

    try {
        const decoded = verify(token, secret!) as DecodedToken;
        const currentUserId = decoded.id;
        const { classId, userId: otherUserId } = params;

        if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(otherUserId)) {
            return NextResponse.json({ success: false, message: 'ID Kelas atau Pengguna tidak valid.' }, { status: 400 });
        }
        
        await dbConnect();

        const classObjectId = new mongoose.Types.ObjectId(classId);
        const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
        const otherUserObjectId = new mongoose.Types.ObjectId(otherUserId);

        const messages = await Message.find({
            classId: classObjectId,
            $or: [
                { senderId: currentUserObjectId, receiverId: otherUserObjectId },
                { senderId: otherUserObjectId, receiverId: currentUserObjectId }
            ]
        })
        .populate('senderId', '_id namaLengkap')
        .sort({ timestamp: 1 })
        .lean(); 

        return NextResponse.json({ success: true, data: messages });

    } catch (error: any) {
        // ==================================================================
        // == PERBAIKAN DI SINI =============================================
        // ==================================================================
        if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
            // Tangani token kedaluwarsa ATAU token tidak valid dengan satu respons
            return NextResponse.json({ success: false, message: 'Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.' }, { status: 401 });
        }
        
        console.error("[CHAT HISTORY API - UNIVERSAL] Terjadi error tak terduga:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}