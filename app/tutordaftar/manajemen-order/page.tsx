'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext'; // <-- 1. IMPORT HOOK useAuth
import apiClient from '@/lib/apiClient'; // <-- 2. IMPORT apiClient

// Interface untuk Order (sudah benar, kita pertahankan)
interface Order {
  _id: string;
  studentId: { namaLengkap: string };
  classId: { nama: string };
  amount: number;
  status: string;
  createdAt: string;
}

// Interface untuk struktur respons API orders
interface ApiResponse {
  success: boolean;
  data: Order[];
  message?: string;
}

export default function ManajemenOrderTutor() {
  // Ambil status otentikasi dari Context
  const { user, isLoading: isAuthLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  // Ganti nama 'loading' agar tidak bentrok dengan 'isAuthLoading'
  const [isFetchingOrders, setIsFetchingOrders] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 3. JANGAN AMBIL DATA JIKA:
    //    - AuthContext masih memverifikasi token (isAuthLoading)
    //    - Pengguna tidak login (!user)
    if (isAuthLoading || !user) {
      return;
    }

    const fetchOrders = async () => {
      try {
        // 4. GUNAKAN apiClient UNTUK MENGAMBIL DATA
        //    - Tidak perlu lagi mengambil token atau set header secara manual.
        //    - Error 401/403 akan otomatis ditangani oleh interceptor (redirect).
        const response = await apiClient.get<ApiResponse>('/api/tutor/orders');
        
        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          // Tangani jika 'success' bernilai false dari API
          throw new Error(response.data.message || 'Gagal memuat data order.');
        }
      } catch (err: any) {
        // Blok ini sekarang hanya akan menangani error selain 401/403 (misal: 500)
        if (err.response?.status !== 401 && err.response?.status !== 403) {
           setError(err.message);
        }
      } finally {
        setIsFetchingOrders(false);
      }
    };
    
    fetchOrders();
  }, [user, isAuthLoading]); // <-- 5. Tambahkan dependency agar effect berjalan saat status login berubah

  // Tampilkan loading screen saat AuthContext sedang bekerja
  if (isAuthLoading) return <p>Memverifikasi sesi Anda...</p>;
  
  // Jika sudah tidak loading tapi tidak ada user, berarti sesi tidak valid
  // Seharusnya sudah diredirect, tapi ini sebagai pengaman tambahan.
  if (!user) return null; 

  // Tampilkan loading screen saat data order sedang diambil
  if (isFetchingOrders) return <p>Memuat data order...</p>;
  
  // Tampilkan error jika ada masalah selain otentikasi
  if (error) return <p className="text-red-500">Error: {error}</p>;

  // Tampilan utama halaman Anda (tidak ada yang diubah di sini)
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manajemen Order</h1>
      <p className="text-gray-600 mb-4">Berikut adalah daftar pendaftaran untuk kelas yang Anda ajar.</p>
      
      {/* Tampilan Tabel untuk Desktop (Hidden on Mobile) */}
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Siswa</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kelas</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{order.studentId?.namaLengkap || 'N/A'}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{order.classId?.nama || 'N/A'}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${order.status === 'pending_payment' ? 'text-yellow-900' : 'text-green-900'}`}>
                    <span aria-hidden className={`absolute inset-0 ${order.status === 'pending_payment' ? 'bg-yellow-200' : 'bg-green-200'} opacity-50 rounded-full`}></span>
                    <span className="relative">{order.status}</span>
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <Link href={`/order/${order._id}`} className="text-indigo-600 hover:text-indigo-900">Detail</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tampilan Kartu untuk Mobile (Hidden on Desktop) */}
      <div className="md:hidden space-y-4">
        {orders.map(order => (
          <div key={order._id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-800">{order.classId?.nama || 'N/A'}</p>
                <p className="text-sm text-gray-600">{order.studentId?.namaLengkap || 'N/A'}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold leading-tight rounded-full ${order.status === 'pending_payment' ? 'bg-yellow-200 text-yellow-900' : 'bg-green-200 text-green-900'}`}>
                {order.status}
              </span>
            </div>
            <div className="mt-4 border-t pt-4 flex justify-between items-center text-sm">
              <p className="text-gray-500">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
              <Link href={`/order/${order._id}`} className="text-indigo-600 font-semibold hover:text-indigo-900">
                Lihat Detail
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
