// app/api/courses/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(); // Gunakan nama DB dari connection string Anda

    // Anggap Anda punya collection bernama 'courses'
    const courses = await db.collection('courses').find({}).toArray();

    return NextResponse.json({ courses });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error fetching courses' }, { status: 500 });
  }
}