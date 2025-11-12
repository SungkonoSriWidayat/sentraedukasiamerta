'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';

// Definisikan tipe untuk data yang ada di dalam token
interface DecodedToken {
  name: string;
}

export default function TutorDashboardPage() {
  const [tutorName, setTutorName] = useState<string>('Tutor');
   const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Ambil token dari localStorage untuk mendapatkan nama tutor
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);
        setTutorName(decodedToken.name);
      } catch (error) {
        console.error("Gagal decode token:", error);
      }
    }
     // ======================================================
    // === BAGIAN BARU: Periksa pesan dari sessionStorage ===
    // ======================================================
    const message = sessionStorage.getItem('successMessage');
    if (message) {
      setSuccessMessage(message);
      // Hapus pesan agar tidak muncul lagi saat refresh
      sessionStorage.removeItem('successMessage');
    }
    // ======================================================
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
        Dashboard Tutor
      </h1>
      <p className="text-gray-600 mb-8">
        Selamat datang kembali, {tutorName}! Kelola kelas dan profil Anda di sini.
      </p>

      {/* Grid responsif untuk kartu navigasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card untuk "Kelas Saya" */}
        <Link href="/tutordaftar/kelas-saya">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <h2 className="text-xl font-bold text-teal-600 mb-2">Kelas Saya</h2>
            <p className="text-gray-500">Lihat dan kelola semua kelas yang Anda ajar.</p>
          </div>
        </Link>
        
        {/* Card untuk "Profil Saya" */}
        <Link href="/tutordaftar/profil">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <h2 className="text-xl font-bold text-green-600 mb-2">Profil Saya</h2>
            <p className="text-gray-500">Perbarui informasi pribadi dan data diri Anda.</p>
          </div>
        </Link>

        <Link href="/tutordaftar/ajukan-kelas">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <h2 className="text-xl font-bold text-orange-600 mb-2">Ajukan Kelas Baru</h2>
            <p className="text-gray-500">Usulkan ide kelas baru untuk disetujui oleh admin.</p>
          </div>
        </Link>

        <Link href="/tutordaftar/pengajuan-saya">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <h2 className="text-xl font-bold text-blue-600 mb-2">Pengajuan Saya</h2>
            <p className="text-gray-500">Lacak status pengajuan kelas yang telah Anda kirim.</p>
          </div>
        </Link>

        <Link href="/tutordaftar/manajemen-order">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <h2 className="text-xl font-bold text-blue-600 mb-2">Manajemen Order</h2>
            <p className="text-gray-500">Lihat dan verifikasi pendaftaran siswa baru di kelas Anda.</p>
          </div>
        </Link>

        
        {/* Card Placeholder untuk "Materi Ajar" */}
        <div className="bg-gray-200 p-6 rounded-lg shadow-md cursor-not-allowed">
          <h2 className="text-xl font-bold text-gray-500 mb-2">Materi Ajar</h2>
          <p className="text-gray-400">(Segera Hadir) Unggah dan kelola materi untuk kelas Anda.</p>
        </div>

      </div>
    </div>
  );
}
