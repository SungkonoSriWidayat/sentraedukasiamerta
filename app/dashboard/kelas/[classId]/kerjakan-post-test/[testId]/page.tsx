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
    message?: string;
}
interface SubmitApiResponse {
    success: boolean;
    message: string;
    data?: { score: number }; // Data skor bersifat opsional
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

export default function KerjakanPostTestPage() {
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
        
        // Menggunakan toast.promise untuk loading, success, dan error
        const rawPromise = apiClient.post<SubmitApiResponse>('/api/siswa/tes/submit', { 
            testId, 
            classId, 
            answers 
        });

        // Wrap the non-standard IPromise into a native Promise so toast.promise accepts it
        const promise = new Promise<any>((resolve, reject) => {
            (rawPromise as any).then(resolve).catch(reject);
        });
        
        toast.promise(promise, {
            loading: 'Mengumpulkan jawaban...',
            success: (res: any) => {
                router.push(`/dashboard/raport/${classId}`); 
                return res?.data?.message || 'Tes berhasil dikumpulkan!';
            },
            error: (err: any) => {
                setIsSubmitting(false); // Reset status submitting jika error
                return err?.response?.data?.message || 'Gagal mengumpulkan jawaban.';
            }
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
                const res = await apiClient.get<TestApiResponse>(`/api/siswa/tes/${testId}`);
                if (res.data.success) {
                    setTest(res.data.data);
                } else {
                    throw new Error(res.data.message || 'Gagal memuat data tes.');
                }
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
            {/* ... sisa kode JSX Anda (div, header, main, dll) tetap sama persis ... */}
        </>
    );
}