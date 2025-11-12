import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import User from '@/models/User'; // Pastikan User diimpor agar populate berfungsi
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';

const secret = process.env.NEXTAUTH_SECRET;
const MESSAGE_LIMIT = 5; // Batas jumlah pesan dalam percakapan

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret!) as JwtPayload;
    const senderId = decoded.id;

    const { classId, receiverId, content } = await req.json();

    if (!classId || !receiverId || !content) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap.' }, { status: 400 });
    }

    await dbConnect();
    
    // Baris ini "menggunakan" model User agar linter tidak memberikan peringatan "never read"
    User.name; 

    // --- LOGIKA HAPUS OTOMATIS ---
    const conversationQuery = {
      classId: new Types.ObjectId(classId),
      $or: [
        { senderId: new Types.ObjectId(senderId), receiverId: new Types.ObjectId(receiverId) },
        { senderId: new Types.ObjectId(receiverId), receiverId: new Types.ObjectId(senderId) },
      ],
    };

    const messageCount = await Message.countDocuments(conversationQuery);

    if (messageCount >= MESSAGE_LIMIT) {
      // Temukan pesan tertua dalam percakapan dan hapus
      const oldestMessage = await Message.findOne(conversationQuery).sort({ timestamp: 1 }).lean();
      if (oldestMessage) {
        await Message.findByIdAndDelete(oldestMessage._id);
      }
    }
    // --- AKHIR LOGIKA HAPUS OTOMATIS ---

    const newMessage = new Message({
      classId,
      senderId,
      receiverId,
      content,
    });
    await newMessage.save();
    
    // Kita perlu populate senderId agar data yang dikembalikan ke frontend konsisten
    const populatedMessage = await Message.findById(newMessage._id).populate('senderId', '_id').lean();

    return NextResponse.json({ success: true, data: populatedMessage }, { status: 201 });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
    }
    console.error('Error saat mengirim pesan:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

