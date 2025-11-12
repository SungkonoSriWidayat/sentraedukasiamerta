'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Definisikan tipe data untuk order
interface Order {
  _id: string;
  studentId: { namaLengkap: string };
  classId: { nama: string };
  amount: number;
  status: string;
  createdAt: string;
  paymentProofUrl?: string; // Tambahkan properti ini
}

export default function ManajemenOrderAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      } else {
        throw new Error(data.message || 'Gagal memuat data.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApprove = async (orderId: string) => {
    setActionLoading(orderId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/order/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Siswa berhasil disetujui!');
      fetchOrders(); // Muat ulang data
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Apakah Anda yakin ingin menghapus order ini?')) return;
    setActionLoading(orderId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/order/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Order berhasil dihapus.');
      setOrders(orders.filter(o => o._id !== orderId)); // Hapus dari UI
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <p>Memuat data order...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manajemen Order</h1>

      {/* Tampilan Tabel untuk Desktop (Hidden on Mobile) */}
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Siswa</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kelas</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{order.studentId?.namaLengkap || 'N/A'}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{order.classId?.nama || 'N/A'}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${order.status === 'pending_payment' ? 'text-yellow-900' : 'text-green-900'}`}>
                    <span aria-hidden className={`absolute inset-0 ${order.status === 'pending_payment' ? 'bg-yellow-200' : 'bg-green-200'} opacity-50 rounded-full`}></span>
                    <span className="relative">{order.status}</span>
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm space-x-2">
                    {order.status === 'pending_verification' && (
                        <button onClick={() => handleApprove(order._id)} disabled={actionLoading === order._id} className="text-green-600 hover:text-green-900 disabled:text-gray-400">
                            Setujui
                        </button>
                    )}
                    {order.paymentProofUrl && (
                        <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
                            Lihat Bukti
                        </a>
                    )}
                    {(order.status === 'rejected' || order.status === 'pending_payment') && (
                         <button onClick={() => handleDelete(order._id)} disabled={actionLoading === order._id} className="text-red-600 hover:text-red-900 disabled:text-gray-400">
                            Hapus
                        </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tampilan Kartu untuk Mobile */}
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
            <div className="mt-4 border-t pt-4 flex flex-wrap gap-2 items-center text-sm">
                {order.status === 'pending_verification' && (
                    <button onClick={() => handleApprove(order._id)} disabled={actionLoading === order._id} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400">
                        {actionLoading === order._id ? 'Memproses...' : 'Setujui'}
                    </button>
                )}
                {order.paymentProofUrl && (
                    <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                        Lihat Bukti
                    </a>
                )}
                {(order.status === 'rejected' || order.status === 'pending_payment') && (
                     <button onClick={() => handleDelete(order._id)} disabled={actionLoading === order._id} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:bg-gray-400">
                        Hapus
                    </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
