import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  backgroundColor?: string;
  children?: React.ReactNode; // Para contenido adicional como barras de progreso
}

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = "#14b8a6",
  backgroundColor = "#003D49",
  children 
}: MetricCardProps) => {
  return (
    <Card
      className="border-0 shadow-lg text-white rounded-3xl"
      style={{ backgroundColor }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium text-gray-100">
          {title}
        </CardTitle>
        <div
          className="rounded-full p-2"
          style={{ backgroundColor: iconColor }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-white mb-3">
            {subtitle}
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  );
};

export default MetricCard;