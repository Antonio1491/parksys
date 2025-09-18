import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import HierarchicalPermissionsMatrix from '@/components/ui/permissions-hierarchical-matrix';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

const MatrixPage: React.FC = () => {
  const { user } = useUnifiedAuth();

  return (
    <AdminLayout>
      <HierarchicalPermissionsMatrix
        editable={true}
        currentUser={user ? { 
          id: user.id, 
          roleId: user.roleId, 
          role: user.role 
        } : undefined}
        title="Matriz Jerárquica de Permisos"
        description="Vista de árbol organizada por módulos, submódulos y páginas con operaciones bulk para una gestión más eficiente."
        showFilters={true}
      />
    </AdminLayout>
  );
};

export default MatrixPage;