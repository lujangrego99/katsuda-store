'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'SUPER' | 'ADMIN' | 'STAFF';
}

interface AdminAuthContextType {
  admin: Admin | null;
  token: string | null;
  loading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('adminToken');
      const storedAdmin = localStorage.getItem('adminUser');

      if (!storedToken || !storedAdmin) {
        setLoading(false);
        // Si no está en login, redirigir
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
        return;
      }

      // Verificar token con el servidor
      try {
        const response = await fetch(`${API_URL}/api/admin/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAdmin(data.data);
          setToken(storedToken);
        } else {
          // Token inválido, limpiar
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          if (pathname !== '/admin/login') {
            router.push('/admin/login');
          }
        }
      } catch {
        // Error de red, usar datos en cache
        try {
          setAdmin(JSON.parse(storedAdmin));
          setToken(storedToken);
        } catch {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          if (pathname !== '/admin/login') {
            router.push('/admin/login');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
    setToken(null);
    router.push('/admin/login');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        loading,
        logout,
        isAuthenticated: !!admin && !!token,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
