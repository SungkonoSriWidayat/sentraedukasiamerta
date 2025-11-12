// LOKASI: components/admin/AudioUploader.tsx
'use client';

import { useRef, useState } from 'react';

// Definisikan tipe untuk props
interface AudioUploaderProps {
  onUploadComplete: (url: string) => void;
}

export default function AudioUploader({ onUploadComplete }: AudioUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // PERBAIKAN 1: Gunakan 'useRef' untuk mengontrol input file
  const inputFileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
        setError('File yang dipilih bukan audio.');
        return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/upload-audio?filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          body: file,
        }
      );
      
      // PERBAIKAN 2: Panggil setUploading(false) di dalam 'try' block
      // Ini memastikan state di-reset SEBELUM komponen di-unmount oleh parent
      setUploading(false);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengunggah file.');
      }

      const newBlob = await response.json();
      onUploadComplete(newBlob.url);

    } catch (err: any) {
      setError(err.message);
      // Pastikan loading berhenti jika ada error
      setUploading(false);
    } finally {
        // PERBAIKAN 3: Reset input file menggunakan ref agar bisa upload file yang sama lagi
        if (inputFileRef.current) {
            inputFileRef.current.value = '';
        }
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Upload File Audio
      </label>
      <input
        ref={inputFileRef} // Hubungkan ref ke input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {uploading && <p className="text-sm text-blue-600 mt-2">Mengunggah, mohon tunggu...</p>}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}