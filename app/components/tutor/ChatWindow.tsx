'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
// PERBAIKAN 1: Path impor diperbaiki agar sesuai dengan struktur folder Anda
import { IEnrolledStudent, IMessage } from '@/app/components/lib/types'; 
import apiClient from '@/lib/apiClient'; // Menggunakan path relatif yang lebih pasti
import { useAuth } from '@/app/context/AuthContext'; // Menggunakan path relatif yang lebih pasti
import { DeleteIcon } from './Icons';
import { FaSpinner } from 'react-icons/fa';

interface ChatWindowProps {
  student: IEnrolledStudent;
  classId: string;
  onClose: () => void;
  onChatClose: () => void;
}

// PERBAIKAN 2: Definisikan tipe data untuk respons API
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export default function ChatWindow({ student, classId, onClose, onChatClose }: ChatWindowProps) {
    const { user } = useAuth();
    const tutorId = user?.id;

    const [messages, setMessages] = useState<IMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchHistory = useCallback(async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        if (!tutorId) return;

        try {
            // Beri tahu TypeScript bentuk data yang diharapkan (ApiResponse dengan array IMessage)
            const res = await apiClient.get<ApiResponse<IMessage[]>>(`/chat/history/${classId}/${student._id}`);
            
            if (res.data.success) {
                setMessages(currentMessages => {
                    if (JSON.stringify(currentMessages) !== JSON.stringify(res.data.data)) {
                        return res.data.data || [];
                    }
                    return currentMessages;
                });
            }
        } catch (error) {
            console.error("Gagal mengambil riwayat chat:", error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [classId, student._id, tutorId]);
    
    useEffect(() => {
        fetchHistory(true);
        const intervalId = setInterval(() => fetchHistory(false), 3000);
        return () => {
            clearInterval(intervalId);
            onChatClose();
        };
    }, [fetchHistory, onChatClose]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            // Beri tahu TypeScript bentuk data yang diharapkan (ApiResponse dengan satu IMessage)
            const res = await apiClient.post<ApiResponse<IMessage>>('/chat/send-message', {
                classId,
                receiverId: student._id,
                content: newMessage,
            });

            if (res.data.success) {
                setMessages(prev => [...prev, res.data.data]);
                setNewMessage('');
            } else {
                toast.error(res.data.message || "Gagal mengirim pesan.");
            }
        } catch (error) {
            toast.error("Gagal mengirim pesan.");
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await apiClient.delete(`/chat/delete-message/${messageId}`);
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
            toast.success("Pesan dihapus");
        } catch (error) {
            toast.error("Gagal menghapus pesan.");
        }
    };
    
    return (
        <div className="fixed bottom-4 right-4 w-96 h-[32rem] bg-white rounded-lg shadow-2xl flex flex-col z-50">
            <div className="bg-teal-600 text-white p-3 flex justify-between items-center rounded-t-lg">
                <h3 className="font-bold">Chat dengan {student.namaLengkap}</h3>
                <button onClick={onClose} className="font-bold text-xl ml-2">&times;</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <FaSpinner className="animate-spin text-teal-500 text-2xl" />
                        <span className="ml-2 text-gray-500">Memuat percakapan...</span>
                    </div>
                ) : messages.map(msg => (
                    <div key={msg._id} className={`group flex items-end gap-2 mb-3 ${msg.senderId._id === tutorId ? 'justify-end' : 'justify-start'}`}>
                        {msg.senderId._id === tutorId && (
                            <button onClick={() => handleDeleteMessage(msg._id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity mb-1">
                                <DeleteIcon />
                            </button>
                        )}
                        <div className={`rounded-lg py-2 px-3 max-w-xs break-words ${msg.senderId._id === tutorId ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-3 border-t flex">
                <input 
                    type="text" 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    placeholder="Ketik pesan..." 
                    className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button type="submit" className="bg-teal-600 text-white px-4 rounded-r-md hover:bg-teal-700">Kirim</button>
            </form>
        </div>
    );
}