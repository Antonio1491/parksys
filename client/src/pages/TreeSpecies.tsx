import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Trees, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Leaf, 
  Globe, 
  Award,
  Droplets,
  Sun,
  Clock,
  TreePine,
  Info,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { Link, useLocation } from 'wouter';
const parkImage = "/images/park-lake-bridge.jpg";
import AdSpace from '@/components/AdSpace';

interface TreeSpecies {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  origin: string;
  growthRate: string;
  description?: string;
  ecologicalBenefits?: string;
  maintenanceRequirements?: string;
  climateZone?: string;
  waterRequirements?: string;
  sunRequirements?: string;
  soilRequirements?: string;
  heightMature?: string;
  canopyDiameter?: string;
  lifespan?: string;
  ornamentalValue?: string;
  commonUses?: string;
  photoUrl?: string;
  imageUrl?: string;
  isEndangered: boolean;
  iconType?: string;
  customIconUrl?: string;
}

const growthRateColors = {
  'Lento': 'bg-red-100 text-red-800 border-red-200',
  'Medio': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Rapido': 'bg-green-100 text-green-800 border-green-200'
};

const growthRateLabels = {
  'Lento': 'Lento',
  'Medio': 'Medio', 
  'Rapido': 'Rápido'
};

const originColors = {
  'Nativo': 'bg-blue-100 text-blue-800 border-blue-200',
  'Introducido': 'bg-purple-100 text-purple-800 border-purple-200',
  'Naturalizado': 'bg-teal-100 text-teal-800 border-teal-200'
};

function TreeSpeciesCard({ species, viewMode }: { species: TreeSpecies; viewMode: 'grid' | 'list' }) {
  const growthRateColor = growthRateColors[species.growthRate as keyof typeof growthRateColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  const originColor = originColors[species.origin as keyof typeof originColors] || 'bg-gray-100 text-gray-800 border-gray-200';

  if (viewMode === 'list') {
    return (
      <Link href={`/tree-species/${species.id}`}>
        <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Imagen */}
            <div className="w-32 h-32 flex-shrink-0">
              {(species.photoUrl || species.imageUrl) ? (
                <img 
                  src={species.photoUrl || species.imageUrl} 
                  alt={species.commonName}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    // Si falla la carga, mostrar placeholder
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Trees className="h-16 w-16 text-white opacity-80" />
              </div>
            </div>
            
            {/* Contenido */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{species.commonName}</h3>
                  <p className="text-sm text-gray-500 italic">{species.scientificName}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={growthRateColor}>
                    {growthRateLabels[species.growthRate as keyof typeof growthRateLabels] || species.growthRate}
                  </Badge>
                  <Badge className={originColor}>
                    {species.origin}
                  </Badge>
                  {species.isEndangered && (
                    <Badge variant="destructive">
                      En peligro
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Familia:</span>
                  <span className="font-medium">{species.family}</span>
                </div>
                {species.climateZone && (
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Zona:</span>
                    <span className="font-medium">{species.climateZone}</span>
                  </div>
                )}
                {species.heightMature && (
                  <div className="flex items-center gap-2">
                    <TreePine className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Altura:</span>
                    <span className="font-medium">{species.heightMature}</span>
                  </div>
                )}
                {species.waterRequirements && (
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Agua:</span>
                    <span className="font-medium">{species.waterRequirements}</span>
                  </div>
                )}
              </div>
              
              {species.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{species.description}</p>
              )}
              
              {species.ecologicalBenefits && (
                <div className="mb-4">
                  <h4 className="font-medium text-green-700 mb-1">Beneficios Ecológicos:</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{species.ecologicalBenefits}</p>
                </div>
              )}
              
              {/* Botón Ver más información */}
              <div className="text-center mt-4">
                <Button 
                  className="bg-[#00a587] hover:bg-[#067f5f] text-white px-6 py-2"
                  size="sm"
                >
                  Ver más información
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </Link>
    );
  }

  return (
    <Link href={`/tree-species/${species.id}`}>
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <CardContent className="p-0">
        {/* Imagen */}
        <div className="relative h-48 overflow-hidden">
          {(species.photoUrl || species.imageUrl) ? (
            <img 
              src={species.photoUrl || species.imageUrl} 
              alt={species.commonName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Trees className="h-16 w-16 text-white opacity-80" />
            </div>
          )}
          
          {/* Badges superpuestos */}
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge className={originColor}>
              {species.origin}
            </Badge>
            {species.isEndangered && (
              <Badge variant="destructive">
                En peligro
              </Badge>
            )}
          </div>
        </div>
        
        {/* Contenido */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{species.commonName}</h3>
              <p className="text-sm text-gray-500 italic">{species.scientificName}</p>
            </div>
            <Badge className={growthRateColor}>
              {growthRateLabels[species.growthRate as keyof typeof growthRateLabels] || species.growthRate}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Familia:</span>
              <span className="font-medium">{species.family}</span>
            </div>
            {species.climateZone && (
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Zona:</span>
                <span className="font-medium">{species.climateZone}</span>
              </div>
            )}
          </div>
          
          {species.description && (
            <p className="text-gray-600 text-sm line-clamp-3 mb-4">{species.description}</p>
          )}
          
          {species.ecologicalBenefits && (
            <div className="mb-4">
              <h4 className="font-medium text-green-700 mb-1">Beneficios:</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{species.ecologicalBenefits}</p>
            </div>
          )}
          
          {/* Botón Ver más información */}
          <div className="text-center">
            <Button 
              className="bg-[#00a587] hover:bg-[#067f5f] text-white px-6 py-2"
              size="sm"
            >
              Ver más información
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}

export default function TreeSpecies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState('all');
  const [growthRateFilter, setGrowthRateFilter] = useState('all');
  const [parkFilter, setParkFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Consulta para obtener todas las especies de árboles
  const { data: treeSpeciesResponse, isLoading } = useQuery<{data: TreeSpecies[], pagination: any}>({
    queryKey: ['/api/tree-species'],
    queryFn: async () => {
      const response = await fetch('/api/tree-species?limit=1000'); // Obtener muchos registros para página pública
      if (!response.ok) throw new Error('Error cargando especies arbóreas');
      return response.json();
    }
  });

  // Consulta para obtener todos los parques
  const { data: parksResponse } = useQuery({
    queryKey: ['/api/parks'],
    queryFn: async () => {
      const response = await fetch('/api/parks?limit=100');
      if (!response.ok) throw new Error('Error cargando parques');
      return response.json();
    }
  });

  // Consulta para obtener las asignaciones de especies a parques
  const { data: parkSpeciesResponse } = useQuery({
    queryKey: ['/api/park-tree-species'],
    queryFn: async () => {
      const response = await fetch('/api/park-tree-species');
      if (!response.ok) throw new Error('Error cargando especies por parque');
      return response.json();
    }
  });

  // Extraer los datos de la respuesta
  const treeSpecies = treeSpeciesResponse?.data || [];
  const parks = parksResponse || [];
  const parkSpeciesAssignments = parkSpeciesResponse?.data || [];

  // Filtrar especies
  const filteredSpecies = useMemo(() => {
    if (!Array.isArray(treeSpecies)) return [];
    
    return treeSpecies.filter(species => {
      const matchesSearch = searchTerm === '' || 
        species.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        species.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        species.family.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesOrigin = originFilter === 'all' || species.origin === originFilter;
      const matchesGrowthRate = growthRateFilter === 'all' || species.growthRate === growthRateFilter;
      
      // Filtro por parque
      const matchesPark = parkFilter === 'all' || 
        parkSpeciesAssignments.some((assignment: any) => 
          assignment.speciesId === species.id && assignment.parkId === parseInt(parkFilter)
        );
      
      return matchesSearch && matchesOrigin && matchesGrowthRate && matchesPark;
    });
  }, [treeSpecies, searchTerm, originFilter, growthRateFilter, parkFilter, parkSpeciesAssignments]);

  // Calcular paginación
  const totalItems = filteredSpecies.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSpecies = filteredSpecies.slice(startIndex, startIndex + itemsPerPage);

  // Resetear a página 1 cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, originFilter, growthRateFilter, parkFilter]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="h-8 bg-gray-200 rounded w-96 mx-auto mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header Ad Space - Oculto */}
        {/* 
        <div className="w-full bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-2">
            <AdSpace 
              spaceId="4" 
              position="header" 
              pageType="tree-species" 
              className="w-full"
            />
          </div>
        </div>
        */}

        {/* Hero Section con imagen */}
        <div className="relative h-96 overflow-hidden">
          <img 
            src={parkImage} 
            alt="Parque urbano con árboles" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Leaf className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  <h1 className="font-guttery text-3xl md:text-4xl font-thin">Descubre</h1>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold">
                  Especies Arbóreas
                </h2>
              </div>
              <p className="text-lg md:text-xl text-green-100 mb-8 max-w-2xl mx-auto px-4">
                La diversidad de árboles en nuestros parques urbanos de Guadalajara
              </p>
              <div className="flex items-center justify-center gap-4 text-green-100 flex-wrap">
                <div className="flex items-center gap-2">
                  <TreePine className="h-5 w-5" />
                  <span>{Array.isArray(treeSpecies) ? treeSpecies.length : 0} especies</span>
                </div>
                <Separator orientation="vertical" className="h-6 bg-green-300" />
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <span>{Array.isArray(treeSpecies) ? treeSpecies.filter(s => s.origin === 'Nativo').length : 0} nativas</span>
                </div>
                <Separator orientation="vertical" className="h-6 bg-green-300" />
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <span>{Array.isArray(treeSpecies) ? treeSpecies.filter(s => s.isEndangered).length : 0} en peligro</span>
                </div>
                <Separator orientation="vertical" className="h-6 bg-green-300" />
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <span>{filteredSpecies.length} filtradas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sección de Filtros */}
        <section className="sticky top-0 z-10 border-b border-gray-200 shadow-sm mb-6" style={{backgroundColor: '#19633c'}}>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="rounded-lg shadow-sm p-6" style={{backgroundColor: '#19633c'}}>
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar especies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Select value={parkFilter} onValueChange={setParkFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Parque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los parques</SelectItem>
                      {parks.map((park: any) => (
                        <SelectItem key={park.id} value={park.id.toString()}>
                          {park.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={originFilter} onValueChange={setOriginFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Origen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los orígenes</SelectItem>
                      <SelectItem value="Nativo">Nativo</SelectItem>
                      <SelectItem value="Introducido">Introducido</SelectItem>
                      <SelectItem value="Naturalizado">Naturalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={growthRateFilter} onValueChange={setGrowthRateFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Crecimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los ritmos</SelectItem>
                      <SelectItem value="Lento">Lento</SelectItem>
                      <SelectItem value="Medio">Medio</SelectItem>
                      <SelectItem value="Rapido">Rápido</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="bg-[#00a587] hover:bg-[#067f5f] text-white"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="bg-[#00a587] hover:bg-[#067f5f] text-white"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 pt-8">
          {/* Resultados - Grid expandido sin sidebar */}
          {filteredSpecies.length > 0 ? (
            <>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
                {paginatedSpecies.map((species) => (
                  <TreeSpeciesCard key={species.id} species={species} viewMode={viewMode} />
                ))}
              </div>
              
              {/* Información de paginación */}
              <div className="flex items-center justify-between mt-8 mb-12">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} especies
                </div>
                
                {/* Controles de paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    
                    {/* Números de página */}
                    <div className="flex space-x-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={currentPage === page ? "bg-[#00a587] hover:bg-[#067f5f]" : ""}
                            >
                              {page}
                            </Button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-2 text-gray-500">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Trees className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron especies
              </h3>
              <p className="text-gray-500">
                Intenta ajustar los filtros o el término de búsqueda
              </p>
            </div>
          )}
          
          {/* Banner Publicitario */}
          <div className="mt-12 mb-8">
            <AdSpace spaceId="36" position="banner" pageType="tree-species" />
          </div>
        </div>

        {/* Sección de Contacto */}
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Necesitas más información?</h2>
              <p className="text-lg text-gray-600">Nuestro equipo está aquí para ayudarte</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#51a19f'}}>
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Teléfono</h3>
                <p className="text-gray-600 mb-2">(33) 1234-5678</p>
                <p className="text-sm text-gray-500">Lun-Vie 8:00-16:00</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#51a19f'}}>
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Correo</h3>
                <p className="text-gray-600 mb-2">arbolado@parques.gdl.gob.mx</p>
                <p className="text-sm text-gray-500">Respuesta en 24 horas</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#51a19f'}}>
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ubicación</h3>
                <p className="text-gray-600 mb-2">Av. Hidalgo 400, Centro</p>
                <p className="text-sm text-gray-500">Guadalajara, Jalisco</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 px-8 py-3">
                <Mail className="h-5 w-5 mr-2" />
                Enviar mensaje
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}