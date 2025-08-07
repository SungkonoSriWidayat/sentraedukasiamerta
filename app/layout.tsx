import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header'; // <-- Impor Header

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MyLearning Platform',
  description: 'Belajar apa saja, kapan saja!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header /> {/* <-- Tambahkan Header di sini */}
        <main className="container mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
