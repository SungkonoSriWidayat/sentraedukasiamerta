'use client';

import React from 'react';
import { IEnrolledStudent } from '@/app/components/lib/types';
import { RefreshCwIcon } from './Icons';

interface SiswaTerdaftarPanelProps {
  students: IEnrolledStudent[];
  isLoading: boolean;
  onRefresh: () => void;
  onStartChat: (student: IEnrolledStudent) => void;
}

// Komponen ini menampilkan daftar siswa, status absensi, dan pesan terakhir.
export default function SiswaTerdaftarPanel({ students, isLoading, onRefresh, onStartChat }: SiswaTerdaftarPanelProps) {
  
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Hadir': return 'bg-green-100 text-green-800';
      case 'Aktif': return 'bg-blue-100 text-blue-800';
      case 'MenungguKonfirmasi': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Siswa Terdaftar ({students?.length || 0})</h2>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          title="Cek Status Absensi Terbaru"
        >
          <RefreshCwIcon className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto">
        {isLoading && <p className="text-center text-sm text-gray-500">Memuat status absensi...</p>}
        {!isLoading && students && students.length > 0 ? (
          students.map(student => (
            <div key={student._id} className="border-b last:border-b-0 py-2 flex justify-between items-start">
              <div className="flex-grow pr-2">
                <p className="font-medium text-gray-900">{student.namaLengkap}</p>
                {student.attendanceStatus ? (
                  <div className="mt-1">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusChip(student.attendanceStatus)}`}>
                      {student.attendanceStatus}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1">
                    <span className="text-xs text-gray-500 italic">Pilih materi untuk melihat status</span>
                  </div>
                )}
                <textarea
                  readOnly
                  value={student.lastMessage || ''}
                  className="mt-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md w-full p-1 resize-none h-12"
                  rows={2}
                  placeholder="Belum ada percakapan"
                />
              </div>
              <button 
                onClick={() => onStartChat(student)} 
                className="bg-teal-100 text-teal-800 text-xs font-semibold py-1 px-3 rounded-full hover:bg-teal-200 flex-shrink-0 mt-1"
              >
                Chat
              </button>
            </div>
          ))
        ) : (
          !isLoading && <p className="text-sm text-gray-500">Belum ada siswa yang terdaftar.</p>
        )}
      </div>
    </div>
  );
}
