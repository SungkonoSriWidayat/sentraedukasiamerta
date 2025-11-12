'use client';

// Pastikan path ke AuthContext Anda benar
import { AuthProvider } from '@/app/context/AuthContext'; 
import React from 'react';

export default function KelasLayout({ children }: { children: React.ReactNode }) {
  // Membungkus halaman di /kelas dengan AuthProvider
  // agar page.tsx bisa menggunakan useAuth()
  return <AuthProvider>{children}</AuthProvider>;
}

