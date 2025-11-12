// Lokasi: app/api/admin/test-templates/[templateId]/route.ts

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TestTemplate from '@/models/TestTemplate';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// --- GET a single template by its ID ---
export async function GET(request: Request, { params }: { params: { templateId: string } }) {
    try {
        await connectDB();
        const { templateId } = params;

        if (!mongoose.Types.ObjectId.isValid(templateId)) {
            return NextResponse.json({ message: 'ID template tidak valid' }, { status: 400 });
        }

        const template = await TestTemplate.findById(templateId);

        if (!template) {
            return NextResponse.json({ message: 'Template tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: template });

    } catch (error) {
        return NextResponse.json({ message: 'Error Server' }, { status: 500 });
    }
}


// --- UPDATE a template by its ID ---
export async function PUT(request: Request, { params }: { params: { templateId: string } }) {
    try {
        const { templateId } = params;
        
        // --- Authentication (same as POST) ---
        const authHeader = request.headers.get('Authorization');
        // ... (your full JWT verification logic here) ...
        
        if (!mongoose.Types.ObjectId.isValid(templateId)) {
            return NextResponse.json({ message: 'ID template tidak valid' }, { status: 400 });
        }

        const body = await request.json();

        const updatedTemplate = await TestTemplate.findByIdAndUpdate(
            templateId,
            body,
            { new: true, runValidators: true } // Options: return the updated doc & run schema validation
        );

        if (!updatedTemplate) {
            return NextResponse.json({ message: 'Template tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ 
            message: 'Template berhasil diperbarui!', 
            data: updatedTemplate 
        });

    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
             return NextResponse.json({ message: `Validasi gagal: ${error.message}` }, { status: 400 });
        }
        // ... (other error handling) ...
        return NextResponse.json({ message: 'Error Server' }, { status: 500 });
    }
}