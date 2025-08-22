import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, UserPlus, AlertCircle } from 'lucide-react';
import InstructorCard from './InstructorCard';

interface ActivityInstructorSectionProps {
  instructorId?: number;
  showTitle?: boolean;
  enableAssign?: boolean;
}

export default function ActivityInstructorSection({ 
  instructorId, 
  showTitle = true,
  enableAssign = false
}: ActivityInstructorSectionProps) {
  const [, setLocation] = useLocation();
  
  // Consultar datos del instructor si tenemos un ID
  const { 
    data: instructor, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: instructorId ? [`/api/instructors/${instructorId}`] : null,
    enabled: !!instructorId, // Solo ejecutar si hay un instructorId
  });

  // Consultar lista de instructores
  const { 
    data: instructors, 
    isLoading: isLoadingList 
  } = useQuery({
    queryKey: ['/api/instructors'],
    enabled: !instructorId && enableAssign, // Solo cargar la lista si no hay un instructor asignado y enableAssign es true
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          {showTitle && (
            <div className="flex items-center mb-2">
              <GraduationCap className="mr-2 h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Instructor</h3>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          {showTitle && (
            <div className="flex items-center mb-2">
              <GraduationCap className="mr-2 h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Instructor</h3>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No se pudo cargar la información del instructor.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si no hay instructor asignado
  if (!instructorId || !instructor) {
    return (
      <Card>
        <CardHeader>
          {showTitle && (
            <div className="flex items-center mb-2">
              <GraduationCap className="mr-2 h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Instructor</h3>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            {isLoadingList ? (
              <Skeleton className="h-8 w-48 mx-auto" />
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Esta actividad no tiene un instructor asignado.
                </p>
                {enableAssign && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation('/admin/activities/instructors/cards')}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Ver instructores disponibles
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si tenemos un instructor asignado, mostramos su tarjeta
  return (
    <Card>
      <CardHeader>
        {showTitle && (
          <div className="flex items-center mb-2">
            <GraduationCap className="mr-2 h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium">Instructor</h3>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <InstructorCard 
          instructor={instructor} 
          showActions={true} 
          compact={true} 
        />
      </CardContent>
    </Card>
  );
}