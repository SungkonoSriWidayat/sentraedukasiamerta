'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IClassProposal } from '@/models/ClassProposal';

// Definisikan tipe baru untuk proposal yang sudah terisi data tutor
interface PopulatedClassProposal extends Omit<IClassProposal, 'tutorId'> {
  tutorId: {
    _id: string;
    nomorWhatsapp: string;
  };
}

export default function VerifikasiKelasPage() {
  const [proposals, setProposals] = useState<PopulatedClassProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/class-proposals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          router.push('/adminSEA/login');
          return;
        }
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal mengambil data');
      }
      
      const data = await res.json();
      if (data.success) {
        setProposals(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleProcess = async (proposal: PopulatedClassProposal, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/process-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ proposalId: proposal._id, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      const internationalNumber = '62' + proposal.tutorId.nomorWhatsapp.substring(1);
      let message = '';

      if (action === 'approve') {
        message = encodeURIComponent(
          `Selamat, ${proposal.tutorName}! Pengajuan kelas Anda "${proposal.namaKelas}" telah kami SETUJUI dan kelasnya sudah kami buat. Terima kasih.`
        );
      } else {
        message = encodeURIComponent(
          `Dengan hormat, ${proposal.tutorName}. Terkait pengajuan kelas Anda "${proposal.namaKelas}", setelah peninjauan, saat ini belum dapat kami setujui. Silakan hubungi kami untuk diskusi lebih lanjut. Terima kasih.`
        );
      }
      
      const whatsappUrl = `https://wa.me/${internationalNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');

      fetchProposals();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleContact = (proposal: PopulatedClassProposal) => {
    const internationalNumber = '62' + proposal.tutorId.nomorWhatsapp.substring(1);
    const message = encodeURIComponent(`Halo, ${proposal.tutorName}. Terkait pengajuan kelas Anda "${proposal.namaKelas}", ada beberapa hal yang ingin kami diskusikan.`);
    const whatsappUrl = `https://wa.me/${internationalNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Verifikasi Pengajuan Kelas</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      
      {isLoading ? <p>Memuat...</p> : proposals.length === 0 ? (
        <p className="text-gray-500">Tidak ada pengajuan kelas baru.</p>
      ) : (
        <div className="space-y-6">
          {proposals.map((p) => (
            <div key={String(p._id)} className="bg-white p-6 rounded-lg shadow-md">
              <div className="md:flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{p.namaKelas}</h2>
                  <p className="text-sm text-gray-500">Diajukan oleh: {p.tutorName}</p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                  <button onClick={() => handleContact(p)} className="bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded">Hubungi</button>
                  <button onClick={() => handleProcess(p, 'reject')} className="bg-red-500 text-white text-xs font-bold py-2 px-3 rounded">Tolak</button>
                  <button onClick={() => handleProcess(p, 'approve')} className="bg-green-500 text-white text-xs font-bold py-2 px-3 rounded">Setujui & Buat Kelas</button>
                </div>
              </div>
              <div className="mt-4 border-t pt-4 space-y-2 text-sm text-gray-700">
                <p><strong>Deskripsi:</strong> {p.deskripsi}</p>
                
                {/* ======================================= */}
                {/* ===    PERUBAHAN TAMPILAN MATERI    === */}
                {/* ======================================= */}
                <div>
                  <strong className="block mb-1">Rencana Materi:</strong>
                  <ul className="list-decimal list-inside pl-4 space-y-1">
                    {p.materi.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                {/* ======================================= */}

                <p><strong>Jadwal:</strong> {p.jadwal}</p>
                <p><strong>Detail:</strong> {p.jumlahPertemuan} pertemuan @ {p.waktuPerPertemuan}</p>
                <p><strong>Harga:</strong> Rp {p.harga.toLocaleString('id-ID')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
