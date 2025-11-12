'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';

// --- Tipe Data ---
interface IQuestion { _id: string; pertanyaan: string; pilihan: string[]; tipeSoal: string; passage?: string; audioSrc?: string; }
interface ISection { _id: string; judul: string; instruksi: string; passage?: string; durasi: number; questions: IQuestion[]; tipeSesi: string; }
interface ITest { _id: string; judul: string; instructions: string; sections: ISection[]; }
interface Answer { questionId: string; studentAnswer: string; }

// --- Tipe Data untuk Respons API ---
interface TestApiResponse {
    success: boolean;
    data: ITest;
}
interface SubmitApiResponse {
    success: boolean;
    message: string;
}

// --- Komponen Modal Konfirmasi ---
const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <p className="text-lg mb-4">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">Batal</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Yakin</button>
                </div>
            </div>
        </div>
    );
};

export default function KerjakanTesPage() {
    const params = useParams();
    const router = useRouter();
    const { classId, testId } = params;
    const { user, isLoading: isAuthLoading } = useAuth();

    const [test, setTest] = useState<ITest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSubmitTest = useCallback(async () => {
        setIsModalOpen(false);
        if (isSubmitting) return;

        setIsSubmitting(true);
        
        const promise = async (): Promise<SubmitApiResponse> => {
            const response = await apiClient.post<SubmitApiResponse>('/siswa/tes/submit', { testId, classId, answers });
            return response.data;
        };
        
        toast.promise(promise(), {
            loading: 'Mengumpulkan jawaban...',
            success: (res: SubmitApiResponse) => {
                router.push(`/dashboard/kelas/${classId}`); 
                return res.message;
            },
            error: (err: any) => err.response?.data?.message || 'Gagal mengumpulkan jawaban.'
        });

    }, [answers, classId, testId, router, isSubmitting]);

    const handleNextSection = useCallback(() => {
        if (test && currentSectionIndex < test.sections.length - 1) {
            setCurrentSectionIndex(prev => prev + 1);
        }
    }, [test, currentSectionIndex]);

    useEffect(() => {
        if (timeLeft <= 0 || !test || isSubmitting) return;

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerId);
                    toast.error("Waktu untuk sesi ini habis!", { duration: 4000 });
                    if (currentSectionIndex < test.sections.length - 1) {
                        handleNextSection();
                    } else {
                        handleSubmitTest();
                    }
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, test, handleSubmitTest, isSubmitting, currentSectionIndex, handleNextSection]);

    const handleSelectAnswer = (questionId: string, answer: string) => {
        setAnswers(prev => {
            const otherAnswers = prev.filter(a => a.questionId !== questionId);
            return [...otherAnswers, { questionId, studentAnswer: answer }];
        });
    };
    
    useEffect(() => {
        if (test) {
            setTimeLeft(test.sections[currentSectionIndex].durasi * 60);
        }
    }, [currentSectionIndex, test]);

    useEffect(() => {
        const fetchTest = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const res = await apiClient.get<TestApiResponse>(`/siswa/tes/${testId}`);
                setTest(res.data.data);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Gagal memuat tes.');
                router.back();
            } finally {
                setIsLoading(false);
            }
        };
        if (!isAuthLoading && user) {
            fetchTest();
        }
    }, [testId, router, user, isAuthLoading]);

    if (isLoading || isAuthLoading || !test) {
        return <div className="flex justify-center items-center h-screen">Memuat Tes...</div>;
    }

    const currentSection = test.sections[currentSectionIndex];
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <>
            <Toaster />
            <ConfirmationModal 
                isOpen={isModalOpen}
                message="Apakah Anda yakin ingin menyelesaikan dan mengumpulkan tes ini?"
                onConfirm={handleSubmitTest}
                onCancel={() => setIsModalOpen(false)}
            />
            <div className="bg-gray-100 min-h-screen flex flex-col">
                <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
                    <h1 className="text-xl font-bold">{test.judul} - {currentSection.judul}</h1>
                    <div className="bg-red-500 text-white font-bold text-lg px-4 py-2 rounded-md">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                </header>

                <main className="flex-grow container mx-auto p-4 md:p-8">
                    <div className="bg-white rounded-lg shadow-xl p-8 w-full">
                        <div className="prose max-w-none mb-8">
                            <h2 className="text-lg font-bold">Instruksi Sesi</h2>
                            <p>{currentSection.instruksi}</p>
                            {currentSection.passage && <div className="mt-4 border-t pt-4" dangerouslySetInnerHTML={{ __html: currentSection.passage }} />}
                        </div>
                        
                        <div className="space-y-6">
                            {currentSection.questions.map((q, index) => (
                                <div key={q._id} className="border-t pt-6">
                                    <p className="text-gray-600 mb-2 font-semibold">Pertanyaan {index + 1}</p>
                                    <div className="flex items-start gap-4">
                                        {q.audioSrc && <audio controls src={q.audioSrc} />}
                                        <p className="text-lg">{q.pertanyaan}</p>
                                    </div>
                                    
                                    {(q.tipeSoal === 'Pilihan Ganda' || q.tipeSoal === 'Listening') && (
                                        <div className="space-y-3 mt-4">
                                            {q.pilihan.map((pilihan, pIndex) => (
                                                <label key={pIndex} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
                                                    <input type="radio" name={`question_${q._id}`} value={pilihan} 
                                                        checked={answers.find(a => a.questionId === q._id)?.studentAnswer === pilihan}
                                                        onChange={() => handleSelectAnswer(q._id, pilihan)}
                                                        className="h-5 w-5 mr-3"
                                                    />
                                                    <span className="text-md">{pilihan}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {q.tipeSoal === 'Writing' && (
                                        <div className="mt-4">
                                            <textarea 
                                                rows={8}
                                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Tuliskan jawaban esai Anda di sini..."
                                                value={answers.find(a => a.questionId === q._id)?.studentAnswer || ''}
                                                onChange={(e) => handleSelectAnswer(q._id, e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 pt-6 border-t flex justify-end">
                            {currentSectionIndex === test.sections.length - 1 ? (
                                <button onClick={() => setIsModalOpen(true)} disabled={isSubmitting} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                                    Selesai & Kumpulkan
                                </button>
                            ) : (
                                <button onClick={handleNextSection} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700">
                                    Lanjut ke Sesi Berikutnya
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

