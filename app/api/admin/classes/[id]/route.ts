// app/api/admin/classes/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

// === PERBAIKAN: params sekarang adalah Promise ===
type RouteContext = {
  params: Promise<{ id: string }>
}

async function verifyAdminToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error('Akses ditolak: Token tidak ditemukan');
  
  const decoded = verify(token, JWT_SECRET) as { role: string };
  if (decoded.role !== 'admin') throw new Error('Akses ditolak: Bukan admin');
}

// ==========================================================
// === FUNGSI GET (SUDAH DIPERBAIKI) ===
// ==========================================================
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await verifyAdminToken(request);
    await dbConnect();

    // PERBAIKAN: Tunggu params dengan await
    const { id } = await context.params;

    const classItem = await Class.findById(id);
    if (!classItem) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: classItem });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
}

// ==========================================================
// === FUNGSI PUT (SUDAH DIPERBAIKI) ===
// ==========================================================
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await verifyAdminToken(request);
    await dbConnect();

    // PERBAIKAN: Tunggu params dengan await
    const { id } = await context.params;

    const body = await request.json();
    const updatedClass = await Class.findByIdAndUpdate(id, body, {
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
// === FUNGSI DELETE (SUDAH DIPERBAIKI) ===
// ============================================================
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await verifyAdminToken(request);
    await dbConnect();

    // PERBAIKAN: Tunggu params dengan await
    const { id } = await context.params;

    const deletedClass = await Class.findByIdAndDelete(id);
    if (!deletedClass) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 403 });
  }
}