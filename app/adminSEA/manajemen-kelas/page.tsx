'use client';

import { useState, useEffect } from 'react'; 
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Impor 'useAuth' dari path context Anda
import { useAuth } from '@/app/context/AuthContext'; 

// Interface untuk tipe data kelas
interface IClass {
  _id: string;
  nama: string;
  tutorName: string;
  deskripsi: string;
  jadwal: string;
  jumlahPertemuan: number;
  waktuPerPertemuan: string;
}

export default function ManajemenKelasPage() {
  const [classes, setClasses] = useState<IClass[]>([]);
  const [loading, setLoading] = useState(true); // Loading untuk data kelas
  const [error, setError] = useState('');

  // --- Integrasi AuthContext ---
  // Gunakan 'isLoading' (camelCase) yang benar dari context
  const { token, user, isLoading: authLoading } = useAuth(); 
  const router = useRouter();
  // -----------------------------

  // Efek untuk Guard/Perlindungan Rute
  useEffect(() => {
    // Tunggu sampai auth selesai loading
    if (!authLoading) {
      // Jika tidak ada user ATAU rolenya bukan admin, redirect
      if (!user || user.role !== 'admin') {
        router.push('/adminSEA/login'); 
      }
    }
  }, [authLoading, user, router]);

  // Efek untuk Fetch Data Kelas
  useEffect(() => {
    const fetchClasses = async () => {
      // Hanya fetch jika: auth selesai, ada token, dan user adalah admin
      if (!authLoading && token && user?.role === 'admin') {
        setLoading(true); // Mulai loading data kelas
        try {
          const res = await fetch('/api/admin/kelas', {
            headers: { 
              'Authorization': `Bearer ${token}` // Gunakan token dari context
            }
          });
          const data = await res.json();
          if (data.success) {
            setClasses(data.data);
          } else {
            throw new Error(data.message || 'Gagal memuat data kelas.');
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false); // Selesai loading data kelas
        }
      } else if (!authLoading && !user) {
        // Jika auth selesai tapi tidak ada user, hentikan loading
        setLoading(false);
      }
    };

    fetchClasses();
    // Dependensi ditambah authLoading, token, dan user
  }, [authLoading, token, user]); 

  // --- Tampilan Loading & Guard ---
  // Tampilkan loading jika status auth ATAU status fetch data sedang berjalan
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Memuat data...</p>
      </div>
    );
  }
  
  // Tampilan jika user tidak sah (sebelum redirect selesai)
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Mengalihkan ke halaman login...</p>
      </div>
    );
  }
  // ---------------------------------

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  // Render konten utama jika semua sudah aman
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Kelas</h1>
        {/* Anda bisa menambahkan tombol "Tambah Kelas Baru" di sini nanti */}
      </div>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(kelas => (
            <div key={kelas._id} className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
              <div className="flex-grow">
                <p className="text-sm font-semibold text-teal-600">{kelas.tutorName}</p>
                <h2 className="text-lg font-bold text-gray-800 mt-1">{kelas.nama}</h2>
                <p className="text-sm text-gray-500 mt-2 h-16 overflow-hidden">{kelas.deskripsi}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                  <p><strong>Jadwal:</strong> {kelas.jadwal}</p>
                  <p><strong>Pertemuan:</strong> {kelas.jumlahPertemuan} x {kelas.waktuPerPertemuan}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link 
                  href={`/adminSEA/manajemen-kelas/${kelas._id}`} 
                  className="block w-full text-center bg-indigo-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-indigo-700"
                >
                  Kelola Kelas
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Belum ada kelas yang dibuat.</p>
      )}
    </div>
  );
}
