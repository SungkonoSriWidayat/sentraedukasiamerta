// app/adminSEA/classes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { IClass } from '@/models/Class';
import ClassForm from '../components/ClassForm';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<IClass | null>(null);

  const fetchClasses = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
        // Seharusnya ini sudah ditangani oleh layout, tapi sebagai pengaman tambahan
        return;
    }

    try {
        const res = await fetch('/api/classes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Gagal mengambil data kelas');
        
        const data = await res.json();
        if (data.success) {
            setClasses(data.data);
        }
    } catch (error) {
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleAdd = () => {
    setEditingClass(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cls: IClass) => {
    setEditingClass(cls);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kelas ini?')) {
      const token = localStorage.getItem('token');
      await fetch(`/api/classes/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchClasses(); // Refresh data setelah hapus
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manajemen Kelas</h1>
        <button onClick={handleAdd} className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
          + Tambah Kelas Baru
        </button>
      </div>

      {isLoading ? (
        <p>Loading data kelas...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold uppercase">Nama Kelas</th>
                <th className="px-5 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold uppercase">Harga</th>
                <th className="px-5 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold uppercase">Jadwal</th>
                <th className="px-5 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls._id as string}>
                  <td className="px-5 py-5 border-b text-sm">{cls.nama}</td>
                  <td className="px-5 py-5 border-b text-sm">{cls.harga}</td>
                  <td className="px-5 py-5 border-b text-sm">{cls.jadwal}</td>
                  <td className="px-5 py-5 border-b text-sm">
                    <button onClick={() => handleEdit(cls)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => handleDelete(String(cls._id))} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <ClassForm
          initialData={editingClass}
          onClose={() => setIsModalOpen(false)}
          onSave={fetchClasses}
        />
      )}
    </div>
  );
}