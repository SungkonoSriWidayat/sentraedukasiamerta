'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TutorDaftarPage() {
  // State untuk mengontrol status pendaftaran (dibuka/ditutup)
  const [registrationStatus, setRegistrationStatus] = useState<'loading' | 'open' | 'closed'>('loading');
  
  // State untuk data form
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // State untuk fungsionalitas UI
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false); 

  const router = useRouter();

  // Cek status pendaftaran saat halaman dimuat
  useEffect(() => {
    const checkStatus = async () => {
        try {
            const res = await fetch('/api/settings/registration-status');
            const data = await res.json();
            if (data.success) {
                setRegistrationStatus(data.data.isOpen ? 'open' : 'closed');
            } else {
                setRegistrationStatus('closed'); // Anggap tertutup jika ada error
            }
        } catch (error) {
            setRegistrationStatus('closed');
        }
    };
    checkStatus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!file) {
      setError('Mohon unggah file dokumen Anda.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('namaLengkap', namaLengkap);
    formData.append('nomorWhatsapp', nomorWhatsapp);
    formData.append('password', password);
    formData.append('file', file);

    try {
      const res = await fetch('/api/tutor-register', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.message || 'Pendaftaran gagal.');
      }
    } catch (err) {
      setError('Tidak bisa terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tampilan saat status sedang dicek
  if (registrationStatus === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Memuat...</div>;
  }

  // Tampilan jika pendaftaran ditutup
  if (registrationStatus === 'closed') {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md text-center">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Pendaftaran Ditutup</h1>
                <p className="text-gray-600 mb-6">
                    Mohon maaf, pendaftaran tutor kami tutup sementara karena masih terlalu banyak pendaftar dalam antrian verifikasi. Silakan coba lagi di lain waktu.
                </p>
                {/* Tombol Hubungi Admin BARU */}
                <a
                    href="https://wa.me/6282281289818?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20mengenai%20pendaftaran%20tutor."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                    Hubungi Admin via WhatsApp
                </a>
                <button
                    onClick={() => router.push('/')}
                    className="mt-2 w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                    Kembali ke Halaman Utama
                </button>
            </div>
        </div>
    );
  }

  // Tampilan setelah pendaftaran berhasil
  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-teal-700">Pendaftaran Berhasil Dikirim!</h1>
          <p className="text-gray-700 mb-6">
            Terima kasih telah mendaftar.
          </p>
          <div className="bg-blue-100 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg relative text-left" role="alert">
            <strong className="font-bold block">Informasi Penting:</strong>
            <span className="block mt-1">
              Untuk Anda calon tutor dari Yayasan Pendidikan Sentra Edukasi Amerta, pendaftaran Anda sedang kami verifikasi. **Untuk saat ini Anda belum bisa Login.** Tunggu kami verifikasi dan hubungi via WhatsApp.
            </span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="mt-8 w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Kembali ke Halaman Utama
          </button>
        </div>
      </div>
    );
  }

  // Tampilan form pendaftaran jika dibuka
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 py-12">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-teal-700">Daftar Sebagai Tutor</h1>
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
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Unggah Dokumen (CV/Sertifikat)</label>
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
              accept=".pdf,.png,.jpg,.jpeg"
              required 
            />
            <p className="text-xs text-gray-500 mt-1">Tipe file: PDF, PNG, JPG. Maks: 5MB.</p>
          </div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 disabled:bg-teal-300">
            {isLoading ? 'Mengirim...' : 'Daftar'}
          </button>
          <p className="text-center text-sm text-gray-600 mt-4">
            Sudah punya akun tutor? <Link href="/tutordaftar/login" className="text-teal-600 hover:underline">Login di sini</Link>
          </p>
          {/* Link Hubungi Admin BARU */}
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-gray-600">
                Ada pertanyaan? 
                <a 
                    href="https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20mengenai%20pendaftaran%20tutor."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 font-semibold text-green-600 hover:underline"
                >
                    Hubungi Admin
                </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
