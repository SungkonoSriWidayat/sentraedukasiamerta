'use client';

import React from 'react';

// Tipe data untuk sesi yang diterima sebagai prop
interface Sesi {
    _id: string;
    tanggalSesi: string;
    className: string; // Menggunakan nama kelas yang diformat dari API
    materiTitle: string; // Menggunakan judul materi yang diformat dari API
}

interface JadwalProps {
    sesiList: Sesi[];
    isLoading: boolean;
    // Prop untuk menangani klik tombol refresh
    onRefresh: () => void;
}

export default function Jadwal({ sesiList, isLoading, onRefresh }: JadwalProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Header dengan tombol refresh */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Jadwal Pertemuan Anda</h2>
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait transition-colors text-sm"
                >
                    {isLoading ? 'Memuat...' : 'Cek Jadwal'}
                </button>
            </div>

            {/* Tabel untuk menampilkan jadwal */}
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas & Materi</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            // Menampilkan pesan loading jika sedang memuat
                            <tr>
                                <td colSpan={2} className="text-center py-4">
                                    Memuat jadwal...
                                </td>
                            </tr>
                        ) : sesiList && sesiList.length > 0 ? (
                            // Menampilkan daftar sesi jika ada
                            sesiList.map((sesi) => (
                                <tr key={sesi._id}>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <p className="font-semibold text-gray-900">{sesi.className}</p>
                                        <p className="text-sm text-gray-500">{sesi.materiTitle}</p>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(sesi.tanggalSesi).toLocaleString('id-ID', {
                                            dateStyle: 'full',
                                            timeStyle: 'short',
                                        })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            // Menampilkan pesan jika tidak ada jadwal
                            <tr>
                                <td colSpan={2} className="text-center py-4 text-gray-500">
                                    Anda belum memiliki jadwal pertemuan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}