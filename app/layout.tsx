// app/layout.tsx
import type { Metadata } from "next";
// Ganti import font ini sesuai dengan yang Anda gunakan (misal: Inter)
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext"; 
// Hapus import NextAuthProvider jika Anda sudah tidak menggunakan NextAuth.js
// import NextAuthProvider from './components/NextAuthProvider'; 
// app/page.tsx
export const dynamic = 'force-dynamic';

// Kode halaman Anda yang sudah ada...

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sentra Edukasi Amerta",
  description: "Pendidikan Berkualitas Internasional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body 
        className={inter.className}
        // TAMBAHKAN INI: Untuk mengabaikan perbedaan kecil yang disebabkan ekstensi browser
        suppressHydrationWarning={true} 
      >
      <AuthProvider>
          <main className="container mx-auto p-4 sm:p-6">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
