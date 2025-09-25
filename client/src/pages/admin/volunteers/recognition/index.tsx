import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card } from '@/components/ui/card';

const VolunteerRecognition = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Reconocimientos de Voluntarios</h1>
          <p className="text-gray-600">
            Esta sección para gestionar reconocimientos de voluntarios está en desarrollo.
          </p>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default VolunteerRecognition;