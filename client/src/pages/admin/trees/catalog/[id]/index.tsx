import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Edit,
  Trash2,
  TreePine,
  Leaf,
  Info,
  CircleAlert,
  CircleCheck,
  CloudRain,
  Sun,
  Flower,
  Bug,
  Sprout,
  Clock,
  Shovel,
} from 'lucide-react';

interface TreeSpecies {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  origin: string;
  climateZone: string | null;
  growthRate: string;
  heightMature: number | null;
  canopyDiameter: number | null;
  lifespan: string | null;
  imageUrl: string | null;
  description: string;
  maintenanceRequirements: string | null;
  waterRequirements: string | null;
  sunRequirements: string | null;
  soilRequirements: string | null;
  ecologicalBenefits: string | null;
  ornamentalValue: string | null;
  commonUses: string | null;
  isEndangered: boolean;
  iconColor: string | null;
  iconType: string | null;
  customIconUrl: string | null;
  photoUrl: string | null;
  photoCaption: string | null;
  createdAt: string;
  updatedAt: string;
}

function TreeSpeciesDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Validar que el ID sea un número válido
  const numericId = parseInt(id as string, 10);
  const isValidId = !isNaN(numericId) && id !== undefined;

  const { data: species, isLoading, error } = useQuery({
    queryKey: [`/api/tree-species/${id}`],
    queryFn: async () => {
      if (!isValidId) {
        throw new Error('ID de especie inválido');
      }
      const response = await fetch(`/api/tree-species/${numericId}`);
      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la especie arbórea');
      }
      return response.json();
    },
    enabled: isValidId, // Solo ejecutar la query si el ID es válido
  });

  // Redirigir si el ID no es válido
  if (!isValidId) {
    setLocation('/admin/trees/catalog');
    return null;
  }

  if (error) {
    toast({
      title: "Error",
      description: "No se pudieron cargar los detalles de la especie arbórea. Por favor, intenta nuevamente.",
      variant: "destructive",
    });
  }

  const handleBack = () => {
    setLocation('/admin/trees/catalog');
  };

  const handleEdit = () => {
    setLocation(`/admin/trees/catalog/${id}/edit`);
  };

  const renderDescription = (text: string | null) => {
    if (!text) return <p className="text-gray-500 italic">No disponible</p>;
    
    return (
      <div className="whitespace-pre-line">
        {text.split('\n').map((paragraph, i) => (
          <p key={i} className="mb-2">{paragraph}</p>
        ))}
      </div>
    );
  };

  const renderDetailItem = (label: string, value: string | null, icon: React.ReactNode) => {
    return (
      <div className="flex items-start gap-2 py-2">
        <div className="mt-0.5 text-green-600">{icon}</div>
        <div>
          <h4 className="font-medium text-gray-900">{label}</h4>
          <p className="text-gray-600">{value || 'No disponible'}</p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <Skeleton className="h-64 w-64 rounded-md" />
                <div className="space-y-4 flex-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>{species?.commonName ? `${species.commonName} | Especies Arbóreas` : 'Detalles de Especie Arbórea'} | ParquesMX</title>
        <meta name="description" content={`Información detallada sobre la especie arbórea ${species?.commonName || ''}`} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800 flex items-center">
              <TreePine className="mr-2 h-8 w-8" />
              {species?.commonName}
            </h1>
            <p className="text-gray-600 mt-1 italic">
              {species?.scientificName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Catálogo
            </Button>
            <Button 
              variant="default"
              onClick={handleEdit}
              className="flex items-center bg-green-600 hover:bg-green-700"
            >
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="informacion-completa" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="informacion-completa">Información Completa</TabsTrigger>
          </TabsList>
          
          {/* Pestaña de Información Completa */}
          <TabsContent value="informacion-completa">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>
                  Datos principales y descripción de la especie arbórea
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3 lg:w-1/4">
                    {species?.imageUrl ? (
                      <div className="rounded-md overflow-hidden border border-gray-200">
                        <img 
                          src={species.imageUrl} 
                          alt={species.commonName} 
                          className="w-full h-auto object-cover aspect-square"
                        />
                      </div>
                    ) : (
                      <div className="rounded-md bg-gray-100 w-full aspect-square flex items-center justify-center border border-gray-200">
                        <Leaf className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="mt-4 space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Familia:</span>
                        <p className="font-medium">{species?.family}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Origen:</span>
                        <div>
                          <Badge variant={species?.origin === 'Nativo' ? 'default' : 'outline'}>
                            {species?.origin}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Tasa de Crecimiento:</span>
                        <p className="font-medium">{species?.growthRate}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Estado de Conservación:</span>
                        <div>
                          {species?.isEndangered ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <CircleAlert className="h-3 w-3" /> Amenazada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1 text-green-600 bg-green-50">
                              <CircleCheck className="h-3 w-3" /> Normal
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Esperanza de Vida:</span>
                        <p className="font-medium">{species?.lifespan || 'No especificada'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Info className="mr-2 h-5 w-5 text-green-600" /> Descripción
                    </h3>
                    {renderDescription(species?.description)}
                    
                    <Separator className="my-6" />
                    
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Leaf className="mr-2 h-5 w-5 text-green-600" /> Beneficios Ecológicos
                    </h3>
                    {renderDescription(species?.ecologicalBenefits)}
                    
                    <Separator className="my-6" />
                    
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Sprout className="mr-2 h-5 w-5 text-green-600" /> Requerimientos de Cultivo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800 flex items-center mb-2">
                          <Shovel className="mr-2 h-4 w-4" /> Suelo
                        </h4>
                        <p className="text-sm text-blue-700">
                          {species?.soilRequirements || 'No especificado'}
                        </p>
                      </div>
                      <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                        <h4 className="font-medium text-cyan-800 flex items-center mb-2">
                          <CloudRain className="mr-2 h-4 w-4" /> Agua
                        </h4>
                        <p className="text-sm text-cyan-700">
                          {species?.waterRequirements || 'No especificado'}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-800 flex items-center mb-2">
                          <Sun className="mr-2 h-4 w-4" /> Sol
                        </h4>
                        <p className="text-sm text-yellow-700">
                          {species?.sunRequirements || 'No especificado'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-purple-800 flex items-center mb-2">
                          <Clock className="mr-2 h-4 w-4" /> Zona Climática
                        </h4>
                        <p className="text-sm text-purple-700">
                          {species?.climateZone || 'No especificada'}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800 flex items-center mb-2">
                          <TreePine className="mr-2 h-4 w-4" /> Usos Comunes
                        </h4>
                        <p className="text-sm text-green-700">
                          {species?.commonUses || 'No especificados'}
                        </p>
                      </div>
                    </div>
                    
                    {species?.ornamentalValue && (
                      <div className="bg-pink-50 p-4 rounded-lg border border-pink-200 mb-4">
                        <h4 className="font-medium text-pink-800 flex items-center mb-2">
                          <Flower className="mr-2 h-4 w-4" /> Valor Ornamental
                        </h4>
                        <p className="text-sm text-pink-700">
                          {species.ornamentalValue}
                        </p>
                      </div>
                    )}
                    
                    {species?.maintenanceRequirements && (
                      <>
                        <Separator className="my-6" />
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <Bug className="mr-2 h-5 w-5 text-green-600" /> Requisitos de Mantenimiento
                        </h3>
                        {renderDescription(species.maintenanceRequirements)}
                      </>
                    )}
                    
                    {species?.notes && (
                      <>
                        <Separator className="my-6" />
                        <h3 className="text-lg font-semibold mb-2">Notas Adicionales</h3>
                        {renderDescription(species.notes)}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

export default TreeSpeciesDetail;
