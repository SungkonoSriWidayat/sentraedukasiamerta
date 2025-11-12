/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...mungkin ada konfigurasi Anda yang lain di sini...

  // TAMBAHKAN BLOK INI:
  eslint: {
    // Warning: Ini akan mengabaikan error ESLint saat proses build.
    // Sebaiknya perbaiki errornya, bukan diabaikan.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;