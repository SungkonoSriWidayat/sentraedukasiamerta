// app/api/admin/classes/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

// Fungsi untuk memverifikasi token admin
async function verifyAdminToken(request: NextRequest) {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error('Akses ditolak: Token tidak ditemukan');
    
    const decoded = verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'admin') throw new Error('Akses ditolak: Bukan admin');
}

// ==========================================================
// === FUNGSI GET (Melihat satu kelas) - SUDAH DIAMANKAN ===
// ==========================================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdminToken(request); // <-- 2. Tambahkan pengecekan keamanan
    await dbConnect();

    const classItem = await Class.findById(params.id);
    if (!classItem) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: classItem });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 }); // 403 Forbidden
  }
}

// ==========================================================
// === FUNGSI PUT (Mengubah satu kelas) - SUDAH DIAMANKAN ===
// ==========================================================
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdminToken(request); // <-- 2. Tambahkan pengecekan keamanan
    await dbConnect();

    const body = await request.json();
    const updatedClass = await Class.findByIdAndUpdate(params.id, body, {
        new: true,
        runValidators: true,
    });
    if (!updatedClass) {
        return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updatedClass });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
}

// ============================================================
// === FUNGSI DELETE (Menghapus satu kelas) - SUDAH DIAMANKAN ===
// ============================================================
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdminToken(request); // <-- 2. Tambahkan pengecekan keamanan
    await dbConnect();
    
    const deletedClass = await Class.findByIdAndDelete(params.id);
    if (!deletedClass) {
        return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
}