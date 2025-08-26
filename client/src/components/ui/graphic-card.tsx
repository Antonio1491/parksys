import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GraphicCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const GraphicCard = ({ 
  title, 
  description, 
  children, 
  className = "" 
}: GraphicCardProps) => {
  return (
    <Card className={`border-0 shadow-lg rounded-3xl h-full min-h-[24rem] ${className}`}>
      <CardHeader className="bg-white rounded-t-lg">
        <CardTitle className="text-lg font-bold text-gray-800">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0 h-full flex flex-col justify-between">
        {children}
      </CardContent>
    </Card>
  );
};

export default GraphicCard;