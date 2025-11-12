'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useRef, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

// ... (Interface User dan AuthContextType tetap sama) ...
interface User { id: string; name: string; role: string; }
interface AuthContextType { user: User | null; token: string | null; login: (token: string) => void; logout: () => void; isLoading: boolean; }


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenExpiryTimer = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    console.log("LOGOUT: Sesi diakhiri.");
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
    if (tokenExpiryTimer.current) {
      clearTimeout(tokenExpiryTimer.current);
      tokenExpiryTimer.current = null;
    }

    // --- LOGIKA REDIRECT PINTAR YANG SAMA ---
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/tutordaftar')) {
        window.location.href = '/tutordaftar/login';
    } else if (currentPath.startsWith('/adminSEA')) {
        window.location.href = '/adminSEA/login'; // Sesuaikan jika perlu
    } else {
        window.location.href = '/login';
    }
  }, []);

  const login = useCallback(/* ... (fungsi login tetap sama persis seperti sebelumnya) ... */
    (newToken: string) => {
    try {
      const decoded = jwtDecode<User & { exp: number }>(newToken);
      const expiresIn = (decoded.exp * 1000) - Date.now();
      if (expiresIn <= 0) {
        console.log("LOGIN GAGAL: Token sudah kedaluwarsa.");
        localStorage.removeItem('authToken'); return;
      }
      localStorage.setItem('authToken', newToken); 
      setUser({ id: decoded.id, name: decoded.name, role: decoded.role });
      setToken(newToken);
      if (tokenExpiryTimer.current) clearTimeout(tokenExpiryTimer.current);
      console.log(`TIMER: Sesi akan berakhir otomatis dalam ${Math.round(expiresIn / 1000)} detik.`);
      tokenExpiryTimer.current = setTimeout(() => {
        console.log("TIMER: Waktu sesi habis, logout otomatis dijalankan.");
        logout();
      }, expiresIn);
    } catch (error) {
      console.error("LOGIN GAGAL: Token tidak valid.", error);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    // ... (useEffect tetap sama persis seperti sebelumnya) ...
    try {
        const storedToken = localStorage.getItem('authToken'); 
        if (storedToken) {
            console.log("INIT: Token ditemukan, mencoba memulai sesi...");
            login(storedToken);
        }
    } catch (e) {
        console.error("INIT ERROR:", e)
    } finally {
        setIsLoading(false);
    }
    return () => { if (tokenExpiryTimer.current) clearTimeout(tokenExpiryTimer.current); };
  }, [login]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => { /* ... (hook tetap sama) ... */
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

