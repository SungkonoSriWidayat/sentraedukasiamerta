'use client';

import { useState, useEffect, useCallback } from 'react';
import { IUser } from '@/models/User';

export default function ManajemenTutorPage() {
  const [tutors, setTutors] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/get-users?role=tutor', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil data tutor.');
      
      const data = await res.json();
      if (data.success) {
        setTutors(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  const handleDelete = async (userId: string) => {
    if (confirm('Anda yakin ingin MENGHAPUS pengguna ini secara permanen?')) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`/api/admin/delete-tutor/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Gagal menghapus pengguna.');
        
        fetchTutors(); // Refresh daftar setelah hapus
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  // ======================================================
  // === FUNGSI BARU UNTUK MENGHUBUNGI TUTOR VIA WHATSAPP ===
  // ======================================================
  const handleContact = (tutor: IUser) => {
    // Ubah format nomor dari '08...' menjadi '628...'
    const internationalNumber = '62' + tutor.nomorWhatsapp.substring(1);
    
    // Siapkan pesan (opsional, bisa dikosongkan)
    const message = encodeURIComponent(
      `Halo, ${tutor.namaLengkap}. Kami dari Sentra Edukasi Amerta ingin menghubungi Anda.`
    );
    
    // Buat URL WhatsApp
    const whatsappUrl = `https://wa.me/${internationalNumber}?text=${message}`;
    
    // Buka URL di tab baru
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Manajemen Tutor</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      
      {isLoading ? (
        <p>Memuat data...</p>
      ) : tutors.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-500">Belum ada tutor yang disetujui.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg">
          {/* Tampilan Tabel untuk Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold uppercase">Nama Lengkap</th>
                  <th className="px-5 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold uppercase">No. WhatsApp</th>
                  <th className="px-5 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tutors.map((tutor) => (
                  <tr key={String(tutor._id)}>
                    <td className="px-5 py-5 border-b text-sm">{tutor.namaLengkap}</td>
                    <td className="px-5 py-5 border-b text-sm">{tutor.nomorWhatsapp}</td>
                    <td className="px-5 py-5 border-b text-sm whitespace-nowrap">
                      {/* Tombol Hubungi BARU */}
                      <button onClick={() => handleContact(tutor)} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded mr-2">Hubungi</button>
                      <button onClick={() => handleDelete(String(tutor._id))} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tampilan Kartu untuk Mobile */}
          <div className="md:hidden">
            {tutors.map((tutor) => (
              <div key={String(tutor._id)} className="p-4 border-b border-gray-200">
                <div className="font-bold text-gray-800">{tutor.namaLengkap}</div>
                <div className="text-sm text-gray-600 mt-1">{tutor.nomorWhatsapp}</div>
                <div className="mt-3 flex space-x-2">
                  {/* Tombol Hubungi BARU */}
                  <button onClick={() => handleContact(tutor)} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-3 rounded">Hubungi</button>
                  <button onClick={() => handleDelete(String(tutor._id))} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-3 rounded">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
