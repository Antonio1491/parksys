import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import { ROUTES } from '@/routes';

interface NotificationBellProps {
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
  badgeClassName?: string;
}

interface NotificationCount {
  unreadCount: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  className = "",
  buttonClassName = "",
  iconClassName = "",
  badgeClassName = ""
}) => {
  const { user } = useUnifiedAuth();
  const { t } = useTranslation();

  // Query para obtener el conteo de notificaciones no leídas
  const { data: notificationData, isLoading } = useQuery<NotificationCount>({
    queryKey: ['/api/notifications/count'],
    enabled: !!user, // Solo ejecutar si hay usuario autenticado
    refetchInterval: false, // DEPLOYMENT FIX: Disabled polling to prevent deployment hanging
  });

  const unreadCount = notificationData?.unreadCount || 0;

  const handleNotificationClick = () => {
    // TODO: Implementar navegación al panel de notificaciones
    console.log('Abriendo panel de notificaciones...');
  };

  return (
    <div className={cn("relative", className)}>
      <Link to={ROUTES.admin.profile.notifications}>
        <Button
          variant="outline"
          size="sm"
          className={cn("w-10 h-10 p-0 rounded-full", buttonClassName)}
          title={t('admin.notifications')}
          aria-label={t('admin.notifications')}
          onClick={handleNotificationClick}
        >
            <Bell className={cn("h-5 w-5 text-gray-600", iconClassName)} />     
        </Button>
      </Link>

      {/* Badge con contador de notificaciones no leídas */}
      {unreadCount > 0 && (
        <div className={cn("absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg border-2 border-white", badgeClassName)}
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