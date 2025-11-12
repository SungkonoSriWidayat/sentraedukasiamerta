'use client';

import Link from 'next/link';
import { FaPlus, FaEdit, FaBook } from 'react-icons/fa'; // Using react-icons for nice icons

export default function ManajemenMateriHubPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manajemen Materi & Tes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Card 1: Buat Template Tes */}
        <Link href="/adminSEA/manajemen-materi/buat">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex items-center">
            <FaPlus className="text-4xl text-white bg-blue-500 p-2 rounded-full mr-4" />
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Buat Template Tes</h2>
              <p className="text-gray-500">Rancang template ujian baru dari awal.</p>
            </div>
          </div>
        </Link>

        {/* Card 2: Edit Template Tes */}
        <Link href="/adminSEA/manajemen-materi/edit">
           <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex items-center">
            <FaEdit className="text-4xl text-white bg-green-500 p-2 rounded-full mr-4" />
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Edit Template Tes</h2>
              <p className="text-gray-500">Lihat & modifikasi template yang sudah ada.</p>
            </div>
          </div>
        </Link>

        {/* Card 3: Materi Kelas (Placeholder) */}
        <Link href="/adminSEA/manajemen-materi/materi-kelas">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex items-center">
          <FaBook className="text-4xl text-white bg-purple-500 p-2 rounded-full mr-4" />
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Bank Materi Kelas</h2>
            <p className="text-gray-500">Ambil & salin materi dari Google Drive.</p>
          </div>
        </div>
        </Link>

      </div>
    </div>
  );
}