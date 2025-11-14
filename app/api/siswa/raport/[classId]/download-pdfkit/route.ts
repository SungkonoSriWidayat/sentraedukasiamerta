import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verify, JwtPayload } from 'jsonwebtoken';
import Class from '@/models/Class';
import Attendance from '@/models/Attendance';
import Test from '@/models/Test';
import TestResult from '@/models/TestResult';
import User from '@/models/User';
import mongoose, { Types } from 'mongoose';
import PDFDocument from 'pdfkit'; // Import pdfkit
import fs from 'fs'; // Untuk membaca file font
import path from 'path'; // Untuk path file
import { calculateMaxScore, getNGainGrade } from '@/lib/utils'; // Impor fungsi utilitas

// --- NON-AKTIFKAN CACHING ROUTE ---
export const dynamic = 'force-dynamic';
// --- PAKSA DATA FETCHING SELALU BARU ---
export const revalidate = 0;
// ------------------------------------

const secret = process.env.NEXTAUTH_SECRET;

interface DecodedToken extends JwtPayload {
  id: string;
}

// --- Interface Data ---
interface IStudentData {
    namaLengkap: string;
}
interface IClassData {
    nama: string;
    jumlahPertemuan: number;
}
interface ITestData {
    _id: any;
    tipe: string;
    sections: Array<{ questions: Array<{ tipeSoal: 'Pilihan Ganda' | 'Writing' }> }>;
}
interface ITestResultData {
    testId: any;
    totalScore: number;
    status: string;
    createdAt: Date;
}

// --- Fungsi Sanitasi Filename (Tetap ada) ---
function sanitizeFilename(name: string): string {
    return name
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9.\-_]/g, '')
        .substring(0, 100);
}

// --- FUNGSI GET DIPERBARUI ---
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ classId: string }> } // PERBAIKAN: params sebagai Promise
) {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return new NextResponse('Akses ditolak', { status: 401 });
    }

    try {
        const decoded = verify(token, secret!) as DecodedToken;
        const studentId = decoded.id;
        
        // PERBAIKAN: Tunggu params dengan await
        const { classId } = await params;

        if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(studentId)) {
             return new NextResponse('Class ID atau Student ID tidak valid', { status: 400 });
        }

        await dbConnect();

        // --- Ambil Data Raport ---
        const [kelas, student, attendances] = await Promise.all([
            Class.findById(classId).select('nama jumlahPertemuan').lean() as Promise<IClassData | null>,
            User.findById(studentId).select('namaLengkap').lean() as Promise<IStudentData | null>,
            Attendance.countDocuments({
                classId: new mongoose.Types.ObjectId(classId),
                studentId: new mongoose.Types.ObjectId(studentId),
                status: 'Hadir'
            }).exec(),
        ]);

        if (!kelas || !student) {
             console.error(`[PDF API] Kelas atau Siswa tidak ditemukan.`);
             return new NextResponse('Data kelas atau siswa tidak ditemukan', { status: 404 });
        }

        const tests: ITestData[] = await Test.find({
            classId: new mongoose.Types.ObjectId(classId),
            tipe: { $in: ['Pre-Test', 'Post-Test'] }
        }).select('_id tipe sections').lean();

        const preTestInfo = tests.find(t => t.tipe === 'Pre-Test');
        const postTestInfo = tests.find(t => t.tipe === 'Post-Test');

        const testResults = await TestResult.find({
            studentId: new mongoose.Types.ObjectId(studentId),
            testId: { $in: [preTestInfo?._id, postTestInfo?._id].filter(id => id) }
        }).select('testId totalScore status createdAt').lean() as unknown as ITestResultData[];

        const preTestResult = testResults.find(r => r.testId.toString() === preTestInfo?._id.toString());
        const postTestResult = testResults.find(r => r.testId.toString() === postTestInfo?._id.toString());

        const preTestScore = preTestResult?.totalScore ?? 0;
        const preTestMaxScore = preTestInfo ? calculateMaxScore(preTestInfo) : 0;
        const preTestStatus = preTestResult?.status ?? null;

        const postTestScore = postTestResult?.totalScore ?? 0;
        const postTestMaxScore = postTestInfo ? calculateMaxScore(postTestInfo) : 0;
        const postTestStatus = postTestResult?.status ?? null;
        const postTestCompletionDate = postTestResult?.createdAt ?? null;

        const nGainData = getNGainGrade(preTestScore, postTestScore, postTestMaxScore);

        const graduationDate = postTestCompletionDate
            ? postTestCompletionDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Belum Selesai';

        const attendancePercentage = kelas.jumlahPertemuan > 0
            ? Math.round((attendances / kelas.jumlahPertemuan) * 100)
            : 0;

        // --- PERSIAPAN FONT ---
        const fontPathRegular = path.join(process.cwd(), 'public', 'fonts', 'NotoSans-Regular.ttf');
        const fontPathBold = path.join(process.cwd(), 'public', 'fonts', 'NotoSans-Bold.ttf');
        let fontRegularBuffer: Buffer | null = null;
        let fontBoldBuffer: Buffer | null = null;
        let defaultFontPath: string | undefined = undefined;

        try {
            if (fs.existsSync(fontPathRegular)) {
                fontRegularBuffer = fs.readFileSync(fontPathRegular);
                defaultFontPath = fontPathRegular;
            } else {
                 console.error("[PDF API] Font Regular tidak ditemukan di:", fontPathRegular);
            }
             if (fs.existsSync(fontPathBold)) {
                fontBoldBuffer = fs.readFileSync(fontPathBold);
            } else {
                 console.error("[PDF API] Font Bold tidak ditemukan di:", fontPathBold);
            }
        } catch (fontError) {
             console.error("[PDF API] Gagal membaca file font:", fontError);
        }

        // --- PEMBUATAN PDF DENGAN PDFKIT ---
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 10, right: 50, bottom: 10, left: 50 }, // Sesuaikan margin sesuai kebutuhan — kembalikan margin ke 50 agar ada ruang
            font: defaultFontPath,
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));

        // --- DAFTARKAN FONT ---
        let fontRegularRegisteredName = 'Helvetica'; // Fallback
        let fontBoldRegisteredName = 'Helvetica-Bold'; // Fallback

        if (fontRegularBuffer) {
             try {
                doc.registerFont('NotoSans-Regular', fontRegularBuffer);
                fontRegularRegisteredName = 'NotoSans-Regular';
                doc.font(fontRegularRegisteredName); // Set default
             } catch (regError) {
                 console.error("[PDF API] Gagal mendaftarkan font regular:", regError);
             }
        }
        if (fontBoldBuffer) {
             try {
                 doc.registerFont('NotoSans-Bold', fontBoldBuffer);
                 fontBoldRegisteredName = 'NotoSans-Bold';
             } catch (regError) {
                 console.error("[PDF API] Gagal mendaftarkan font bold:", regError);
             }
        }


        // Path ke gambar background
        const imagePath = path.join(process.cwd(), 'public', 'sertifikat.png');

        if (fs.existsSync(imagePath)) {
            doc.image(imagePath, 0, 0, { width: doc.page.width, height: doc.page.height });
        } else {
             console.warn("[PDF API] Gambar background sertifikat tidak ditemukan di:", imagePath);
        }

        // --- Tambahkan Konten Teks ---
        const colorTextPrimary = '#1f2937';
        const colorTextSecondary = '#6b7280';
        const colorGreen = '#10B981';
        const colorBlue = '#3B82F6';
        const colorYellow = '#F59E0B';
        const colorRed = '#EF4444';
        const colorOrange = '#F97316';
        const colorGray = '#374151';
        const colorGold = '#713f12';


        // Koordinat dan Lebar Konten (Gunakan margin halaman)
        const contentX = doc.page.margins.left; // Mulai dari margin kiri
        const contentY = 70;
        const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right; // Lebar penuh antar margin
        const columnWidth = contentWidth / 2 - 20; // Lebar kolom dengan gap 40
        const column1X = contentX;
        const column2X = contentX + columnWidth + 40;

        // Header
        doc.font(fontBoldRegisteredName).fontSize(25).fillColor(colorTextPrimary).text('SERTIFIKAT KELULUSAN', contentX, contentY, { align: 'center', width: contentWidth });
        doc.font(fontRegularRegisteredName).fontSize(12).fillColor(colorTextSecondary).text('Diberikan kepada:', contentX, doc.y + 5, { align: 'center', width: contentWidth });
        doc.font(fontBoldRegisteredName).fontSize(20).fillColor(colorTextPrimary).text(student.namaLengkap, contentX, doc.y + 5, { align: 'center', width: contentWidth });
        doc.font(fontRegularRegisteredName).fontSize(10).fillColor(colorTextSecondary).text('Telah menyelesaikan kelas', contentX, doc.y + 5, { align: 'center', width: contentWidth });
        doc.font(fontBoldRegisteredName).fontSize(16).fillColor(colorTextPrimary).text(kelas.nama, contentX, doc.y + 5, { align: 'center', width: contentWidth });

        // Posisi Y Mulai untuk Nilai/Absensi
        const startYDetail = doc.y + 40;

        // Kolom Nilai
        doc.font(fontBoldRegisteredName).fontSize(14).fillColor(colorTextPrimary).text('Rangkuman Nilai', column1X, startYDetail);
        doc.moveDown(0.5);
        const startYNilaiContent = doc.y;

        // --- PERBAIKAN SEJAJAR PRE-TEST ---
        const yPreTest = doc.y; // Simpan Y sebelum label
        doc.font(fontRegularRegisteredName).font(fontBoldRegisteredName).fontSize(16).fillColor(colorTextPrimary).text('Nilai Pre-Test:', column1X, yPreTest);
        doc.fontSize(18).fillColor(colorTextPrimary).text(`${preTestScore} / ${preTestMaxScore}`, column1X, yPreTest, { align: 'right', width: columnWidth });
        if(preTestStatus === 'Dikerjakan') {
             // Tulis status di bawah skor (agar tidak overlap jika skor panjang)
             doc.fontSize(9).fillColor(colorOrange).text('(Belum Dinilai)', column1X, doc.y + 1, { align: 'right', width: columnWidth });
             doc.moveDown(0.3); // Beri jarak tambahan jika ada status
        }
        // --- AKHIR PERBAIKAN ---
        doc.moveDown(0.5); // Jarak antar baris

        // --- PERBAIKAN SEJAJAR POST-TEST ---
        const yPostTest = doc.y; // Simpan Y sebelum label
        doc.font(fontRegularRegisteredName).fontSize(16).font(fontBoldRegisteredName).fillColor(colorTextPrimary).text('Nilai Post-Test:', column1X, yPostTest);
        doc.fontSize(18).font(fontBoldRegisteredName).fillColor(colorGreen).text(`${postTestScore} / ${postTestMaxScore}`, column1X, yPostTest, { align: 'right', width: columnWidth });
        if(postTestStatus === 'Dikerjakan') {
             doc.fontSize(9).fillColor(colorOrange).text('(Belum Dinilai)', column1X, doc.y + 1, { align: 'right', width: columnWidth });
             doc.moveDown(0.3);
        }
        // --- AKHIR PERBAIKAN ---
        doc.moveDown(1); // Jarak lebih besar sebelum N-Gain

        // --- PERBAIKAN SEJAJAR N-GAIN (Sudah benar sebelumnya) ---
        const yStartNGainLabel = doc.y;
        doc.fontSize(16).font(fontBoldRegisteredName).fillColor(colorTextPrimary).text('Peningkatan (N-Gain):', column1X, yStartNGainLabel);

        let nGainPdfColor = colorTextPrimary;
        switch (nGainData.grade) {
            case 'A': nGainPdfColor = colorGold; break;
            case 'B': nGainPdfColor = colorGreen; break;
            case 'C': nGainPdfColor = colorYellow; break;
            case 'D': nGainPdfColor = colorRed; break;
            default: nGainPdfColor = colorTextSecondary;
        }

        doc.font(fontBoldRegisteredName).fontSize(16).fillColor(nGainPdfColor).text(`Grade: ${nGainData.grade}`, column1X, yStartNGainLabel, { align: 'right', width: columnWidth });
        const yCategory = doc.y;
        doc.font(fontRegularRegisteredName).fontSize(10).fillColor(nGainPdfColor).text(nGainData.category, column1X, yCategory, { align: 'right', width: columnWidth });
        // --- AKHIR PERBAIKAN SEJAJAR N-GAIN ---
        doc.moveDown(0.5);


        // --- KOLOM ABSENSI (PENYESUAIAN TAMPILAN) ---
        doc.font(fontBoldRegisteredName).fontSize(14).fillColor(colorTextPrimary).text('Rangkuman Kehadiran', column2X, startYDetail);
         doc.moveDown(0.5);
         const startYAbsenContent = doc.y;

        // 1. Tampilkan Persentase di Atas Bar
        doc.font(fontRegularRegisteredName).fontSize(14).font(fontBoldRegisteredName).fillColor(colorTextPrimary).text('Tingkat Kehadiran:', column2X, startYAbsenContent);
        doc.font(fontBoldRegisteredName).fontSize(14).fillColor(colorTextPrimary).text(`${attendancePercentage}%`, { align: 'right', width: columnWidth });
        doc.moveDown(0.3); // Jarak kecil

        // 2. Gambar Progress Bar (sedikit lebih tebal)
        const barWidth = columnWidth; // Gunakan lebar penuh kolom
        const barX = column2X;
        const barY = doc.y;
        const barHeight = 12;
        const barborderradius = 4; // Sedikit lebih tebal
        // Gunakan roundedRect untuk mendukung radius sudut pada PDFKit
        doc.roundedRect(barX, barY, barWidth, barHeight, barborderradius).fill('#E5E7EB');
        doc.roundedRect(barX, barY, barWidth * (attendancePercentage / 100), barHeight, barborderradius).fill(colorGray);
        doc.moveDown(0.5); // Jarak setelah bar

        // 3. Teks Detail di Bawah Bar
        doc.font(fontRegularRegisteredName).fontSize(10).fillColor(colorTextSecondary).text(`Hadir ${attendances} dari ${kelas.jumlahPertemuan} Pertemuan`, { align: 'right', width: columnWidth });
        // --- AKHIR PENYESUAIAN ABSENSI ---


        // Footer (Posisi tetap)
        const footerY = 564;
        doc.font(fontRegularRegisteredName).fontSize(9).fillColor(colorTextSecondary).text(`Diterbitkan oleh Sentra Edukasi Amerta ${graduationDate}`, contentX, footerY, { align: 'center', width: contentWidth });
        
        doc.end();

        return new Promise<void>((resolve, reject) => {
             doc.on('end', () => {
                 try {
                     const pdfData = Buffer.concat(buffers);
                     const sanitizedStudentName = sanitizeFilename(student.namaLengkap);
                     const sanitizedClassName = sanitizeFilename(kelas.nama);
                     const filename = `Sertifikat_${sanitizedStudentName}_${sanitizedClassName}.pdf`;

                     const responseHeaders = new Headers({
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `inline; filename="${filename}"`,
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                     });

                     const response = new NextResponse(pdfData, {
                         status: 200,
                         headers: responseHeaders,
                     });
                     resolve(response as unknown as void);
                 } catch (bufferError) {
                     console.error("[PDF API] Error concatenating buffers or creating response:", bufferError);
                     reject(bufferError);
                 }
             });

              doc.on('error', (err) => {
                  console.error("[PDF API] PDF generation stream error:", err);
                  reject(err);
              });
        });

    } catch (error: any) {
        console.error("[PDF API] Full error details in GET handler:", error);
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
             return new NextResponse('Token tidak valid', { status: 401 });
        }
        if (error.code === 'ENOENT' && error.path?.includes('.afm')) {
             return new NextResponse('Gagal memuat file font internal PDFKit. Pastikan font kustom tersedia di public/fonts.', { status: 500 });
        }

        console.error("[PDF API] Error saat membuat PDF raport:", error);
         return new NextResponse('Terjadi kesalahan pada server saat membuat PDF.', { status: 500 });
    }
}