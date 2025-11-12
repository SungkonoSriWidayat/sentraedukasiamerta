'use client';

import { useState, useEffect, useCallback } from 'react';
import { IUser } from '@/models/User';

export default function ManajemenUserPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      // Panggil API yang sama, tapi dengan parameter role=user
      const res = await fetch('/api/admin/get-users?role=user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil data user.');
      
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId: string) => {
    if (confirm('Anda yakin ingin MENGHAPUS pengguna ini secara permanen?')) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`/api/admin/delete-tutor/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Gagal menghapus pengguna.');
        
        fetchUsers(); // Refresh daftar setelah hapus
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  // JSX di sini sama persis dengan halaman manajemen-tutor,
  // hanya ganti nama variabel dari 'tutors' menjadi 'users'.
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Manajemen User/Siswa</h1>
      {/* ... (Isi JSX sama seperti halaman manajemen tutor, ganti 'tutors' dengan 'users') ... */}
    </div>
  );
}
