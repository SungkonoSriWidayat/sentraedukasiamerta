'use client';

import React from 'react';
import { ISiswaClass, IMateri } from '@/app/components/lib/types'; 

// --- (Ikon lama tetap ada) ---
const VideoCameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const DocumentDownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const LockClosedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

// --- Ikon baru untuk YouTube ---
const YouTubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);


interface MateriDisplayPanelProps {
    kelas: ISiswaClass;
    materi: IMateri;
    sessionStatus: string;
    isTimerRunning: boolean; // Prop baru untuk mengontrol link
}

export default function MateriDisplayPanel({ kelas, materi, sessionStatus, isTimerRunning }: MateriDisplayPanelProps) {
    const isSesiAktif = sessionStatus === 'Aktif';
    const isSiswaHadir = materi.kehadiranSiswa === 'Hadir';
    
    // --- PERBAIKAN #1: Logika isLinkAktif disederhanakan ---
    const isLinkAktif = isTimerRunning; 

    const getLinkClassName = (baseClass: string) => {
        return isLinkAktif 
            ? `${baseClass} hover:opacity-80` 
            : `${baseClass} opacity-50 cursor-not-allowed`;
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-800">{kelas.nama}</h1>
                <p className="text-gray-500 mt-1">Tutor: {kelas.tutorName}</p>
                <div className="mt-4 pt-4 border-t text-sm">
                    <dl>
                        <dt className="font-medium text-gray-500">Deskripsi Kelas</dt>
                        <dd className="text-gray-900 mt-1">{kelas.deskripsi}</dd>
                    </dl>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md min-h-[20rem]">
                <h2 className="text-2xl font-semibold mb-4">{materi.judul}</h2>
                <p className="text-gray-600 mb-6">{materi.deskripsi}</p>
                
                {/* --- PERBAIKAN #2: Perombakan total struktur logika tampilan --- */}

                {/* KASUS 1: Timer sedang berjalan (dan siswa belum hadir) */}
                {isTimerRunning && !isSiswaHadir && (
                    <div className="flex flex-wrap gap-4 my-4">
                        {materi.linkVideo && (
                            <a href={materi.linkVideo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">
                                <YouTubeIcon /> Tonton Video Materi
                            </a>
                        )}
                        {materi.linkGoogleMeet && (
                            <a href={materi.linkGoogleMeet} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">
                                <VideoCameraIcon /> Gabung Google Meet
                            </a>
                        )}
                    </div>
                )}

                {/* KASUS 2: Sesi sudah aktif, TAPI timer belum jalan (dan siswa belum hadir) */}
                {isSesiAktif && !isTimerRunning && !isSiswaHadir && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 rounded-r-lg" role="alert">
                           <p className="font-bold">Sesi Aktif</p>
                           <p>Klik "Siap Memulai Pertemuan" untuk mengaktifkan link materi dan memulai timer. Pastikan Anda masuk dulu di Google Meet agar kamu bertemu dengan pengajar mu dahulu.</p>
                       </div>
                       <div className="flex flex-wrap gap-4">
                           {materi.linkVideo && (
                               <a onClick={(e) => e.preventDefault()} href="#" className={getLinkClassName("inline-flex items-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg")}>
                                   <YouTubeIcon /> Tonton Video Materi
                               </a>
                           )}
                           {materi.linkGoogleMeet && (
                               <a onClick={(e) => e.preventDefault()} href="#" className={getLinkClassName("inline-flex items-center bg-green-500 text-white font-bold py-2 px-4 rounded-lg")}>
                                   <VideoCameraIcon /> Gabung Google Meet
                               </a>
                           )}
                       </div>
                   </div>
                )}
                
                {/* KASUS 3: Sesi belum aktif DAN timer tidak jalan (dan siswa belum hadir) */}
                {!isSesiAktif && !isTimerRunning && !isSiswaHadir && (
                    <div className="mt-8 flex flex-col items-center justify-center text-center bg-gray-50 p-8 rounded-lg">
                        <LockClosedIcon />
                        <p className="mt-2 font-semibold text-gray-700">Materi Terkunci</p>
                        <p className="text-sm text-gray-500">
                            Sesi belum aktif. Klik "Cek Pertemuan" untuk melihat status terbaru dari tutor.
                        </p>
                    </div>
                )}
                
                {/* Tombol unduh materi akan selalu tampil jika link ada, terlepas dari status sesi */}
                {materi.linkPdf && (
                    <div className="mt-4 pt-4 border-t">
                         <a href={materi.linkPdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600">
                            <DocumentDownloadIcon /> Unduh Materi
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

