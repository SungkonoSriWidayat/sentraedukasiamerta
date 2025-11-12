'use client';

import { useState, useEffect } from 'react'; // <-- Tambahkan useEffect
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // <-- Tambahkan useRouter
import { useAuth } from '@/app/context/AuthContext';

// --- Komponen Ikon ---
const HamburgerIcon = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden">
        <span className="sr-only">Buka menu</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    </button>
);

// --- Komponen Sidebar ---
const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const pathname = usePathname();
    const { logout } = useAuth();

    const sidebarLinks = [
        { name: 'Dashboard', href: '/tutordaftar/dashboard' },
        { name: 'Kelas Saya', href: '/tutordaftar/kelas-saya' },
        { name: 'Manajemen Order', href: '/tutordaftar/manajemen-order' },
        { name: 'Ajukan Pembuatan Kelas', href: '/tutordaftar/ajukan-kelas' },
        { name: 'Pengajuan Kelas Saya', href: '/tutordaftar/pengajuan-saya' },
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold text-white mb-8 px-4">Portal Tutor</h2>
            <nav className="flex-grow">
                {sidebarLinks.map(link => {
                    const isActive = pathname === link.href || (link.href !== '/tutordaftar/dashboard' && pathname.startsWith(link.href));
                    return (
                        <Link key={link.name} href={link.href} onClick={onClose} className={`block py-2.5 px-4 rounded-md transition duration-200 ${isActive ? 'bg-teal-700 text-white' : 'text-gray-300 hover:bg-teal-700 hover:text-white'}`}>
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4">
                <button 
                    onClick={logout}
                    className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700"
                >
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose}
            ></div>
            <div className={`fixed top-0 left-0 h-full w-64 bg-teal-800 z-50 transform transition-transform md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {sidebarContent}
            </div>
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-teal-800">
                {sidebarContent}
            </div>
        </>
    );
};

export default function TutorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, isLoading } = useAuth(); // <-- Ambil status user dan loading
    const router = useRouter(); // <-- Ambil instance router

    // --- LOGIKA PENJAGA GERBANG ---
    useEffect(() => {
        // Efek ini akan berjalan setiap kali Anda berpindah halaman di dalam layout ini.
        if (!isLoading && !user) {
            // Jika proses verifikasi selesai (isLoading false) dan tidak ada user,
            // paksa kembali ke halaman login.
            router.push('/tutordaftar/login');
        }
    }, [user, isLoading, router]); // <-- Dijalankan saat status auth berubah

    // Selama AuthContext masih memeriksa token, tampilkan loading screen
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                Memverifikasi sesi...
            </div>
        );
    }
    
    // Hanya tampilkan layout dan konten halaman jika user terbukti ada (sudah login)
    if (user) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="md:ml-64 flex flex-col flex-1">
                    <header className="p-4 md:hidden flex justify-between items-center bg-white border-b sticky top-0 z-30">
                        <h1 className="text-lg font-semibold">Portal Tutor</h1>
                        <HamburgerIcon onClick={() => setSidebarOpen(true)} />
                    </header>
                    <main className="flex-1 p-6 sm:p-10">
                        {children}
                    </main>
                </div>
            </div>
        )
    }

    // Jika tidak loading dan tidak ada user, return null selagi menunggu redirect
    return null;
}

