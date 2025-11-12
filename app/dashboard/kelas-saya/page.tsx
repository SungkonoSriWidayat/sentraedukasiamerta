'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';

// Interface untuk mendefinisikan struktur data satu kelas
interface IKelas {
  _id: string;
  nama: string;
  deskripsi: string;
  tutorId: {
    namaLengkap: string;
  };
}

// Interface untuk mendefinisikan struktur respons dari API
interface ApiResponse {
  success: boolean;
  data: IKelas[];
  message?: string;
}

export default function KelasSayaSiswaPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [daftarKelas, setDaftarKelas] = useState<IKelas[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    const fetchKelasSaya = async () => {
      setIsLoadingData(true);
      setError('');
      try {
        const response = await apiClient.get<ApiResponse>('/siswa/kelas-saya');
        
        if (response.data.success) {
          setDaftarKelas(response.data.data);
        } else {
          throw new Error(response.data.message || 'Gagal memuat data kelas.');
        }
      } catch (err: any) {
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          setError(err.message);
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchKelasSaya();
  }, [user, isAuthLoading]);

  if (isAuthLoading) {
    return null;
  }

  if (isLoadingData) {
    return <p>Memuat daftar kelas Anda...</p>;
  }

  if (error) {
    return <p className="text-red-500">Terjadi kesalahan: {error}</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Kelas yang Anda Ikuti</h1>
      <a href="/dashboard" className="text-indigo-600 hover:text-indigo-900 mb-6 inline-block"> &larr; Kembali ke Dashboard </a>
      {daftarKelas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {daftarKelas.map((kelas) => {
            // --- TES CACHE BUSTER ---
            // Menambahkan timestamp acak untuk memaksa browser memuat ulang
            const cacheBuster = `?t=${new Date().getTime()}`;

            return (
              <div key={kelas._id} className="bg-white rounded-lg shadow p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{kelas.nama}</h2>
                  <p className="text-sm text-gray-500 mt-1">Diajar oleh: {kelas.tutorId?.namaLengkap || 'N/A'}</p>
                  <p className="text-gray-700 mt-4">{kelas.deskripsi}</p>
                </div>
                <div className="mt-6">
                  {/* --- PERBAIKAN DI SINI --- */}
                  <Link 
                    href={`/dashboard/kelas/${kelas._id}${cacheBuster}`} 
                    className="block w-full text-center bg-yellow-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-yellow-600"
                  >
                    Masuk ke Kelas
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-600">Anda belum terdaftar di kelas mana pun.</p>
      )}
    </div>
  );
}

