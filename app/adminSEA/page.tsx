'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';
import { useNotification } from './context/NotificationContext';

// Definisikan tipe untuk data di dalam token
interface DecodedToken {
  name: string;
}

// Komponen baru untuk saklar (bisa diletakkan di file terpisah jika perlu)
const ToggleSwitch = ({ label, enabled, onChange, isLoading }: { label: string, enabled: boolean, onChange: () => void, isLoading: boolean }) => {
    return (
        <div className="flex items-center justify-between">
            <span className="text-gray-700">{label}</span>
            <button 
              onClick={onChange} 
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
};

export default function AdminDashboardPage() {
  const [adminName, setAdminName] = useState<string>('Admin');
  const { hasNewVerification, hasNewClassProposal } = useNotification();
  
  // State baru untuk mengelola status pendaftaran
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [isLoadingToggle, setIsLoadingToggle] = useState(true); // Loading state untuk saklar

  // Fetch status awal saat komponen dimuat
  useEffect(() => {
    const fetchStatus = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/settings', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                setIsRegistrationOpen(data.data.isOpen);
            }
        } catch (error) {
            console.error("Gagal mengambil status pendaftaran:", error);
        } finally {
            setIsLoadingToggle(false);
        }
    };
    fetchStatus();
  }, []);

  // Fungsi untuk mengubah status pendaftaran saat saklar diklik
  const handleToggleRegistration = async () => {
    setIsLoadingToggle(true);
    const token = localStorage.getItem('token');
    const newStatus = !isRegistrationOpen;
    try {
        await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ isOpen: newStatus })
        });
        setIsRegistrationOpen(newStatus);
    } catch (error) {
        console.error("Gagal mengubah status pendaftaran:", error);
    } finally {
        setIsLoadingToggle(false);
    }
  };

  useEffect(() => {
    // Ambil nama dari token untuk pesan selamat datang
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);
        setAdminName(decodedToken.name);
      } catch (error) {
        console.error("Gagal decode token:", error);
      }
    }
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
        Selamat Datang, {adminName}!
      </h1>
      <p className="text-gray-600 mb-8">
        Anda berada di Dashboard Admin. Silakan pilih menu di samping atau kartu di bawah untuk mulai mengelola konten.
      </p>

      {/* Bagian Pengaturan Situs */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Pengaturan Situs</h2>
        <ToggleSwitch 
          label="Pendaftaran Tutor Dibuka"
          enabled={isRegistrationOpen}
          onChange={handleToggleRegistration}
          isLoading={isLoadingToggle}
        />
      </div>

      {/* Kartu Navigasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card untuk Verifikasi Tutor dengan Notifikasi */}
        <Link href="/adminSEA/verifikasi-tutor">
          <div className="relative bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            {hasNewVerification && (
              <span className="absolute top-4 right-4 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            <h2 className="text-xl font-bold text-orange-600 mb-2">Verifikasi Tutor</h2>
            <p className="text-gray-500">Setujui atau tolak pendaftaran tutor baru yang masuk.</p>
          </div>
        </Link>
        
        {/* Card untuk Verifikasi Kelas dengan Notifikasi */}
        <Link href="/adminSEA/verifikasi-kelas">
          <div className="relative bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            {hasNewClassProposal && (
              <span className="absolute top-4 right-4 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            )}
            <h2 className="text-xl font-bold text-purple-600 mb-2">Verifikasi Kelas</h2>
            <p className="text-gray-500">Tinjau dan setujui pengajuan kelas baru dari para tutor.</p>
          </div>
        </Link>

        {/* ... Kartu lainnya ... */}
        <Link href="/adminSEA/manajemen-kelas">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <h2 className="text-xl font-bold text-yellow-600 mb-2">Manajemen Kelas</h2>
            <p className="text-gray-500">Tambah, edit, atau hapus data kelas yang tersedia.</p>
          </div>
        </Link>
        <Link href="/adminSEA/manajemen-materi">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
               <h2 className="text-xl font-bold text-green-600 mb-2">Manajemen Materi</h2>
               <p className="text-gray-500">Buat template tes dan lihat semua materi dari setiap kelas.</p>
            </div>
        </Link>
        <Link href="/adminSEA/manajemen-tutor">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <h2 className="text-xl font-bold text-teal-600 mb-2">Manajemen Tutor</h2>
            <p className="text-gray-500">Lihat, kelola, atau hapus data tutor yang sudah disetujui.</p>
          </div>
        </Link>
        <Link href="/adminSEA/manajemen-order" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold">Manajemen Order</h2>
          <p className="text-gray-600 mt-2">Lihat dan verifikasi pendaftaran kelas baru.</p>
        </Link>
        <Link href="/adminSEA/manajemen-user">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <h2 className="text-xl font-bold text-blue-600 mb-2">Manajemen User</h2>
            <p className="text-gray-500">Lihat, kelola, atau hapus data pengguna/siswa.</p>
          </div>
        </Link>
        <div className="bg-gray-200 p-6 rounded-lg shadow-md cursor-not-allowed">
          <h2 className="text-xl font-bold text-gray-500 mb-2">Manajemen Slideshow</h2>
          <p className="text-gray-400">(Segera Hadir) Ubah konten slideshow di halaman utama.</p>
        </div>

      </div>
    </div>
  );
}
