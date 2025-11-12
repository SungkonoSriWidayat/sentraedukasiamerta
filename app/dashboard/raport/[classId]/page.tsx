'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import useRouter
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';
import toast, { Toaster } from 'react-hot-toast';
// Hapus import jsPDF dan dom-to-image karena PDF dibuat di server
// import { jsPDF } from "jspdf";
// import domtoimage from 'dom-to-image-more';

// --- Interface ---
interface IRaportData {
    studentName: string;
    className: string;
    totalMeetings: number;
    attendedMeetings: number;
    preTest: { score: number; maxScore: number; status: string | null };
    postTest: { score: number; maxScore: number; status: string | null };
    nGainData: {
        score: number; // Mungkin tidak perlu ditampilkan lagi
        grade: string;
        category: string;
    };
    postTestCompletionDate: string | null;
}

// Interface ini mungkin tidak diperlukan lagi jika apiClient menangani error
// interface ApiResponse {
//     success: boolean;
//     data: IRaportData;
//     message?: string;
// }

// --- Interface untuk respons API Leave ---
interface LeaveApiResponse {
    success: boolean;
    message?: string;
}


// --- Komponen ---
export default function RaportPage() {
    const params = useParams();
    const router = useRouter(); // Initialize router
    const { classId } = params;
    const { isLoading: isAuthLoading } = useAuth();
    // Hapus ref
    // const contentRef = useRef<HTMLDivElement>(null);
    // const backgroundRef = useRef<HTMLImageElement>(null);

    const [raportData, setRaportData] = useState<IRaportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    // Hapus state isBgLoaded
    // const [isBgLoaded, setIsBgLoaded] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false); // State baru untuk tombol leave

    const fetchRaportData = useCallback(async () => {
        if (!classId) return;
        setIsLoading(true);
        try {
            const timestamp = Date.now();
            // Berikan tipe eksplisit untuk respons get
            const res = await apiClient.get<{ success: boolean; data: IRaportData; message?: string }>(`/siswa/raport/${classId}?t=${timestamp}`, {
                 headers: {
                    'Cache-Control': 'no-store',
                 }
            });
            if (res.data.success) {
                setRaportData(res.data.data);
            } else {
                throw new Error(res.data.message || 'Gagal memuat data raport.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat memuat data');
        } finally {
            setIsLoading(false);
        }
    }, [classId]);


    useEffect(() => {
        if (!isAuthLoading) {
            fetchRaportData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthLoading, fetchRaportData]);


    // --- Fungsi Pratinjau PDF (menggunakan apiClient) ---
    const handlePreviewPdf = async () => {
        if (!classId) {
            toast.error("Class ID tidak ditemukan.");
            return;
        }
        setIsDownloading(true);
        const loadingToast = toast.loading("Meminta pratinjau sertifikat...");
        try {
            const timestamp = Date.now();
            const pdfApiUrl = `/api/siswa/raport/${classId}/download-pdfkit?t=${timestamp}`;
            const response = await apiClient.get(pdfApiUrl, {
                responseType: 'blob',
            });
            const pdfBlob = response.data as Blob;
            if (pdfBlob.type !== 'application/pdf') {
                 throw new Error("Respons dari server bukan file PDF.");
            }
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
             setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
            toast.dismiss(loadingToast);
            toast.success("Pratinjau PDF dibuka di tab baru!");
        } catch (err: any) {
            toast.dismiss(loadingToast);
            const errorMessage = err.response?.data instanceof Blob
                ? `Gagal mengambil PDF (${err.response?.status || 'status tidak diketahui'})`
                : (err.response?.data?.message || err.message || "Gagal membuat pratinjau PDF.");
            toast.error(errorMessage);
            console.error("Full error object while fetching PDF:", err.response || err);
        } finally {
            setIsDownloading(false);
        }
    };
    // --- Akhir Fungsi Pratinjau PDF ---

    // --- FUNGSI BARU: Tinggalkan Kelas ---
    const handleLeaveClass = async () => {
         // !!! PENTING: Implementasikan modal konfirmasi yang sesungguhnya di sini !!!
         // Contoh sederhana (ganti dengan modal UI Anda):
         const confirmed = true; // window.confirm("Apakah Anda yakin ingin meninggalkan kelas ini? Semua data terkait (nilai, absensi, pesan) akan dihapus permanen.");

         if (!confirmed) {
             return; // Batalkan jika pengguna tidak konfirmasi
         }

         if (!classId) {
             toast.error("Class ID tidak ditemukan.");
             return;
         }

         setIsLeaving(true);
         const loadingToast = toast.loading("Memproses permintaan meninggalkan kelas...");

         try {
             // --- PERBAIKAN: Tambahkan tipe generic <LeaveApiResponse> ---
             const response = await apiClient.delete<LeaveApiResponse>(`/siswa/raport/${classId}/leave`);
             // --- AKHIR PERBAIKAN ---

             // Sekarang response.data dikenali sebagai LeaveApiResponse
             if (response.data.success) {
                 toast.dismiss(loadingToast);
                 toast.success("Anda telah berhasil meninggalkan kelas.");
                 // Arahkan ke dashboard setelah berhasil
                 router.push('/dashboard');
             } else {
                 throw new Error(response.data.message || "Gagal meninggalkan kelas.");
             }

         } catch (err: any) {
             toast.dismiss(loadingToast);
             const errorMessage = err.response?.data?.message || err.message || "Gagal memproses permintaan.";
             toast.error(errorMessage);
             console.error("Error leaving class:", err.response || err);
             setIsLeaving(false); // Reset state jika gagal
         }
         // finally tidak perlu setIsLeaving(false) karena akan redirect jika sukses
    };
    // --- AKHIR FUNGSI BARU ---


    if (isLoading || isAuthLoading) {
        return <div className="flex h-screen items-center justify-center">Memuat Raport...</div>;
    }

    if (error) {
       return <div className="flex h-screen items-center justify-center text-red-500">Error: {error}</div>;
    }

    if (!raportData) {
        return <div className="flex h-screen items-center justify-center">Data raport tidak ditemukan.</div>;
    }

    const attendancePercentage = raportData.totalMeetings > 0
        ? (raportData.attendedMeetings / raportData.totalMeetings) * 100
        : 0;

    const graduationDate = raportData.postTestCompletionDate
        ? new Date(raportData.postTestCompletionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Belum Selesai';

    const { nGainData } = raportData;
    let nGainColor = 'text-gray-700';
    switch (nGainData.grade) {
        case 'A': nGainColor = 'text-gold-600'; break;
        case 'B': nGainColor = 'text-green-600'; break;
        case 'C': nGainColor = 'text-yellow-600'; break;
        case 'D': nGainColor = 'text-red-600'; break;
        default: nGainColor = 'text-gray-700';
    }


    return (
        <>
            <Toaster position="top-center" />
            <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-800">Raport Akhir Kelas</h1>
                        <button
                            onClick={handlePreviewPdf}
                            disabled={isDownloading || isLeaving} // Nonaktifkan jika sedang proses
                            className={`bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors ${isDownloading || isLeaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                        >
                            {isDownloading ? 'Memproses...' : 'Pratinjau Sertifikat PDF'}
                        </button>
                    </div>

                    {/* Wadah Utama Sertifikat (Hanya untuk Tampilan Web) */}
                    <div className="bg-white rounded-xl relative overflow-hidden mb-8"> {/* Tambah margin bawah */}

                        {/* Gambar Background */}
                        <img
                            src="/sertifikat.png"
                            alt="Background Sertifikat"
                            className="w-full h-195 object-cover z-0"
                        />

                        {/* Konten Sertifikat (Wadah Grid Utama) */}
                        <div className="absolute inset-0 z-10 p-8 grid grid-rows-[auto_1fr_auto]">
                            {/* Header Sertifikat */}
                            <div className="text-center pb-4 mb-4">
                                <h2 className="mt-4 text-4xl font-bold text-gray-800">SERTIFIKAT KELULUSAN</h2>
                                <p className="text-lg text-gray-600 mt-2">Diberikan kepada:</p>
                                <p className="text-3xl font-semibold text-gray-800 mt-0">{raportData.studentName}</p>
                                <p className="text-md text-gray-500 mt-2">Telah menyelesaikan kelas</p>
                                <p className="text-2xl font-bold text-gray-700 mt-1">{raportData.className}</p>
                            </div>

                            {/* Bagian Nilai & Absensi */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Kolom Nilai */}
                                <div className="space-y-6">
                                    <h3 className="mt-1 text-xl font-semibold text-gray-700 pb-2">Rangkuman Nilai</h3>
                                    {/* Pre-Test */}
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-600">Nilai Pre-Test</p>
                                            {raportData.preTest.status === 'Dikerjakan' && (
                                                <p className="text-xs text-yellow-600 font-medium">Belum Dinilai</p>
                                            )}
                                        </div>
                                        <p className="font-bold text-2xl text-gray-800">
                                            {raportData.preTest.score}
                                            {raportData.preTest.maxScore > 0 && ` / ${raportData.preTest.maxScore}`}
                                        </p>
                                    </div>
                                    {/* Post-Test */}
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-600">Nilai Post-Test</p>
                                            {raportData.postTest.status === 'Dikerjakan' && (
                                                <p className="text-xs text-yellow-600 font-medium">Belum Dinilai</p>
                                            )}
                                        </div>
                                        <p className="font-bold text-2xl text-green-600">
                                            {raportData.postTest.score}
                                            {raportData.postTest.maxScore > 0 && ` / ${raportData.postTest.maxScore}`}
                                        </p>
                                    </div>
                                    {/* N-Gain */}
                                    <div className="p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <p className="text-gray-600">Peningkatan (N-Gain)</p>
                                            <div className="text-right">
                                                <p className={`font-bold text-xl ${nGainColor}`}>Grade: {nGainData.grade}</p>
                                                <p className={`text-sm font-medium ${nGainColor}`}>{nGainData.category}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Kolom Absensi */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-semibold text-gray-700 pb-2">Rangkuman Kehadiran</h3>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-base font-medium text-gray-700">Tingkat Kehadiran</span>
                                            <span className="text-sm font-medium text-gray-700">{Math.round(attendancePercentage)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                            <div className="bg-gray-700 h-full rounded-full" style={{ width: `${attendancePercentage}%` }}></div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2 text-right">
                                            Hadir {raportData.attendedMeetings} dari {raportData.totalMeetings} Pertemuan
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Sertifikat */}
                            <div className="pt-55 text-center text-gray-500 text-sm"> {/* Sesuai penyesuaian Anda */}
                                <p>Diterbitkan oleh Sentra Edukasi Amerta {graduationDate}</p>
                            </div>
                        </div>
                    </div>

                     {/* --- BAGIAN TOMBOL BARU --- */}
                     <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                         <p className="text-sm text-red-700 mb-4">
                             <strong>Peringatan:</strong> Pastikan Anda sudah mengunduh file sertifikat Anda. Menekan tombol di bawah ini akan menghapus semua data Anda terkait kelas ini (nilai, absensi, pesan) secara permanen dan Anda tidak akan bisa mengakses atau mengunduh sertifikat lagi.
                         </p>
                         <button
                             onClick={handleLeaveClass}
                             disabled={isLeaving || isDownloading} // Nonaktifkan jika sedang proses
                             className={`bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors ${isLeaving || isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                         >
                             {isLeaving ? 'Memproses...' : 'Tinggalkan Kelas dan Kembali Ke Dashboard'}
                         </button>
                     </div>
                     {/* --- AKHIR BAGIAN TOMBOL BARU --- */}

                </div>
            </div>
        </>
    );
}

