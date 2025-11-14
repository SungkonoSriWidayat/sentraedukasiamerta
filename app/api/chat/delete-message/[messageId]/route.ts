import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import jwt, { JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ messageId: string }> } // PERBAIKAN: params sebagai Promise
) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, secret!) as JwtPayload;
        const userId = decoded.id;

        await dbConnect();
        
        // PERBAIKAN: Tunggu params dengan await
        const { messageId } = await params;

        const message = await Message.findById(messageId);

        if (!message) {
            return NextResponse.json({ success: false, message: 'Pesan tidak ditemukan.' }, { status: 404 });
        }

        // Pastikan hanya pengirim asli yang dapat menghapus pesan
        if (message.senderId.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Anda tidak diizinkan menghapus pesan ini.' }, { status: 403 });
        }

        await Message.findByIdAndDelete(messageId);

        return NextResponse.json({ success: true, message: 'Pesan berhasil dihapus.' }, { status: 200 });

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
        }
        console.error('Error saat menghapus pesan:', error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}