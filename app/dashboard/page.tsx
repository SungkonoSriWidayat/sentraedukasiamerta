'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';
import dynamic from 'next/dynamic';

// Menggunakan dynamic import untuk Slideshow, sama seperti di halaman utama
// PERUBAHAN: Tinggi placeholder loading diperkecil
const Slideshow = dynamic(() => import('@/app/components/Slideshow'), {
  ssr: false,
  loading: () => <div className="w-full h-[30vh] md:h-[40vh] bg-gray-200 animate-pulse rounded-lg" />,
});

// Komponen ikon untuk UI
const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.523 5.754 19 7.5 19s3.332-.477 4.5-1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.523 18.246 19 16.5 19s-3.332-.477-4.5-1.253" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export default function UserDashboardPage() {
  const [userName, setUserName] = useState<string>('Siswa');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: { name: string } = jwtDecode(token);
        setUserName(decodedToken.name);
      } catch (error) {
        console.error("Gagal decode token:", error);
      }
    }
  }, []);

  return (
    <div>
      {/* Bagian Slideshow */}
      <div className="mb-8">
        <Slideshow />
      </div>

      {/* Bagian Grid Menu */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Menu Navigasi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Kartu untuk Kelas Saya */}
          <Link href="/dashboard/kelas-saya">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center">
              <BookOpenIcon />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Kelas Saya</h3>
              <p className="text-gray-500">Lihat semua kelas yang sedang atau telah Anda ikuti.</p>
            </div>
          </Link>
          
          {/* Kartu untuk Cari Kelas */}
          <Link href="/kelas">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center">
              <SearchIcon />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Cari Kelas</h3>
              <p className="text-gray-500">Jelajahi dan daftar ke kelas-kelas baru yang tersedia.</p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
