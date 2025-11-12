'use client';

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';

// Types dan Interfaces
import { IClass, IEnrolledStudent, IMateri } from '@/app/components/lib/types'; // Tambahkan IMateri
import ManajemenSesiPanel from '@/app/components/tutor/JadwalTesPanel'; 
import ChatWindow from '@/app/components/tutor/ChatWindow';
import MateriEditorPanel from '@/app/components/tutor/MateriEditorPanel';
import MateriControlPanel from '@/app/components/tutor/MateriControlPanel';
import SiswaTerdaftarPanel from '@/app/components/tutor/SiswaTerdaftarPanel';

interface IPreTestTaker {
    _id: string;
    score: number;
    createdAt: string;
    studentId: { _id: string; namaLengkap: string; email: string; } | null;
}

interface ClassApiResponse { success: boolean; data: IClass; message?: string }
interface PreTestApiResponse { success: boolean; results: IPreTestTaker[]; }
interface UpdateApiResponse { success: boolean; message?: string; data?: IMateri } // Tambahkan data opsional


export default function TutorClassDetailPage() {
    const params = useParams();
    const classId = params.classId as string;
    const { user, isLoading: isAuthLoading } = useAuth();

    const [kelas, setKelas] = useState<IClass | null>(null);
    const [selectedMateriIndex, setSelectedMateriIndex] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeChatStudent, setActiveChatStudent] = useState<IEnrolledStudent | null>(null);
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
    const [preTestTakers, setPreTestTakers] = useState<IPreTestTaker[]>([]);
    const [isLoadingPreTest, setIsLoadingPreTest] = useState(true);

    const fetchPreTestTakers = useCallback(async () => {
        if (!classId) return;
        setIsLoadingPreTest(true);
        try {
            const res = await apiClient.get<PreTestApiResponse>(`/tutor/hasil-tes?classId=${classId}&tipeTes=Pre-Test`);
            if (res.data.success && Array.isArray(res.data.results)) {
                const validResults = res.data.results.filter(taker => taker.studentId);
                setPreTestTakers(validResults);
            } else {
                setPreTestTakers([]);
            }
        } catch (err) {
            console.error("Gagal memuat data hasil pre-test:", err);
            toast.error("Gagal memuat data hasil pre-test.");
        } finally {
            setIsLoadingPreTest(false);
        }
    }, [classId]);

    const fetchStudentData = useCallback(async (pertemuanIndex: number) => {
        if (!classId) return;
        setIsAttendanceLoading(true);
        try {
            const res = await apiClient.get<ClassApiResponse>(`/tutor/kelas/${classId}?pertemuan=${pertemuanIndex}`);
            if (res.data.success && res.data.data.enrolledStudents) {
                setKelas(prevKelas => prevKelas ? { ...prevKelas, enrolledStudents: res.data.data.enrolledStudents } : null);
            }
        } catch (err) {
            console.error("Gagal memuat data siswa:", err);
        } finally {
            setIsAttendanceLoading(false);
        }
    }, [classId]);

    const fetchBaseClassData = useCallback(async () => {
        if (!classId) return;
        setLoading(true);
        try {
            const res = await apiClient.get<ClassApiResponse>(`/tutor/kelas/${classId}`);
            
            if (!res.data.success) throw new Error(res.data.message || 'Gagal memuat data kelas.');
            
            const classData: IClass = res.data.data;
            const targetCount = classData.jumlahPertemuan || 0;
            let currentMateri = classData.materi || [];
            while (currentMateri.length < targetCount) {
                currentMateri.push({ judul: `Materi ${currentMateri.length + 1}`, deskripsi: '' });
            }
            classData.materi = currentMateri.slice(0, targetCount);
            setKelas(classData);
        } catch (err: any) {
            if (err.response?.status !== 401 && err.response?.status !== 403) {
                setError(err.message);
                toast.error(`Error: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        if (!isAuthLoading && user && classId) {
            fetchBaseClassData();
            fetchStudentData(0);
            fetchPreTestTakers();
        }
    }, [isAuthLoading, user, classId, fetchBaseClassData, fetchStudentData, fetchPreTestTakers]);

    // Fungsi "Simpan Semua" yang lama, tetap berguna
    const handleSaveChanges = async () => {
        if (!kelas) return;
        setIsSaving(true);
        try {
            await apiClient.put(`/tutor/kelas/${classId}/update-all-materials`, { materi: kelas.materi });
            toast.success('Semua perubahan berhasil disimpan!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan perubahan.');
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- FUNGSI BARU UNTUK MENANGANI UPDATE PER-FIELD ---
    const handleUpdateField = useCallback(async (field: string, value: string) => {
        if (!kelas || !kelas.materi[selectedMateriIndex]?._id) {
            // Jika materi belum ada di DB, simpan semua dulu
            toast.error("Simpan semua perubahan materi terlebih dahulu.");
            await handleSaveChanges();
            return;
        }

        const materiId = kelas.materi[selectedMateriIndex]._id;
        
        try {
            // Panggil API PATCH yang baru
            const res = await apiClient.patch<UpdateApiResponse>(`/tutor/kelas/${classId}/materi/${materiId}`, {
                [field]: value
            });

            if (res.data.success && res.data.data) {
                // Perbarui state 'kelas' dengan data materi yang baru dari server
                setKelas(prevKelas => {
                    if (!prevKelas) return null;
                    const newMateriArray = [...prevKelas.materi];
                    newMateriArray[selectedMateriIndex] = res.data.data!;
                    return { ...prevKelas, materi: newMateriArray };
                });
            }

        } catch (err: any) {
            toast.error(err.response?.data?.message || `Gagal menyimpan ${field}.`);
            // Opsional: kembalikan state ke nilai sebelumnya jika gagal
        }
    }, [kelas, selectedMateriIndex, classId, handleSaveChanges]);


    const handleChatClose = useCallback(() => { fetchStudentData(selectedMateriIndex); }, [fetchStudentData, selectedMateriIndex]);
    const handleSelectMateri = (index: number) => { setSelectedMateriIndex(index); fetchStudentData(index); };
    
    // Fungsi ini sekarang hanya untuk memperbarui UI secara instan
    const handleMaterialChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!kelas) return;
        const { name, value } = e.target;
        
        setKelas(prevKelas => {
            if (!prevKelas) return null;
            const newMateriArray = JSON.parse(JSON.stringify(prevKelas.materi));
            if (!newMateriArray[selectedMateriIndex]) {
                newMateriArray[selectedMateriIndex] = {};
            }
            newMateriArray[selectedMateriIndex][name] = value;
            return { ...prevKelas, materi: newMateriArray };
        });
    };

    if (isAuthLoading || loading) return <div className="p-8 text-center text-lg font-semibold">Memuat data kelas...</div>;
    if (!user) return null;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!kelas) return <div className="p-8 text-center">Kelas tidak ditemukan atau gagal dimuat.</div>;
    
    const currentMateri = kelas.materi?.[selectedMateriIndex] || {};
    const eligibleStudentsForSession = (kelas.enrolledStudents || []).filter(student => student && preTestTakers.some(taker => taker.studentId?._id === student._id));

    return (
        <>
            <Toaster />
            <div className="p-4 md:p-8">
                <Link href="/tutordaftar/kelas-saya" className="text-indigo-600 hover:text-indigo-900 mb-6 hidden md:inline-block">&larr; Kembali</Link>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        
                        {/* --- PERBAIKAN: Berikan props baru ke MateriEditorPanel --- */}
                        <MateriEditorPanel
                            kelasId={classId}
                            materi={currentMateri}
                            onMaterialChange={handleMaterialChange}
                            onUpdateField={handleUpdateField}
                        />
                        
                        <MateriControlPanel
                            materiList={kelas.materi || []}
                            selectedIndex={selectedMateriIndex}
                            onSelectMateri={handleSelectMateri}
                            onSaveChanges={handleSaveChanges}
                            isSaving={isSaving}
                        />
                        <SiswaTerdaftarPanel
                            students={kelas.enrolledStudents || []}
                            isLoading={isAttendanceLoading}
                            onRefresh={() => fetchStudentData(selectedMateriIndex)}
                            onStartChat={setActiveChatStudent}
                        />
                        
                    </div>
                    
                    <div className="space-y-8">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-3">Siswa Selesai Pre-Test ({preTestTakers.length})</h2>
                            {isLoadingPreTest ? <p>Memuat...</p> : (
                                preTestTakers.length > 0 ? (
                                    <ul className="space-y-3">
                                        {preTestTakers.map(taker => (
                                            <li key={taker._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                            </li>
                                        ))}
                                    </ul>
                                ) : ( <p className="text-sm text-gray-500">Belum ada siswa yang menyelesaikan pre-test.</p> )
                            )}
                        </div>
                        <ManajemenSesiPanel 
                            kelas={kelas} 
                            eligibleStudents={eligibleStudentsForSession} 
                        />
                    </div>
                </div>
            </div>

            {activeChatStudent && user && (
                <ChatWindow 
                    student={activeChatStudent} 
                    classId={classId} 
                    onClose={() => setActiveChatStudent(null)}
                    onChatClose={handleChatClose}
                />
            )}
        </>
    );
}

