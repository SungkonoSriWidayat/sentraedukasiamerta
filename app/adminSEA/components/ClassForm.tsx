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
    deskripsi: '',
    tutorName: '',
    harga: '',
    jumlahPertemuan: '',
    waktuPerPertemuan: '',
    jadwal: '',
    adminStatus: 'kelas belum siap' as 'kelas belum siap' | 'kelas siap' | 'kelas terlalu banyak siswa',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        nama: initialData.nama || '',
        deskripsi: initialData.deskripsi || '',
        tutorName: initialData.tutorName || '',
        harga: initialData.harga?.toString() || '',
        jumlahPertemuan: initialData.jumlahPertemuan?.toString() || '',
        waktuPerPertemuan: initialData.waktuPerPertemuan?.toString() || '',
        jadwal: initialData.jadwal || '',
        adminStatus: initialData.adminStatus || 'kelas belum siap', // Default tetap 'kelas belum siap'
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

    // Konversi data numerik dari string ke number sebelum dikirim
    const dataToSend = {
      ...formData,
      harga: formData.harga ? Number(formData.harga) : 0,
      jumlahPertemuan: formData.jumlahPertemuan ? Number(formData.jumlahPertemuan) : 0,
      waktuPerPertemuan: formData.waktuPerPertemuan ? Number(formData.waktuPerPertemuan) : undefined,
      // adminStatus tetap 'kelas belum siap' sebagai default
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menyimpan data.');
      }

      onSave();
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Input Nama */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Nama Kelas *</label>
            <input 
              type="text" 
              value={formData.nama} 
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })} 
              className="w-full px-3 py-2 border rounded" 
              required 
            />
          </div>

          {/* Input Tutor Name */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Nama Tutor *</label>
            <input 
              type="text" 
              value={formData.tutorName} 
              onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })} 
              className="w-full px-3 py-2 border rounded" 
              required 
            />
          </div>

          {/* Input Harga */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Harga</label>
            <input 
              type="number" 
              value={formData.harga} 
              onChange={(e) => setFormData({ ...formData, harga: e.target.value })} 
              className="w-full px-3 py-2 border rounded" 
              min="0"
              step="1000"
              placeholder="0"
            />
          </div>

          {/* Input Jumlah Pertemuan */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Jumlah Pertemuan *</label>
            <input 
              type="number" 
              value={formData.jumlahPertemuan} 
              onChange={(e) => setFormData({ ...formData, jumlahPertemuan: e.target.value })} 
              className="w-full px-3 py-2 border rounded" 
              required 
              min="1"
            />
          </div>

          {/* Input Waktu Per Pertemuan */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Waktu Per Pertemuan (menit)</label>
            <input 
              type="number" 
              value={formData.waktuPerPertemuan} 
              onChange={(e) => setFormData({ ...formData, waktuPerPertemuan: e.target.value })} 
              className="w-full px-3 py-2 border rounded" 
              min="0"
              placeholder="60"
            />
          </div>

          {/* Input Jadwal */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Jadwal</label>
            <input 
              type="text" 
              value={formData.jadwal} 
              onChange={(e) => setFormData({ ...formData, jadwal: e.target.value })} 
              className="w-full px-3 py-2 border rounded" 
              placeholder="Contoh: Senin & Rabu, 19:00-20:30"
            />
          </div>

          {/* Input Deskripsi */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Deskripsi</label>
            <textarea 
              value={formData.deskripsi} 
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} 
              className="w-full px-3 py-2 border rounded" 
              rows={4} 
              placeholder="Deskripsi lengkap tentang kelas..."
            />
          </div>

          {/* Input Admin Status - Hanya untuk edit, hidden untuk tambah baru */}
          {initialData && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Status Admin</label>
              <select 
                value={formData.adminStatus} 
                onChange={(e) => setFormData({ ...formData, adminStatus: e.target.value as any })} 
                className="w-full px-3 py-2 border rounded"
              >
                <option value="kelas belum siap">Kelas Belum Siap</option>
                <option value="kelas siap">Kelas Siap</option>
                <option value="kelas terlalu banyak siswa">Kelas Terlalu Banyak Siswa</option>
              </select>
            </div>
          )}
          
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <div className="flex justify-end space-x-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-yellow-300"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}