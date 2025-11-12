'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaEdit, FaClock } from 'react-icons/fa';

// Define the type for the template data we expect from the API
interface TestTemplate {
  _id: string;
  judul: string;
  tipe: string;
  updatedAt: string;
  sections: any[];
}

export default function EditTemplateListPage() {
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // We will create this API route in the next step
        const response = await fetch('/api/admin/test-templates'); 
        if (!response.ok) {
          throw new Error('Gagal memuat data template.');
        }
        const data = await response.json();
        setTemplates(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="p-8">
        <Link href="/adminSEA/manajemen-materi" className="text-blue-600 hover:underline mb-6 inline-block">
            &larr; Kembali ke Manajemen Materi
        </Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Pilih Template untuk Diedit</h1>

      {isLoading && <p className="text-center">Memuat data template...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!isLoading && !error && (
        <div className="space-y-4">
          {templates.length > 0 ? (
            templates.map(template => (
              <div key={template._id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                <div>
                    <p className="text-xs font-semibold text-blue-600">{template.tipe}</p>
                    <h2 className="text-lg font-bold text-gray-800">{template.judul}</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <FaClock /> Terakhir diubah: {new Date(template.updatedAt).toLocaleDateString('id-ID')}
                    </p>
                </div>
                <Link href={`/adminSEA/manajemen-materi/edit/${template._id}`}>
                  <div className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                    <FaEdit />
                    <span>Edit</span>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">Belum ada template yang dibuat.</p>
          )}
        </div>
      )}
    </div>
  );
}