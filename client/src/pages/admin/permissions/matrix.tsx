import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import PermissionsMatrix from '@/components/ui/permissions-matrix';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

const MatrixPage: React.FC = () => {
  const { user } = useUnifiedAuth();

  return (
    <AdminLayout>
      <PermissionsMatrix
        editable={true}
        currentUser={user}
        title="Matriz de Permisos del Sistema"
        description="Gestiona permisos granulares para cada rol y módulo. Los cambios se aplican inmediatamente al sistema."
        showFilters={true}
      />
    </AdminLayout>
  );
};

export default MatrixPage;