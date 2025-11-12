// app/adminSEA/components/ClassForm.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { IClass } from '@/models/Class';

interface ClassFormProps {
  initialData: IClass | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ClassForm({ initialData, onClose, onSave }: ClassFormProps) {
  const [formData, setFormData] = useState({
    nama: '',
    harga: '',
    jadwal: '',
    deskripsi: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        nama: initialData.nama,
        harga: initialData.harga,
        jadwal: initialData.jadwal,
        deskripsi: initialData.deskripsi,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Autentikasi gagal. Silakan login kembali.');
      setIsLoading(false);
      return;
    }

    const method = initialData ? 'PUT' : 'POST';
    const url = initialData ? `/api/classes/${initialData._id}` : '/api/classes';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menyimpan data.');
      }

      onSave(); // Memicu refresh data di halaman utama
      onClose(); // Menutup modal

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Input Nama */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Nama Kelas</label>
            <input type="text" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="w-full px-3 py-2 border rounded" required />
          </div>
          {/* Input Harga */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Harga</label>
            <input type="text" value={formData.harga} onChange={(e) => setFormData({ ...formData, harga: e.target.value })} className="w-full px-3 py-2 border rounded" required />
          </div>
          {/* Input Jadwal */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Jadwal</label>
            <input type="text" value={formData.jadwal} onChange={(e) => setFormData({ ...formData, jadwal: e.target.value })} className="w-full px-3 py-2 border rounded" required />
          </div>
          {/* Input Deskripsi */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Deskripsi</label>
            <textarea value={formData.deskripsi} onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} className="w-full px-3 py-2 border rounded" rows={4} required />
          </div>
          
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Batal</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-yellow-300">
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}