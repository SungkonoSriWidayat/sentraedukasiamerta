'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FaPlus, FaEdit, FaFileAlt, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';
import toast, { Toaster } from 'react-hot-toast';

// --- Type Definitions ---
interface ITest {
    _id: string;
    tipe: 'Pre-Test' | 'Post-Test';
}
interface ApiResponse {
    success: boolean;
    data: ITest[];
}

// --- NavCard Component ---
const NavCard = ({ href, title, description, icon, color, disabled = false }: any) => {
  const content = (
    <div className={`p-6 rounded-lg shadow-md h-full border-l-4 ${color} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300'}`}>
      <div className="flex items-start">
        <div className="mr-4">{icon}</div>
        <div>
          <h2 className={`text-lg font-bold mb-1 ${disabled ? 'text-gray-500' : 'text-gray-800'}`}>{title}</h2>
          <p className={`${disabled ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{description}</p>
        </div>
      </div>
    </div>
  );
  return disabled ? <div>{content}</div> : <Link href={href}>{content}</Link>;
};

export default function BuatSoalHubPage() {
  const params = useParams();
  const classId = params.classId as string;
  const { user, isLoading: isAuthLoading } = useAuth();

  const [existingTests, setExistingTests] = useState<{ preTest: boolean, postTest: boolean }>({ preTest: false, postTest: false });
  const [isLoading, setIsLoading] = useState(true);

  const checkExistingTests = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse>(`/tutor/tes?classId=${classId}`);
      if (response.data.success && response.data.data) {
        setExistingTests({
          preTest: response.data.data.some((test: ITest) => test.tipe === 'Pre-Test'),
          postTest: response.data.data.some((test: ITest) => test.tipe === 'Post-Test')
        });
      }
    } catch (error) {
      console.error("Gagal memeriksa tes:", error);
      toast.error("Gagal memeriksa data tes yang ada.");
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (!isAuthLoading && user && classId) {
      checkExistingTests();
    } else if (!isAuthLoading && !user) {
        setIsLoading(false);
    }
  }, [isAuthLoading, user, classId, checkExistingTests]);

  const iconClass = "text-3xl text-white p-2 rounded-full";

  if (isAuthLoading || isLoading) {
    return <div className="p-8 text-center">Memeriksa data tes...</div>;
  }

  return (
    <>
      <Toaster />
      <div className="p-4 md:p-8">
        <Link href={`/tutordaftar/kelas-saya/${classId}`} className="text-blue-600 hover:underline mb-6 inline-block">
          &larr; Kembali ke Detail Kelas
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Manajemen Soal & Tes</h1>
        <p className="text-gray-600 mb-8">Pilih jenis tes yang ingin Anda buat, edit, atau kelola.</p>

        {/* Pre-Test Section */}
        <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Pre-Test</h2>
            {existingTests.preTest ? (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md flex items-center gap-3">
                  <FaExclamationCircle className="text-2xl" />
                  <div>
                    <p className="font-bold">Anda sudah memiliki soal Pre-Test untuk kelas ini.</p>
                    <p>Silakan gunakan tombol "Edit Soal Pre-Test" untuk mengubahnya.</p>
                  </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NavCard href={`/tutordaftar/kelas-saya/${classId}/buat-soal/pre-test-non-english`} title="Buat Pre-Test (Non-B.Inggris)" description="Untuk kelas umum (pilihan ganda/esai)." icon={<FaPlus className={`${iconClass} bg-blue-500`} />} color="border-blue-500" />
                  <NavCard href={`/tutordaftar/kelas-saya/${classId}/buat-soal/pre-test-english`} title="Buat Pre-Test (B.Inggris)" description="Dengan format sesi TOEFL (Reading, Listening, dll)." icon={<FaPlus className={`${iconClass} bg-cyan-500`} />} color="border-cyan-500" />
              </div>
            )}
            <div className="mt-4">
               <NavCard href={`/tutordaftar/kelas-saya/${classId}/edit-soal/pre-test`} title="Edit Soal Pre-Test" description="Lihat & modifikasi soal Pre-Test yang sudah ada." icon={<FaEdit className={`${iconClass} bg-green-500`} />} color="border-green-500" disabled={!existingTests.preTest} />
            </div>
        </div>
        
        <hr className="my-12"/>

        {/* Post-Test Section */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Post-Test</h2>
          {existingTests.postTest ? (
             <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md flex items-center gap-3">
                <FaExclamationCircle className="text-2xl" />
                <div>
                  <p className="font-bold">Anda sudah memiliki soal Post-Test untuk kelas ini.</p>
                  <p>Silakan gunakan tombol "Edit Soal Post-Test" untuk mengubahnya.</p>
                </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <NavCard href={`/tutordaftar/kelas-saya/${classId}/buat-soal/post-test-non-english`} title="Buat Post-Test (Non-B.Inggris)" description="Untuk kelas umum (pilihan ganda/esai)." icon={<FaPlus className={`${iconClass} bg-purple-500`} />} color="border-purple-500" />
               <NavCard href={`/tutordaftar/kelas-saya/${classId}/buat-soal/post-test-english`} title="Buat Post-Test (B.Inggris)" description="Dengan format sesi TOEFL (Reading, Listening, dll)." icon={<FaPlus className={`${iconClass} bg-orange-500`} />} color="border-orange-500" />
            </div>
          )}
           <div className="mt-4">
             <NavCard href={`/tutordaftar/kelas-saya/${classId}/edit-soal/post-test`} title="Edit Soal Post-Test" description="Lihat & modifikasi soal Post-Test yang sudah ada." icon={<FaEdit className={`${iconClass} bg-red-500`} />} color="border-red-500" disabled={!existingTests.postTest} />
          </div>
        </div>

        <hr className="my-12"/>

        {/* Template Section */}
         <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Template</h2>
           <NavCard href={`/tutordaftar/kelas-saya/${classId}/template-soal`} title="Gunakan Template Soal" description="Gunakan template dari Admin untuk membuat tes dengan cepat." icon={<FaFileAlt className={`${iconClass} bg-gray-500`} />} color="border-gray-500" />
        </div>
      </div>
    </>
  );
}