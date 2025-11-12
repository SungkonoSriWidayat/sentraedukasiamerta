'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function DaftarPage() {
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Pastikan ini memanggil API pendaftaran untuk user/siswa biasa
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namaLengkap, nomorWhatsapp, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Pendaftaran berhasil! Anda akan diarahkan ke halaman login.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || 'Pendaftaran gagal.');
      }
    } catch (err) {
      setError('Tidak bisa terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        {/* ======================================= */}
        {/* ===    LOGO & LINK BERANDA BARU     === */}
        {/* ======================================= */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image 
              src="/logo.png" 
              alt="Sentra Edukasi Amerta Logo"
              width={100}
              height={100}
              className="cursor-pointer"
            />
            <h1 className="text-center text-sm text-gray-600">Halaman Utama</h1>
          </Link>
        </div>
        {/* ======================================= */}
        <h1 className="text-2xl font-bold mb-6 text-center">Daftar Akun Siswa</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Nama Lengkap</label>
            <input type="text" value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Nomor WhatsApp</label>
            <input type="tel" value={nomorWhatsapp} onChange={(e) => setNomorWhatsapp(e.target.value)} placeholder="Contoh: 08123456789" className="w-full px-3 py-2 border rounded-lg" required />
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
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600"
              >
                {/* Ikon mata (SVG) */}
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4 text-center">{success}</p>}

          <button type="submit" disabled={isLoading} className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:bg-yellow-300">
            {isLoading ? 'Mendaftar...' : 'Daftar'}
          </button>
          <p className="text-center text-sm text-gray-600 mt-4">
            Sudah punya akun? <Link href="/login" className="text-yellow-600 hover:underline">Login di sini</Link>
          </p>

          <div className="mt-6 pt-4 border-t">
            <p className="text-center text-sm text-gray-600">
              Apakah Anda seorang pengajar?
              <Link href="/tutordaftar/daftar" className="ml-1 font-semibold text-teal-600 hover:underline">
                Daftar sebagai Tutor
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
