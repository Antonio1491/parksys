import React from 'react';
import { DocumentationViewer } from '@/components/DocumentationViewer';
import { useLocation } from 'wouter';

export default function ActividadesManual() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <DocumentationViewer 
        documentId="actividades-manual"
        onBack={() => setLocation('/admin')}
      />
    </div>
  );
}