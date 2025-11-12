'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Mengambil data dan fungsi dari AuthContext terpusat
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();

    // 2. Logika "Penjaga Gerbang" (dipertahankan dari kode Canvas sebelumnya)
    useEffect(() => {
        if (isLoading) {
            return; // Jangan lakukan apa-apa selagi memverifikasi
        }
        // Setelah selesai, periksa hasilnya
        if (!user || user.role !== 'user') {
            console.log(`PENJAGA: Akses ke dashboard siswa ditolak untuk role '${user?.role}'. Mengarahkan ke login.`);
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // 3. Tampilkan loading screen yang informatif selagi verifikasi berjalan
    if (isLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100">
                <p className="text-lg text-gray-600">Memverifikasi sesi Anda...</p>
            </div>
        );
    }
    
    // 4. Jika verifikasi berhasil, tampilkan UI dashboard yang Anda inginkan
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-md sticky top-0 z-50">
                <nav className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                    <Link href="/">
                        <Image src="/logo.png" alt="Logo" width={150} height={40} priority />
                    </Link>
                    <div className="flex items-center space-x-4">
                        <span className="hidden sm:block text-gray-700">
                            {/* Ambil nama langsung dari 'user' context */}
                            Halo, <span className="font-bold">{user.name}</span>
                        </span>
                        {/* Hubungkan tombol ke fungsi 'logout' dari context */}
                        <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded">
                            Logout
                        </button>
                    </div>
                </nav>
            </header>
            
            <main className="container mx-auto p-4 sm:p-6">
                {children}
            </main>
        </div>
    );
}

