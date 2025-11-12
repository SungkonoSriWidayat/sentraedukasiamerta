'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import apiClient from '@/lib/apiClient';

// --- TAMBAHAN: Interface untuk mendeskripsikan respons API ---
interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted. Attempting to log in...");
    setError('');
    setIsLoading(true);

    try {
      // PERBAIKAN: Beri tahu apiClient tipe data yang diharapkan
      const response = await apiClient.post<LoginResponse>('/login', {
        nomorWhatsapp,
        password,
      });
      
      const data = response.data;

      // Sekarang TypeScript tahu 'data' memiliki properti .success
      if (data.success && data.token) {
        login(data.token);
        const decoded: { role: string } = jwtDecode(data.token);
        if (decoded.role === 'admin') {
            router.push('/adminSEA');
        } else {
            router.push('/dashboard');
        }
      } else {
        setError(data.message || 'Login gagal!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tidak bisa terhubung atau kredensial salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Link href="/">
              <Image 
                  src="/logo.png" 
                  alt="Logo"
                  width={100}
                  height={100}
                  priority
              />
              <h1 className="text-center text-sm text-gray-600">Halaman Utama</h1>
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Login Siswa</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Nomor WhatsApp</label>
            <input
              type="tel"
              value={nomorWhatsapp}
              onChange={(e) => setNomorWhatsapp(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg pr-10"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></> : <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></>}
                </svg>
              </button>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          <button type="submit" disabled={isLoading} className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:bg-yellow-300">
            {isLoading ? 'Memproses...' : 'Login'}
          </button>
          <p className="text-center text-sm text-gray-600 mt-4">
            Anda seorang tutor? <Link href="/tutordaftar/login" className="text-green-600 hover:underline">Login sebagai tutor</Link>
          </p>
          <p className="text-center text-sm text-gray-600 mt-4">
            Belum punya akun? <Link href="/daftar" className="text-yellow-600 hover:underline">Daftar di sini</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

