'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';

// Interface untuk satu objek kelas (sudah ada)
interface IClass {
  _id: string;
  nama: string;
  deskripsi: string;
  jadwal: string;
  jumlahPertemuan: number;
  waktuPerPertemuan: string;
}

// <-- 1. TAMBAHKAN INTERFACE INI
// Interface ini mendeskripsikan struktur lengkap dari respons API kita
interface ApiResponse {
  success: boolean;
  data: IClass[];
  message?: string; // message bersifat opsional
}

export default function KelasSayaPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [classes, setClasses] = useState<IClass[]>([]);
  const [isFetchingClasses, setIsFetchingClasses] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    const fetchClasses = async () => {
      try {
        // <-- 2. BERI TAHU apiClient TIPE DATA YANG DIHARAPKAN
        const response = await apiClient.get<ApiResponse>('/tutor/my-classes');
        
        // Sekarang TypeScript tahu bahwa response.data memiliki properti .success dan .data
        if (response.data.success) {
          setClasses(response.data.data);
        } else {
          throw new Error(response.data.message || 'Gagal memuat data kelas.');
        }
      } catch (err: any) {
        if (err.response?.status !== 401 && err.response?.status !== 403) {
           setError(err.message);
        }
      } finally {
        setIsFetchingClasses(false);
      }
    };

    fetchClasses();
  }, [user, isAuthLoading]);

  if (isAuthLoading) return <p>Memverifikasi sesi Anda...</p>;
  
  if (!user) return null; 

  if (isFetchingClasses) return <p>Memuat data kelas Anda...</p>;
  
  if (error) return <p className="text-red-500">Error: {error}</p>;

  // Tampilan utama halaman (tidak ada yang diubah)
  return (
    <div>
      <h1 className="text-2xl font-bold">Kelas Saya</h1>
      <p className="text-gray-600 mt-2 mb-6">Berikut adalah daftar kelas yang Anda ajar. Klik "Kelola" untuk mengedit materi dan melihat siswa terdaftar.</p>
      
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((kelas) => (
            <div key={kelas._id} className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
              <div className="flex-grow">
                <h2 className="text-lg font-bold text-gray-800">{kelas.nama}</h2>
                <p className="text-sm text-gray-500 mt-2 h-16 overflow-hidden">{kelas.deskripsi}</p>
              
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                    <p><strong>Jadwal:</strong> {kelas.jadwal}</p>
                    <p><strong>Pertemuan:</strong> {kelas.jumlahPertemuan} x {kelas.waktuPerPertemuan}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link 
                  href={`/tutordaftar/kelas-saya/${kelas._id}`} 
                  className="block w-full text-center bg-teal-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-teal-600"
                >
                  Kelola Kelas
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Anda belum memiliki kelas yang disetujui.</p>
      )}
    </div>
  );
}

