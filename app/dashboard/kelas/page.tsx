'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IClass } from '@/models/Class'; // Pastikan path ini benar
import Image from 'next/image';
import { jwtDecode } from 'jwt-decode';

// --- Komponen Header ---
const Header = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
    <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <Link href="/">
                {/* Ganti dengan logo Anda atau pastikan path-nya benar */}
                <span className="text-xl font-bold text-teal-600">Sentra Edukasi</span>
            </Link>
            <div className="flex space-x-2">
                {isLoggedIn ? (
                    <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700">
                        Dashboard Saya
                    </Link>
                ) : (
                    <>
                        <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-yellow-600">Login</Link>
                        <Link href="/daftar" className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600">Daftar</Link>
                    </>
                )}
            </div>
        </div>
    </header>
);

// --- Komponen Kartu Kelas (Menggunakan Fetch API) ---
const ClassCard = ({ kelas, isLoggedIn, setGlobalError }: { kelas: IClass, isLoggedIn: boolean, setGlobalError: (msg: string) => void }) => {
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);

    const handleRegisterClick = async () => {
        setIsRegistering(true);
        setGlobalError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setGlobalError('Sesi Anda telah berakhir. Silakan login kembali.');
            setIsRegistering(false);
            router.push('/login');
            return;
        }

        try {
            const response = await fetch('/api/order/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ classId: kelas._id })
            });

            const data = await response.json();

            if (!response.ok) {
                // Menangkap error dari server (status 4xx atau 5xx)
                throw new Error(data.message || 'Gagal membuat pesanan.');
            }

            if (data.success) {
                const { orderId } = data;
                router.push(`/order/${orderId}`);
            } else {
                setGlobalError(data.message || 'Gagal membuat pesanan.');
            }
        } catch (err: any) {
            console.error("Registration failed:", err);
            setGlobalError(err.message || 'Terjadi kesalahan saat mendaftar kelas.');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleDetailClick = () => {
        router.push('/login');
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex-grow">{kelas.nama}</h2>
            <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p><strong>Jadwal:</strong> {kelas.jadwal}</p>
                <p><strong>Harga:</strong> <span className="font-semibold text-yellow-600">Rp {(kelas.harga ?? 0).toLocaleString('id-ID')}</span></p>
                {isLoggedIn && (
                    <>
                        <p><strong>Tutor:</strong> {kelas.tutorName || 'Belum ditentukan'}</p>
                        <div>
                            <p className="font-semibold mt-2">Materi yang akan dipelajari:</p>
                            <ul className="list-disc list-inside text-gray-500 text-xs pl-2">
                                {kelas.materi?.slice(0, 3).map((materiItem: any, index: number) => (
                                    <li key={index}>{materiItem.title}</li>
                                ))}
                                {kelas.materi?.length > 3 && <li>dan lainnya...</li>}
                            </ul>
                        </div>
                    </>
                )}
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100">
                {isLoggedIn ? (
                    <button
                        onClick={handleRegisterClick}
                        disabled={isRegistering}
                        className="w-full text-center bg-teal-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isRegistering ? 'Mendaftarkan...' : 'Daftar Kelas'}
                    </button>
                ) : (
                    <button onClick={handleDetailClick} className="w-full bg-gray-200 text-gray-700 font-bold py-2 px-3 rounded-lg hover:bg-gray-300">
                        Login untuk Mendaftar
                    </button>
                )}
            </div>
        </div>
    );
};


export default function CariKelasPage() {
  const [classes, setClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: { exp: number } = jwtDecode(token);
        if (decodedToken.exp * 1000 > Date.now()) {
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public/classes');
      if (!res.ok) throw new Error('Gagal mengambil data kelas.');
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header isLoggedIn={isLoggedIn} />
      <main className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Temukan Kelas Anda</h1>
        <p className="text-gray-500 mb-8">Jelajahi berbagai pilihan kelas berkualitas yang kami tawarkan.</p>
        
        {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
        
        {isLoading ? (
          <p>Memuat daftar kelas...</p>
        ) : classes.length === 0 && !error ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-500">Saat ini belum ada kelas yang tersedia. Silakan cek kembali nanti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((kelas) => (
              <ClassCard key={String(kelas._id)} kelas={kelas} isLoggedIn={isLoggedIn} setGlobalError={setError} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
