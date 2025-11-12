'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';

// Interface untuk struktur data Message
interface Message {
    _id: string;
    senderId: {
        _id: string;
        namaLengkap: string;
    };
    content: string;
    timestamp: string;
}

// Interface untuk props komponen
interface PengumumanKelasProps {
    tutorName: string;
    tutorId: string;
    classId: string;
    studentId: string;
}

// Interface untuk respons API
interface HistoryApiResponse { success: boolean; data: Message[]; }
interface SendMsgApiResponse { success: boolean; data: Message; }

export default function PengumumanKelas({ tutorName, tutorId, classId, studentId }: PengumumanKelasProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Refs untuk mengelola timer dan interval polling
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fungsi untuk mengambil pesan, sekarang dengan dependency yang benar
    const fetchMessages = useCallback(async () => {
        if (!classId || !tutorId) return;
        try {
            const response = await apiClient.get<HistoryApiResponse>(`/chat/history/${classId}/${tutorId}`);
            if (response.data.success) {
                setMessages(response.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat riwayat chat.", error);
            // Hentikan polling jika terjadi error
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            toast.error("Gagal terhubung ke chat.");
        } finally {
            // Hanya set loading ke false pada pengambilan data pertama kali
            setIsLoading(false);
        }
    }, [classId, tutorId]); // Dependency yang benar: hanya ID yang relevan

    // Logika polling cerdas Anda, diimplementasikan dengan benar
    const startPolling = useCallback(() => {
        // Jangan mulai polling baru jika sudah aktif
        if (pollingIntervalRef.current) return;

        toast.success("Mode chat real-time aktif selama 3 menit.");

        // Mulai polling setiap 5 detik
        pollingIntervalRef.current = setInterval(fetchMessages, 5000);

        // Hentikan polling setelah 3 menit (180000 ms)
        pollingTimeoutRef.current = setTimeout(() => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
                toast("Mode chat real-time dinonaktifkan.");
            }
        }, 60000);
    }, [fetchMessages]);

    // Mengambil pesan awal sekali saja saat komponen siap
    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchMessages();
        }
    }, [isAuthLoading, user, fetchMessages]);

    // Auto-scroll ke pesan terbaru
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cleanup untuk memastikan semua timer mati saat komponen dilepas
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        };
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        setIsSending(true);
        const originalMessage = newMessage;
        setNewMessage('');

        try {
            await apiClient.post<SendMsgApiResponse>('/chat/send', {
                classId,
                receiverId: tutorId,
                content: originalMessage,
            });
            await fetchMessages(); // Langsung refresh setelah mengirim
            startPolling(); // Aktifkan kembali polling jika sempat mati
        } catch (error) {
            toast.error("Gagal mengirim pesan.");
            setNewMessage(originalMessage);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Diskusi Kelas dengan {tutorName}</h2>
            <div className="h-64 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
                {isLoading ? (
                    <p className="text-center text-gray-500">Memuat pesan...</p>
                ) : messages.length > 0 ? (
                    messages.map(msg => (
                        <div key={msg._id} className={`flex mb-2 ${msg.senderId._id === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.senderId._id === user?.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p className="text-sm font-semibold mb-1">{msg.senderId.namaLengkap}</p>
                                <p className="text-sm">{msg.content}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500">Belum ada pesan. Mulai percakapan!</p>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan Anda..."
                    className="flex-grow border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!user || isSending}
                    onFocus={startPolling} // Polling dipicu saat pengguna siap mengetik
                />
                <button type="submit" className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300" disabled={!newMessage.trim() || !user || isSending}>
                    {isSending ? 'Mengirim...' : 'Kirim'}
                </button>
            </form>
        </div>
    );
}

