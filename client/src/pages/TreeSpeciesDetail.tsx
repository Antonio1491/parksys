import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, TreePine, Users, Calendar, Droplets, Sun, Mountain, Leaf, Home } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import ROUTES from '@/routes';
import { useState } from 'react';
import PublicLayout from '@/components/PublicLayout';

const logoImage = "/images/logo-ambu.png";

interface TreeSpecies {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  origin: string;
  climateZone: string;
  growthRate: string;
  heightMature: number;
  canopyDiameter: number;
  lifespan: number;
  imageUrl: string;
  description: string;
  maintenanceRequirements: string;
  waterRequirements: string;
  sunRequirements: string;
  soilRequirements: string;
  ecologicalBenefits: string;
  ornamentalValue: string;
  commonUses: string;
  isEndangered: boolean;
  iconColor: string;
  iconType: string;
  customIconUrl: string;
  photoUrl: string;
  photoCaption: string;
  createdAt: string;
  updatedAt: string;
}

interface TreeCensus {
  parkId: number;
  parkName: string;
  treeCount: number;
  averageHeight: number;
  healthyCount: number;
  totalTrees: number;
  lastUpdated: string;
}

interface SpeciesDetail {
  species: TreeSpecies;
  census: TreeCensus[];
  totalTrees: number;
  totalParks: number;
}

export default function TreeSpeciesDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'info' | 'census' | 'care'>('info');

  // Obtener datos detallados de la especie
  const { data: speciesData, isLoading } = useQuery<SpeciesDetail>({
    queryKey: ['/api/tree-species', id, 'detail'],
    queryFn: async () => {
      const response = await fetch(`/api/tree-species/${id}/detail`);
      if (!response.ok) throw new Error('Error cargando especie');
      return response.json();
    },
    enabled: !!id
  });

  if (!speciesData) {
    return (
      <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Especie no encontrada</CardTitle>
            <CardDescription>
              La especie que buscas no existe o ha sido eliminada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(ROUTES.public.treeSpecies)} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al catálogo
            </Button>
          </CardContent>
        </Card>
      </div>
      </PublicLayout>
    );
  }

  const { species, census, totalTrees, totalParks } = speciesData;

  return (
    <PublicLayout>
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header con navegación */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.public.treeSpecies)}
            className="mb-4 text-green-600 hover:text-green-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al catálogo
          </Button>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-1/3">
              <div className="relative h-64 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={species.photoUrl || species.imageUrl || '/api/placeholder/400/300'}
                  alt={species.commonName}
                  className="w-full h-full object-cover"
                />
                {species.isEndangered && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="destructive">En peligro</Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full md:w-2/3">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {species.commonName}
              </h1>
              <p className="text-xl text-gray-600 italic mb-4">
                {species.scientificName}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{species.family}</Badge>
                <Badge variant={species.origin === 'Nativo' ? 'default' : 'secondary'}>
                  {species.origin}
                </Badge>
                <Badge variant="outline">{species.growthRate}</Badge>
              </div>
              
              <p className="text-gray-700 leading-relaxed">
                {species.description}
              </p>
              
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{totalTrees}</div>
                  <div className="text-sm text-gray-600">Ejemplares totales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalParks}</div>
                  <div className="text-sm text-gray-600">Parques</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{species.lifespan}</div>
                  <div className="text-sm text-gray-600">Años de vida</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{species.heightMature}m</div>
                  <div className="text-sm text-gray-600">Altura máxima</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'info'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <Leaf className="w-4 h-4 inline mr-2" />
              Información General
            </button>
            <button
              onClick={() => setActiveTab('census')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'census'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              Censo por Parques
            </button>
            <button
              onClick={() => setActiveTab('care')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'care'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <TreePine className="w-4 h-4 inline mr-2" />
              Cuidado y Mantenimiento
            </button>
          </div>
        </div>

        {/* Contenido según pestaña activa */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                  Características Botánicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Familia</h4>
                  <p className="text-gray-700">{species.family}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Origen</h4>
                  <p className="text-gray-700">{species.origin}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Zona Climática</h4>
                  <p className="text-gray-700">{species.climateZone}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Ritmo de Crecimiento</h4>
                  <p className="text-gray-700">{species.growthRate}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Diámetro de Copa</h4>
                  <p className="text-gray-700">{species.canopyDiameter}m</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mountain className="w-5 h-5 text-blue-600" />
                  Beneficios Ecológicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {species.ecologicalBenefits}
                </p>
                <Separator className="my-4" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Valor Ornamental</h4>
                  <p className="text-gray-700">{species.ornamentalValue}</p>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Usos Comunes</h4>
                  <p className="text-gray-700">{species.commonUses}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'census' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Distribución por Parques
                </CardTitle>
                <CardDescription>
                  Censo completo de ejemplares de {species.commonName} en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {census.map((park) => (
                    <Card key={park.parkId} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{park.parkName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total de ejemplares</span>
                          <span className="font-semibold text-green-600">{park.treeCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Altura promedio</span>
                          <span className="font-semibold text-blue-600">{park.averageHeight}m</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Ejemplares saludables</span>
                          <span className="font-semibold text-green-600">{park.healthyCount}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Actualizado: {new Date(park.lastUpdated).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'care' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  Requisitos de Cuidado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Agua
                  </h4>
                  <p className="text-gray-700">{species.waterRequirements}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-yellow-500" />
                    Sol
                  </h4>
                  <p className="text-gray-700">{species.sunRequirements}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Mountain className="w-4 h-4 text-brown-500" />
                    Suelo
                  </h4>
                  <p className="text-gray-700">{species.soilRequirements}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Mantenimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {species.maintenanceRequirements}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
      </div>
    </div>
    </PublicLayout>
  );
}