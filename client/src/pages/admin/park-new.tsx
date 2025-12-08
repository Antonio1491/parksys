import React from 'react';
import { useLocation } from 'wouter';
import { Trees } from 'lucide-react';
import ROUTES from '@/routes';
import AdminLayout from '@/components/AdminLayout';
import { ReturnHeader } from '@/components/ui/return-header';
import { Card, CardContent } from '@/components/ui/card';
import { ParkBasicInfoForm } from '@/components/admin/parks/ParkBasicInfoForm';

const AdminParkNew: React.FC = () => {
  const [, setLocation] = useLocation();
  const handleSuccess = () => {
    setLocation(ROUTES.admin.parks.list);
  };

  return (
    <AdminLayout>
      <div className="mx-auto">
        <ReturnHeader />
          <div className="mt-4 mb-2 sm:mt-6 sm:mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 border-2 border-accent rounded-full">
                <Trees className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Crear Nuevo Parque
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 ml-0 sm:ml-14">
              Completa la información básica del nuevo parque
            </p>
          </div>

        <Card>
            <CardContent className="mt-4 sm:mt-6" >
              <ParkBasicInfoForm
                parkId={undefined}
                onSuccess={handleSuccess}
                showCancelButton={true}
                cancelRoute={ROUTES.admin.parks.list}
              />
            </CardContent>
          </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminParkNew;