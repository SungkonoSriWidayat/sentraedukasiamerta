import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export async function POST(request: Request) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    const { fileId } = await request.json();
    if (!fileId) {
      return NextResponse.json({ error: "File ID tidak ada dalam permintaan." }, { status: 400 });
    }

    // --- PERTAHANAN 1: Dapatkan metadata file ---
    let fileName: string;
    try {
      const fileMetadata = await drive.files.get({
        fileId: fileId,
        fields: 'name',
      });
      // --- PERTAHANAN 2: Pastikan nama file tidak kosong ---
      fileName = fileMetadata.data.name || "(Tanpa Judul)"; 
    } catch (metaError: any) {
      console.error("Gagal mendapatkan metadata file:", metaError.message);
      if (metaError.code === 404) {
        return NextResponse.json({ error: 'File tidak ditemukan di Google Drive. Periksa kembali link Anda.' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Gagal membaca file asli dari Google Drive.' }, { status: 500 });
    }

    // --- PERTAHANAN 3: Lanjutkan proses penyalinan ---
    const copiedFile = await drive.files.copy({
      fileId: fileId,
      requestBody: {
        name: `(Salinan Tutor) ${fileName}`,
      },
      fields: 'id, webViewLink', // Minta field yang dibutuhkan saja
    });

    const newFileId = copiedFile.data.id;
    const newWebViewLink = copiedFile.data.webViewLink;

    if (!newFileId || !newWebViewLink) {
      throw new Error("Penyalinan berhasil, namun gagal mendapatkan ID atau Link dari file baru.");
    }

    // Buat izin agar bisa diakses
    await drive.permissions.create({
      fileId: newFileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });
    
    // Kirim kembali data yang LENGKAP dan VALID
    return NextResponse.json({ link: newWebViewLink, name: fileName });

  } catch (error: any) {
    console.error('Error di proses copyFile:', error.message);
    return NextResponse.json({ error: 'Terjadi kesalahan internal saat menyalin file.' }, { status: 500 });
  }
}