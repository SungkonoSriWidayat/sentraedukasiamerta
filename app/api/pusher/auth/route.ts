import { NextRequest, NextResponse } from 'next/server';
// --- PERBAIKAN: Mengubah path impor agar sesuai dengan struktur folder ---
 // Impor instance pusher yang sudah kita buat
import jwt, { JwtPayload } from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Forbidden', { status: 403 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret!) as JwtPayload;
    const userId = decoded.id;

    const data = await req.formData();
    const socketId = data.get('socket_id') as string;
    const channel = data.get('channel_name') as string;

    // Ekstrak ID pengguna dari nama channel
    // Contoh: 'private-chat-USERID1-USERID2'
    const channelUsers = channel.split('-').slice(2);

    // Otorisasi: Pengguna hanya boleh masuk jika ID mereka ada di dalam nama channel
    if (!channelUsers.includes(userId)) {
        return new Response('Unauthorized', { status: 401 });
    }

    const userData = {
      user_id: userId,
    };

    // Buat tanda tangan otorisasi
  

    

  } catch (error) {
    console.error('Pusher auth error:', error);
    return new Response('Forbidden', { status: 403 });
  }
}
