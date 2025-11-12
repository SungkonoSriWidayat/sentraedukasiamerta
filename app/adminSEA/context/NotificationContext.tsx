'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Tentukan bentuk data yang akan kita bagikan
interface NotificationContextType {
  hasNewVerification: boolean;
  setHasNewVerification: React.Dispatch<React.SetStateAction<boolean>>;
  hasNewClassProposal: boolean; // <-- State BARU untuk notifikasi kelas
  setHasNewClassProposal: React.Dispatch<React.SetStateAction<boolean>>; // <-- Setter BARU
}

// Buat Context dengan nilai default
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Buat Provider yang akan "membungkus" komponen kita
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [hasNewVerification, setHasNewVerification] = useState(false);
  const [hasNewClassProposal, setHasNewClassProposal] = useState(false); // <-- Instance state BARU

  return (
    <NotificationContext.Provider value={{ 
        hasNewVerification, setHasNewVerification, 
        hasNewClassProposal, setHasNewClassProposal 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Buat custom hook agar lebih mudah digunakan
export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
