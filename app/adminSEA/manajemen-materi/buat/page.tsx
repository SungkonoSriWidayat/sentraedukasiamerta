'use client';

import { useState } from 'react';
import AudioUploader from '@/app/adminSEA/components/admin/AudioUploader';
import TiptapEditor from '@/app/adminSEA/components/admin/TiptapEditor';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

// --- Type Definitions ---
interface Question {
  id: number;
  tipeSoal: 'Pilihan Ganda' | 'Listening' | 'Speaking' | 'Writing';
  pertanyaan: string;
  audioSrc: string | null;
  pilihan: string[];
  jawabanBenar: string;
}

interface Section {
  id: number;
  tipeSesi: 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  judul: string;
  instruksi: string;
  durasi: number;
  questions: Question[];
  passage: string;
}

interface TestTemplateData {
  judul: string;
  tipe: 'Pre-Test' | 'Post-Test';
  instructions: string;
  isEnglishTest: boolean;
  sections: Section[];
}

export default function ManajemenMateriPage() {
    const [template, setTemplate] = useState<TestTemplateData>({
        judul: '',
        tipe: 'Pre-Test',
        instructions: '',
        isEnglishTest: false,
        sections: [],
    });

    // --- State Management Functions ---

    const handleInputChange = (path: (string | number)[], value: any) => {
        setTemplate(prevTemplate => {
            const newTemplate = JSON.parse(JSON.stringify(prevTemplate));
            let current: any = newTemplate;
            path.slice(0, -1).forEach(key => {
                current = current[key];
            });
            current[path[path.length - 1]] = value;
            return newTemplate;
        });
    };

    const handleQuestionChange = (sectionIndex: number, questionIndex: number, field: keyof Question, value: any) => {
        handleInputChange(['sections', sectionIndex, 'questions', questionIndex, field], value);
    };

    const handleOptionChange = (sectionIndex: number, questionIndex: number, optionIndex: number, value: string) => {
        const newOptions = [...template.sections[sectionIndex].questions[questionIndex].pilihan];
        newOptions[optionIndex] = value;
        handleQuestionChange(sectionIndex, questionIndex, 'pilihan', newOptions);
    };

    const handleAnswerChange = (sectionIndex: number, questionIndex: number, value: string) => {
        handleQuestionChange(sectionIndex, questionIndex, 'jawabanBenar', value);
    };

    const handleAudioDelete = async (sectionIndex: number, questionIndex: number, url: string) => {
        if (!url) return;
        const promise = fetch('/api/admin/delete-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        }).then(res => {
            if (!res.ok) throw new Error('Gagal menghapus file dari storage.');
            return res.json();
        });
        toast.promise(promise, {
            loading: 'Menghapus file audio...',
            success: 'File berhasil dihapus!',
            error: (err) => err.message,
        });
        try {
            await promise;
            handleInputChange(['sections', sectionIndex, 'questions', questionIndex, 'audioSrc'], null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAudioUploaded = (sectionIndex: number, questionIndex: number, url: string) => {
        handleQuestionChange(sectionIndex, questionIndex, 'audioSrc', url);
    };

    const addSection = () => {
        const newSection: Section = {
            id: Date.now(),
            tipeSesi: 'Reading',
            judul: `Sesi ${template.sections.length + 1}`,
            instruksi: '',
            durasi: 10,
            questions: [],
            passage: '',
        };
        setTemplate(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
    };

    const addQuestion = (sectionIndex: number) => {
        const newQuestion: Question = {
            id: Date.now(),
            tipeSoal: 'Pilihan Ganda',
            pertanyaan: '',
            audioSrc: null,
            pilihan: ['', '', '', ''],
            jawabanBenar: '',
        };
        const updatedSections = [...template.sections];
        updatedSections[sectionIndex].questions.push(newQuestion);
        setTemplate({ ...template, sections: updatedSections });
    };

    const deleteSection = (sectionId: number) => {
        setTemplate(prev => ({
            ...prev,
            sections: prev.sections.filter(section => section.id !== sectionId)
        }));
    };
    
    const deleteQuestion = (sectionIndex: number, questionId: number) => {
        const updatedSections = [...template.sections];
        updatedSections[sectionIndex].questions = updatedSections[sectionIndex].questions.filter(q => q.id !== questionId);
        setTemplate({ ...template, sections: updatedSections });
    };

    const handleSaveTemplate = async () => {
        if (!template.judul.trim()) {
            return toast.error('Judul Template wajib diisi.');
        }
        if (template.sections.length === 0) {
            return toast.error('Template harus memiliki setidaknya satu sesi.');
        }
        for (const section of template.sections) {
            if (!section.judul.trim()) {
                return toast.error(`Judul Sesi di "${section.tipeSesi}" wajib diisi.`);
            }
            if (!section.instruksi.trim()) {
                return toast.error(`Instruksi di Sesi "${section.judul}" wajib diisi.`);
            }
            for (const question of section.questions) {
                if (!question.pertanyaan.trim()) {
                    return toast.error(`Teks Pertanyaan di Sesi "${section.judul}" wajib diisi.`);
                }
            }
        }

        const cleanedTemplate = {
            ...template,
            sections: template.sections.map(section => {
                const { id, ...restSection } = section;
                return {
                    ...restSection,
                    questions: section.questions.map(question => {
                        const { id, ...restQuestion } = question;
                        return restQuestion;
                    })
                };
            })
        };

        const token = localStorage.getItem('token');
        if (!token) {
            return toast.error('Anda harus login untuk menyimpan template.');
        }

        const promise = fetch('/api/admin/test-templates', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(cleanedTemplate),
        }).then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.message || 'Gagal menyimpan template.') });
            }
            return res.json();
        });

        toast.promise(promise, {
            loading: 'Menyimpan template ke database...',
            success: (result) => result.message || 'Template berhasil disimpan!',
            error: (err) => err.message,
        });
    };

    return (
        <>
            <Toaster position="top-center" reverseOrder={false} />
            <div className="p-8">
                 {/* Back button */}
                <Link href="/adminSEA/manajemen-materi" className="text-blue-600 hover:underline mb-6 inline-block">
                    &larr; Kembali ke Manajemen Materi
                </Link>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Buat Template Tes Baru</h1>
                    <button onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Simpan Template
                    </button>
                </div>
                <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
                    <div>
                        <label className="font-semibold">Judul Template</label>
                        <input type="text" className="w-full border rounded p-2 mt-1" placeholder="cth: Ujian TOEFL Prediction 1" value={template.judul} onChange={(e) => handleInputChange(['judul'], e.target.value)} />
                    </div>
                    <div>
                        <label className="font-semibold">Tipe Tes</label>
                        <select className="w-full border rounded p-2 mt-1" value={template.tipe} onChange={(e) => handleInputChange(['tipe'], e.target.value as TestTemplateData['tipe'])}>
                            <option value="Pre-Test">Pre-Test</option>
                            <option value="Post-Test">Post-Test</option>
                        </select>
                    </div>

                    <div className="flex items-center p-3 bg-blue-50 rounded-md border border-blue-200">
                        <input
                            id="isEnglishTest"
                            type="checkbox"
                            checked={template.isEnglishTest}
                            onChange={(e) => handleInputChange(['isEnglishTest'], e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="isEnglishTest" className="ml-3 block text-sm font-medium text-gray-900">
                            Tandai sebagai Template Tes Bahasa Inggris
                            <span className="block text-xs text-gray-500">Aktifkan jika template ini memiliki sesi Listening/Speaking.</span>
                        </label>
                    </div>

                    <div>
                        <label className="font-semibold mb-2 block">Instruksi Umum Tes</label>
                        <TiptapEditor content={template.instructions} onChange={(newContent) => handleInputChange(['instructions'], newContent)} />
                    </div>
                </div>
                <div className="my-6">
                    <button onClick={addSection} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        + Tambah Sesi
                    </button>
                </div>

                {template.sections.map((section, sectionIndex) => (
                    <div key={section.id} className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-indigo-500 relative">
                        <button 
                            onClick={() => deleteSection(section.id)}
                            className="absolute top-4 right-4 text-red-500 hover:text-red-700 font-bold transition-colors"
                        >
                            Hapus Sesi
                        </button>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Sesi {sectionIndex + 1}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="font-semibold">Judul Sesi</label>
                                <input type="text" className="w-full border rounded p-2 mt-1" value={section.judul} onChange={(e) => handleInputChange(['sections', sectionIndex, 'judul'], e.target.value)} />
                            </div>
                            <div>
                                <label className="font-semibold">Tipe Sesi</label>
                                <select className="w-full border rounded p-2 mt-1" value={section.tipeSesi} onChange={(e) => handleInputChange(['sections', sectionIndex, 'tipeSesi'], e.target.value as Section['tipeSesi'])}>
                                    <option>Reading</option><option>Listening</option><option>Speaking</option><option>Writing</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* --- INPUT INSTRUKSI SESI YANG HILANG (DITAMBAHKAN KEMBALI) --- */}
                        <div className="mb-4">
                            <label className="font-semibold">Instruksi Sesi</label>
                            <textarea
                                className="w-full border rounded p-2 mt-1"
                                rows={2}
                                placeholder="Tuliskan instruksi spesifik untuk sesi ini..."
                                value={section.instruksi}
                                onChange={(e) => handleInputChange(['sections', sectionIndex, 'instruksi'], e.target.value)}
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="font-semibold">Durasi</label>
                            <div className="flex items-center gap-2">
                                <input type="number" className="w-full border rounded p-2 mt-1" value={section.durasi} onChange={(e) => handleInputChange(['sections', sectionIndex, 'durasi'], Number(e.target.value))} />
                                <span className="text-gray-600 mt-1">(menit)</span>
                            </div>
                        </div>
                        {section.tipeSesi === 'Speaking' && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 my-4" role="alert">
                                <p className="font-bold">Informasi Sesi Speaking</p>
                                <p>Tes untuk sesi Speaking akan dilakukan secara langsung saat sesi tatap muka atau video conference.</p>
                            </div>
                        )}
                        {section.tipeSesi === 'Reading' && (
                            <div className="mb-6">
                                <label className="font-semibold mb-2 block">Teks Bacaan (Reading Passage)</label>
                                <TiptapEditor
                                    content={section.passage}
                                    onChange={(newContent) => handleInputChange(['sections', sectionIndex, 'passage'], newContent)}
                                />
                            </div>
                        )}
                        
                        {section.questions.map((question, questionIndex) => (
                            <div key={question.id} className="border-t pt-4 mt-4 space-y-2 relative">
                                <button
                                    onClick={() => deleteQuestion(sectionIndex, question.id)}
                                    className="absolute top-4 right-0 text-sm text-red-500 hover:text-red-700 font-semibold"
                                >
                                    Hapus Pertanyaan
                                </button>
                                
                                <h3 className="font-bold">Pertanyaan {questionIndex + 1}</h3>
                                <div>
                                    <label className="font-semibold">Tipe Soal</label>
                                    <select 
                                        value={question.tipeSoal} 
                                        className="w-full border rounded p-2 mt-1"
                                        onChange={(e) => handleQuestionChange(sectionIndex, questionIndex, 'tipeSoal', e.target.value as Question['tipeSoal'])}
                                    >
                                        <option>Pilihan Ganda</option>
                                        <option>Listening</option>
                                        <option>Speaking</option>
                                        <option>Writing</option>
                                    </select>
                                </div>
                                {question.tipeSoal === 'Listening' && (
                                   <div className="my-4 p-4 bg-blue-50 rounded-lg">
                                        {question.audioSrc ? (
                                            <div>
                                                <p className="text-sm font-medium text-green-700">Audio sudah ter-upload:</p>
                                                <audio controls src={question.audioSrc} className="w-full mt-2"></audio>
                                                <button onClick={() => handleAudioDelete(sectionIndex, questionIndex, question.audioSrc!)} className="text-sm text-red-500 hover:underline mt-2">
                                                    Ganti/Hapus Audio
                                                </button>
                                            </div>
                                        ) : (
                                            <AudioUploader onUploadComplete={(url) => handleAudioUploaded(sectionIndex, questionIndex, url)} />
                                        )}
                                    </div>
                                )}
                                <div>
                                    <label className="font-semibold">Teks Pertanyaan</label>
                                    <textarea 
                                        className="w-full border rounded p-2 mt-1" 
                                        rows={3} 
                                        value={question.pertanyaan}
                                        onChange={(e) => handleQuestionChange(sectionIndex, questionIndex, 'pertanyaan', e.target.value)}
                                    ></textarea>
                                </div>
                                
                                {(question.tipeSoal === 'Pilihan Ganda' || question.tipeSoal === 'Listening') && (
                                    <div className="mt-4 space-y-3">
                                        <label className="font-semibold">Pilihan Jawaban</label>
                                        {question.pilihan.map((option, optionIndex) => (
                                            <div key={optionIndex} className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name={`jawabanBenar_${question.id}`}
                                                    checked={question.jawabanBenar === option}
                                                    onChange={() => handleAnswerChange(sectionIndex, questionIndex, option)}
                                                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder={`Pilihan ${String.fromCharCode(65 + optionIndex)}`}
                                                    value={option}
                                                    onChange={(e) => handleOptionChange(sectionIndex, questionIndex, optionIndex, e.target.value)}
                                                    className="w-full border rounded p-2"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={() => addQuestion(sectionIndex)} className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">
                            + Tambah Pertanyaan
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
}