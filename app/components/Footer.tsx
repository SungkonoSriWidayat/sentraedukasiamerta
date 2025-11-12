// app/components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-serif font-bold mb-4">Sentra Edukasi Amerta</h3>
            <p className="text-gray-400 max-w-md">
              Pusat pendidikan yang berdedikasi untuk mencetak generasi unggul melalui metode pembelajaran inovatif dan kurikulum berstandar tinggi.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Tautan</h4>
            <ul>
              <li className="mb-2"><Link href="/" className="hover:text-yellow-400">Beranda</Link></li>
              <li className="mb-2"><Link href="/kelas" className="hover:text-yellow-400">Kelas</Link></li>
              <li className="mb-2"><Link href="/tentang-kami" className="hover:text-yellow-400">Tentang Kami</Link></li>
              <li className="mb-2"><Link href="/kontak" className="hover:text-yellow-400">Kontak</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Hubungi Kami</h4>
            <p className="text-gray-400">Jl. Pendidikan No. 123, Jakarta, Indonesia</p>
            <p className="text-gray-400">info@sentraedukasi.com</p>
            <p className="text-gray-400">(021) 123-4567</p>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Sentra Edukasi Amerta. Semua Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}