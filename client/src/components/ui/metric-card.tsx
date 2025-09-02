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
  textColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  borderColor?: string;
  children?: React.ReactNode; // Para contenido adicional como barras de progreso
}

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = "#14b8a6",
  backgroundColor = "#003D49",
  textColor,
  titleColor,
  subtitleColor,
  borderColor,
  children 
}: MetricCardProps) => {
  return (
    <Card
      className={`shadow-lg rounded-3xl ${borderColor ? 'border' : 'border-0'} ${textColor ? '' : 'text-white'}`}
      style={{ 
        backgroundColor,
        ...(borderColor && { borderColor, borderWidth: '1px' })
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle 
          className="text-base font-medium"
          style={{ 
            color: titleColor || (textColor ? textColor : undefined) 
          }}
        >
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
        <div 
          className="text-3xl font-bold mb-2"
          style={{ 
            color: textColor || 'white' 
          }}
        >
          {value}
        </div>
        {subtitle && (
          <p 
            className="text-xs mb-3"
            style={{ 
              color: subtitleColor || textColor || 'white' 
            }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  );
};

export default MetricCard;