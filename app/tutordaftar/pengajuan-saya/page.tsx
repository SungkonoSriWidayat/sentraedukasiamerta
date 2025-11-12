'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';
import { IClassProposal } from '@/models/ClassProposal';

// Interface untuk respons API GET my-proposals (sudah ada)
interface GetProposalsResponse {
  success: boolean;
  data: IClassProposal[];
  message?: string;
}

// <-- 1. TAMBAHKAN INTERFACE INI
// Interface ini untuk respons API DELETE
interface DeleteProposalResponse {
  success: boolean;
  message?: string;
}

// Komponen StatusBadge (tidak ada perubahan)
const StatusBadge = ({ status }: { status: string }) => {
  const baseClasses = "px-2 py-1 text-xs font-bold rounded-full text-white";
  if (status === 'pending') return <span className={`${baseClasses} bg-yellow-500`}>Menunggu</span>;
  if (status === 'rejected') return <span className={`${baseClasses} bg-red-500`}>Ditolak</span>;
  return null;
};

export default function PengajuanSayaPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [proposals, setProposals] = useState<IClassProposal[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchProposals = async () => {
      setIsFetching(true);
      setError('');
      try {
        const response = await apiClient.get<GetProposalsResponse>('/api/tutor/my-proposals');
        if (response.data.success) {
          setProposals(response.data.data.filter((p: IClassProposal) => p.status !== 'approved'));
        } else {
          throw new Error(response.data.message || 'Gagal memuat data.');
        }
      } catch (err: any) {
        if (err.response?.status !== 401 && err.response?.status !== 403) {
           setError(err.message);
        }
      } finally {
        setIsFetching(false);
      }
    };

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }
    fetchProposals();
  }, [user, isAuthLoading]);

  const handleEdit = (proposalId: string) => {
    router.push(`/tutordaftar/ajukan-kelas?edit=${proposalId}`);
  };

  const handleDelete = async (proposalId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengajuan ini secara permanen?')) {
      setError('');
      try {
        // <-- 2. BERI TAHU apiClient TIPE DATA YANG DIHARAPKAN
        const response = await apiClient.delete<DeleteProposalResponse>(`/api/tutor/delete-proposal/${proposalId}`);
        
        // Sekarang TypeScript tahu bahwa response.data memiliki properti .success
        if (!response.data.success) {
          throw new Error(response.data.message || 'Gagal menghapus pengajuan.');
        }
        
        fetchProposals();

      } catch (err: any) {
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          setError(err.message);
        }
      }
    }
  };

  if (isAuthLoading) return <p>Memverifikasi sesi Anda...</p>;
  if (!user) return null;
  if (isFetching) return <p>Memuat...</p>;

  // Tampilan utama (tidak ada perubahan)
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Status Pengajuan Kelas Saya</h1>
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-8 rounded-r-lg" role="alert">
        <p className="font-bold">Informasi Penting</p>
        <p className="mt-2">Setelah pengajuan dikirim, kelas yang Anda ajukan akan kami kaji. Selanjutnya, diskusi akan dilanjutkan via WhatsApp.</p>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {proposals.length === 0 ? (
        <p className="text-gray-500">Anda belum memiliki pengajuan kelas aktif.</p>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <div key={String(p._id)} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="font-bold text-gray-800">{p.namaKelas}</h2>
                <p className="text-sm text-gray-500">Terakhir diupdate: {new Date(p.updatedAt).toLocaleDateString('id-ID')}</p>
              </div>
              <div className="flex items-center space-x-2">
                <StatusBadge status={p.status} />
                {p.status === 'rejected' && (
                  <>
                    <button onClick={() => handleEdit(String(p._id))} className="text-sm bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600">
                      Edit & Ajukan Ulang
                    </button>
                    <button onClick={() => handleDelete(String(p._id))} className="text-sm bg-gray-500 text-white py-1 px-3 rounded hover:bg-gray-600">
                      Hapus
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

