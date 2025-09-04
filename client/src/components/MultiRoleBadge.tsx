import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from './RoleBadge';
import { useQuery } from '@tanstack/react-query';
import { Star, Crown } from 'lucide-react';

interface MultiRoleBadgeProps {
  userId: number;
  showOnlyPrimary?: boolean;
  maxRoles?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface UserRole {
  id: number;
  roleId: number;
  isPrimary: boolean;
  role: {
    id: number;
    name: string;
    slug: string;
    level: number;
  };
}

export const MultiRoleBadge: React.FC<MultiRoleBadgeProps> = ({
  userId,
  showOnlyPrimary = false,
  maxRoles = 3,
  size = 'md',
  className
}) => {
  const { data: userRoles, isLoading } = useQuery<UserRole[]>({
    queryKey: [`/api/users/${userId}/roles`],
    staleTime: 2 * 60 * 1000,
  });

  const { data: hasMultiple } = useQuery<{ hasMultipleRoles: boolean }>({
    queryKey: [`/api/users/${userId}/has-multiple-roles`],
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <div className="animate-pulse bg-gray-200 rounded h-6 w-20"></div>
      </div>
    );
  }

  if (!userRoles || userRoles.length === 0) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800">
        Sin roles
      </Badge>
    );
  }

  // Si solo tiene un rol, usar RoleBadge normal
  if (userRoles.length === 1) {
    return (
      <RoleBadge
        roleId={userRoles[0].role.id}
        size={size}
        className={className}
      />
    );
  }

  // Si showOnlyPrimary, mostrar solo el rol primario
  if (showOnlyPrimary) {
    const primaryRole = userRoles.find(ur => ur.isPrimary) || userRoles[0];
    return (
      <div className="flex items-center gap-2">
        <RoleBadge
          roleId={primaryRole.role.id}
          size={size}
          className={className}
        />
        {hasMultiple?.hasMultipleRoles && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Star className="w-3 h-3 mr-1" />
            +{userRoles.length - 1}
          </Badge>
        )}
      </div>
    );
  }

  // Mostrar múltiples roles
  const rolesToShow = userRoles.slice(0, maxRoles);
  const remainingCount = Math.max(0, userRoles.length - maxRoles);
  
  // Ordenar roles: primario primero, luego por nivel
  const sortedRoles = [...rolesToShow].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.role.level - b.role.level;
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {sortedRoles.map((userRole) => (
        <div key={userRole.id} className="relative">
          <RoleBadge
            roleId={userRole.role.id}
            size={size}
            className={className}
          />
          {userRole.isPrimary && (
            <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 bg-white rounded-full p-0.5" />
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <Badge 
          variant="outline" 
          className="bg-gray-50 text-gray-600 border-gray-200"
        >
          +{remainingCount} más
        </Badge>
      )}
      
      {userRoles.length > 1 && (
        <Badge 
          variant="outline" 
          className="bg-blue-50 text-blue-700 border-blue-200 ml-1"
        >
          {userRoles.length} roles
        </Badge>
      )}
    </div>
  );
};

export default MultiRoleBadge;