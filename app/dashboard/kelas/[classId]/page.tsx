'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';

import { ISiswaClass } from '../../../components/lib/types';
import MateriDisplayPanel from '../../../components/siswa/MateriDisplayPanel';
import MateriSiswaControlPanel from '../../../components/siswa/MateriSiswaControlPanel';
import PengumumanKelas from '../../../components/siswa/PengumumanKelas';
import Jadwal from '../../../components/siswa/Jadwal';

// --- (Interfaces and Overlays remain the same) ---
interface Sesi { _id: string; tanggalSesi: string; className: string; materiTitle: string; }
interface ITestStatus { preTestRequired: boolean; preTestTaken?: boolean; testId?: string; }
interface ApiResponse<T> { success: boolean; data: T; message?: string; }
interface ConfirmAttendanceResponse { success: boolean; message?: string; }
interface SessionStatusResponse { success: boolean; status: 'Aktif' | 'Nonaktif' | 'BelumDitugaskan'; sesiId?: string, data?:any }
interface IGraduationStatus { layakPostTest: boolean; postTestId: string | null; postTestTaken: boolean; message: string; }

const KonfirmasiOverlay = ({ onConfirm, isProcessing }: { onConfirm: () => void; isProcessing: boolean; }) => ( <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"> <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm mx-auto"> <h2 className="text-2xl font-bold mb-4">Waktu Belajar Selesai</h2> <p className="mb-6">Silakan konfirmasi kehadiran Anda untuk menyelesaikan sesi ini.</p> <button onClick={onConfirm} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg"> {isProcessing ? 'Memproses...' : 'Konfirmasi Kehadiran'} </button> </div> </div> );
const PostTestOverlay = ({ postTestId, classId }: { postTestId: string; classId: string; }) => ( <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"> <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm mx-auto"> <h2 className="text-2xl font-bold mb-4">Selamat! 🎉</h2> <p className="mb-6">Anda telah menyelesaikan semua pertemuan. Silakan kerjakan Post-Test untuk menyelesaikan kelas ini.</p> <Link href={`/dashboard/kelas/${classId}/kerjakan-tes/${postTestId}`} className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg"> Kerjakan Post-Test </Link> </div> </div> );
const GoToReportOverlay = ({ classId }: { classId: string; }) => ( <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"> <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm mx-auto"> <h2 className="text-2xl font-bold mb-4">Kelas Telah Selesai! 🎓</h2> <p className="mb-6">Anda telah menyelesaikan semua materi dan Post-Test. Lihat hasil akhir Anda di halaman raport.</p> <Link href={`/dashboard/raport/${classId}`} className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg"> Lihat Raport </Link> </div> </div> );


export default function StudentClassroomPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;

    const isValidObjectId = (id: string) => id && /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValidObjectId(classId)) {
        return (
            <div className="flex h-screen items-center justify-center text-center p-4">
                <div>
                    <h1 className="text-2xl font-bold text-red-600">ID Kelas Tidak Valid</h1>
                    <p className="text-gray-600 mt-2">Alamat URL yang Anda akses tidak benar.</p>
                    <a href="/dashboard/kelas-saya" className="mt-6 inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
                        Kembali ke Kelas Saya
                    </a>
                </div>
            </div>
        );
    }

    const { user, isLoading: isAuthLoading } = useAuth();
    const [kelas, setKelas] = useState<ISiswaClass | null>(null);
    const [selectedMateriIndex, setSelectedMateriIndex] = useState<number>(0);
    const [sesiList, setSesiList] = useState<Sesi[]>([]);
    const [isSesiLoading, setIsSesiLoading] = useState(false);
    const [currentSesiId, setCurrentSesiId] = useState<string | null>(null);
    const [sessionActivationStatus, setSessionActivationStatus] = useState('');
    const [attendanceStatus, setAttendanceStatus] = useState('loading');
    const [waktuSelesai, setWaktuSelesai] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [sessionExpiryTimestamp, setSessionExpiryTimestamp] = useState<number | null>(null);
    const [showConfirmationOverlay, setShowConfirmationOverlay] = useState(false);
    const [testStatus, setTestStatus] = useState<ITestStatus | null>(null);
    const [isCheckingTest, setIsCheckingTest] = useState(true);
    const [loading, setLoading] = useState(true);
    const [graduationStatus, setGraduationStatus] = useState<IGraduationStatus | null>(null);

    const checkPreTestStatus = useCallback(async () => { if (!isValidObjectId(classId)) return; setIsCheckingTest(true); try { const res = await apiClient.get<ApiResponse<ITestStatus>>(`/siswa/kelas/${classId}/status-tes`); if (res.data.success) { setTestStatus(res.data.data); } else { throw new Error("Gagal memeriksa status tes."); } } catch (err: any) { console.error(err); } finally { setIsCheckingTest(false); } }, [classId]);
    const fetchClassDetails = useCallback(async () => { if (!isValidObjectId(classId)) return; try { const res = await apiClient.get<ApiResponse<ISiswaClass>>(`/siswa/kelas/${classId}`); if (res.data.success) { const classData: ISiswaClass = res.data.data; if (!classData.tutorId) throw new Error('ID Tutor tidak ditemukan.'); let currentMateri = classData.materi || []; while (currentMateri.length < classData.jumlahPertemuan) { currentMateri.push({ _id: `placeholder-${currentMateri.length}`, judul: `Materi ${currentMateri.length + 1}`, deskripsi: '...', kehadiranSiswa: 'Belum Absen' }); } classData.materi = currentMateri; setKelas(classData); } else { throw new Error(res.data.message || 'Gagal memuat data.'); } } catch (err: any) { if (err.response?.status !== 401) { console.error(err); setKelas(null); } } }, [classId]);
    const fetchAllSiswaSessions = useCallback(async () => { setIsSesiLoading(true); try { const res = await apiClient.get<ApiResponse<Sesi[]>>(`/siswa/sesikelas`); if (res.data.success) { setSesiList(res.data.data); } else { toast.error('Gagal memuat jadwal pertemuan Anda.'); } } catch (err) { console.error('Gagal mengambil daftar sesi:', err); } finally { setIsSesiLoading(false); } }, []);
    const checkSessionActivationStatus = useCallback(async (index: number) => { if (!isValidObjectId(classId)) return; setIsProcessing(true); try { const res = await apiClient.get<SessionStatusResponse>(`/siswa/kelas/${classId}/pertemuan/${index}/sesi-status`); if (res.data.success) { setSessionActivationStatus(res.data.status); if (res.data.sesiId) { setCurrentSesiId(res.data.sesiId); } } else { setSessionActivationStatus('BelumDitugaskan'); } } catch (err) { console.error('Gagal memeriksa status aktivasi:', err); setSessionActivationStatus('BelumDitugaskan'); } finally { setIsProcessing(false); } }, [classId]);
    const checkAttendanceStatus = useCallback(async (index: number) => { if (!isValidObjectId(classId)) return; setAttendanceStatus('loading'); try { const res = await apiClient.get<ApiResponse<{status: string, waktuSelesai: number | null}>>(`/siswa/absensi/status?classId=${classId}&pertemuan=${index}`); if (res.data.success) { setAttendanceStatus(res.data.data.status); setWaktuSelesai(res.data.data.waktuSelesai || null); } else { setAttendanceStatus('BelumMulai'); } } catch (error) { setAttendanceStatus('BelumMulai'); } }, [classId]);
    const checkGraduationStatus = useCallback(async () => { if (!isValidObjectId(classId)) return; try { const res = await apiClient.get<ApiResponse<IGraduationStatus>>(`/siswa/kelas/${classId}/status-kelulusan`); if (res.data.success) { setGraduationStatus(res.data.data); if(res.data.data.layakPostTest && res.data.data.postTestTaken) { toast.success("Selamat! Anda telah menyelesaikan kelas ini. Mengarahkan ke halaman raport..."); router.push(`/dashboard/raport/${classId}`); } } } catch (err) { console.error("Gagal memeriksa status kelulusan:", err); } }, [classId, router]);

    const handleConfirmAttendance = useCallback(async () => {
        if (!user || !kelas) return;
        setIsProcessing(true);
        try {
            const res = await apiClient.post<ConfirmAttendanceResponse>('/attendance/confirm', { classId: classId, studentId: user.id, tutorId: typeof kelas.tutorId === 'object' ? kelas.tutorId._id : kelas.tutorId, pertemuan: selectedMateriIndex + 1 });
            if (res.data.success) {
                toast.success('Kehadiran berhasil dikonfirmasi!');
                // --- PERBAIKAN #1: Hapus timer dari localStorage setelah selesai ---
                localStorage.removeItem(`timer-${classId}-${selectedMateriIndex}`);
                setIsTimerRunning(false); // Pastikan state timer juga direset
                setSessionExpiryTimestamp(null);
            } else {
                toast.error(res.data.message || 'Gagal konfirmasi kehadiran');
            }
        } catch (error: any) {
            toast.error("Gagal terhubung ke server.");
        } finally {
            setShowConfirmationOverlay(false);
            await fetchClassDetails();
            await checkAttendanceStatus(selectedMateriIndex);
            await checkGraduationStatus();
            setIsProcessing(false);
        }
    }, [classId, user, kelas, selectedMateriIndex, fetchClassDetails, checkAttendanceStatus, checkGraduationStatus]);

    const startLocalTimer = () => {
        if (!kelas) return toast.error("Data kelas tidak ditemukan.");
        const durasiDalamMenit = parseInt(kelas.waktuPerPertemuan, 10);
        if (isNaN(durasiDalamMenit) || durasiDalamMenit <= 0) return toast.error("Durasi waktu pertemuan tidak valid.");
        const timestampSelesai = new Date().getTime() + (durasiDalamMenit * 60 * 1000);
        
        // --- PERBAIKAN #2: Simpan timestamp selesai ke localStorage ---
        localStorage.setItem(`timer-${classId}-${selectedMateriIndex}`, timestampSelesai.toString());

        setSessionExpiryTimestamp(timestampSelesai);
        setIsTimerRunning(true);
        toast.success(`Timer dimulai untuk ${durasiDalamMenit} menit!`);
    };

    const handleTimerEnd = () => {
        setIsTimerRunning(false);
        setShowConfirmationOverlay(true);
        // Hapus juga dari localStorage saat timer berakhir secara alami
        localStorage.removeItem(`timer-${classId}-${selectedMateriIndex}`);
    };

    useEffect(() => {
        if (!isAuthLoading && user && isValidObjectId(classId)) {
            // --- PERBAIKAN #3: Cek localStorage saat halaman dimuat atau materi berubah ---
            const timerKey = `timer-${classId}-${selectedMateriIndex}`;
            const storedTimestamp = localStorage.getItem(timerKey);

            if (storedTimestamp) {
                const expiryTime = parseInt(storedTimestamp, 10);
                if (expiryTime > new Date().getTime()) {
                    setSessionExpiryTimestamp(expiryTime);
                    setIsTimerRunning(true);
                } else {
                    localStorage.removeItem(timerKey);
                    setIsTimerRunning(false);
                    setSessionExpiryTimestamp(null);
                }
            } else {
                 // Reset state jika tidak ada timer di storage
                setIsTimerRunning(false);
                setSessionExpiryTimestamp(null);
            }

            setLoading(true);
            Promise.all([checkPreTestStatus(), fetchClassDetails(), fetchAllSiswaSessions(), checkGraduationStatus()]).finally(() => {
                setLoading(false)
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthLoading, user, classId, selectedMateriIndex]); // selectedMateriIndex ditambahkan sebagai dependency
    
    useEffect(() => {
        if (!isAuthLoading && user && isValidObjectId(classId) && kelas) {
            checkAttendanceStatus(selectedMateriIndex);
        }
    }, [isAuthLoading, user, classId, kelas, selectedMateriIndex, checkAttendanceStatus]);

    if (isAuthLoading || loading || isCheckingTest) { return <div className="flex h-screen items-center justify-center text-lg font-semibold">Memuat data...</div>; }
    if (!user) { return <div className="flex h-screen items-center justify-center">Silakan login untuk mengakses halaman ini.</div>; }
    if (testStatus?.preTestRequired && !testStatus?.preTestTaken) { return ( <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4"> <div className="text-center bg-white p-10 rounded-xl shadow-lg max-w-lg"> <h1 className="text-2xl font-bold text-gray-800 mb-2">Pre-Test Diperlukan</h1> <p className="text-gray-600 mb-6">Anda harus menyelesaikan Pre-Test terlebih dahulu.</p> <Link href={`/dashboard/kelas/${classId}/kerjakan-tes/${testStatus.testId}`} className="inline-block bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg"> Mulai Pre-Test </Link> </div> </div> ); }

    const currentMateri = (kelas?.materi && kelas.materi[selectedMateriIndex]) ? kelas.materi[selectedMateriIndex] : null;

    return (
        <div key={classId}>
            <Toaster position="top-center" reverseOrder={false} />
            {showConfirmationOverlay && <KonfirmasiOverlay onConfirm={handleConfirmAttendance} isProcessing={isProcessing} />}
            {graduationStatus?.layakPostTest && !graduationStatus.postTestTaken && graduationStatus.postTestId && ( <PostTestOverlay postTestId={graduationStatus.postTestId} classId={classId} /> )}
            <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
                <a href="/dashboard/kelas-saya" className="text-indigo-600 hover:text-indigo-900 mb-6 inline-block"> &larr; Kembali ke Kelas Saya </a>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {kelas && currentMateri && 
                            <MateriDisplayPanel 
                                kelas={kelas} 
                                materi={currentMateri} 
                                sessionStatus={sessionActivationStatus} 
                                // --- PERBAIKAN #4: Kirim prop baru ke komponen anak ---
                                isTimerRunning={isTimerRunning} 
                            />
                        }
                        {kelas && kelas.tutorId && ( <PengumumanKelas tutorName={kelas.tutorName || ''} tutorId={typeof kelas.tutorId === 'object' ? kelas.tutorId._id : kelas.tutorId} classId={classId} studentId={user.id} /> )}
                    </div>
                    <div className="space-y-8">
                        {currentMateri && (
                            <MateriSiswaControlPanel 
                                materiList={kelas?.materi || []} 
                                selectedIndex={selectedMateriIndex} 
                                onSelectMateri={(index: number) => { setSelectedMateriIndex(index); setSessionActivationStatus(''); }} 
                                currentMateri={currentMateri} 
                                onCheckSession={() => checkSessionActivationStatus(selectedMateriIndex)} 
                                sessionActivationStatus={sessionActivationStatus} 
                                attendanceStatus={attendanceStatus} 
                                waktuSelesai={waktuSelesai} 
                                isProcessing={isProcessing} 
                                isPertemuanSebelumnyaHadir={ selectedMateriIndex === 0 || (kelas?.materi[selectedMateriIndex - 1]?.kehadiranSiswa === 'Hadir') } 
                                onStartSession={startLocalTimer} 
                                checkAttendanceStatus={() => checkAttendanceStatus(selectedMateriIndex)} 
                                isTimerRunning={isTimerRunning} 
                                sessionExpiryTimestamp={sessionExpiryTimestamp} 
                                onTimerEnd={handleTimerEnd} 
                            />
                        )}
                        <Jadwal sesiList={sesiList} isLoading={isSesiLoading} onRefresh={fetchAllSiswaSessions} />
                    </div>
                </div>
            </div>
        </div>
    );
}

