'use client';

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import toast from 'react-hot-toast';

// --- Tipe Data (Tidak berubah) ---
interface IEnrolledStudent {
  _id: string;
  namaLengkap: string;
  nomorWhatsapp: string;
}
interface IAttendanceState {
  status: 'Terkunci' | 'Aktif' | 'Selesai';
  windowExpires?: string;
}
interface IMateri {
  _id?: string;
  judul?: string;
  deskripsi?: string;
  linkGoogleMeet?: string;
  linkVideo?: string;
  linkPdf?: string;
  absensi: IAttendanceState;
}
interface ITutor {
  _id: string;
  namaLengkap: string;
  nomorWhatsapp: string;
}
interface IClass {
  _id: string;
  nama: string;
  deskripsi?: string;
  jadwal?: string;
  jumlahPertemuan: number;
  materi: IMateri[];
  enrolledStudents: IEnrolledStudent[];
  tutorId: ITutor; 
  tutorName: string;
  adminStatus: 'kelas belum siap' | 'kelas siap' | 'kelas terlalu banyak siswa';
}

// --- TIPE BARU (DIPERBARUI SESUAI MODEL ANDA) ---
interface IStudentWithAttendance {
  _id: string;
  namaLengkap: string;
  // Status 'Izin' dan 'Sakit' dihapus, diganti 'Berlangsung'
  attendanceStatus: 'Hadir' | 'Berlangsung' | 'Belum Absen';
}
// --- AKHIR TIPE BARU ---

// --- Helper styling (DIPERBARUI) ---
const getStatusChip = (status: IStudentWithAttendance['attendanceStatus']) => {
  switch (status) {
    case 'Hadir':
      return 'bg-green-100 text-green-800';
    case 'Berlangsung': // <-- TAMBAHAN BARU
      return 'bg-blue-100 text-blue-800';
    default: // Belum Absen
      return 'bg-gray-100 text-gray-800';
  }
};
// --- AKHIR HELPER ---


export default function AdminClassDetailPage() {
  const params = useParams();
  const classId = params.classId as string;

  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [kelas, setKelas] = useState<IClass | null>(null);
  const [selectedMateriIndex, setSelectedMateriIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentStatus, setCurrentStatus] = useState<'kelas belum siap' | 'kelas siap' | 'kelas terlalu banyak siswa'>('kelas belum siap');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // --- STATE BARU UNTUK DAFTAR ABSENSI ---
  const [studentAttendanceList, setStudentAttendanceList] = useState<IStudentWithAttendance[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  // --- AKHIR STATE BARU ---

  // Auth Guard (Tidak berubah)
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/adminSEA/login');
      }
    }
  }, [authLoading, user, router]);

  // Fungsi Fetch Data Kelas (Tidak berubah)
  const fetchClassDetails = useCallback(async () => {
    if (!token) return; 
    try {
      const res = await fetch(`/api/admin/kelas/${classId}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Gagal memuat data.');
      
      const classData: IClass = data.data;

      const targetCount = classData.jumlahPertemuan || 0;
      let currentMateri = classData.materi || [];
      while (currentMateri.length < targetCount) {
        currentMateri.push({
          judul: `Materi ${currentMateri.length + 1}`,
          deskripsi: '',
          absensi: { status: 'Terkunci' },
        });
      }
      classData.materi = currentMateri.slice(0, targetCount);

      setKelas(classData);
      setCurrentStatus(classData.adminStatus || 'kelas belum siap');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false); 
    }
  }, [classId, token]);

  // Trigger Fetch Data Kelas (Tidak berubah)
  useEffect(() => {
    if (classId && !authLoading && user && token) {
      fetchClassDetails();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [classId, fetchClassDetails, authLoading, user, token]);

  // Fungsi Simpan Status (Tidak berubah)
  const handleStatusChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as 'kelas belum siap' | 'kelas siap' | 'kelas terlalu banyak siswa';
    setCurrentStatus(newStatus);
    setIsSavingStatus(true);

    const promise = fetch(`/api/admin/kelas/${classId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ adminStatus: newStatus })
    });

    toast.promise(
      promise.then(res => {
        if (!res.ok) throw new Error('Gagal menyimpan status.');
        return res.json();
      }),
      {
        loading: 'Menyimpan status...',
        success: 'Status berhasil diperbarui!',
        error: (err) => err.message || 'Gagal menyimpan.',
      }
    ).finally(() => {
      setIsSavingStatus(false);
      fetchClassDetails();
    });
  };

  // --- EFEK BARU: Ambil data absensi saat materi dipilih ---
  useEffect(() => {
    // Jangan fetch jika token atau classId belum siap
    if (!token || !classId) return;
    // Jangan fetch jika kelas (dan materi) belum dimuat
    if (!kelas) return; 

    const fetchAttendance = async () => {
      setIsLoadingAttendance(true);
      try {
        // API path sudah benar
        const res = await fetch(`/api/admin/kelas/${classId}/pertemuan/${selectedMateriIndex}/absensi`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setStudentAttendanceList(data.data);
        } else {
          toast.error('Gagal memuat data absensi siswa.');
        }
      } catch (err) {
        toast.error('Error memuat absensi.');
      } finally {
        setIsLoadingAttendance(false);
      }
    };

    fetchAttendance();
  // tambahkan 'kelas' sebagai dependensi
  }, [token, classId, selectedMateriIndex, kelas]); 
  // --- AKHIR EFEK BARU ---


  // --- Render Logic ---
  if (authLoading || loading) return <div className="p-8 text-center">Memuat...</div>;
  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center">Mengalihkan ke halaman login...</div>;
  }
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!kelas) return <div className="p-8 text-center">Kelas tidak ditemukan.</div>;

  const currentMateri = kelas.materi[selectedMateriIndex] || {};

  // Fungsi helper WA (Tidak berubah)
  const createWhatsAppLink = () => {
    if (!kelas.tutorId?.nomorWhatsapp) return '#';
    const nomorTutor = kelas.tutorId.nomorWhatsapp.replace(/[^0-9]/g, '');
    const pesan = `Halo, saya Admin. Saya ingin bertanya mengenai kelas "${kelas.nama}".`;
    return `https://wa.me/${nomorTutor}?text=${encodeURIComponent(pesan)}`;
  };

  return (
    <div className="p-4 md:p-8">
      <Link href="/adminSEA/manajemen-kelas" className="text-indigo-600 hover:text-indigo-900 mb-6 inline-block">&larr; Kembali</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel Kiri (Detail Materi) (Tidak berubah) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Detail Materi: {currentMateri.judul}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Judul Materi</label>
                <p className="mt-1 text-lg font-semibold text-gray-900">{currentMateri.judul || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                <p className="mt-1 text-base text-gray-700 prose prose-sm max-w-none">{currentMateri.deskripsi || 'Tidak ada deskripsi.'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Link Google Meet</label>
                {currentMateri.linkGoogleMeet ? (
                  <a href={currentMateri.linkGoogleMeet} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">{currentMateri.linkGoogleMeet}</a>
                ) : (
                  <p className="mt-1 text-base text-gray-700">-</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Embed URL Video</label>
                {currentMateri.linkVideo ? (
                   <a href={currentMateri.linkVideo} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">{currentMateri.linkVideo}</a>
                ) : (
                  <p className="mt-1 text-base text-gray-700">-</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">File PDF Materi</label>
                 {currentMateri.linkPdf ? (
                   <a href={currentMateri.linkPdf} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">{currentMateri.linkPdf}</a>
                ) : (
                  <p className="mt-1 text-base text-gray-700">Tidak ada PDF.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel Kanan (Navigasi) */}
        <div className="space-y-8">
          {/* Panel Kontrol (Tidak berubah) */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Status Kelas</h2>
            <select
              value={currentStatus}
              onChange={handleStatusChange}
              disabled={isSavingStatus}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mb-6 disabled:bg-gray-100"
            >
              <option value="kelas belum siap">Kelas Belum Siap</option>
              <option value="kelas siap">Kelas Siap</option>
              <option value="kelas terlalu banyak siswa">Kelas Terlalu Banyak Siswa</option>
            </select>

            <h2 className="text-xl font-semibold mb-4 mt-4">Daftar Materi</h2>
            <select
              value={selectedMateriIndex}
              onChange={(e) => setSelectedMateriIndex(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mb-6"
            >
              {kelas.materi.map((materi, index) => (
                <option key={materi._id || index} value={index}>
                  {materi.judul || `Materi ${index + 1}`}
                </option>
              ))}
            </select>
            
            {kelas.tutorId?.nomorWhatsapp ? (
              <a 
                href={createWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center block bg-green-600 text-white font-semibold py-3 px-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Hubungi Tutor ({kelas.tutorId.namaLengkap || kelas.tutorName})
              </a>
            ) : (
              <p className="text-xs text-center text-gray-500">Nomor WhatsApp tutor tidak terdaftar.</p>
            )}
          </div>

          {/* --- PANEL SISWA TERDAFTAR (DIPERBARUI) --- */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Judul tetap menggunakan data global */}
            <h2 className="text-xl font-semibold mb-4">Siswa Terdaftar ({kelas.enrolledStudents?.length || 0})</h2>
            
            {/* Daftar sekarang menggunakan data absensi */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {isLoadingAttendance ? (
                <p className="text-center text-sm text-gray-500">Memuat status absensi...</p>
              ) : studentAttendanceList.length > 0 ? (
                studentAttendanceList.map(student => (
                  <div key={student._id} className="border-b pb-2">
                    <p className="font-medium text-gray-900">{student.namaLengkap}</p>
                    {/* Tampilkan status absensi (seperti referensi tutor) */}
                    <div className="mt-1">
                      {/* Fungsi getStatusChip sudah diperbarui */}
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusChip(student.attendanceStatus)}`}>
                        {student.attendanceStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Belum ada siswa yang terdaftar di kelas ini.</p>
              )}
            </div>
          </div>
          {/* --- AKHIR PERUBAHAN PANEL SISWA --- */}

        </div>
      </div>
    </div>
  );
}

