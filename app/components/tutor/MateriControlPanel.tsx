'use client';

import React from 'react';
import { IMateri } from '@/app/components/lib/types';

interface MateriControlPanelProps {
  materiList: IMateri[];
  selectedIndex: number;
  onSelectMateri: (index: number) => void;
  onSaveChanges: () => void;
  isSaving: boolean;
}

// Komponen ini berisi dropdown untuk memilih materi dan tombol untuk menyimpan semua perubahan.
export default function MateriControlPanel({ materiList, selectedIndex, onSelectMateri, onSaveChanges, isSaving }: MateriControlPanelProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Pilih Materi untuk Diedit</h2>
      <select
        value={selectedIndex}
        onChange={(e) => onSelectMateri(Number(e.target.value))}
        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mb-6"
      >
        {materiList.map((materi, index) => (
          <option key={materi._id || index} value={index}>
            Pertemuan {index + 1}
          </option>
        ))}
      </select>
      <button 
        onClick={onSaveChanges} 
        disabled={isSaving} 
        className="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 transition-colors"
      >
        {isSaving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
      </button>
    </div>
  );
}
