import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Definición de la estructura de usuario
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  roleId: number;
  fullName?: string;
  [key: string]: any; // Para compatibilidad con otros campos
}

export function useAuth() {
  const [localUser, setLocalUser] = useState<User | null>(null);
  
  // Intentar obtener el usuario desde localStorage al montar el componente
  useEffect(() => {
    try {
      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        setLocalUser(storedUser);
      }
    } catch (error) {
      console.error('Error al cargar usuario desde localStorage:', error);
    }
  }, []);
  
  // Obtener el usuario desde la API si está autenticado
  const { data: apiUser, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: false, // Desactivamos la consulta automática ya que usamos localStorage
  });
  
  // Determinar el usuario final (priorizar localStorage y agregar el campo role basado en roleId)
  const user = localUser || apiUser;
  
  // Asegurar que el campo 'role' está presente basado en roleId
  if (user && typeof user === 'object' && 'roleId' in user && !('role' in user && user.role) && user.roleId) {
    const roleMap: Record<number, string> = {
      1: 'super-admin', // ✅ CORREGIDO: roleId 1 = Super Administrador
      2: 'admin'        // ✅ CORREGIDO: roleId 2 = Administrador General
    };
    (user as any).role = roleMap[user.roleId as number] || 'unknown';
  }
  
  // Determinar si el usuario está autenticado
  const isAuthenticated = !!user;
  
  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setLocalUser(null);
    window.location.href = '/admin/login';
  };
  
  return {
    user,
    isLoading,
    isAuthenticated,
    logout
  };
}