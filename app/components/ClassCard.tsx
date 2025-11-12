'use client';

import { IClass } from '@/models/Class'; // Pastikan path import ini benar
import Link from 'next/link';

// Definisikan props yang diterima, pastikan harga adalah number
interface ClassCardProps {
  kelas: IClass;
}

export default function ClassCard({ kelas }: ClassCardProps) {
  // Format angka harga menjadi format mata uang Rupiah
  const formattedHarga = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0, // Menghilangkan ,00 di akhir
  }).format(kelas.harga ?? 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <h3 className="text-xl font-bold text-gray-800 mb-2 flex-grow">{kelas.nama}</h3>
      
      {/* Tampilkan harga yang sudah diformat */}
      <p className="text-2xl font-bold text-yellow-600 mb-4">{formattedHarga}</p>
      
      <p className="text-sm text-gray-500 mb-4">{kelas.jadwal}</p>

      <div className="mt-auto">
        {/* Tombol ini akan mengarah ke halaman detail kelas */}
        <Link href={"daftar"} className="block w-full text-center bg-yellow-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-yellow-600">
          Lihat Detail
        </Link>
      </div>
    </div>
  );
}
