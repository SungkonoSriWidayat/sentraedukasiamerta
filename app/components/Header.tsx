'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext'; // <-- 1. Ganti semua import state dengan useAuth

export default function Header() {
  // 2. Ambil status otentikasi LANGSUNG dari Context. Inilah satu-satunya sumber kebenaran.
  const { user, isLoading, logout } = useAuth();

  // Fungsi getDashboardUrl tetap sama, ia akan bekerja dengan 'user' dari context
  const getDashboardUrl = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/adminSEA';
    if (user.role === 'tutor') return '/tutordaftar/dashboard'; // Arahkan ke dashboard tutor
    return '/dashboard';
  };
  
  // 3. Tampilkan placeholder KOSONG selagi context memverifikasi token.
  //    Ini SANGAT PENTING untuk mencegah "kedipan" UI yang menampilkan status login yang salah.
  if (isLoading) {
    return (
      <header className="bg-white shadow-md">
        {/* Placeholder ini menjaga tinggi header agar layout tidak "loncat" */}
        <div className="container mx-auto px-6 h-[76px]"></div>
      </header>
    );
  }

  // 4. Setelah loading selesai, render UI berdasarkan 'user' dari context
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/">
          <Image src="/logo.png" alt="Logo" width={180} height={50} priority />
        </Link>

        {/* Navigasi Desktop sekarang sepenuhnya dikontrol oleh Context */}
        <div className="hidden md:flex items-center space-x-2">
          {user ? (
            // Tampilan jika user ADA di context
            <div className="flex items-center space-x-3">
              <span className="text-gray-700">Halo, {user.name}</span>
              <Link href={getDashboardUrl()} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
                Ke Dashboard
              </Link>
              {/* Tambahkan tombol logout yang memanggil fungsi dari context */}
              <button 
                onClick={logout} 
                className="px-4 py-2 text-gray-700 hover:text-yellow-600"
              >
                Logout
              </button>
            </div>
          ) : (
            // Tampilan jika user TIDAK ADA di context
            <>
              <Link href="/login" className="px-4 py-2 text-gray-700 hover:text-yellow-600">
                Login
              </Link>
              <Link href="/daftar" className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
                Daftar
              </Link>
            </>
          )}
        </div>
        
        {/* Anda bisa menerapkan logika {user ? ... : ...} yang sama untuk menu mobile */}
      </nav>
    </header>
  );
}
