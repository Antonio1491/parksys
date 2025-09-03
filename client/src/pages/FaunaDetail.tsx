import React from 'react';
import { Link, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Bird, 
  Bug, 
  Fish, 
  Rabbit, 
  TreePine,
  MapPin, 
  Calendar, 
  Clock, 
  Shield, 
  Heart,
  Eye,
  Leaf,
  Info,
  AlertTriangle,
  Star,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PublicLayout from '@/components/PublicLayout';
import AdSpace from '@/components/AdSpace';

interface FaunaSpecies {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  category: 'aves' | 'mamiferos' | 'reptiles' | 'anfibios' | 'insectos' | 'peces';
  habitat?: string;
  description?: string;
  behavior?: string;
  diet?: string;
  reproductionPeriod?: string;
  conservationStatus: 'estable' | 'vulnerable' | 'en_peligro' | 'critico' | 'extinto_silvestre';
  sizeCm?: string;
  weightGrams?: string;
  lifespan?: number;
  isNocturnal?: boolean;
  isMigratory?: boolean;
  isEndangered?: boolean;
  imageUrl?: string;
  photoUrl?: string;
  photoCaption?: string;
  ecologicalImportance?: string;
  threats?: string;
  protectionMeasures?: string;
  observationTips?: string;
  bestObservationTime?: string;
  iconColor?: string;
}

const categoryConfig = {
  'aves': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Bird, gradient: 'from-blue-500 to-blue-600' },
  'mamiferos': { bg: 'bg-green-100', text: 'text-green-800', icon: Rabbit, gradient: 'from-green-500 to-green-600' },
  'reptiles': { bg: 'bg-orange-100', text: 'text-orange-800', icon: TreePine, gradient: 'from-orange-500 to-orange-600' },
  'anfibios': { bg: 'bg-teal-100', text: 'text-teal-800', icon: Fish, gradient: 'from-teal-500 to-teal-600' },
  'insectos': { bg: 'bg-purple-100', text: 'text-purple-800', icon: Bug, gradient: 'from-purple-500 to-purple-600' },
  'peces': { bg: 'bg-cyan-100', text: 'text-cyan-800', icon: Fish, gradient: 'from-cyan-500 to-cyan-600' }
};

const conservationColors = {
  'estable': { bg: 'bg-green-100', text: 'text-green-800', label: 'Estable', color: 'green' },
  'vulnerable': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Vulnerable', color: 'yellow' },
  'en_peligro': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'En Peligro', color: 'orange' },
  'critico': { bg: 'bg-red-100', text: 'text-red-800', label: 'Crítico', color: 'red' },
  'extinto_silvestre': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Extinto en Silvestre', color: 'gray' }
};

export default function FaunaDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: species, isLoading, error } = useQuery<FaunaSpecies>({
    queryKey: ['/api/fauna/public/species', id],
    queryFn: async () => {
      if (!id) throw new Error('ID no proporcionado');
      
      const response = await fetch(`/api/fauna/public/species/${id}`);
      
      if (!response.ok) {
        throw new Error('Especie no encontrada');
      }
      
      return response.json();
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información de la especie...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !species) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Bird className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Especie no encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              La especie que buscas no está disponible o fue removida del catálogo.
            </p>
            <Link href="/fauna">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Fauna
              </Button>
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const config = categoryConfig[species.category];
  const conservationConfig = conservationColors[species.conservationStatus];
  const IconComponent = config.icon;

  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
        {/* Botón de regreso */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/fauna">
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Fauna
              </Button>
            </Link>
          </div>
        </div>

        {/* Imagen principal */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="aspect-video relative overflow-hidden">
              <img
                src={species.imageUrl || species.photoUrl || '/images/default-fauna.jpg'}
                alt={species.commonName}
                className="w-full h-full object-cover bg-gray-100"
              />
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* Información superpuesta */}
              <div className="absolute bottom-8 left-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-full">
                      <IconComponent className="h-6 w-6 text-gray-700" />
                    </div>
                    <Badge className={`${config.bg} ${config.text} text-sm`}>
                      {species.category.charAt(0).toUpperCase() + species.category.slice(1)}
                    </Badge>
                    <Badge className={`${conservationConfig.bg} ${conservationConfig.text} text-sm`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {conservationConfig.label}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{species.commonName}</h1>
                  <p className="text-lg italic text-gray-600 mb-2">{species.scientificName}</p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Leaf className="h-4 w-4" />
                    <span>Familia: {species.family}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información básica */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{species.commonName}</CardTitle>
                      <p className="text-lg italic text-gray-600 mb-3">{species.scientificName}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={`${config.bg} ${config.text} border`}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {species.category.charAt(0).toUpperCase() + species.category.slice(1)}
                        </Badge>
                        <Badge className={`${conservationConfig.bg} ${conservationConfig.text}`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {conservationConfig.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-700 mb-1">
                        Familia: {species.family}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {species.description && (
                    <p className="text-gray-700 mb-6 leading-relaxed">{species.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {species.sizeCm && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">Tamaño</div>
                          <div>{species.sizeCm}</div>
                        </div>
                      </div>
                    )}
                    
                    {species.weightGrams && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Star className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="font-medium">Peso</div>
                          <div>{species.weightGrams}</div>
                        </div>
                      </div>
                    )}
                    
                    {species.lifespan && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Longevidad</div>
                          <div>{species.lifespan} años</div>
                        </div>
                      </div>
                    )}
                    
                    {species.habitat && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <div>
                          <div className="font-medium">Hábitat</div>
                          <div>{species.habitat}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {(species.isNocturnal || species.isMigratory || species.isEndangered) && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {species.isNocturnal && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Nocturno
                        </Badge>
                      )}
                      {species.isMigratory && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <Calendar className="h-3 w-3 mr-1" />
                          Migratorio
                        </Badge>
                      )}
                      {species.isEndangered && (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Protegida
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comportamiento y Dieta */}
              {(species.behavior || species.diet) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      Comportamiento y Alimentación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {species.behavior && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Comportamiento</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{species.behavior}</p>
                        </div>
                      )}
                      {species.diet && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Alimentación</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{species.diet}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reproducción y Ecología */}
              {(species.reproductionPeriod || species.ecologicalImportance) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-green-600" />
                      Reproducción e Importancia Ecológica
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {species.reproductionPeriod && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Periodo Reproductivo</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{species.reproductionPeriod}</p>
                        </div>
                      )}
                      {species.ecologicalImportance && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Importancia Ecológica</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{species.ecologicalImportance}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conservación */}
              {(species.threats || species.protectionMeasures) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      Estado de Conservación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {species.threats && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Amenazas</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{species.threats}</p>
                        </div>
                      )}
                      {species.protectionMeasures && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Medidas de Protección</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{species.protectionMeasures}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Observación */}
              {(species.observationTips || species.bestObservationTime) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-blue-600" />
                      Guía de Observación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {species.observationTips && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Consejos de Observación</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{species.observationTips}</p>
                        </div>
                      )}
                      {species.bestObservationTime && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Mejor Horario</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{species.bestObservationTime}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Datos rápidos */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Datos Principales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Badge className={`${conservationConfig.bg} ${conservationConfig.text} mb-2`}>
                        {conservationConfig.label}
                      </Badge>
                      <div className="text-xs text-gray-600">Estado de conservación</div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Categoría:</span>
                        <span className="text-gray-900">{species.category.charAt(0).toUpperCase() + species.category.slice(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Familia:</span>
                        <span className="text-gray-900">{species.family}</span>
                      </div>
                      {species.sizeCm && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Tamaño:</span>
                          <span className="text-gray-900">{species.sizeCm}</span>
                        </div>
                      )}
                      {species.weightGrams && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Peso:</span>
                          <span className="text-gray-900">{species.weightGrams}</span>
                        </div>
                      )}
                      {species.lifespan && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Longevidad:</span>
                          <span className="text-gray-900">{species.lifespan} años</span>
                        </div>
                      )}
                      {species.habitat && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Hábitat:</span>
                          <span className="text-gray-900">{species.habitat}</span>
                        </div>
                      )}
                    </div>

                    {(species.isNocturnal || species.isMigratory || species.isEndangered) && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          {species.isNocturnal && (
                            <div className="flex items-center gap-2 text-purple-600">
                              <Clock className="h-4 w-4" />
                              <span>Actividad nocturna</span>
                            </div>
                          )}
                          {species.isMigratory && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Calendar className="h-4 w-4" />
                              <span>Especie migratoria</span>
                            </div>
                          )}
                          {species.isEndangered && (
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Bajo protección</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Llamada a la acción */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-green-600" />
                    ¿La has visto?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Ayúdanos a documentar la biodiversidad urbana reportando tus avistamientos.
                  </p>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <Camera className="h-4 w-4 mr-2" />
                    Reportar Avistamiento
                  </Button>
                </CardContent>
              </Card>

              {/* Publicidad lateral */}
              <AdSpace placement="lateral" />
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}