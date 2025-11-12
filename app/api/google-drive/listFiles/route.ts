import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Inisialisasi OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI 
);

// Untuk sekarang kita akan hardcode refresh token, nanti bisa disimpan di database
// Anda perlu mendapatkan ini sekali melalui proses otorisasi
// Tutorial singkat untuk mendapatkan refresh token akan saya berikan jika diperlukan
oauth2Client.setCredentials({
  refresh_token:process.env.GOOGLE_REFRESH_TOKEN, // INI PERLU DIDAPATKAN SEKALI
});


export async function GET() {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, webViewLink, iconLink)',
      orderBy: 'createdTime desc',
    });

    return NextResponse.json(res.data.files);

  } catch (error) {
    console.error('Error fetching files from Google Drive:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}