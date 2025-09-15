import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mapeo de roles a colores de avatar y letras iniciales
const roleAvatarConfig: Record<string, { bgColor: string, textColor: string }> = {
  admin: { bgColor: 'bg-red-500', textColor: 'text-white' },
  director: { bgColor: 'bg-purple-500', textColor: 'text-white' },
  manager: { bgColor: 'bg-blue-500', textColor: 'text-white' },
  supervisor: { bgColor: 'bg-teal-500', textColor: 'text-white' },
  instructor: { bgColor: 'bg-green-500', textColor: 'text-white' },
  volunteer: { bgColor: 'bg-yellow-500', textColor: 'text-black' },
  citizen: { bgColor: 'bg-orange-500', textColor: 'text-white' },
  user: { bgColor: 'bg-gray-500', textColor: 'text-white' },
};

// Función para determinar si una URL de imagen es válida/confiable
const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;
  // Solo permitir URLs que empiecen con rutas relativas o HTTPS de dominio conocido
  return url.startsWith('/') || url.startsWith('/api/') || url.startsWith('https://');
};

// Obtener iniciales del nombre
const getInitials = (fullName: string): string => {
  if (!fullName) return '??';
  
  const parts = fullName.split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface UserAvatarProps {
  userId: number;
  role?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  imageUrl?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  userId, 
  role = 'user', 
  name = '',
  className = '',
  size = 'md',
  imageUrl
}) => {
  // Determinar el tamaño del avatar
  const sizeClass = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-lg',
  }[size];
  
  // Solo usar imageUrl si es válida, sino fallback a iniciales
  const avatarUrl = isValidImageUrl(imageUrl) ? imageUrl : undefined;
  
  // Configuración visual basada en el rol
  const avatarConfig = roleAvatarConfig[role] || roleAvatarConfig.user;
  
  return (
    <Avatar className={`${sizeClass} ${className}`}>
      <AvatarImage src={avatarUrl} alt={name || `Usuario ${userId}`} />
      <AvatarFallback className={`${avatarConfig.bgColor} ${avatarConfig.textColor}`}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;