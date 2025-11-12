'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import useRouter
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';
import toast, { Toaster } from 'react-hot-toast';
import { FaArrowUp, FaCheckCircle, FaPen } from 'react-icons/fa';

// --- Tipe Data Lengkap ---
interface IAnswer { _id: string; questionId: string; studentAnswer: string; isCorrect?: boolean; score?: number; }
interface ISpeakingScores { fluency: number; grammar: number; pronunciation: number; diction: number; }
// --- PERUBAHAN DI SINI ---
interface ITestResult { _id: string; studentId: { _id: string; namaLengkap: string; }; answers: IAnswer[]; speakingScores?: ISpeakingScores; totalScore: number; status: 'Dikerjakan' | 'Dinilai'; }
interface IQuestion { _id: string; pertanyaan: string; tipeSoal: 'Pilihan Ganda' | 'Writing' | 'Listening' | 'Speaking'; }
interface ISection { _id: string; tipeSesi: 'Reading' | 'Writing' | 'Listening' | 'Speaking'; judul: string; questions: IQuestion[]; }
interface ITestDetails { _id: string; judul: string; sections: ISection[]; tipe: 'Pre-Test' | 'Post-Test'; maxScore?: number; }
interface ApiResponse { success: boolean; testDetails: ITestDetails | null; results: ITestResult[]; preTestResults?: ITestResult[]; }
interface ManualScores { [testResultId: string]: { scores?: { [answerId: string]: number }, speakingScores?: ISpeakingScores } }
interface GradeApiResponse { success: boolean; message: string; }


// Fungsi helper untuk menghitung N-gain dan menentukan Grade
// Logika ini sekarang ada di backend (lib/utils.ts), tapi kita simpan di sini
// untuk ditampilkan di frontend tutor.
const calculateNGain = (postTest: number, preTest: number | undefined | null, maxScore: number | undefined | null): { score: number | null; grade: string; category: string; color: string } => {
    if (maxScore === undefined || maxScore === null || preTest === undefined || preTest === null) {
        return { score: null, grade: 'N/A', category: 'Data Tidak Lengkap', color: 'gray' };
    }
    
    // Normalisasi skor
    const normalizedPreTest = maxScore > 0 ? (preTest / maxScore) : 0;
    const normalizedPostTest = maxScore > 0 ? (postTest / maxScore) : 0;
    const maxNormalizedScore = 1.0;

    if (normalizedPreTest === maxNormalizedScore) {
         const gain = (normalizedPostTest === maxNormalizedScore) ? 1.0 : 0.0;
         if (gain === 1.0) {
            return { score: 1, grade: 'A+', category: 'Mempertahankan Sempurna', color: 'emerald' };
         } else {
            return { score: 0, grade: 'D', category: 'Terjadi Penurunan', color: 'red' };
         }
    }
    if (maxNormalizedScore - normalizedPreTest === 0) {
        // Ini seharusnya sudah ditangani di atas, tapi sebagai pengaman
        return { score: null, grade: 'N/A', category: 'Skor Awal Maksimal', color: 'gray' };
    }

    const gain = (normalizedPostTest - normalizedPreTest) / (maxNormalizedScore - normalizedPreTest);

    if (gain > 0.7) {
        return { score: gain, grade: 'A', category: 'Peningkatan Tinggi', color: 'emerald' };
    } else if (gain >= 0.3) {
        return { score: gain, grade: 'B', category: 'Peningkatan Sedang', color: 'sky' };
    } else if (gain >= 0) {
        return { score: gain, grade: 'C', category: 'Peningkatan Rendah', color: 'amber' };
    } else {
        return { score: gain, grade: 'D', category: 'Terjadi Penurunan', color: 'red' };
    }
};


export default function HasilTesPage() {
    const params = useParams();
    const router = useRouter(); // Gunakan useRouter
    const classId = params.classId as string;
    const tipeTesSlug = params.tipeTes as string;
    const { user, isLoading: isAuthLoading } = useAuth();
    
    const [activeTab, setActiveTab] = useState('detail');
    const [testDetails, setTestDetails] = useState<ITestDetails | null>(null);
    const [testResults, setTestResults] = useState<ITestResult[]>([]);
    const [preTestResults, setPreTestResults] = useState<ITestResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [manualScores, setManualScores] = useState<ManualScores>({});

    const testTypeLabel = useMemo(() => tipeTesSlug === 'pre-test' ? 'Pre-Test' : 'Post-Test', [tipeTesSlug]);

    const loadTestResults = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get<ApiResponse>(`/tutor/hasil-tes?classId=${classId}&tipeTes=${testTypeLabel}`);
            if (response.data.success) {
                setTestDetails(response.data.testDetails);
                setTestResults(response.data.results);
                if (response.data.preTestResults) setPreTestResults(response.data.preTestResults);
            }
        } catch (error: any)
{
            toast.error(error.response?.data?.message || "Gagal memuat hasil tes.");
        } finally {
            setIsLoading(false);
        }
    }, [classId, user, testTypeLabel]);

    useEffect(() => {
        if (!isAuthLoading && user) {
            loadTestResults();
        } else if (!isAuthLoading && !user) {
            setIsLoading(false);
        }
    }, [isAuthLoading, user, loadTestResults]);

    const handleScoreChange = (resultId: string, answerId: string, score: number) => {
        setManualScores(prev => ({ ...prev, [resultId]: { ...prev[resultId], scores: { ...prev[resultId]?.scores, [answerId]: score } } }));
    };

    const handleSpeakingScoreChange = (resultId: string, field: keyof ISpeakingScores, score: number) => {
        setManualScores(prev => ({ ...prev, [resultId]: { ...prev[resultId], speakingScores: { fluency: 0, grammar: 0, pronunciation: 0, diction: 0, ...prev[resultId]?.speakingScores, [field]: score } } }));
    };

    const handleSaveGrading = async () => {
        const payload = Object.entries(manualScores).map(([testResultId, data]) => ({ testResultId, scores: data.scores ? Object.entries(data.scores).map(([answerId, score]) => ({ answerId, score })) : [], speakingScores: data.speakingScores }));
        if (payload.length === 0) return toast.error("Tidak ada perubahan nilai untuk disimpan.");

        const promise = async (): Promise<GradeApiResponse> => {
            const response = await apiClient.post<GradeApiResponse>('/tutor/hasil-tes/grade', payload);
            return response.data;
        };

        toast.promise(promise(), {
            loading: 'Menyimpan penilaian...',
            success: (res: GradeApiResponse) => {
                loadTestResults();
                setManualScores({});
                return res.message;
            },
            error: (err: any) => err.response?.data?.message || 'Gagal menyimpan penilaian.'
        });
    };

    const getUngradedWritingAnswers = (section: ISection) => {
        if (section.tipeSesi !== 'Writing') return [];
        const questionIds = section.questions.map(q => q._id.toString());
        return testResults.flatMap(result => 
            result.answers.filter(answer => 
                questionIds.includes(answer.questionId.toString()) && (answer.score === undefined || answer.score === null || answer.score === 0) // Cek null juga
            ).map(answer => ({ ...answer, student: result.studentId, resultId: result._id }))
        );
    };

    if (isLoading || isAuthLoading) return <div className="p-8 text-center">Memuat hasil tes...</div>;

    return (
        <>
            <Toaster position="top-center" />
            <div className="p-4 md:p-8">
                <Link href={`/tutordaftar/kelas-saya/${classId}`} className="text-indigo-600 hover:text-indigo-900 mb-6 inline-block">
                    &larr; Kembali ke Detail Kelas
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {testDetails ? `Hasil ${testDetails.judul}` : `Hasil Tes`}
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {testResults.length > 0 ? `${testResults.length} siswa telah mengerjakan tes ini.` : 'Tes ini belum dibuat atau belum ada siswa yang mengerjakan.'}
                        </p>
                    </div>
                    {/* --- TOMBOL NAVIGASI BARU --- */}
                    <div className="mt-4 sm:mt-0 flex items-center space-x-2 p-1 bg-gray-200 rounded-lg">
                        <button 
                            onClick={() => router.push(`/tutordaftar/kelas-saya/${classId}/hasil/pre-test`)} 
                            className={`w-full text-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${tipeTesSlug === 'pre-test' ? 'bg-white text-indigo-700 shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                        >
                            Pre-Test
                        </button>
                        <button 
                            onClick={() => router.push(`/tutordaftar/kelas-saya/${classId}/hasil/post-test`)} 
                            className={`w-full text-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${tipeTesSlug === 'post-test' ? 'bg-white text-indigo-700 shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                        >
                            Post-Test
                        </button>
                    </div>
                </div>

                <div className="border-b border-gray-200 mt-8">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                         <button onClick={() => setActiveTab('detail')} className={`${activeTab === 'detail' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Detail & Perbandingan Nilai
                        </button>
                        <button onClick={() => setActiveTab('penilaian')} className={`${activeTab === 'penilaian' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Penilaian Manual
                        </button>
                    </nav>
                </div>

                <div className="py-8">
                    {(!testDetails || testResults.length === 0) ? (
                        <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
                            <p className="text-gray-500">Belum ada hasil yang bisa ditampilkan.</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'penilaian' && (
                                <div className="space-y-8">
                                   {/* --- KODE LENGKAP UNTUK PENILAIAN MANUAL --- */}
                                   {testDetails.sections.map(section => {
                                        const isSubjective = section.tipeSesi === 'Writing' || section.tipeSesi === 'Speaking';
                                        const ungradedWritingAnswers = getUngradedWritingAnswers(section);
                                        // Cek apakah ada siswa yang statusnya 'Dikerjakan' untuk speaking
                                        const speakingNeedsGrading = section.tipeSesi === 'Speaking' && testResults.some(r => r.status === 'Dikerjakan');
                                        const sectionNeedsGrading = ungradedWritingAnswers.length > 0 || speakingNeedsGrading;

                                        return (
                                            <div key={section._id} className="bg-white p-6 rounded-lg shadow-md">
                                                <div className="flex justify-between items-center">
                                                    <h2 className="text-xl font-bold text-gray-800">{section.judul}</h2>
                                                    {!isSubjective ? (
                                                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center gap-1"><FaCheckCircle /> Dinilai Otomatis</span>
                                                    ) : sectionNeedsGrading ? (
                                                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1"><FaPen /> Perlu Penilaian</span>
                                                    ) : (
                                                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center gap-1"><FaCheckCircle /> Semua Telah Dinilai</span>
                                                    )}
                                                </div>

                                                {/* --- Penilaian Writing --- */}
                                                {section.tipeSesi === 'Writing' && (
                                                    <div className="mt-4 border-t pt-4 space-y-4">
                                                        {ungradedWritingAnswers.length > 0 ? ungradedWritingAnswers.map(answer => {
                                                            const question = section.questions.find(q => q._id.toString() === answer.questionId.toString());
                                                            return (
                                                                <div key={answer._id} className="p-3 bg-gray-50 rounded-md">
                                                                    <p className="font-semibold text-gray-700">Soal: <span className="font-normal">{question?.pertanyaan}</span></p>
                                                                    <div className="mt-2">
                                                                        <p className="text-sm font-bold">{answer.student.namaLengkap}</p>
                                                                        <p className="text-gray-600 mt-1 italic">"{answer.studentAnswer}"</p>
                                                                        <div className="mt-2 flex items-center">
                                                                            <label className="text-sm font-medium mr-2">Skor (1-5):</label>
                                                                            <input 
                                                                                type="number" 
                                                                                min="1" 
                                                                                max="5" 
                                                                                // Gunakan defaultValue agar nilai 0 atau null tampil
                                                                                defaultValue={answer.score || ''} 
                                                                                onChange={(e) => handleScoreChange(answer.resultId, answer._id, parseInt(e.target.value))} 
                                                                                className="w-24 p-1 border rounded-md" 
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }) : (
                                                            <p className="mt-4 text-sm text-center text-gray-500 bg-gray-50 p-4 rounded-md">Semua jawaban esai untuk sesi ini sudah dinilai.</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* --- Penilaian Speaking --- */}
                                                {section.tipeSesi === 'Speaking' && (
                                                    <div className="mt-4 border-t pt-4 space-y-3">
                                                        <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md">Nilai sesi Speaking dimasukkan secara manual (misal, setelah sesi wawancara).</p>
                                                        {testResults.map(result => (
                                                            <div key={result._id} className="p-3 bg-gray-50 rounded-md">
                                                                <p className="text-sm font-bold mb-2">{result.studentId.namaLengkap}</p>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                    {(Object.keys(result.speakingScores || {fluency:0, grammar:0, pronunciation:0, diction:0}) as Array<keyof ISpeakingScores>).map(key => (
                                                                        <div key={key}>
                                                                            <label className="capitalize text-sm font-medium">{key}</label>
                                                                            <input 
                                                                                type="number" 
                                                                                min="1" 
                                                                                max="5" 
                                                                                defaultValue={result.speakingScores?.[key] || ''} 
                                                                                onChange={(e) => handleSpeakingScoreChange(result._id, key, parseInt(e.target.value))} 
                                                                                className="w-full mt-1 p-1 border rounded-md"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                   })}
                                   {/* Tombol Simpan */}
                                   <div className="flex justify-end mt-6">
                                        <button 
                                            onClick={handleSaveGrading} 
                                            className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                                            disabled={Object.keys(manualScores).length === 0}
                                        >
                                            Simpan Semua Penilaian
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'detail' && (
                                <div className="overflow-x-auto bg-white rounded-lg shadow">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siswa</th>
                                                {testTypeLabel === 'Post-Test' && <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Skor Pre-Test</th>}
                                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{`Skor ${testTypeLabel}`}</th>
                                                {testTypeLabel === 'Post-Test' && <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Peningkatan (N-Gain)</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {testResults.map(result => {
                                                const preTestScoreData = preTestResults.find(pre => pre?.studentId?._id?.toString() === result?.studentId?._id?.toString());
                                                const preTestScore = preTestScoreData?.totalScore;
                                                
                                                // Panggil fungsi N-Gain
                                                const nGainData = calculateNGain(
                                                    result.totalScore,
                                                    preTestScore,
                                                    testDetails?.maxScore // maxScore dari Post-Test
                                                );

                                                return (
                                                    <tr key={result._id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{result.studentId?.namaLengkap || 'Siswa tidak ditemukan'}</div>
                                                        </td>
                                                        {testTypeLabel === 'Post-Test' && (
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <div className="text-sm font-bold text-gray-900">{preTestScore ?? 'N/A'}</div>
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="text-sm font-bold text-gray-900">{result.totalScore}</div>
                                                        </td>
                                                        {testTypeLabel === 'Post-Test' && (
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {nGainData.score !== null ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${nGainData.color}-100 text-${nGainData.color}-800`}>
                                                                            Grade: {nGainData.grade}
                                                                        </span>
                                                                        <p className="text-xs text-gray-500 mt-1">{nGainData.category}</p>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-500 text-center block w-full">{nGainData.category}</span>
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

