'use client'; // Komponen ini sekarang client-side untuk interaktivitas

import Link from 'next/link';
import { IClass } from '@/models/Class';

// Komponen Kartu Kelas Sederhana
const ClassCard = ({ kelas }: { kelas: IClass }) => {
    const formattedHarga = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(kelas.harga ?? 0);

    return (
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-bold text-gray-800 mb-2 flex-grow">{kelas.nama}</h3>
            <p className="text-2xl font-bold text-yellow-600 mb-4">{formattedHarga}</p>
            <p className="text-sm text-gray-500 mb-4">{kelas.jadwal}</p>
            <div className="mt-auto">
                <Link href={`/kelas/${kelas._id}`} className="block w-full text-center bg-yellow-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-yellow-600">
                    Lihat Detail
                </Link>
            </div>
        </div>
    );
};


// Komponen Grid Utama
interface ClassGridProps {
  classes: IClass[];
}

export default function ClassGrid({ classes }: ClassGridProps) {
  return (
    <section className="bg-gray-50 py-16 sm:py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-800">Program Kelas Unggulan</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Pilih program yang paling sesuai untuk meningkatkan keahlian dan pengetahuan Anda.</p>
        </div>
        
        {/* Menampilkan beberapa kelas unggulan (maksimal 3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.slice(0, 3).map((kelas) => (
            <ClassCard
              key={String(kelas._id)}
              kelas={kelas}
            />
          ))}
        </div>

        {/* Tombol "Lihat Semua Kelas" akan muncul jika total kelas lebih dari 3 */}
        {classes.length > 3 && (
            <div className="text-center mt-16">
                <Link href="/kelas" className="inline-block bg-teal-600 text-white font-bold py-3 px-10 rounded-lg hover:bg-teal-700 transition-colors text-lg">
                    Lihat Semua Kelas Lainnya
                </Link>
            </div>
        )}
      </div>
    </section>
  );
}
