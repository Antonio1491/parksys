import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Users, ChevronLeft, Edit, Trash } from 'lucide-react';

// Tipo para las actividades según la estructura actual de datos
interface Actividad {
  id: number;
  title: string;          // Nombre de la actividad
  description: string;    // Descripción
  category: string;       // Categoría
  parkId: number;         // ID del parque
  parkName?: string;      // Nombre del parque (agregado desde la consulta de parques)
  startDate: string;      // Fecha de inicio
  endDate?: string;       // Fecha fin (opcional)
  location?: string;      // Ubicación dentro del parque
  createdAt: string;
  // Campos adicionales que mostraremos si están disponibles
  capacity?: number;
  price?: number;
  materials?: string;
  requirements?: string;
  duration?: number;      // Duración en minutos
  isRecurring?: boolean;  // Si es recurrente
  recurringDays?: string[]; // Días recurrentes
  instructorId?: number;
  instructor?: {
    id: number;
    full_name: string;
  };
}

// Mapeo de categorías a colores
const CATEGORIAS_COLORES = {
  "Arte y Cultura": "bg-pink-100 text-pink-800",
  "Recreación y Bienestar": "bg-green-100 text-green-800",
  "Eventos de Temporada": "bg-amber-100 text-amber-800",
  "Naturaleza, Ciencia y Conservación": "bg-blue-100 text-blue-800",
};

const DetalleActividadPage = () => {
  const [location, setLocation] = useLocation();
  const [actividadId, setActividadId] = useState<number | null>(null);
  
  // Extraer el ID de la actividad desde la URL
  useEffect(() => {
    const id = location.split('/').pop();
    if (id) {
      setActividadId(parseInt(id));
    }
  }, [location]);
  
  // Obtener los detalles de la actividad
  const { data: actividadRaw, isLoading } = useQuery({
    queryKey: [`/api/activities/${actividadId}`],
    enabled: actividadId !== null,
  });
  
  // Procesar los datos de actividad con valores por defecto para evitar errores
  const actividad = actividadRaw ? {
    id: (actividadRaw as any).id || 0,
    title: (actividadRaw as any).title || 'Actividad sin título',
    description: (actividadRaw as any).description || 'Sin descripción disponible',
    category: (actividadRaw as any).category || 'Sin categoría',
    parkId: (actividadRaw as any).parkId || 0,
    parkName: (actividadRaw as any).parkName || '',
    startDate: (actividadRaw as any).startDate || null,
    endDate: (actividadRaw as any).endDate || null,
    location: (actividadRaw as any).location || null,
    createdAt: (actividadRaw as any).createdAt || new Date().toISOString(),
    capacity: (actividadRaw as any).capacity || null,
    price: (actividadRaw as any).price || null,
    materials: (actividadRaw as any).materials || null,
    requirements: (actividadRaw as any).requirements || null,
    duration: (actividadRaw as any).duration || null,
    isRecurring: (actividadRaw as any).isRecurring || false,
    recurringDays: (actividadRaw as any).recurringDays || [],
    instructorId: (actividadRaw as any).instructorId || null,
    instructorName: (actividadRaw as any).instructorName || null,
    startTime: (actividadRaw as any).startTime || null,
    isFree: (actividadRaw as any).isFree || false
  } : null;

  // Debug: Ver qué datos estamos recibiendo
  console.log('Datos crudos recibidos:', actividadRaw);
  console.log('Actividad procesada:', actividad);
  
  // Obtener el parque relacionado
  const { data: parque } = useQuery({
    queryKey: ['/api/parks', actividad?.parkId],
    enabled: !!actividad?.parkId,
  });
  
  // Obtener el instructor relacionado si existe
  const { data: instructor } = useQuery({
    queryKey: ['/api/instructors', actividad?.instructorId],
    enabled: !!actividad?.instructorId,
  });
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">Cargando detalles de la actividad...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!actividad) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-500">Actividad no encontrada</h2>
            <p className="mt-4 text-gray-500">
              La actividad que estás buscando no existe o ha sido eliminada.
            </p>
            <Button 
              className="mt-6" 
              onClick={() => setLocation('/admin/activities/management')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver al listado
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  const categoriaColor = CATEGORIAS_COLORES[actividad.category as keyof typeof CATEGORIAS_COLORES] || "bg-gray-100 text-gray-800";
  
  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/admin/activities/management')}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver al listado
          </Button>
          
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">{actividad.title}</h1>
            <Badge className={categoriaColor}>
              {actividad.category}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Información principal */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Información de la actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Descripción</h3>
                <p className="text-gray-700 whitespace-pre-line">{actividad.description}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Fechas</h3>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                    <div>
                      <p>Inicio: {actividad.startDate ? 
                          (() => {
                            try {
                              return format(new Date(actividad.startDate), "PPP", { locale: es });
                            } catch (e) {
                              return 'Fecha no disponible';
                            }
                          })() : 'Fecha no disponible'}</p>
                      {actividad.endDate && (
                        <p>Fin: {(() => {
                          try {
                            return format(new Date(actividad.endDate), "PPP", { locale: es });
                          } catch (e) {
                            return 'Fecha no disponible';
                          }
                        })()}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Ubicación</h3>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                    <div>
                      <p>{(parque as any)?.name || actividad.parkName || (actividad.parkId ? `Parque #${actividad.parkId}` : 'Parque no especificado')}</p>
                      {actividad.location && <p>{actividad.location}</p>}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Duración, capacidad, precio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {actividad.duration && (
                  <div>
                    <h3 className="font-medium mb-2">Duración</h3>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{actividad.duration} minutos</span>
                    </div>
                  </div>
                )}
                
                {actividad.capacity && (
                  <div>
                    <h3 className="font-medium mb-2">Capacidad</h3>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{actividad.capacity} personas</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium mb-2">Precio</h3>
                  <div>
                    {actividad.price && Number(actividad.price) > 0 ? (
                      <Badge variant="outline" className="text-yellow-700">
                        ${Number(actividad.price).toFixed(2)} MXN
                      </Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-700 border-0">Gratuita</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Actividad recurrente */}
              {actividad.isRecurring && actividad.recurringDays && actividad.recurringDays.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Actividad recurrente</h3>
                  <div className="flex flex-wrap gap-1">
                    {actividad.recurringDays.map((dia: string) => (
                      <Badge key={dia} variant="outline">
                        {dia.charAt(0).toUpperCase() + dia.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Materiales y requisitos */}
              {(actividad.materials || actividad.requirements) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {actividad.materials && (
                    <div>
                      <h3 className="font-medium mb-2">Materiales</h3>
                      <p className="text-gray-700">{actividad.materials}</p>
                    </div>
                  )}
                  
                  {actividad.requirements && (
                    <div>
                      <h3 className="font-medium mb-2">Requisitos</h3>
                      <p className="text-gray-700">{actividad.requirements}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t bg-gray-50 justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  // Lógica para editar actividad
                  console.log(`Editar actividad ${actividad.id}`);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  // Lógica para eliminar actividad
                  if (window.confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
                    console.log(`Eliminar actividad ${actividad.id}`);
                  }
                }}
              >
                <Trash className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </CardFooter>
          </Card>
          
          {/* Información lateral */}
          <Card>
            <CardHeader>
              <CardTitle>Información adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Instructor */}
              {actividad.instructorId && (
                <div>
                  <h3 className="font-medium mb-2">Instructor</h3>
                  <div className="p-3 border rounded-md">
                    <div className="font-medium">{actividad.instructorName || `Instructor #${actividad.instructorId}`}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      ID: {actividad.instructorId}
                    </div>
                  </div>
                </div>
              )}

              {/* Horario */}
              {actividad.startTime && (
                <div>
                  <h3 className="font-medium mb-2">Horario de inicio</h3>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{actividad.startTime}</span>
                  </div>
                </div>
              )}
              
              {/* Fecha de creación */}
              <div>
                <h3 className="font-medium mb-2">Fecha de creación</h3>
                <div className="text-gray-700">
                  {format(new Date(actividad.createdAt), "PPP", { locale: es })}
                </div>
              </div>
              
              {/* ID para referencia */}
              <div>
                <h3 className="font-medium mb-2">ID de referencia</h3>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                  {actividad.id}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DetalleActividadPage;