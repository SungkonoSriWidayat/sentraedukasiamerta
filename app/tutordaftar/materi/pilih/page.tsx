'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link'; // Import Link
import toast from 'react-hot-toast';
import { FaSpinner, FaCheckCircle, FaEye, FaLink, FaGoogleDrive, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';

interface DriveFile {
  id: string;
  name: string;
  iconLink: string;
  webViewLink: string;
}

function PilihMateriComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const kelasId = searchParams.get('kelasId');
  const pertemuanId = searchParams.get('pertemuanId');

  console.log("Membaca dari URL:", { kelasId, pertemuanId });

  // ... (State dan fungsi lainnya tidak berubah)
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingFileId, setSelectingFileId] = useState<string | null>(null);
  const [customLink, setCustomLink] = useState('');

  useEffect(() => {
    async function fetchDriveFiles() {
      try {
        const res = await fetch('/api/google-drive/listFiles');
        if (!res.ok) throw new Error('Gagal memuat file dari Google Drive.');
        const data = await res.json();
        setFiles(data);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDriveFiles();
  }, []);

  const processAndLinkFile = async (fileId: string, triggerId: string) => {
    // ... (Fungsi ini tidak berubah)
    if (!kelasId || !pertemuanId) {
      toast.error("Informasi kelas atau pertemuan tidak valid.");
      return;
    }
    setSelectingFileId(triggerId);
    const toastId = toast.loading('Memproses dan menautkan materi...');
    try {
      const copyRes = await fetch('/api/google-drive/copyFile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
      if (!copyRes.ok) {
        const errorData = await copyRes.json();
        throw new Error(errorData.error || 'Gagal menyalin file.');
      }
      const copyData = await copyRes.json();
      const { link: newLinkPdf, name: newNamaPdf } = copyData;
      const updateRes = await fetch('/api/tutor/materi/update-link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelasId, pertemuanId, linkPdf: newLinkPdf, namaPdf: newNamaPdf }),
      });

      // TAMBAHKAN INI UNTUK DEBUGGING
      const dataUntukDikirim = { kelasId, pertemuanId, linkPdf: newLinkPdf, namaPdf: newNamaPdf };
      console.log("Data yang akan dikirim ke API update-link:", dataUntukDikirim);

      if (!updateRes.ok) throw new Error('Gagal menyimpan tautan materi ke database.');
      toast.success('Materi berhasil ditautkan!', { id: toastId });
      router.push(`/tutordaftar/kelas-saya/${kelasId}?pertemuan=${pertemuanId}`);
    } catch (error: any) {
    // Kode ini akan mencoba membaca pesan error dari server
    const errorMessage = error.response?.data?.error || error.message;
    toast.error(errorMessage, { id: toastId });
    setSelectingFileId(null);
}
  };
  
  const handleCustomLinkSubmit = () => {
    // ... (Fungsi ini tidak berubah)
    try {
      const regex = /\/d\/([a-zA-Z0-9_-]+)/;
      const match = customLink.match(regex);
      if (!match || !match[1]) {
        toast.error('URL Google Drive tidak valid. Pastikan link Anda benar.');
        return;
      }
      const fileId = match[1];
      processAndLinkFile(fileId, 'custom-link-submit');
    } catch (error) {
      toast.error('Gagal memproses link. Periksa kembali URL Anda.');
    }
  };

  if (loading) return <div className="p-8 text-center"><FaSpinner className="animate-spin inline mr-2" /> Memuat materi...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* ================================================================== */}
      {/* == TOMBOL KEMBALI BARU =========================================== */}
      {/* ================================================================== */}
      <div className="mb-6">
        <Link 
          href={`/tutordaftar/kelas-saya/${kelasId}?pertemuan=${pertemuanId}`}
          className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Kembali ke Halaman Edit Kelas
        </Link>
      </div>

      {/* BAGIAN UPLOAD BARU DENGAN INSTRUKSI */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gunakan Materi dari Drive Anda Sendiri</h2>
        
        {/* ================================================================== */}
        {/* == BOX INSTRUKSI BARU ============================================ */}
        {/* ================================================================== */}
        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-4 rounded-r-lg" role="alert">
            <div className="flex">
                <div className="py-1"><FaInfoCircle className="h-5 w-5 mr-3"/></div>
                <div>
                    <p className="font-bold">Agar link berfungsi, ikuti 3 langkah ini di Google Drive:</p>
                    <ol className="list-decimal list-inside mt-2 text-sm">
                        <li><strong>Klik kanan</strong> pada file materi, lalu pilih <strong>Bagikan</strong> (Share).</li>
                        <li>Ubah "Akses umum" dari "Dibatasi" menjadi <strong>"Siapa saja yang memiliki link"</strong>.</li>
                        <li>Pastikan perannya adalah <strong>"Pelihat"</strong> (Viewer), lalu salin link.</li>
                    </ol>
                </div>
            </div>
        </div>

        <a 
          href="https://drive.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-all mb-4"
        >
          <FaGoogleDrive className="mr-2" />
          Buka Google Drive
        </a>
        <div className="mt-4">
          <label htmlFor="customLink" className="block text-sm font-medium text-gray-700">Tempel (paste) link Google Drive materi Anda di bawah ini:</label>
          <div className="flex items-center space-x-2">
            <input 
              id="customLink"
              type="text"
              value={customLink}
              onChange={(e) => setCustomLink(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleCustomLinkSubmit}
              disabled={!!selectingFileId}
              className="bg-indigo-600 hover:bg-indigo-800 text-white font-bold py-2 px-4 rounded-lg flex-shrink-0 disabled:bg-gray-400"
            >
              {selectingFileId === 'custom-link-submit' ? <FaSpinner className="animate-spin" /> : <FaLink />}
            </button>
          </div>
        </div>
      </div>

      {/* BAGIAN BANK MATERI (Tidak Berubah) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* ... (sisa kode untuk Bank Materi tidak perlu diubah) ... */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Atau Pilih dari Bank Materi Pusat</h2>
        <ul className="space-y-3">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center min-w-0">
                <img src={file.iconLink} alt="file icon" className="w-6 h-6 mr-3 flex-shrink-0" />
                <span className="text-gray-800 font-medium truncate" title={file.name}>{file.name}</span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold p-2 rounded-full flex items-center transition-all"
                  title="Lihat Materi"
                >
                  <FaEye />
                </a>
                <button
                  onClick={() => processAndLinkFile(file.id, file.id)}
                  disabled={!!selectingFileId}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:bg-gray-400 transition-all"
                >
                  {selectingFileId === file.id ? ( <FaSpinner className="animate-spin mr-2" /> ) : ( <FaCheckCircle className="mr-2" /> )}
                  {selectingFileId === file.id ? 'Memproses' : 'Pilih'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function PilihMateriPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PilihMateriComponent />
        </Suspense>
    )
}