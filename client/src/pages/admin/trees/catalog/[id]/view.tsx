import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Leaf, TreePine, Sprout, AlertCircle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import TreeSpeciesIcon from '@/components/ui/tree-species-icon';
import ROUTES from '@/routes';
import { useToast } from '@/hooks/use-toast';

// Helper para obtener estilos de badge según origen
const getOriginBadgeStyles = (origin: string) => {
  switch (origin) {
    case 'Nativo':
      return 'bg-[#cff9c5] text-gray-800';
    case 'Introducido':
      return 'bg-[#c5efff] text-gray-800';
    case 'Naturalizado':
      return 'bg-[#f1e3ff] text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper para obtener color de fondo según tasa de crecimiento
const getGrowthRateBackground = (growthRate: string) => {
  switch (growthRate) {
    case 'Lento':
      return '#a6b2ed';
    case 'Medio':
      return '#efcda5';
    case 'Rapido':
    case 'Rápido':
      return '#99dd9c';
    default:
      return '#e5e7eb';
  }
};

interface TreeSpecies {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  origin: string;
  growthRate: string;
  description?: string;
  imageUrl?: string;
  isEndangered: boolean;
  iconType?: 'system' | 'custom';
  customIconUrl?: string | null;
  climateZone?: string;
  heightMature?: string;
  canopyDiameter?: string;
  lifespan?: string;
  maintenanceRequirements?: string;
  waterRequirements?: string;
  sunRequirements?: string;
  soilRequirements?: string;
  ecologicalBenefits?: string;
  ornamentalValue?: string;
  commonUses?: string;
}

export default function TreeSpeciesDetailView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: species, isLoading, error } = useQuery<TreeSpecies>({
    queryKey: [`/api/tree-species/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/tree-species/${id}`);
      if (!response.ok) {
        throw new Error('Error al cargar la especie');
      }
      return response.json();
    },
    enabled: !!id,
  });

  const handleBack = () => {
    setLocation(ROUTES.admin.trees.species.list);
  };

  const handleEdit = () => {
    if (id) {
      setLocation(ROUTES.admin.trees.species.edit.build(id));
    }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Error al cargar la especie</h3>
            <p className="text-gray-500 mt-2">No se pudo cargar la información de la especie.</p>
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Catálogo
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-96 col-span-1" />
            <Skeleton className="h-96 col-span-2" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!species) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Especie no encontrada</h3>
            <p className="text-gray-500 mt-2">No se encontró la especie solicitada.</p>
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Catálogo
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title={species.commonName}
          subtitle={species.scientificName}
          icon={<Leaf className="h-6 w-6 text-white" />}
          actions={[
            <Button
              key="back"
              variant="outline"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>,
            <Button
              key="edit"
              variant="primary"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>,
          ]}
          backgroundColor="bg-header-background"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna izquierda - Información básica */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="h-5 w-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Icono de la especie */}
                <div className="flex justify-center">
                  <div className="flex items-center justify-center h-32 w-32 rounded-full bg-green-50">
                    <TreeSpeciesIcon
                      iconType={species.iconType || 'system'}
                      customIconUrl={species.customIconUrl || undefined}
                      size={80}
                      className="text-green-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre Común</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{species.commonName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre Científico</label>
                  <p className="text-lg italic text-gray-900 mt-1">{species.scientificName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Familia</label>
                  <p className="text-gray-900 mt-1">{species.family}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Origen</label>
                  <Badge 
                    variant="outline"
                    className={`text-xs px-3 py-1 ${getOriginBadgeStyles(species.origin)}`}
                  >
                    {species.origin}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Tasa de Crecimiento</label>
                  <Badge 
                    variant="outline"
                    className="text-xs px-3 py-1 text-gray-800"
                    style={{ backgroundColor: getGrowthRateBackground(species.growthRate) }}
                  >
                    {species.growthRate}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Estado de Conservación</label>
                  {species.isEndangered ? (
                    <Badge variant="outline" className="inline-flex items-center gap-1 bg-red-100 text-red-800 border-red-300 text-xs px-3 py-1">
                      <AlertCircle className="h-3 w-3" />
                      Amenazada
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="inline-flex items-center gap-1 bg-green-100 text-green-800 border-green-300 text-xs px-3 py-1">
                      Normal
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Detalles */}
          <div className="md:col-span-2 space-y-6">
            {/* Descripción */}
            {species.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{species.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Características y Cultivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  Características y Cultivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información general */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {species.climateZone && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Zona Climática</label>
                      <p className="text-gray-900 mt-1">{species.climateZone}</p>
                    </div>
                  )}

                  {species.lifespan && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Esperanza de Vida</label>
                      <p className="text-gray-900 mt-1">{species.lifespan}</p>
                    </div>
                  )}

                  {species.heightMature && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Altura al Madurar</label>
                      <p className="text-gray-900 mt-1">{species.heightMature}</p>
                    </div>
                  )}

                  {species.canopyDiameter && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Diámetro de Copa</label>
                      <p className="text-gray-900 mt-1">{species.canopyDiameter}</p>
                    </div>
                  )}

                  {species.ornamentalValue && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Valor Ornamental</label>
                      <p className="text-gray-900 mt-1">{species.ornamentalValue}</p>
                    </div>
                  )}

                  {species.commonUses && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Usos Comunes</label>
                      <p className="text-gray-900 mt-1">{species.commonUses}</p>
                    </div>
                  )}
                </div>

                {/* Requerimientos de cultivo */}
                {(species.soilRequirements || species.waterRequirements || species.sunRequirements) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Requerimientos de Cultivo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {species.soilRequirements && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Suelo</label>
                          <p className="text-gray-900 mt-1">{species.soilRequirements}</p>
                        </div>
                      )}

                      {species.waterRequirements && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Agua</label>
                          <p className="text-gray-900 mt-1">{species.waterRequirements}</p>
                        </div>
                      )}

                      {species.sunRequirements && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Sol</label>
                          <p className="text-gray-900 mt-1">{species.sunRequirements}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mantenimiento */}
                {species.maintenanceRequirements && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Requisitos de Mantenimiento</label>
                    <p className="text-gray-700 leading-relaxed">{species.maintenanceRequirements}</p>
                  </div>
                )}

                {/* Beneficios ecológicos */}
                {species.ecologicalBenefits && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Beneficios Ecológicos</label>
                    <p className="text-gray-700 leading-relaxed">{species.ecologicalBenefits}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}