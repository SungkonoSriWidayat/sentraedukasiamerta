/**
 * Mengubah berbagai format URL YouTube menjadi URL embed yang bersih.
 * @param url URL YouTube yang dimasukkan oleh pengguna.
 * @returns URL embed atau string kosong jika tidak valid.
 */
export const convertYoutubeUrlToEmbed = (url: string): string => {
  if (!url) return '';
  
  const videoIdRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(videoIdRegex);

  if (match && match[1]) {
    const videoId = match[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  return '';
};

/**
 * Membersihkan URL Google Meet dari parameter tambahan (seperti ?authuser=).
 * @param url URL Google Meet yang dimasukkan oleh pengguna.
 * @returns URL Google Meet yang bersih atau string kosong jika tidak valid.
 */
export const cleanGoogleMeetUrl = (url: string): string => {
  if (!url) return '';

  // Regex untuk menangkap URL Google Meet yang valid
  const meetUrlRegex = /(https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3})/;
  const match = url.match(meetUrlRegex);

  if (match && match[1]) {
    return match[1]; // Mengembalikan URL yang bersih
  }

  return '';
};


// --- LOGIKA PENILAIAN N-GAIN DIMULAI DI SINI ---

// --- INTERFACE BERSAMA ---
interface IQuestionInfo {
    tipeSoal: 'Pilihan Ganda' | 'Writing';
}
interface ISectionInfo {
    questions: IQuestionInfo[];
}
export interface ITestInfo {
    _id: any; // Bisa Types.ObjectId
    tipe: string;
    sections: ISectionInfo[];
    maxScore?: number;
}

/**
 * Menghitung skor maksimum (maxScore) dari sebuah tes berdasarkan soal-soalnya.
 * @param test Objek tes yang berisi sections dan questions.
 * @returns Angka skor maksimum.
 */
export const calculateMaxScore = (test: ITestInfo): number => {
    let score = 0;
    if (test.sections && Array.isArray(test.sections)) {
        for (const section of test.sections) {
            if (section.questions && Array.isArray(section.questions)) {
                for (const question of section.questions) {
                    switch (question.tipeSoal) {
                        case 'Pilihan Ganda':
                            score += 1;
                            break;
                        case 'Writing':
                            score += 5;
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }
    return score;
};

/**
 * Menghitung N-Gain dan mengembalikan Grade beserta kategorinya.
 * @param preTestScore Skor Pre-Test mentah (cth: 5)
 * @param postTestScore Skor Post-Test mentah (cth: 8)
 * @param maxScore Skor maksimum tes (cth: 10)
 * @returns Objek berisi skor N-Gain (0-1), Grade (A-D), dan Kategori.
 */
export const getNGainGrade = (
    preTestScore: number, 
    postTestScore: number, 
    maxScore: number
): { score: number, grade: string, category: string } => {
    
    // 1. Normalisasikan skor
    const normalizedPreTestScore = maxScore > 0 ? (preTestScore / maxScore) : 0;
    const normalizedPostTestScore = maxScore > 0 ? (postTestScore / maxScore) : 0;
    
    const maxNormalizedScore = 1.0;
    let nGainScore = 0.0; 

    // 2. Hitung N-Gain
    if (normalizedPreTestScore === maxNormalizedScore) {
        // Siswa sudah sempurna di pre-test
        nGainScore = (normalizedPostTestScore === maxNormalizedScore) ? 1.0 : 0.0;
    } else if (maxNormalizedScore - normalizedPreTestScore > 0) {
        // Rumus N-Gain utama
        nGainScore = (normalizedPostTestScore - normalizedPreTestScore) / (maxNormalizedScore - normalizedPreTestScore);
    }
    // Jika pre-test 0 dan post-test 0, nGainScore akan tetap 0

    // 3. Tentukan Grade
    if (nGainScore > 0.7) {
        return { score: nGainScore, grade: 'A', category: 'Peningkatan Tinggi' };
    } else if (nGainScore >= 0.3) {
        return { score: nGainScore, grade: 'B', category: 'Peningkatan Sedang' };
    } else if (nGainScore >= 0) {
        return { score: nGainScore, grade: 'C', category: 'Peningkatan Rendah' };
    } else {
        return { score: nGainScore, grade: 'D', category: 'Terjadi Penurunan' };
    }
};
