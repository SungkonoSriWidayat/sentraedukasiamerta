'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaFileAlt, FaCheckCircle } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';

// --- Type Definitions (Lengkap) ---
interface TestTemplate {
  _id: string;
  judul: string;
  instructions: string;
}
interface ExistingTest {
    _id: string;
    tipe: 'Pre-Test' | 'Post-Test';
}
interface TemplateApiResponse {
    success: boolean;
    data: TestTemplate[];
}
interface TutorTestApiResponse {
    success: boolean;
    data: ExistingTest[];
}
// Tipe baru untuk respons sukses dari API 'from-template'
interface UseTemplateApiResponse {
    success: boolean;
    message: string;
    data: any; // data tes yang baru dibuat
}

export default function TemplateSoalPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;
    
    const { user, isLoading: isAuthLoading } = useAuth();

    const [templates, setTemplates] = useState<TestTemplate[]>([]);
    const [existingTests, setExistingTests] = useState<{ preTest: boolean, postTest: boolean }>({ preTest: false, postTest: false });
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [templateRes, existingTestRes] = await Promise.all([
                apiClient.get<TemplateApiResponse>('/admin/test-templates'),
                apiClient.get<TutorTestApiResponse>(`/tutor/tes?classId=${classId}`)
            ]);

            if (templateRes.data.success) setTemplates(templateRes.data.data);
            if (existingTestRes.data.success) {
                setExistingTests({
                    preTest: existingTestRes.data.data.some((test) => test.tipe === 'Pre-Test'),
                    postTest: existingTestRes.data.data.some((test) => test.tipe === 'Post-Test')
                });
            }
        } catch (error) {
            console.error("Gagal memuat data:", error);
            toast.error("Gagal memuat data dari server.");
        } finally {
            setIsLoading(false);
        }
    }, [classId]);
    
    useEffect(() => {
        if (!isAuthLoading && user && classId) {
            loadData();
        } else if (!isAuthLoading && !user) {
            setIsLoading(false);
        }
    }, [isAuthLoading, user, classId, loadData]);

    const handleUseTemplate = async (templateId: string, tipe: 'Pre-Test' | 'Post-Test') => {
        const promise = async (): Promise<UseTemplateApiResponse> => {
            // Terapkan tipe pada panggilan apiClient
            const response = await apiClient.post<UseTemplateApiResponse>('/tutor/tes/from-template', { 
                templateId, 
                classId, 
                tipe 
            });
            return response.data;
        };

        toast.promise(promise(), {
            loading: `Membuat ${tipe}...`,
            success: (data) => { // 'data' sekarang memiliki tipe 'UseTemplateApiResponse'
                router.push(`/tutordaftar/kelas-saya/${classId}`);
                return data.message || `Berhasil membuat ${tipe}.`;
            },
            error: (err) => err.response?.data?.message || `Gagal membuat ${tipe}.`
        });
    };

    if (isLoading || isAuthLoading) {
        return <div className="p-8 text-center text-lg">Memuat data...</div>;
    }

    return (
        <>
            <Toaster position="top-center" />
            <div className="p-4 md:p-8">
                <Link href={`/tutordaftar/kelas-saya/${classId}/buat-soal`} className="text-indigo-600 hover:text-indigo-900 mb-6 inline-block">
                    &larr; Kembali ke Manajemen Soal
                </Link>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Gunakan Template Soal</h1>
                <p className="text-gray-600 mb-8">Pilih template dari Admin untuk dijadikan Pre-Test atau Post-Test.</p>
                
                <div className="space-y-4">
                    {templates.length > 0 ? templates.map(template => (
                        <div key={template._id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-300">
                            <div className="flex flex-col md:flex-row justify-between md:items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <FaFileAlt className="text-gray-400"/>
                                        {template.judul}
                                    </h2>
                                    <div 
                                        className="prose prose-sm mt-2 text-gray-600 line-clamp-2"
                                        dangerouslySetInnerHTML={{ __html: template.instructions }} 
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                                    {existingTests.preTest ? (
                                        <button className="px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-200 rounded-md flex items-center gap-2 cursor-not-allowed" disabled>
                                            <FaCheckCircle /> Pre-Test Sudah Ada
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleUseTemplate(template._id, 'Pre-Test')}
                                            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            Jadikan Pre-Test
                                        </button>
                                    )}
                                    {existingTests.postTest ? (
                                        <button className="px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-200 rounded-md flex items-center gap-2 cursor-not-allowed" disabled>
                                            <FaCheckCircle /> Post-Test Sudah Ada
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleUseTemplate(template._id, 'Post-Test')}
                                            className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            Jadikan Post-Test
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
                            <p className="text-gray-500">Admin belum membuat template soal.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
