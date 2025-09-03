import React from "react";
import { LucideIcon, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";

interface DashboardLayoutProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  backgroundColor?: string;
  children: React.ReactNode;
  onExportPDF?: () => void;
}

const DashboardLayout = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  backgroundColor = "#14b8a6",
  children,
  onExportPDF
}: DashboardLayoutProps) => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Main Header Estructurado */}
        <div 
          className="mb-4 py-8 px-4 -mx-4 -mt-6 flex items-center justify-between bg-[#14b8a6]"
          style={{ backgroundColor }}
        >
          {/* Sección Izquierda: Ícono + Título + Subtítulo */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Icon className="h-8 w-8 text-white" />
              <h1 className="text-3xl font-bold text-white font-poppins">
                {title}
              </h1>
            </div>
            <p className="text-lg font-medium text-white/90 font-poppins ml-11">
              {subtitle}
            </p>
          </div>

          {/* Sección Derecha: Botón Exportar PDF */}
          <div className="flex items-center">
            <Button
              onClick={onExportPDF}
              variant="secondary"
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 backdrop-blur-sm font-medium"
            >
              <FileDown className="h-5 w-5 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {children}
      </div>
    </AdminLayout>
  );
};

export default DashboardLayout;