import React from "react";
import { LucideIcon } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface DashboardLayoutProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  backgroundColor?: string;
  children: React.ReactNode;
}

const DashboardLayout = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  backgroundColor = "#14b8a6",
  children 
}: DashboardLayoutProps) => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Main Header con fondo coloreado */}
        <div 
          className="mb-4 py-8 px-4 -mx-4 -mt-6 flex items-center justify-between bg-[#14b8a6]"
          style={{ backgroundColor }}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-6 w-6 text-white" />
            <h1 className="text-3xl font-bold text-white font-poppins">
              {title}
            </h1>
          </div>
          <p className="text-base font-normal text-white font-poppins">
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </AdminLayout>
  );
};

export default DashboardLayout;