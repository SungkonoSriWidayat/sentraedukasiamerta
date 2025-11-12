'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import TiptapEditor from '@/app/adminSEA/components/admin/TiptapEditor';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';

// --- Tipe Data ---
interface Question {
    id: number;
    tipeSoal: 'Pilihan Ganda' | 'Writing' | 'Listening' | 'Speaking';
    pertanyaan: string;
    pilihan: string[];
    jawabanBenar: string;
    audioSrc: string | null;
}
interface Section {
    id: number;
    tipeSesi: 'Reading' | 'Writing' | 'Listening' | 'Speaking';
    judul: string;
    instruksi: string;
    passage: string;
    durasi: number;
    questions: Question[];
}
interface TestData {
    _id: string;
    judul: string;
    tipe: 'Pre-Test' | 'Post-Test';
    instructions: string;
    isEnglishTest: boolean;
    sections: Section[];
}
interface TutorTestApiResponse {
    success: boolean;
    data: TestData[];
}
interface UpdateApiResponse {
    message: string;
    success: boolean;
    data: TestData;
}

export default function EditSoalPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;
    const tipeTesFromUrl = params.tipeTes as string;
    const testTypeToFind = tipeTesFromUrl === 'pre-test' ? 'Pre-Test' : 'Post-Test';

    const { user, isLoading: isAuthLoading } = useAuth();
    
    const [testData, setTestData] = useState<TestData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const fetchAndSetTestData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get<TutorTestApiResponse>(`/tutor/tes?classId=${classId}`);
            if (response.data.success && response.data.data) {
                const testToEdit = response.data.data.find(t => t.tipe === testTypeToFind);
                if (testToEdit) {
                    const testWithFrontendIds = {
                        ...testToEdit,
                        sections: (testToEdit.sections || []).map((section: any, idx: number) => ({
                            ...section,
                            id: Date.now() + idx + Math.random(),
                            questions: (section.questions || []).map((q: any, qIdx: number) => ({ ...q, id: Date.now() + qIdx + Math.random() }))
                        }))
                    };
                    setTestData(testWithFrontendIds);
                } else {
                    toast.error(`${testTypeToFind} tidak ditemukan untuk kelas ini.`);
                    setTestData(null);
                }
            }
        } catch (error) {
            console.error("Gagal memuat data tes:", error);
            toast.error("Gagal memuat data tes.");
        } finally {
            setIsLoading(false);
        }
    }, [classId, user, testTypeToFind]);

    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchAndSetTestData();
        } else if (!isAuthLoading && !user) {
            setIsLoading(false);
        }
    }, [isAuthLoading, user, fetchAndSetTestData]);

    // --- Semua Fungsi Handler Lengkap ---
    const handleInputChange = (path: (string | number)[], value: any) => {
        if (!testData) return;
        setTestData(prevData => {
            if (!prevData) return null;
            const newData = JSON.parse(JSON.stringify(prevData));
            let current: any = newData;
            path.slice(0, -1).forEach(key => { current = current[key]; });
            current[path[path.length - 1]] = value;
            return newData;
        });
    };
    
    const handleSectionChange = (sectionId: number, field: keyof Section, value: any) => {
        const sectionIndex = testData?.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1 || sectionIndex === undefined) return;
        handleInputChange(['sections', sectionIndex, field], value);
    };

    const handleQuestionChange = (sectionId: number, questionId: number, field: keyof Question, value: any, optionIndex?: number) => {
        const sectionIndex = testData?.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1 || sectionIndex === undefined) return;
        const questionIndex = testData?.sections[sectionIndex].questions.findIndex(q => q.id === questionId);
        if (questionIndex === -1 || questionIndex === undefined) return;

        if (field === 'pilihan' && value && optionIndex !== undefined && testData) {
            const newOptions = [...testData.sections[sectionIndex].questions[questionIndex].pilihan];
            newOptions[optionIndex] = value as string;
            handleInputChange(['sections', sectionIndex, 'questions', questionIndex, 'pilihan'], newOptions);
        } else {
            handleInputChange(['sections', sectionIndex, 'questions', questionIndex, field], value);
        }
    };
    
    const handleFileUpload = async (sectionId: number, questionId: number, file: File) => {
        if (!file) return;
        setIsUploading(true);
        const toastId = toast.loading('Mengunggah file audio...');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            handleQuestionChange(sectionId, questionId, 'audioSrc', (response as { data: { url: string } }).data.url);
            toast.success('File berhasil diunggah!', { id: toastId });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal mengunggah file.', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const addSection = () => {
        if (!testData) return;
        const newSection: Section = {
            id: Date.now(), tipeSesi: 'Reading', judul: `Sesi ${testData.sections.length + 1}`,
            instruksi: '', passage: '', durasi: 30, questions: []
        };
        setTestData(prev => prev ? ({ ...prev, sections: [...prev.sections, newSection] }) : null);
    };

    const addQuestion = (sectionId: number) => {
        if (!testData) return;
        const section = testData.sections.find(s => s.id === sectionId);
        if (!section || section.tipeSesi === 'Speaking') return;

        let defaultQuestionType: 'Pilihan Ganda' | 'Writing' = 'Pilihan Ganda';
        if (section.tipeSesi === 'Writing') defaultQuestionType = 'Writing';

        const newQuestion: Question = {
            id: Date.now(), tipeSoal: defaultQuestionType, pertanyaan: '',
            pilihan: defaultQuestionType === 'Pilihan Ganda' ? ['', '', '', ''] : [],
            jawabanBenar: '', audioSrc: null,
        };
        const sectionIndex = testData.sections.findIndex(s => s.id === sectionId);
        const updatedSections = [...testData.sections];
        updatedSections[sectionIndex].questions.push(newQuestion);
        setTestData({ ...testData, sections: updatedSections });
    };

    const deleteSection = (sectionId: number) => {
        if (!testData) return;
        setTestData(prev => prev ? ({ ...prev, sections: prev.sections.filter(s => s.id !== sectionId) }) : null);
    };

    const deleteQuestion = (sectionId: number, questionId: number) => {
        if (!testData) return;
        const sectionIndex = testData.sections.findIndex(s => s.id === sectionId);
        const updatedSections = [...testData.sections];
        updatedSections[sectionIndex].questions = updatedSections[sectionIndex].questions.filter(q => q.id !== questionId);
        setTestData({ ...testData, sections: updatedSections });
    };

    const handleUpdateTest = async () => {
        if (!testData) return;
        
        const cleanedData = {
            ...testData,
            sections: testData.sections.map(({ id, questions, ...restSection }) => ({
                ...restSection,
                questions: questions.map(({ id, ...restQuestion }) => restQuestion)
            }))
        };

        const promise = async (): Promise<UpdateApiResponse> => {
            const response = await apiClient.put(`/tutor/tes/${testData._id}`, cleanedData);
            return response.data  as UpdateApiResponse;
        };

        toast.promise(promise(), {
            loading: 'Memperbarui tes...',
            success: (res: UpdateApiResponse) => {
                router.push(`/tutordaftar/kelas-saya/${classId}/buat-soal`);
                return res.message;
            },
            error: (err) => err.response?.data?.message || 'Gagal memperbarui tes.'
        });
    };

    if (isLoading || isAuthLoading) return <div className="p-8 text-center text-lg">Memuat data tes...</div>;
    if (!testData) return <div className="p-8 text-center">Tes tidak ditemukan. <Link href={`/tutordaftar/kelas-saya/${classId}/buat-soal`} className="text-blue-600">Kembali</Link></div>;

    return (
        <>
            <Toaster position="top-center" reverseOrder={false} />
            <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
                <Link href={`/tutordaftar/kelas-saya/${classId}/buat-soal`} className="text-indigo-600 hover:text-indigo-900 mb-6 inline-block">
                    &larr; Kembali ke Manajemen Soal
                </Link>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Edit {testData.tipe}</h1>
                    <button onClick={handleUpdateTest} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">Simpan Perubahan</button>
                </div>
                
                <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
                    <div>
                        <label className="font-semibold">Judul Tes</label>
                        <input type="text" value={testData.judul} onChange={(e) => handleInputChange(['judul'], e.target.value)} className="w-full border rounded p-2 mt-1"/>
                    </div>
                    <div>
                        <label className="font-semibold">Tipe Tes</label>
                        <select className="w-full border rounded p-2 mt-1 bg-gray-100 cursor-not-allowed" value={testData.tipe} disabled>
                            <option value="Pre-Test">Pre-Test</option>
                            <option value="Post-Test">Post-Test</option>
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold mb-2 block">Instruksi Umum Tes</label>
                        <TiptapEditor content={testData.instructions} onChange={(newContent) => handleInputChange(['instructions'], newContent)} />
                    </div>
                </div>
                <div className="my-6">
                    <button onClick={addSection} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">+ Tambah Sesi</button>
                </div>
                {testData.sections.map((section, sectionIndex) => (
                    <div key={section.id} className="border-2 border-gray-200 p-6 rounded-lg bg-white mb-6 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Sesi {sectionIndex + 1}</h2>
                            <button onClick={() => deleteSection(section.id)} className="font-semibold text-red-500 hover:text-red-700">Hapus Sesi</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                             <select value={section.tipeSesi} onChange={(e) => handleSectionChange(section.id, 'tipeSesi', e.target.value as Section['tipeSesi'])} className="w-full p-2 border rounded-md bg-white">
                                {testData.isEnglishTest ? (
                                    <>
                                        <option value="Reading">Reading (Teks & Pilihan Ganda)</option>
                                        <option value="Listening">Listening (Audio & Pilihan Ganda)</option>
                                        <option value="Speaking">Speaking (Wawancara)</option>
                                        <option value="Writing">Writing (Esai)</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Reading">Soal Pilihan Ganda</option>
                                        <option value="Writing">Soal Esai</option>
                                    </>
                                )}
                            </select>
                            <input type="text" value={section.judul} onChange={(e) => handleSectionChange(section.id, 'judul', e.target.value)} placeholder="Judul Sesi" className="w-full p-2 border rounded-md"/>
                            <input type="number" value={section.durasi} onChange={(e) => handleSectionChange(section.id, 'durasi', Number(e.target.value))} placeholder="Durasi (menit)" className="w-full p-2 border rounded-md"/>
                        </div>
                        <textarea value={section.instruksi} onChange={(e) => handleSectionChange(section.id, 'instruksi', e.target.value)} placeholder="Instruksi untuk sesi ini..." className="w-full p-2 border rounded-md mb-4" rows={2}></textarea>
                        {section.tipeSesi === 'Reading' && <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-2">{testData.isEnglishTest ? 'Teks Bacaan (Passage)' : 'Teks Bacaan / Stimulus (Opsional)'}</label><TiptapEditor content={section.passage} onChange={(newContent) => handleSectionChange(section.id, 'passage', newContent)} /></div>}
                        {section.tipeSesi === 'Speaking' && <input type="url" value={section.passage} onChange={(e) => handleSectionChange(section.id, 'passage', e.target.value)} placeholder="Masukkan link Google Meet/Zoom..." className="w-full p-2 border rounded-md mb-6"/>}
                        <div className="space-y-6 border-t pt-6">
                            {section.questions.map((q, qIndex) => (
                                <div key={q.id} className="border p-4 rounded-lg bg-gray-50 relative">
                                    <div className='flex justify-between items-center'><h3 className="font-semibold mb-2">Pertanyaan {qIndex + 1}</h3><button onClick={() => deleteQuestion(section.id, q.id)} className="text-red-500 hover:text-red-700 font-semibold text-sm">Hapus</button></div>
                                    
                                    {section.tipeSesi === 'Listening' && (
                                        <div className="mb-4 p-3 bg-indigo-50 rounded-md">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">File Audio Pertanyaan</label>
                                            {q.audioSrc ? (
                                                <div>
                                                    <audio controls src={q.audioSrc} className="w-full mt-1"></audio>
                                                    <button onClick={() => handleQuestionChange(section.id, q.id, 'audioSrc', null)} className="text-xs text-red-500 hover:underline mt-1">
                                                        Ganti/Hapus Audio
                                                    </button>
                                                </div>
                                            ) : (
                                                <input 
                                                    type="file" 
                                                    accept="audio/*" 
                                                    disabled={isUploading} 
                                                    onChange={(e) => e.target.files && handleFileUpload(section.id, q.id, e.target.files[0])} 
                                                    className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                                                />
                                            )}
                                        </div>
                                    )}

                                    <textarea value={q.pertanyaan} onChange={(e) => handleQuestionChange(section.id, q.id, 'pertanyaan', e.target.value)} placeholder="Tulis teks pertanyaan..." className="w-full p-2 border rounded-md mb-3" rows={3}></textarea>
                                    
                                    {(section.tipeSesi === 'Reading' || (testData.isEnglishTest && section.tipeSesi === 'Listening')) && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{q.pilihan?.map((pilihan, optionIdx) => (<div key={optionIdx} className="flex items-center"><input type="radio" name={`jawabanBenar_${q.id}`} checked={q.jawabanBenar === pilihan} onChange={() => handleQuestionChange(section.id, q.id, 'jawabanBenar', pilihan)} className="mr-2 h-4 w-4"/><input type="text" value={pilihan} onChange={(e) => handleQuestionChange(section.id, q.id, 'pilihan', e.target.value, optionIdx)} placeholder={`Pilihan ${String.fromCharCode(65 + optionIdx)}`} className="w-full p-2 border rounded-md"/></div>))}</div>}
                                    {section.tipeSesi === 'Writing' && <p className="text-sm text-gray-500 p-2 bg-gray-100 rounded-md">Siswa akan menjawab pertanyaan ini dalam bentuk esai.</p>}
                                </div>
                            ))}
                        </div>
                        {section.tipeSesi !== 'Speaking' && <button onClick={() => addQuestion(section.id)} className="mt-6 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 text-sm">+ Tambah Pertanyaan ke Sesi Ini</button>}
                    </div>
                ))}
            </div>
        </>
    );
}

