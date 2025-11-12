'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext'; // <-- 1. IMPORT FUNGSI AUTH

export default function AdminLoginPage() {
  const { login } = useAuth(); // <-- 2. Panggil hook untuk mendapatkan fungsi login
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // <-- Tambahkan isLoading state
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // Mulai loading

    try {
      // Memanggil API login khusus untuk admin
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomorWhatsapp, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // 3. PANGGIL FUNGSI LOGIN DARI CONTEXT
        // Ini akan menyimpan token sebagai 'authToken' dan memulai timer logout otomatis.
        login(data.token);
        
        // Arahkan ke dashboard admin setelah berhasil
        router.push('/adminSEA'); 
      } else {
        setError(data.message || 'Login gagal!');
      }
    } catch (err) {
      setError('Tidak bisa terhubung ke server.');
    } finally {
        setIsLoading(false); // Selesai loading
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="p-8 bg-gray-800 rounded-lg shadow-lg w-full max-w-sm border border-yellow-500">
        <h1 className="text-2xl font-bold mb-6 text-center text-yellow-400">Super Admin Login</h1>
        <form onSubmit={handleSubmit} className="text-white">
          <div className="mb-4">
            <label className="block mb-2">Username Admin</label>
            <input 
              type="text" 
              value={nomorWhatsapp} 
              onChange={(e) => setNomorWhatsapp(e.target.value)} 
              className="w-full px-3 py-2 border rounded-lg bg-gray-700 border-gray-600 focus:outline-none focus:ring-yellow-400" 
              required 
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2">Password Admin</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg bg-gray-700 border-gray-600 pr-10 focus:outline-none focus:ring-yellow-400" 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
              >
                {/* Ikon mata (contoh) */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></> : <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></>}
                </svg>
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
          <button 
            type="submit" 
            disabled={isLoading} // <-- Tambahkan disabled saat loading
            className="w-full bg-yellow-500 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-600 disabled:bg-yellow-800 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Memproses...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

