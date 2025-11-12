'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaEye, FaTrash, FaSpinner, FaGoogleDrive } from 'react-icons/fa';

interface DriveFile {
  id: string;
  name: string;
  iconLink: string;
  webViewLink: string;
}

// URL folder Google Drive Anda untuk tombol "Tambah Materi"
const GOOGLE_DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1qmK6BcTTWeQxaXUbFh0XzgUZ4JQm5hU3";

export default function MateriKelasAdminPage() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  async function fetchFiles() {
    try {
      setLoading(true);
      const res = await fetch('/api/google-drive/listFiles');
      if (!res.ok) {
        throw new Error('Gagal mengambil data dari server');
      }
      const data = await res.json();
      setFiles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus materi "${fileName}" secara permanen?`)) {
        return;
    }
    setDeletingFileId(fileId);
    try {
        const res = await fetch('/api/google-drive/deleteFile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId }),
        });

        if (!res.ok) {
            throw new Error('Gagal menghapus file');
        }
        // Refresh daftar file setelah berhasil menghapus
        await fetchFiles();
    } catch (error) {
        alert('Terjadi kesalahan saat menghapus file.');
    } finally {
        setDeletingFileId(null);
    }
  };

  if (loading && files.length === 0) return <div className="p-8 text-center"><FaSpinner className="animate-spin inline mr-2" /> Memuat materi...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Bank Materi Kelas (Admin)</h1>
        <a
          href={GOOGLE_DRIVE_FOLDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all"
        >
          <FaGoogleDrive className="mr-2" />
          Tambah Materi Baru
        </a>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <ul className="space-y-3">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100">
              <div className="flex items-center">
                <img src={file.iconLink} alt="file icon" className="w-6 h-6 mr-3" />
                <span className="text-gray-800">{file.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <a 
                    href={file.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg flex items-center"
                    title="Lihat File"
                >
                    <FaEye />
                </a>
                <button
                  onClick={() => handleDeleteFile(file.id, file.name)}
                  disabled={deletingFileId === file.id}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg flex items-center disabled:bg-gray-400"
                  title="Hapus File"
                >
                  {deletingFileId === file.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}