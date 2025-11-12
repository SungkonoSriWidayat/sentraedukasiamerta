'use client';

import React, { ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IMateri } from '@/app/components/lib/types';
import { convertYoutubeUrlToEmbed, cleanGoogleMeetUrl } from '@/lib/utils'; 
import { FaPlus, FaEye, FaTrash, FaFilePdf, FaYoutube, FaVideo, FaExclamationTriangle } from 'react-icons/fa'; // Ikon baru

interface MateriEditorPanelProps {
  kelasId: string;
  materi: IMateri;
  onMaterialChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onUpdateField: (field: string, value: any) => void;
}

export default function MateriEditorPanel({ kelasId, materi, onMaterialChange, onUpdateField }: MateriEditorPanelProps) {

  const handleUnlinkPdf = () => {
    if (confirm('Apakah Anda yakin ingin menghapus tautan materi PDF dari pertemuan ini?')) {
      onUpdateField('linkPdf', null);
      onUpdateField('namaPdf', null);
      toast.success('Tautan materi berhasil dihapus.');
    }
  };

  const handleDebouncedUpdate = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onMaterialChange(e);
    const { name, value } = e.target;
    onUpdateField(name, value);
  };

  const handleMeetLinkBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const rawUrl = e.target.value;
    if (rawUrl === '') {
      onUpdateField('linkGoogleMeet', '');
      return;
    }
    const cleanUrl = cleanGoogleMeetUrl(rawUrl);
    if (cleanUrl) {
      onUpdateField('linkGoogleMeet', cleanUrl);
    } else {
      toast.error('Link Google Meet tidak valid. Mohon periksa kembali.');
    }
  };

  const handleVideoLinkChange = (e: ChangeEvent<HTMLInputElement>) => {
    onMaterialChange(e);
    const rawUrl = e.target.value;
    const embedUrl = convertYoutubeUrlToEmbed(rawUrl);
    if (embedUrl) {
      onUpdateField('linkVideo', embedUrl);
    } else if (rawUrl === '') {
      onUpdateField('linkVideo', '');
    }
  };

  const handleVideoLinkBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const rawUrl = e.target.value;
    const embedUrl = convertYoutubeUrlToEmbed(rawUrl);
    if (rawUrl !== '' && !embedUrl) {
      toast.error('Link YouTube tidak valid. Mohon periksa kembali.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Edit Materi: {materi.judul || 'Materi Baru'}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Judul Materi</label>
          <input type="text" name="judul" value={materi.judul || ''} onChange={onMaterialChange} onBlur={handleDebouncedUpdate} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
          <textarea name="deskripsi" value={materi.deskripsi || ''} onChange={onMaterialChange} onBlur={handleDebouncedUpdate} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows={3}></textarea>
        </div>
        
        {/* BAGIAN GOOGLE MEET */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Link Google Meet</label>
          <div className="flex items-center space-x-2 mt-1">
            <input 
              type="text" 
              name="linkGoogleMeet" 
              defaultValue={materi.linkGoogleMeet || ''}
              onChange={onMaterialChange}
              onBlur={handleMeetLinkBlur}
              placeholder="Tempel (paste) link Google Meet di sini"
              className="block w-full rounded-md border-gray-300 shadow-sm" 
            />
            <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-700 text-white p-3 rounded-md transition-all" title="Buka Google Meet">
              <FaVideo />
            </a>
          </div>
        </div>

        {/* BAGIAN EMBED VIDEO */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Embed URL Video</label>
          <div className="flex items-center space-x-2 mt-1">
            <input 
              type="text" 
              name="linkVideo" 
              defaultValue={materi.linkVideo || ''}
              onChange={handleVideoLinkChange}
              onBlur={handleVideoLinkBlur}
              placeholder="Tempel (paste) link YouTube di sini"
              className="block w-full rounded-md border-gray-300 shadow-sm" 
            />
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-md transition-all" title="Buka YouTube">
              <FaYoutube />
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-1">Masuk ke YouTube lalu salin link video dan tempel di sini.</p>
          
          {materi.linkVideo && convertYoutubeUrlToEmbed(materi.linkVideo) && (
            <div className="aspect-video w-full mt-4">
              <iframe
                className="w-full h-full rounded-lg shadow-md"
                src={materi.linkVideo}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
        </div>

        {/* BAGIAN PDF MATERI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">File PDF Materi</label>
          <div className="p-4 border-2 border-dashed rounded-lg">
            {materi.linkPdf ? (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <FaFilePdf className="text-red-500 text-2xl mr-3 flex-shrink-0" />
                    <span className="font-semibold text-gray-800 truncate" title={materi.namaPdf}>{materi.namaPdf || 'File Materi'}</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <a href={materi.linkPdf} target="_blank" rel="noopener noreferrer" className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded-full transition-all" title="Lihat Materi">
                      <FaEye />
                    </a>
                    <button onClick={handleUnlinkPdf} className="bg-red-500 hover:bg-red-700 text-white p-2 rounded-full transition-all" title="Hapus Tautan Materi">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 mb-4">Belum ada materi PDF yang ditautkan.</p>
                <Link 
                  href={`/tutordaftar/materi/pilih?kelasId=${kelasId}&pertemuanId=${materi._id}`}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Tambah Materi dari Bank Materi
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* == INSTRUKSI PENYIMPANAN BARU ==================================== */}
        {/* ================================================================== */}
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-r-lg" role="alert">
            <div className="flex">
                <div className="py-1"><FaExclamationTriangle className="h-5 w-5 mr-3"/></div>
                <div>
                    <p className="font-bold">Perhatian</p>
                    <p className="text-sm">
                        Jika Anda mengubah isi materi dari setiap pertemuan, jangan lupa untuk menekan tombol <strong>"Simpan Semua Perubahan"</strong> di bawah untuk menyimpan pekerjaan Anda.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}