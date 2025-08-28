import React, { useState } from 'react';
import AdminSidebarComplete from './AdminSidebarComplete';
import Header from './Header';

interface AdminLayoutProps {
  title?: string;
  children: React.ReactNode;
  subtitle?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, subtitle, children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fijo en la parte superior */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>
      
      {/* Sidebar fijo global - debajo del header */}
      <AdminSidebarComplete />
      
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-800/50 z-40 md:hidden" 
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Main Content con margen izquierdo para el sidebar y superior para el header */}
      <div className="ml-64 pt-20 flex flex-col min-h-screen">
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export { AdminLayout };
export default AdminLayout;