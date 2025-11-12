'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image'; // Impor komponen Image

interface IClassDisplay {
  _id: string;
  nama: string;
  deskripsi: string;
  tutorName: string;
  jumlahPertemuan: number;
  harga: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function CariKelasPage() {
  const [allClasses, setAllClasses] = useState<IClassDisplay[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<IClassDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/public/classes');
        const data = await res.json();
        if (data.success) {
          setAllClasses(data.data);
          setFilteredClasses(data.data);
        } else {
          throw new Error(data.message || 'Gagal memuat data kelas.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    const filtered = allClasses.filter(kelas =>
      kelas.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClasses(filtered);
  }, [searchQuery, allClasses]);

  const handleBeliKelas = (classId: string) => {
    if (authLoading) return; 

    if (user) {
      router.push(`/order/${classId}`);
    } else {
      router.push('/login');
    }
  };

  return (
    // Menggunakan div utama sebagai container untuk background
    <div 
      className="min-h-screen relative overflow-hidden" 
      style={{
        backgroundImage: `url(${'/'}bg_kelas_pattern.jpg)`, // Pastikan gambar diletakkan di folder public
        backgroundSize: 'cover', // Mengcover seluruh area
        backgroundAttachment: 'fixed', // Agar background tidak ikut scroll
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay untuk meningkatkan keterbacaan teks */}
      <div className="absolute inset-0 bg-white opacity-60 z-0"></div> 

      <div className="container mx-auto p-4 md:p-8 relative z-10"> {/* Konten di atas overlay */}
        
        <div className="mb-8 text-center pt-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Temukan Kelas Impianmu</h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Jelajahi berbagai kelas berkualitas yang siap membantumu meraih potensi terbaikmu.
          </p>
          <div className="max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kelas..."
              className="w-full p-5 text-lg border-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg "
              style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }} // Custom padding
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-700 text-lg">Memuat kelas...</p>
        ) : error ? (
          <p className="text-center text-red-600 text-lg">Error: {error}</p>
        ) : filteredClasses.length === 0 ? (
          <p className="text-center text-gray-700 text-lg mt-12">
            {searchQuery ? 'Kelas tidak ditemukan. Coba kata kunci lain.' : 'Belum ada kelas yang tersedia saat ini. Mohon kembali nanti!'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-12">
            {filteredClasses.map(kelas => (
              <div key={kelas._id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="p-6 flex-grow">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{kelas.nama}</h2>
                  <p className="text-sm text-black font-medium mb-3">oleh {kelas.tutorName}</p>
                  <p className="text-gray-700 text-base mb-4 h-24 overflow-hidden leading-relaxed">
                    {kelas.deskripsi && kelas.deskripsi.length > 120 ? `${kelas.deskripsi.substring(0, 120)}...` : (kelas.deskripsi || 'Tidak ada deskripsi lengkap untuk kelas ini.')}
                  </p>
                  <div className="text-base text-gray-600 mt-auto">
                    <p className="font-semibold">Total Pertemuan: <span className="text-gray-800">{kelas.jumlahPertemuan}x</span></p>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Harga</p>
                    <p className="text-2xl font-bold text-black">
                      {formatCurrency(kelas.harga)}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleBeliKelas(kelas._id)}
                    disabled={authLoading}
                    className="bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-gold-700 active:bg-indigo-800 transition-all duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Beli Kelas
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

