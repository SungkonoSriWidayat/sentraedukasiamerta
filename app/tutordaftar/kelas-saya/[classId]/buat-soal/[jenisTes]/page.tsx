'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import TiptapEditor from '@/app/adminSEA/components/admin/TiptapEditor';

// --- Tipe Data ---
type QuestionType = 'Pilihan Ganda' | 'Writing';
type SectionType = 'Reading' | 'Writing' | 'Listening' | 'Speaking';

interface Question {
    id: number;
    tipeSoal: QuestionType;
    pertanyaan: string;
    pilihan: string[];
    jawabanBenar: string;
    audioSrc: string | null;
}

interface Section {
    id: number;
    tipeSesi: SectionType;
    judul: string;
    instruksi: string;
    passage: string;
    durasi: number;
    questions: Question[];
}

interface TestData {
    judul: string;
    tipe: 'Pre-Test' | 'Post-Test';
    instructions: string;
    sections: Section[];
}

export default function BuatSoalDinamisPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;
    const jenisTes = params.jenisTes as string;

    const isEnglishTest = jenisTes ? !jenisTes.includes('non-english') : false;
    const tipeTesDariUrl = jenisTes && jenisTes.startsWith('pre-test') ? 'Pre-Test' : 'Post-Test';

    const [testData, setTestData] = useState<TestData>({
        judul: '',
        tipe: tipeTesDariUrl,
        instructions: '',
        sections: [],
    });
    const [isUploading, setIsUploading] = useState(false);

    // --- State Management Handlers ---
    const handleInputChange = (path: (string | number)[], value: any) => {
        setTestData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            let current: any = newData;
            path.slice(0, -1).forEach(key => {
                current = current[key];
            });
            current[path[path.length - 1]] = value;
            return newData;
        });
    };
    
    const handleSectionChange = (sectionId: number, field: keyof Section, value: any) => {
        const sectionIndex = testData.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;
        handleInputChange(['sections', sectionIndex, field], value);
    };

    const handleQuestionChange = (sectionId: number, questionId: number, field: keyof Question, value: any, optionIndex?: number) => {
        const sectionIndex = testData.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;
        const questionIndex = testData.sections[sectionIndex].questions.findIndex(q => q.id === questionId);
        if (questionIndex === -1) return;

        if (field === 'pilihan' && value && optionIndex !== undefined) {
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
            const token = localStorage.getItem('token');
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Gagal mengunggah file.");
            
            handleQuestionChange(sectionId, questionId, 'audioSrc', result.url);
            toast.success('File berhasil diunggah!', { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const addSection = () => {
        const newSection: Section = {
            id: Date.now(),
            tipeSesi: 'Reading',
            judul: `Sesi ${testData.sections.length + 1}`,
            instruksi: '',
            passage: '',
            durasi: 30,
            questions: []
        };
        setTestData(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
    };

    const addQuestion = (sectionId: number) => {
        const section = testData.sections.find(s => s.id === sectionId);
        if (!section || section.tipeSesi === 'Speaking') return;
        
        let defaultQuestionType: QuestionType = 'Pilihan Ganda';
        if (section.tipeSesi === 'Writing') {
            defaultQuestionType = 'Writing';
        }

        const newQuestion: Question = {
            id: Date.now(),
            tipeSoal: defaultQuestionType,
            pertanyaan: '',
            pilihan: defaultQuestionType === 'Pilihan Ganda' ? ['', '', '', ''] : [],
            jawabanBenar: '',
            audioSrc: null,
        };
        const sectionIndex = testData.sections.findIndex(s => s.id === sectionId);
        const updatedSections = [...testData.sections];
        updatedSections[sectionIndex].questions.push(newQuestion);
        setTestData({ ...testData, sections: updatedSections });
    };

    const deleteSection = (sectionId: number) => {
        setTestData(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== sectionId) }));
    };

    const deleteQuestion = (sectionId: number, questionId: number) => {
        const sectionIndex = testData.sections.findIndex(s => s.id === sectionId);
        const updatedSections = [...testData.sections];
        updatedSections[sectionIndex].questions = updatedSections[sectionIndex].questions.filter(q => q.id !== questionId);
        setTestData({ ...testData, sections: updatedSections });
    };

    const handleSaveTest = async () => {
        if (!testData.judul.trim()) return toast.error('Judul Tes harus diisi.');
        if (testData.sections.length === 0) return toast.error('Tes harus memiliki setidaknya satu sesi.');
        
        const testDataToSave = {
            classId,
            ...testData,
            isEnglishTest: isEnglishTest,
            sections: testData.sections.map(({ id, questions, ...restSection }) => ({
                ...restSection,
                questions: questions.map(({ id, ...restQuestion }) => restQuestion)
            }))
        };

        const promise = async () => {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tutor/tes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(testDataToSave)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            return result;
        };
        toast.promise(promise(), {
            loading: 'Menyimpan tes...',
            success: (result) => {
                router.push(`/tutordaftar/kelas-saya/${classId}`);
                return result.message;
            },
            error: (err) => err.message
        });
    };

    return (
        <>
            <Toaster position="top-center" reverseOrder={false} />
            <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
                <Link href={`/tutordaftar/kelas-saya/${classId}/buat-soal`} className="text-indigo-600 hover:text-indigo-900 mb-6 inline-block">
                    &larr; Kembali ke Pilihan Tes
                </Link>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Buat {tipeTesDariUrl} {isEnglishTest ? 'Bahasa Inggris' : 'Non-Bahasa Inggris'}</h1>
                    <button onClick={handleSaveTest} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">Simpan Seluruh Tes</button>
                </div>
                
                <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
                    <div>
                        <label className="font-semibold">Judul Tes</label>
                        <input type="text" value={testData.judul} onChange={(e) => handleInputChange(['judul'], e.target.value)} placeholder={`Contoh: ${tipeTesDariUrl} Bab 1`} className="w-full border rounded p-2 mt-1"/>
                    </div>
                    <div>
                        <label className="font-semibold">Tipe Tes</label>
                        <select className="w-full border rounded p-2 mt-1 bg-gray-100 cursor-not-allowed" value={testData.tipe} disabled>
                            <option value="Pre-Test">Pre-Test</option>
                            <option value="Post-Test">Post-Test</option>
                        </select>
                         <p className="text-xs text-gray-500 mt-1">Tipe tes ditentukan dari halaman sebelumnya.</p>
                    </div>
                    <div>
                        <label className="font-semibold mb-2 block">Instruksi Umum Tes</label>
                        <TiptapEditor content={testData.instructions} onChange={(newContent) => handleInputChange(['instructions'], newContent)} />
                    </div>
                </div>
                
                <div className="my-6">
                    <button onClick={addSection} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        + Tambah Sesi
                    </button>
                </div>
                
                {testData.sections.map((section, sectionIndex) => (
                    <div key={section.id} className="border-2 border-gray-200 p-6 rounded-lg bg-white mb-6 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Sesi {sectionIndex + 1}</h2>
                            <button onClick={() => deleteSection(section.id)} className="font-semibold text-red-500 hover:text-red-700">Hapus Sesi</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <select value={section.tipeSesi} onChange={(e) => handleSectionChange(section.id, 'tipeSesi', e.target.value as SectionType)} className="w-full p-2 border rounded-md bg-white">
                                {isEnglishTest ? (
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
                        
                        {section.tipeSesi === 'Reading' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">{isEnglishTest ? 'Teks Bacaan (Passage)' : 'Teks Bacaan / Stimulus (Opsional)'}</label>
                                <TiptapEditor content={section.passage} onChange={(newContent) => handleSectionChange(section.id, 'passage', newContent)} />
                            </div>
                        )}
                        
                        {section.tipeSesi === 'Speaking' && (
                            <input 
                                type="url" 
                                value={section.passage}
                                onChange={(e) => handleSectionChange(section.id, 'passage', e.target.value)}
                                placeholder="Masukkan link Google Meet/Zoom..." 
                                className="w-full p-2 border rounded-md mb-6"
                            />
                        )}
                        
                        <div className="space-y-6 border-t pt-6">
                            {section.questions.map((q, qIndex) => (
                                <div key={q.id} className="border p-4 rounded-lg bg-gray-50 relative">
                                    <div className='flex justify-between items-center'>
                                        <h3 className="font-semibold mb-2">Pertanyaan {qIndex + 1}</h3>
                                        <button onClick={() => deleteQuestion(section.id, q.id)} className="text-red-500 hover:text-red-700 font-semibold text-sm">Hapus</button>
                                    </div>
                                    
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
                                    
                                    {(section.tipeSesi === 'Reading' || (isEnglishTest && section.tipeSesi === 'Listening')) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {q.pilihan?.map((pilihan, optionIdx) => (
                                                <div key={optionIdx} className="flex items-center">
                                                    <input type="radio" name={`jawabanBenar_${q.id}`} checked={q.jawabanBenar === pilihan} onChange={() => handleQuestionChange(section.id, q.id, 'jawabanBenar', pilihan)} className="mr-2 h-4 w-4"/>
                                                    <input type="text" value={pilihan} onChange={(e) => handleQuestionChange(section.id, q.id, 'pilihan', e.target.value, optionIdx)} placeholder={`Pilihan ${String.fromCharCode(65 + optionIdx)}`} className="w-full p-2 border rounded-md"/>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {section.tipeSesi === 'Writing' && (
                                        <p className="text-sm text-gray-500 p-2 bg-gray-100 rounded-md">Siswa akan menjawab pertanyaan ini dalam bentuk esai.</p>
                                    )}
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