'use client';

import React from 'react';
import { IMateri } from '@/app/components/lib/types';
import CountdownTimer from '@/app/components/siswa/CountdownTimer';

interface MateriSiswaControlPanelProps {
    materiList: IMateri[];
    selectedIndex: number;
    onSelectMateri: (index: number) => void;
    currentMateri: IMateri;
    onCheckSession: () => void;
    sessionActivationStatus: string;
    attendanceStatus: string;
    waktuSelesai: number | null;
    isProcessing: boolean;
    onStartSession: () => void;
    checkAttendanceStatus: (index: number) => void;
    isPertemuanSebelumnyaHadir: boolean;
    isTimerRunning: boolean;
    sessionExpiryTimestamp: number | null;
    onTimerEnd: () => void;
}

export default function MateriSiswaControlPanel(props: MateriSiswaControlPanelProps) {
    const {
        materiList, selectedIndex, onSelectMateri, currentMateri, 
        onCheckSession,
        sessionActivationStatus,
        attendanceStatus, waktuSelesai, isProcessing, onStartSession, checkAttendanceStatus,
        isPertemuanSebelumnyaHadir,
        isTimerRunning,
        sessionExpiryTimestamp,
        onTimerEnd
    } = props;

    // --- DEBUGGING LOG 1 ---
    // Log ini akan muncul setiap kali komponen di-render ulang.
    // Perhatikan nilai `isProcessing` di sini.
    console.log('[MateriSiswaControlPanel] Dirender. Props:', { isProcessing, sessionActivationStatus });

    const handleCheckButtonClick = () => {
        // --- DEBUGGING LOG 2 ---
        // Log ini akan muncul TEPAT saat tombol diklik.
        console.log('[MateriSiswaControlPanel] Tombol "Cek Pertemuan" diklik. Memanggil onCheckSession...');
        onCheckSession();
    };

    const renderStatusArea = () => {
        if (isTimerRunning && sessionExpiryTimestamp) {
            return (
                <div>
                    <p className="text-sm mb-2 text-center text-gray-600">Kelas Anda sedang berlangsung:</p>
                    <CountdownTimer
                        expiryTimestamp={sessionExpiryTimestamp}
                        onTimerEnd={onTimerEnd}
                    />
                </div>
            );
        }

        if (currentMateri?.kehadiranSiswa === 'Hadir') {
            return <p className="text-sm font-bold text-green-700 text-center">Anda sudah hadir.</p>;
        }

        if (attendanceStatus === 'Berlangsung' && waktuSelesai) {
            return ( <div><p className="text-sm">Sesi Berlangsung:</p><CountdownTimer expiryTimestamp={waktuSelesai} onTimerEnd={() => checkAttendanceStatus(selectedIndex)} /></div> );
        }

        if (!isPertemuanSebelumnyaHadir) {
            return <p className="text-xs italic mt-2 text-center text-gray-500">Selesaikan pertemuan sebelumnya untuk melanjutkan.</p>;
        }
        
        if (sessionActivationStatus === 'Aktif') {
            return <button onClick={onStartSession} disabled={isProcessing} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">{isProcessing ? 'Memproses...' : 'Siap Memulai Pertemuan'}</button>;
        } else {
            return (
                <>
                    <button 
                        onClick={handleCheckButtonClick} 
                        disabled={isProcessing} 
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Mengecek...' : 'Cek Pertemuan'}
                    </button>

                    {sessionActivationStatus === 'Nonaktif' && (
                        <p className="text-xs italic mt-2 text-center text-gray-500">Sesi pertemuan anda belum aktif, tunggu atau hubungi tutor di kolom diskusi.</p>
                    )}
                    {sessionActivationStatus === 'BelumDitugaskan' && (
                        <p className="text-xs italic mt-2 text-center text-gray-500">Tutor belum menjadwalkan sesi untuk Anda pada pertemuan ini.</p>
                    )}
                </>
            );
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Daftar & Status Materi</h2>
            <select
                value={selectedIndex}
                onChange={(e) => onSelectMateri(Number(e.target.value))}
                className="w-full p-3 border rounded-md mb-4 bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500"
            >
                {(materiList || []).map((materi, index) => (
                    <option key={materi?._id || index} value={index}>
                        Pertemuan {index + 1}: {materi?.judul}
                    </option>
                ))}
            </select>

            <div className="mt-4 pt-4 border-t text-center">
                <span className={`text-sm font-bold px-3 py-1 rounded-full mb-4 inline-block ${currentMateri?.kehadiranSiswa === 'Hadir' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    Status Absensi: {currentMateri?.kehadiranSiswa || 'Belum Absen'}
                </span>
                
                {renderStatusArea()}
            </div>
        </div>
    );
}

