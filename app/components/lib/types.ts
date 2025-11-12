// --- Tipe Data Umum ---
export interface UserToken {
  id: string;
}

export interface IMessage {
  _id: string;
  senderId: { _id: string };
  content: string;
  timestamp: string;
}

// --- Tipe Data Materi (Basis) ---
export interface IMateri {
  _id?: string;
  judul?: string;
  deskripsi?: string;
  linkGoogleMeet?: string;
  linkVideo?: string;
  linkPdf?: string;
  namaPdf?: string;
  kehadiranSiswa?: 'Hadir' | 'Belum Absen'; // Properti ditambahkan untuk kompatibilitas
}


// --- Tipe Data Spesifik untuk Tutor ---
export interface IEnrolledStudent {
  _id: string;
  namaLengkap: string;
  lastMessage?: string;
  attendanceStatus?: string | null;
}

export interface ITutorMateri extends IMateri {
  // Saat ini tidak ada properti tambahan, tapi ini bagus untuk pengembangan di masa depan
}

export interface ITestSchedule {
    _id: string;
    judul: string;
    waktuMulai: string;
    waktuSelesai: string;
    durasi: number; // dalam menit
}

export interface ITutorClass {
  _id: string;
  nama: string;
  tutorName?: string; // Ditambahkan untuk mengatasi error
  deskripsi?: string;
  jadwal?: string;
  jumlahPertemuan: number;
  materi: ITutorMateri[];
  enrolledStudents: IEnrolledStudent[];
  tests?: ITestSchedule[];
}

// Alias untuk kompatibilitas dengan komponen yang mungkin masih menggunakan IClass
export type IClass = ITutorClass;


// --- Tipe Data Spesifik untuk Siswa ---
export interface ISiswaMateri extends IMateri {
  kehadiranSiswa: 'Hadir' | 'Belum Absen';
}

export interface ISiswaClass {
  _id: string;
  nama: string;
  deskripsi: string;
  jumlahPertemuan: number;
  materi: ISiswaMateri[];
  tutorName: string; 
    
    // Memastikan TypeScript tahu bahwa tutorId adalah objek yang sudah di-populate
  tutorId: {
        _id: string;
        namaLengkap: string; 
    };
    
  waktuPerPertemuan: string;
}

