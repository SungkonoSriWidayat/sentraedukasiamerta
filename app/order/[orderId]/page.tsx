'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image'; // <-- Impor Image untuk menampilkan QR
import toast from 'react-hot-toast'; // <-- Impor toast

// Interface (Tidak berubah)
interface OrderDetails {
  _id: string;
  studentId: { namaLengkap: string; nomorWhatsapp: string; };
  classId: { nama: string; jadwal: string; };
  tutorId: { namaLengkap: string; };
  status: string;
  createdAt: string;
  amount: number;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  // State Auth
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- State Baru untuk QRIS ---
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrError, setQrError] = useState('');

  // Hapus useEffect untuk Snap.js
  // Hapus handlePayClick (logika Snap)

  // Fetch data order (logika tidak berubah)
  useEffect(() => {
    if (orderId && !authLoading && token) {
      const fetchOrderDetails = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/order/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || 'Gagal memuat detail pesanan.');
          }
          setOrder(data.data);
          setError(null);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchOrderDetails();
    } else if (!authLoading && !token) {
      router.push('/login');
    }
  }, [orderId, token, authLoading, router]);


  // --- FUNGSI BARU: Untuk membuat QR Code ---
  // --- PERBAIKAN: Mengganti '=' menjadi '=>' ---
  const handleGenerateQris = async () => {
    if (!orderId || !token) {
      toast.error('Gagal memproses, token tidak ditemukan.');
      return;
    }

    setIsGeneratingQR(true);
    setQrError('');

    try {
      const res = await fetch(`/api/order/${orderId}/pay-qris`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal membuat kode QR.');
      }

      setQrCodeUrl(data.qrCodeUrl); // Simpan URL QR dari API
      toast.success('Kode QR berhasil dibuat. Silakan pindai.');

    } catch (err: any) {
      setQrError(err.message);
      toast.error(err.message);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Tampilan Loading & Error (Tidak berubah)
  if (authLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Memuat detail pesanan...</p></div>;
  }
  if (error) {
    return <div className="flex flex-col justify-center items-center min-h-screen text-center"><p className="text-red-500 mb-4">{error}</p><Link href="/login" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700">Kembali ke Halaman Login</Link></div>;
  }
  if (!order) {
    return <div className="text-center mt-10">Pesanan tidak ditemukan.</div>;
  }

  // --- RENDER HALAMAN ---
  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        
        {/* Header (Tidak berubah) */}
        <div className="bg-teal-500 p-6">
          <h1 className="text-3xl font-bold text-white">Detail Pesanan</h1>
          <p className="text-teal-100 mt-1">
            Order ID: {order._id} | Status: <span className="font-semibold uppercase">{order.status}</span>
          </p>
        </div>

        {/* Detail Order & Siswa (Tidak berubah) */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Kelas yang Dipesan</h2>
            <p className="text-2xl font-semibold text-teal-600">{order.classId?.nama}</p>
            <div><p className="font-semibold text-gray-700">Jadwal:</p><p>{order.classId?.jadwal}</p></div>
            <div><p className="font-semibold text-gray-700">Tutor:</p><p>{order.tutorId?.namaLengkap}</p></div>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Detail Pemesan</h2>
            <div><p className="font-semibold text-gray-700">Nama Siswa:</p><p>{order.studentId?.namaLengkap}</p></div>
            <div><p className="font-semibold text-gray-700">Nomor Whatsapp:</p><p>{order.studentId?.nomorWhatsapp}</p></div>
            <div><p className="font-semibold text-gray-700">Tanggal Pesan:</p><p>{new Date(order.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
          </div>
        </div>

        {/* --- BAGIAN PEMBAYARAN (DIUBAH TOTAL) --- */}
        <div className="p-6 sm:p-8 border-t bg-gray-50">
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md mb-6">
            <p className="font-bold">Total Tagihan</p>
            <p className="text-3xl">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.amount)}</p>
          </div>
          
          {/* Tampilkan QR jika status 'pending_payment' */}
          {order.status === 'pending_payment' && (
            <div className="mt-6">
              
              {/* Jika QR SUDAH ada */}
              {qrCodeUrl && (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Pindai Kode QRIS</h3>
                  <p className="text-sm text-gray-600 mb-4">Gunakan aplikasi e-wallet Anda (GoPay, OVO, Dana, dll.) untuk membayar.</p>
                  <div className="flex justify-center">
                    <Image src={qrCodeUrl} alt="Kode QRIS Pembayaran" width={300} height={300} />
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Kode ini akan kedaluwarsa. Segera lakukan pembayaran.</p>
                </div>
              )}

              {/* Jika QR BELUM ada (Tombol untuk Generate) */}
              {!qrCodeUrl && (
                 <div className="text-center">
                   <p className="text-gray-700 mb-4">Silakan selesaikan pembayaran Anda menggunakan QRIS.</p>
                   <button
                      onClick={handleGenerateQris}
                      disabled={isGeneratingQR}
                      className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-400"
                    >
                      {isGeneratingQR ? 'Membuat Kode QR...' : 'Bayar dengan QRIS'}
                    </button>
                    {qrError && <p className="text-red-500 text-sm mt-2">{qrError}</p>}
                 </div>
              )}
            </div>
          )}

          {/* Status selain pending_payment (Tidak berubah) */}
          {order.status === 'pending_verification' && (
            <div className="mt-6 text-center p-4 bg-yellow-100 rounded-lg">
              <p className="font-semibold text-yellow-800">Pembayaran sedang diverifikasi oleh sistem.</p>
            </div>
          )}

          {order.status === 'paid' && (
            <div className="mt-6 text-center p-4 bg-green-100 rounded-lg">
              <p className="font-semibold text-green-800">Pembayaran Lunas! Terima kasih.</p>
            </div>
          )}

          {order.status === 'failed' && (
             <div className="mt-6 text-center p-4 bg-red-100 rounded-lg">
              <p className="font-semibold text-red-800">Pembayaran Gagal atau Kedaluwarsa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

