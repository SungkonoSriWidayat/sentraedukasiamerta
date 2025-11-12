'use client';

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
// import { jwtDecode } from 'jwt-decode'; // Dihapus, diganti context
import Pusher from 'pusher-js';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import toast, { Toaster } from 'react-hot-toast';

// --- TAMBAHKAN IMPOR AuthProvider dan useAuth ---
// Pastikan path ini benar
import { AuthProvider, useAuth } from '@/app/context/AuthContext';

// Definisikan tipe untuk data di dalam token
interface DecodedToken {
  name: string;
  role: string;
}

// Komponen untuk tampilan loading (Tidak berubah)
function AdminLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <p className="text-lg text-gray-600">Memuat Portal Admin...</p>
    </div>
  );
}

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  // const [isAuthenticated, setIsAuthenticated] = useState(false); // Dihapus
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  
  // --- GUNAKAN useAuth ---
  const { user, token, isLoading: authLoading, logout } = useAuth();
  
  const { 
    hasNewVerification, setHasNewVerification, 
    hasNewClassProposal, setHasNewClassProposal 
  } = useNotification();

  // 1. Fungsi checkNotifications (diperbarui untuk menggunakan 'token' dari context)
  const checkNotifications = useCallback(async () => {
    if (!token) return; // Gunakan token dari context

    try {
      const res = await fetch('/api/admin/notification-counts', {
        headers: { 'Authorization': `Bearer ${token}` } // Gunakan token dari context
      });
      const data = await res.json();
      if (data.success) {
        setHasNewVerification(data.data.pendingTutors > 0);
        setHasNewClassProposal(data.data.pendingClasses > 0);
      }
    } catch (error) {
      console.error("Gagal memeriksa notifikasi:", error);
    }
  }, [token, setHasNewVerification, setHasNewClassProposal]);

  // 2. useEffect untuk autentikasi (DIGANTI dengan logika context)
  useEffect(() => {
    setIsClient(true);
    
    // Tunggu sampai status auth selesai loading
    if (authLoading) return;

    // Logika Guarding (Perlindungan Rute)
    if (pathname === '/adminSEA/login') {
      // Jika sudah login sebagai admin, jangan biarkan di halaman login
      if (user && user.role === 'admin') {
        router.replace('/adminSEA');
      }
    } else {
      // Jika di halaman lain TAPI (tidak ada user ATAU rolenya bukan admin)
      if (!user || user.role !== 'admin') {
        router.replace('/adminSEA/login'); // Tendang ke login
      }
    }
  }, [authLoading, user, pathname, router]);

  // 3. useEffect untuk memeriksa notifikasi (ganti 'isAuthenticated' dengan 'user')
  useEffect(() => {
    if (isClient && user && pathname !== '/adminSEA/login') {
      checkNotifications();
    }
  }, [isClient, user, pathname, checkNotifications]);

  // 4. useEffect untuk Pusher (ganti 'isAuthenticated' dengan 'user')
  useEffect(() => {
    if (!isClient || !user || pathname === '/adminSEA/login') return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe('admin-notifications');

    channel.bind('new-payment', function(data: { message: string }) {
      toast.success(data.message, { duration: 6000, position: 'top-right' });
    });
    const handleNotification = (data: { message: string }) => {
      setNotification(data.message);
      checkNotifications(); 
      setTimeout(() => setNotification(null), 5000);
    };
    channel.bind('new-tutor-registration', handleNotification);
    channel.bind('new-class-proposal', handleNotification);

    return () => { pusher.unsubscribe('admin-notifications'); };
  }, [isClient, user, pathname, checkNotifications]);

  const handleLogout = () => {
    logout(); // Panggil fungsi logout dari context
  };

  if (!isClient || authLoading) { // Ganti 'isAuthenticated' dengan 'authLoading'
    return <AdminLoading />;
  }

  if (pathname === '/adminSEA/login') {
    return <>{children}</>;
  }
  
  // Fallback jika proses redirect belum selesai
  if (!user) {
    return <AdminLoading />;
  }

  // --- STRUKTUR JSX ASLI ANDA (BERSIH) ---
  return (
    <div className="flex min-h-screen bg-gray-100">
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
        ></div>
      )}
      <Toaster />
      <aside className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white p-4 flex flex-col shadow-lg transform z-30 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <h2 className="text-2xl font-bold mb-8 text-center text-yellow-400">Admin Portal</h2>
        <nav className="flex-grow">
          <ul>
            <li className="mb-4">
              <Link href="/adminSEA" className="block p-2 rounded hover:bg-gray-700">Dashboard</Link>
            </li>
            <li className="mb-4">
              <Link href="/adminSEA/verifikasi-tutor" className="relative block p-2 rounded hover:bg-gray-700">
                Verifikasi Tutor
                {hasNewVerification && (
                  <span className="absolute top-1 right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                )}
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/adminSEA/verifikasi-kelas" className="relative block p-2 rounded hover:bg-gray-700">
                Verifikasi Kelas
                {hasNewClassProposal && (
                  <span className="absolute top-1 right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span></span>
                )}
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/adminSEA/manajemen-kelas" className="block p-2 rounded hover:bg-gray-700">Manajemen Kelas</Link>
            </li>
            <li className="mb-4">
              <Link href="/adminSEA/manajemen-tutor" className="block p-2 rounded hover:bg-gray-700">Manajemen Tutor</Link>
            </li>
            <li>
              <Link href="/adminSEA/manajemen-order" className="block p-4 hover:bg-gray-700">Manajemen Order</Link>
            </li>
            <li className="mb-4">
              <Link href="/adminSEA/manajemen-user" className="block p-2 rounded hover:bg-gray-700">Manajemen User</Link>
            </li>
          </ul>
        </nav>
        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded">Logout</button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col relative">
        {notification && (
          <div className="absolute top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50">
            {notification}
          </div>
        )}
        <div className="md:hidden flex justify-between items-center bg-white p-4 shadow-md">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <span className="text-xl font-bold text-gray-800">Admin Dashboard</span>
        </div>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}

// Komponen utama yang membungkus dengan Provider
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    // --- BUNGKUS DENGAN AuthProvider ---
    <AuthProvider>
      <NotificationProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </NotificationProvider>
    </AuthProvider>
  );
}

