// Nama file: components/tutor/ManajemenSesiPanel.tsx (contoh)
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ITutorClass, IEnrolledStudent, IMateri } from '@/app/components/lib/types';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';
import Link from 'next/link';

// --- INTERFACES & TYPES ---
interface ISesiKelas {
    _id: string;
    tanggalSesi: string;
    materiId: string;
    siswaId: string | null;
    status: 'Aktif' | 'Nonaktif';
}

// PERBAIKAN: Tipe API yang digabungkan untuk mengurangi duplikasi
interface SesiApiResponse { success: boolean; data: ISesiKelas[]; }
interface SesiSingularApiResponse { success: boolean; data: ISesiKelas; }
interface SesiDeleteApiResponse { success: boolean; message: string; }

// PERBAIKAN: Interface props dipindah ke luar komponen
interface ManajemenSesiPanelProps {
    kelas: ITutorClass;
    eligibleStudents: IEnrolledStudent[];
}

// PERBAIKAN: Nama komponen diubah menjadi lebih deskriptif
export default function ManajemenSesiPanel({ kelas, eligibleStudents }: ManajemenSesiPanelProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    
    const [existingSessions, setExistingSessions] = useState<ISesiKelas[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newSessionData, setNewSessionData] = useState({
        tanggalSesi: '',
        materiId: '',
        siswaId: '',
    });

    // OPTIMASI: Gunakan useMemo untuk membuat lookup map agar tidak melakukan .find() berulang kali
    const materiMap = useMemo(() => {
    const map = new Map<string, string>();
    kelas.materi.forEach(m => {
        if (typeof m._id === 'string' && m.judul !== undefined) {
            map.set(m._id, m.judul);
        }
    });
    return map;
    }, [kelas.materi]);

    const siswaMap = useMemo(() => {
    const map = new Map<string, string>();
    kelas.enrolledStudents.forEach(s => {
        if (s && typeof s._id === 'string') {
            map.set(s._id, s.namaLengkap);
        }
    });
    return map;
    }, [kelas.enrolledStudents]);

    const fetchExistingSessions = useCallback(async () => {
        if (!kelas._id) return;
        setIsLoading(true);
        try {
            const res = await apiClient.get<SesiApiResponse>(`/tutor/kelas/${kelas._id}/sesi`);
            if (res.data.success) {
                setExistingSessions(res.data.data);
            }
        } catch (error: any) {
            console.error("Fetch sessions error:", error);
            // Hanya tampilkan toast jika bukan error karena tidak ada sesi (404) atau masalah otentikasi (401)
            if (error.response?.status !== 401 && error.response?.status !== 404) {
                toast.error("Gagal memuat sesi yang ada.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [kelas._id]);

    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchExistingSessions();
        }
    }, [isAuthLoading, user, fetchExistingSessions]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewSessionData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSessionData.tanggalSesi || !newSessionData.materiId || !newSessionData.siswaId) {
            return toast.error("Harap lengkapi semua field.");
        }

        try {
            const res = await apiClient.post<SesiSingularApiResponse>(`/tutor/kelas/${kelas._id}/sesi`, newSessionData);
            if (res.data.success) {
                toast.success('Sesi berhasil dibuat!');
                setExistingSessions(prev => [...prev, res.data.data]);
                setNewSessionData({ tanggalSesi: '', materiId: '', siswaId: '' });
            }
        } catch (error) { 
            console.error("Create session error:", error);
            toast.error('Gagal membuat sesi.'); 
        }
    };

    const handleToggleActivateSession = async (sesi: ISesiKelas) => {
        const action = sesi.status === 'Aktif' ? 'deactivate' : 'activate';
        const toastMessage = `Pertemuan berhasil di-${action === 'activate' ? 'aktifkan' : 'nonaktifkan'}!`;
        
        try {
            const res = await apiClient.put<SesiSingularApiResponse>(`/tutor/kelas/${kelas._id}/sesi/${sesi._id}/${action}`);
            if (res.data.success) {
                toast.success(toastMessage);
                setExistingSessions(prev => 
                    prev.map(s => s._id === sesi._id ? { ...s, status: res.data.data.status } : s)
                );
            }
        } catch (error) { 
            console.error("Toggle session error:", error);
            toast.error(`Gagal melakukan aksi.`); 
        }
    };

    const handleDeleteSession = async (sesiId: string) => {
        if (typeof window !== 'undefined' && !window.confirm("Yakin ingin menghapus sesi ini? Aksi ini tidak dapat dibatalkan.")) return;
        
        try {
            // PERBAIKAN: URL API disesuaikan agar konsisten
            await apiClient.delete<SesiDeleteApiResponse>(`/tutor/kelas/${kelas._id}/sesi/${sesiId}`);
            toast.success('Sesi berhasil dihapus.');
            setExistingSessions(prev => prev.filter(s => s._id !== sesiId));
        } catch (error) { 
            console.error("Delete session error:", error);
            toast.error('Gagal menghapus sesi.'); 
        }
    };

    if (isAuthLoading) {
        return <div className="p-6 rounded-lg shadow-md bg-white">Memverifikasi sesi...</div>
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <Toaster position="top-center" />

            {/* --- BAGIAN TAMPILAN (JSX) --- */}
            <div className="p-4 border rounded-lg bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">Siswa Siap untuk Sesi ({eligibleStudents.length})</h2>
                {eligibleStudents.length > 0 ? (
                    <ul className="mt-2 space-y-1 list-disc list-inside text-gray-700 max-h-32 overflow-y-auto">
                        {eligibleStudents.map(student => (
                            <li key={student._id} className="text-sm">{student.namaLengkap}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-2 text-sm text-gray-500">Belum ada siswa yang menyelesaikan pre-test. Sesi pertemuan baru bisa dibuat setelah siswa mengerjakan pre-test.</p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link href={`/tutordaftar/kelas-saya/${kelas._id}/buat-soal`} className="w-full text-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Kelola Soal</Link>
                <Link href={`/tutordaftar/kelas-saya/${kelas._id}/hasil/pre-test`} className="w-full text-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Hasil Pre-test</Link>
                <Link href={`/tutordaftar/kelas-saya/${kelas._id}/hasil/post-test`} className="w-full text-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Hasil Post-test</Link>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h2 className="text-xl font-semibold">Buat Sesi Pertemuan Baru</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal & Waktu Sesi</label>
                    <input type="datetime-local" name="tanggalSesi" value={newSessionData.tanggalSesi} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Pilih Materi Pertemuan</label>
                    <select name="materiId" value={newSessionData.materiId} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="">-- Pilih Materi --</option>
                        {kelas.materi.map((m, index) => <option key={m._id} value={m._id}>{`Pertemuan ${index + 1}: ${m.judul}`}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tugaskan ke Siswa</label>
                    <select name="siswaId" value={newSessionData.siswaId} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" disabled={eligibleStudents.length === 0}>
                        <option value="">-- Pilih Siswa (yang sudah pre-test) --</option>
                        {eligibleStudents.map(student => <option key={student._id} value={student._id}>{student.namaLengkap}</option>)}
                    </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50" disabled={eligibleStudents.length === 0}>
                    Buat Sesi
                </button>
            </form>

            <div>
                <h2 className="text-xl font-semibold mb-3">Daftar Sesi Terjadwal</h2>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detail Sesi</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Siswa</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={3} className="text-center py-4">Memuat...</td></tr>
                            ) : existingSessions.length > 0 ? existingSessions.map(sesi => (
                                <tr key={sesi._id}>
                                    <td className="px-4 py-4 align-top">
                                        {/* OPTIMASI: Menggunakan map untuk pencarian cepat */}
                                        <p className="font-semibold text-gray-900">{materiMap.get(sesi.materiId) || 'Materi tidak ada'}</p>
                                        <p className="text-sm text-gray-500">{new Date(sesi.tanggalSesi).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                    </td>
                                    <td className="px-4 py-4 align-top font-medium text-gray-800">
                                        {/* OPTIMASI: Menggunakan map untuk pencarian cepat */}
                                        {sesi.siswaId ? siswaMap.get(sesi.siswaId) || 'Siswa tidak ditemukan' : 'N/A'}
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleToggleActivateSession(sesi)} className={`${sesi.status === 'Aktif' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white text-xs font-bold py-1 px-3 rounded-full transition-colors`}>
                                                {sesi.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                                            </button>
                                            <button onClick={() => handleDeleteSession(sesi._id)} className="text-red-600 hover:text-red-800 text-xs font-bold py-1 px-3 rounded-full hover:bg-red-100">
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={3} className="text-center py-4 text-gray-500">Belum ada sesi yang dibuat.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}