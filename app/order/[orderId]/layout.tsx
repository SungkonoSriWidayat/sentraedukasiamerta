'use client';

// Impor AuthProvider Anda
import { AuthProvider } from '@/app/context/AuthContext';
import { ReactNode } from 'react';

// Bungkus semua halaman di /order dengan AuthProvider
export default function OrderLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
