'use client';

import { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function AjukanKelasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [formData, setFormData] = useState({
    namaKelas: '',
    deskripsi: '',
    jumlahPertemuan: '',
    waktuPerPertemuan: '90',
    harga: '',
    usulanHari: [] as string[],
    usulanJam: '16:00',
    usulanJamSelesai: '17:30', // <-- State BARU untuk jam selesai
    materi: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // useEffect untuk menyesuaikan jumlah input materi (tidak berubah)
  useEffect(() => {
    const pertemuanCount = parseInt(formData.jumlahPertemuan) || 0;
    setFormData(prev => ({
      ...prev,
      materi: Array.from({ length: pertemuanCount }, (_, i) => prev.materi[i] || '')
    }));
  }, [formData.jumlahPertemuan]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleHariChange = (day: string) => {
    setFormData(prevState => {
      const currentDays = prevState.usulanHari;
      if (currentDays.includes(day)) {
        return { ...prevState, usulanHari: currentDays.filter(d => d !== day) };
      } else {
        return { ...prevState, usulanHari: [...currentDays, day] };
      }
    });
  };

  const handleHargaChange = (e: ChangeEvent<HTMLInputElement>) => {
    // ... (Fungsi ini tidak berubah)
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numberValue = parseInt(rawValue, 10);
    if (isNaN(numberValue)) {
      setFormData(prevState => ({ ...prevState, harga: '' }));
      return;
    }
    const formattedValue = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numberValue);
    setFormData(prevState => ({ ...prevState, harga: formattedValue }));
  };

  const handleMateriChange = (index: number, value: string) => {
    // ... (Fungsi ini tidak berubah)
    const newMateri = [...formData.materi];
    newMateri[index] = value;
    setFormData(prevState => ({ ...prevState, materi: newMateri }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    try {
      // PERUBAHAN: Gabungkan jam mulai dan selesai menjadi satu string
      const hari = formData.usulanHari.join(', ');
      const jadwalLengkap = `${hari}, Pukul ${formData.usulanJam} - ${formData.usulanJamSelesai} WIB`;
      const hargaAngka = parseInt(formData.harga.replace(/[^0-9]/g, ''), 10);

      const body = {
        namaKelas: formData.namaKelas,
        deskripsi: formData.deskripsi,
        jumlahPertemuan: Number(formData.jumlahPertemuan),
        waktuPerPertemuan: `${formData.waktuPerPertemuan} Menit`,
        harga: hargaAngka,
        jadwal: jadwalLengkap,
        materi: formData.materi,
        ...(editId && { proposalId: editId })
      };

      const res = await fetch(editId ? '/api/tutor/resubmit-proposal' : '/api/tutor/propose-class', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      sessionStorage.setItem('successMessage', 'Kelas yang Anda ajukan akan kami kaji, lalu kami akan menghubungi Anda ke WhatsApp.');
      router.push('/tutordaftar');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
        {editId ? 'Edit & Ajukan Ulang Kelas' : 'Ajukan Pembuatan Kelas Baru'}
      </h1>
      
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-8 rounded-r-lg" role="alert">
        <p className="font-bold">Informasi Penting</p>
        <p>Kelas yang Anda buat di bawah naungan yayasan pendidikan Sentra Edukasi Amerta, dan otomatis sudah legal dan berkualitas. Dimohon isi semua kolom dengan benar.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ... Input Nama Kelas, Harga, Jumlah Pertemuan, Waktu Pertemuan ... */}
            <div>
                <label className="block text-gray-700 mb-2">Nama Kelas</label>
                <input type="text" name="namaKelas" value={formData.namaKelas} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
            </div>
            <div>
                <label className="block text-gray-700 mb-2">Harga Kelas</label>
                <input type="text" name="harga" value={formData.harga} onChange={handleHargaChange} placeholder="Contoh: Rp 500.000" className="w-full px-3 py-2 border rounded" required />
            </div>
            <div>
                <label className="block text-gray-700 mb-2">Jumlah Pertemuan</label>
                <input type="number" name="jumlahPertemuan" value={formData.jumlahPertemuan} onChange={handleChange} placeholder="Contoh: 8" className="w-full px-3 py-2 border rounded" required min="1" />
            </div>
            <div>
                <label className="block text-gray-700 mb-2">Waktu Setiap Pertemuan</label>
                <select name="waktuPerPertemuan" value={formData.waktuPerPertemuan} onChange={handleChange} className="w-full px-3 py-2 border rounded bg-white" required>
                    <option value="60">60 Menit</option>
                    <option value="90">90 Menit</option>
                    <option value="120">120 Menit</option>
                </select>
            </div>
            
            <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Usulan Hari</label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {daysOfWeek.map(day => (
                        <label key={day} className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.usulanHari.includes(day)}
                                onChange={() => handleHariChange(day)}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span>{day}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* ======================================= */}
            {/* ===    INPUT JAM MULAI & SELESAI    === */}
            {/* ======================================= */}
            <div>
                <label className="block text-gray-700 mb-2">Usulan Jam Mulai</label>
                <input type="time" name="usulanJam" value={formData.usulanJam} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
            </div>
            <div>
                <label className="block text-gray-700 mb-2">Usulan Jam Selesai</label>
                <input type="time" name="usulanJamSelesai" value={formData.usulanJamSelesai} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
            </div>
        </div>

        <div className="mt-6">
            <label className="block text-gray-700 mb-2">Deskripsi Singkat Kelas</label>
            <textarea name="deskripsi" value={formData.deskripsi} onChange={handleChange} className="w-full px-3 py-2 border rounded" rows={3} required></textarea>
        </div>

        {/* Bagian Materi Dinamis */}
        <div className="mt-6">
            <label className="block text-gray-700 mb-2">Rencana Materi per Pertemuan</label>
            {formData.materi.map((materi, index) => (
                <div key={index} className="mb-2">
                    <input
                        type="text"
                        placeholder={`Materi Pertemuan ${index + 1}`}
                        value={materi}
                        onChange={(e) => handleMateriChange(index, e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                    />
                </div>
            ))}
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        <div className="mt-6 text-right">
            <button type="submit" disabled={isLoading} className="bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-700 disabled:bg-teal-300">
                {isLoading ? 'Mengirim...' : (editId ? 'Kirim Ulang Pengajuan' : 'Kirim Pengajuan')}
            </button>
        </div>
      </form>
    </div>
  );
}
