import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.request.use(
  (config) => {
    // Tetap gunakan satu nama token yang konsisten
    const token = localStorage.getItem('authToken'); 
    if (token) {
      if (!config.headers) config.headers = {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('AKSES DITOLAK (401/403). Sesi tidak valid.');
      
      // Hapus token yang tidak valid
      localStorage.removeItem('authToken'); 

      // --- LOGIKA REDIRECT PINTAR ---
      // Cek di URL mana pengguna berada sekarang
      const currentPath = window.location.pathname;

      // Arahkan kembali ke portal login yang sesuai
      if (currentPath.startsWith('/tutordaftar')) {
        window.location.href = '/tutordaftar/login';
      } else if (currentPath.startsWith('/adminSEA')) {
        window.location.href = '/adminSEA/login'; // Sesuaikan jika perlu
      } else {
        window.location.href = '/login'; // Halaman default untuk siswa/publik
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

