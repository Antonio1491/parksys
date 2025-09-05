import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Definición de la estructura de usuario
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  roleId?: number;
  fullName?: string;
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
  
  // Determinar el usuario final (priorizar localStorage)
  const user = localUser || apiUser;
  
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