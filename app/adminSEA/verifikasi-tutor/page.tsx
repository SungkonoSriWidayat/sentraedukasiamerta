'use client';

import { useState, useEffect, useCallback } from 'react';
import { IUser } from '@/models/User';
import { useNotification } from '../context/NotificationContext';

export default function VerifikasiTutorPage() {
  const [pendingTutors, setPendingTutors] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { setHasNewVerification } = useNotification();

  const fetchPendingTutors = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/pending-tutors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil data pendaftar.');
      
      const data = await res.json();
      if (data.success) {
        setPendingTutors(data.data);
        setHasNewVerification(data.data.length > 0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [setHasNewVerification]);

  useEffect(() => {
    fetchPendingTutors();
  }, [fetchPendingTutors]);

  // =================================================================
  // === FUNGSI YANG DIPERBARUI UNTUK MENGHANDLE VERIFIKASI & WHATSAPP ===
  // =================================================================
  const handleVerification = async (tutor: IUser, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    try {
      // Langkah 1: Kirim permintaan verifikasi ke API
      const res = await fetch('/api/admin/verify-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tutorId: tutor._id, action })
      });

      if (!res.ok) throw new Error(`Gagal untuk ${action} tutor.`);
      
      // Langkah 2: Siapkan dan buka link WhatsApp sesuai aksi
      const internationalNumber = '62' + tutor.nomorWhatsapp.substring(1);
      let message = '';

      if (action === 'approve') {
        message = encodeURIComponent(
          `Selamat, ${tutor.namaLengkap}! Pendaftaran Anda sebagai tutor di Sentra Edukasi Amerta telah kami SETUJUI. Anda sekarang sudah bisa login ke portal tutor.`
        );
      } else { // action === 'reject'
        message = encodeURIComponent(
          `Dengan hormat, ${tutor.namaLengkap}. Setelah peninjauan, kami informasikan bahwa pendaftaran Anda sebagai tutor di Sentra Edukasi Amerta saat ini belum dapat kami setujui. Terima kasih atas pengertiannya.`
        );
      }
      
      const whatsappUrl = `https://wa.me/${internationalNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
      
      // Langkah 3: Refresh daftar pendaftar di halaman
      fetchPendingTutors();

    } catch (err: any) {
      setError(err.message);
    }
  };
  const handleContact = (tutor: IUser) => {
    const internationalNumber = '62' + tutor.nomorWhatsapp.substring(1);
    const message = encodeURIComponent(
      `Halo, ${tutor.namaLengkap}. Kami dari Sentra Edukasi Amerta ingin mendiskusikan pendaftaran Anda sebagai tutor.`
    );
    const whatsappUrl = `https://wa.me/${internationalNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Verifikasi Pendaftaran Tutor</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      
      {isLoading ? (
        <p>Memuat data...</p>
      ) : pendingTutors.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-500">Tidak ada pendaftaran tutor baru yang menunggu verifikasi.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg">
          {/* TAMPILAN TABEL UNTUK DESKTOP (md ke atas) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold uppercase">Nama Lengkap</th>
                  <th className="px-5 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold uppercase">No. WhatsApp</th>
                  <th className="px-5 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold uppercase">Dokumen</th>
                  <th className="px-5 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingTutors.map((tutor) => (
                  <tr key={String(tutor._id)}>
                    <td className="px-5 py-5 border-b text-sm">{tutor.namaLengkap}</td>
                    <td className="px-5 py-5 border-b text-sm">{tutor.nomorWhatsapp}</td>
                    <td className="px-5 py-5 border-b text-sm">
                      <a href={tutor.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat File</a>
                    </td>
                    <td className="px-5 py-5 border-b text-sm whitespace-nowrap">
                      <button onClick={() => handleContact(tutor)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded mr-2">Hubungi</button>
                      <button onClick={() => handleVerification(tutor, 'approve')} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded mr-2">Setujui</button>
                      <button onClick={() => handleVerification(tutor, 'reject')} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded">Tolak</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TAMPILAN KARTU UNTUK MOBILE (di bawah md) */}
           <div className="md:hidden">
            {pendingTutors.map((tutor) => (
              <div key={String(tutor._id)} className="p-4 border-b border-gray-200">
                {/* ... (Info tutor) ... */}
                <div className="mt-4 flex flex-col space-y-2">
                  {/* TOMBOL BARU DITAMBAHKAN DI SINI */}
                  <button onClick={() => handleContact(tutor)} className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-3 rounded">Hubungi via WhatsApp</button>
                  <div className="flex space-x-2">
                    <button onClick={() => handleVerification(tutor, 'approve')} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-3 rounded">Setujui</button>
                    <button onClick={() => handleVerification(tutor, 'reject')} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-3 rounded">Tolak</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
