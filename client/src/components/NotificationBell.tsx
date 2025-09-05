import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

interface NotificationBellProps {
  className?: string;
}

interface NotificationCount {
  unreadCount: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = "" }) => {
  const { user } = useFirebaseAuth();

  // Query para obtener el conteo de notificaciones no leídas
  const { data: notificationData, isLoading } = useQuery<NotificationCount>({
    queryKey: ['/api/notifications/count'],
    enabled: !!user, // Solo ejecutar si hay usuario autenticado
    refetchInterval: 30000, // Refrescar cada 30 segundos para ser reactivo
  });

  const unreadCount = notificationData?.unreadCount || 0;

  const handleNotificationClick = () => {
    // TODO: Implementar navegación al panel de notificaciones
    console.log('Abriendo panel de notificaciones...');
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        className="w-9 h-9 p-0 rounded-lg border"
        style={{ backgroundColor: "#f4f5f7", borderColor: "#003D49" }}
        title="Notificaciones"
        onClick={handleNotificationClick}
      >
        <Bell className="h-6 w-8 text-gray-700" />
      </Button>

      {/* Badge con contador de notificaciones no leídas */}
      {unreadCount > 0 && (
        <div 
          className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg border-2 border-white"
          style={{ fontSize: '10px' }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}

      {/* Indicador de carga opcional */}
      {isLoading && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
      )}
    </div>
  );
};

export default NotificationBell;