import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UserAvatar from './UserAvatar';

interface UserProfileImageProps {
  userId: number;
  role?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const UserProfileImage: React.FC<UserProfileImageProps> = ({ 
  userId, 
  role = 'user', 
  name = '', 
  className = '',
  size = 'md'
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Configurar el tamaño del avatar
  const sizeClass = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
  }[size];

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      // Añadir timestamp para invalidar cache cuando sea necesario
      const cacheInvalidationKey = `profile_image_cache_${userId}`;
      const currentTime = Date.now().toString();
      
      // Primero verificamos si tenemos la imagen guardada en localStorage
      const localStorageKey = `profile_image_${userId}`;
      const localImageUrl = localStorage.getItem(localStorageKey);
      
      // Casos especiales para usuarios problemáticos (compatibilidad con versiones anteriores)
      if (userId === 3) {
        const adminGuadalajaraImage = localStorage.getItem('admin_guadalajara_image');
        if (adminGuadalajaraImage) {
          setImageUrl(adminGuadalajaraImage);
          setLoading(false);
          return;
        }
      }
      
      if (userId === 1) {
        const adminGearImage = localStorage.getItem('admin_gear_image');
        if (adminGearImage) {
          setImageUrl(adminGearImage);
          setLoading(false);
          return;
        }
      }

      // Siempre intentar obtener la imagen del servidor para estar seguro de tener la más reciente
      try {
        // Añadimos control para evitar que falle cuando el servidor no responde
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort('Request timeout');
        }, 3000); // 3 segundos de timeout
        
        // Agregar timestamp para evitar cache del navegador
        const response = await fetch(`/api/users/${userId}/profile-image?t=${currentTime}`, {
          signal: controller.signal
        }).catch(err => {
          // No mostrar error si es por abort timeout
          if (err.name !== 'AbortError') {
            console.error("Error al obtener la imagen de perfil:", err);
          }
          return null;
        });
        
        // Limpiar el timeout si la petición se completó
        clearTimeout(timeoutId);
        
        if (response && response.ok) {
          const data = await response.json();
          setImageUrl(data.imageUrl);
          
          // Guardamos también en localStorage como respaldo
          localStorage.setItem(localStorageKey, data.imageUrl);
          localStorage.setItem(cacheInvalidationKey, currentTime);
        } else {
          // Si no hay respuesta del servidor pero tenemos imagen en localStorage, usarla
          if (localImageUrl) {
            console.log(`Usando imagen desde localStorage para usuario ${userId}`);
            setImageUrl(localImageUrl);
          } else {
            // Si no hay imagen en la caché, usamos el avatar generado
            setError(true);
          }
        }
      } catch (err) {
        console.error('Error al obtener la imagen de perfil:', err);
        // En caso de error, intentar usar localStorage como fallback
        if (localImageUrl) {
          console.log(`Usando imagen desde localStorage como fallback para usuario ${userId}`);
          setImageUrl(localImageUrl);
        } else {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileImage();

    // Listener para actualización automática cuando se sube una nueva imagen
    const handleProfileImageUpdate = (event: CustomEvent) => {
      const { userId: eventUserId, imageUrl: newImageUrl } = event.detail;
      if (eventUserId === userId) {
        console.log(`Actualizando imagen de perfil para usuario ${userId}: ${newImageUrl}`);
        setImageUrl(newImageUrl);
        setError(false);
      }
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);

    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    };
  }, [userId]);

  if (loading) {
    return (
      <Avatar className={`${sizeClass} ${className}`}>
        <AvatarFallback>...</AvatarFallback>
      </Avatar>
    );
  }

  if (error || !imageUrl) {
    // Usar el avatar generado como fallback
    return <UserAvatar userId={userId} role={role} name={name} className={className} size={size} />;
  }

  return (
    <Avatar className={`${sizeClass} ${className}`}>
      <AvatarImage 
        src={imageUrl} 
        alt={name || `Usuario ${userId}`}
        className="object-cover w-full h-full"
      />
      <AvatarFallback>
        <UserAvatar userId={userId} role={role} name={name} className={className} size={size} />
      </AvatarFallback>
    </Avatar>
  );
};

export default UserProfileImage;