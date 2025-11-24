import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExtendedPark } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import ParkDetail from '@/components/ParkDetail';
import ExtendedParksList from '@/components/ExtendedParksList';
import PublicLayout from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Trees, 
  Users, 
  Compass, 
  Phone, 
  Mail 
} from 'lucide-react';
import AdSpaceIntelligent from '@/components/AdSpaceIntelligent';

const heroImage = "/images/parks-hero.jpg";

const Parks: React.FC = () => {
  const [filters, setFilters] = useState<{
    search?: string;
    parkType?: string;
    postalCode?: string;
    amenityIds?: number[];
  }>({});
  
  const [selectedParkId, setSelectedParkId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Sin paginación - mostrar todos los parques
  
  // Reset scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Build query string from filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.parkType) params.append('parkType', filters.parkType);
    if (filters.postalCode) params.append('postalCode', filters.postalCode);

    if (filters.amenityIds && filters.amenityIds.length > 0) {
      params.append('amenities', filters.amenityIds.join(','));
    }
    
    return params.toString() ? `?${params.toString()}` : '';
  };
  
  // Fetch parks with filters
  const { data: parksResponse, isLoading } = useQuery<{data: ExtendedPark[]}>({
    queryKey: [`/api/parks${buildQueryString()}`],
    queryFn: () => apiRequest(`/api/parks${buildQueryString()}`),
  });
  
  const allParks = parksResponse?.data || [];
  
  // Filtrar parques sin nombre o marcados como eliminados - agregar programación defensiva
  const filteredParks = Array.isArray(allParks) ? allParks.filter(park => 
    park.name && park.name.trim() !== '' && (park.isDeleted === false || park.isDeleted === undefined || park.isDeleted === null)
  ) : [];

  // Mostrar todos los parques sin paginación
  const totalParks = filteredParks.length;
  const parks = filteredParks; // Mostrar todos los parques

  // Function to scroll to results section
  const scrollToResults = () => {
    const resultsSection = document.getElementById('resultados-busqueda');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Sin función de cambio de página ya que no hay paginación
  
  // Fetch detailed park data when selected
  const { data: selectedPark, isLoading: isLoadingPark } = useQuery<ExtendedPark>({
    queryKey: [selectedParkId ? `/api/parks/${selectedParkId}` : ''],
    queryFn: () => apiRequest(`/api/parks/${selectedParkId}`),
    enabled: !!selectedParkId,
  });
  
  const handleApplyFilters = (newFilters: {
    search?: string;
    parkType?: string;
    postalCode?: string;
    municipality?: string;
    amenityIds?: number[];
  }) => {
    setFilters(newFilters);
  };
  
  const handleSelectPark = (parkId: number) => {
    setSelectedParkId(parkId);
    setModalOpen(true);
  };
  
  const [mapExpanded, setMapExpanded] = useState(false);

  const toggleMapExpansion = () => {
    setMapExpanded(!mapExpanded);
  };

  // Calcular estadísticas para el hero
  const uniqueTypes = new Set(filteredParks.map(park => park.parkType)).size;
  const totalAmenities = filteredParks.reduce((acc, park) => acc + (park.amenities?.length || 0), 0);
  const averageAmenities = filteredParks.length > 0 ? Math.round(totalAmenities / filteredParks.length) : 0;

  return (
    <PublicLayout>
      {/* Hero Section con imagen de fondo */}
      <div 
        className="relative text-white"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Compass className="h-12 w-12 md:h-10 md:w-10 text-white" />
                <span className="font-guttery font-thin text-white">
                  Nuestros
                </span>
              </div>
              <div className="font-poppins font-bold text-white">
                Parques y Bosques
              </div>
            </h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Descubre los espacios públicos más emblemáticos del país, pertenecientes al Sistema de Parques de México.
            </p>
            <div className="flex items-center justify-center gap-4 text-green-100">
              <div className="flex items-center gap-2">
                <Trees className="h-5 w-5" />
                <span>{totalParks} parques</span>
              </div>
              <div className="w-px h-6 bg-green-300"></div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{uniqueTypes} tipos</span>
              </div>
              <div className="w-px h-6 bg-green-300"></div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{averageAmenities} amenidades prom.</span>
              </div>
            </div>
          </div>
        </div>
      </div>



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filtros modernos - TEMPORALMENTE DESACTIVADO */}
        {/* 
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Encuentra tu Parque Ideal</h3>
            </div>
            <SimpleFilterSidebar onApplyFilters={handleApplyFilters} />
          </div>
        </div>
        */}



        {/* Contenido Principal - Ancho completo */}
        <div className="mb-8" id="resultados-busqueda">
          <div className="bg-white rounded-2xl shadow-sm border p-6">

            
            <ExtendedParksList 
              parks={parks}
              isLoading={isLoading}
              onParkSelect={(park: ExtendedPark) => {
                setSelectedParkId(park.id);
                setModalOpen(true);
              }}
            />
          </div>
        </div>

        {/* Sin paginación - todos los parques se muestran */}

        {/* Espacio Publicitario - Footer */}
        <div className="mt-8 mb-6">
          <AdSpaceIntelligent 
            pageType="parks" 
            position="footer" 
          />
        </div>
      </div>

      {/* Modal de detalle del parque */}
      {selectedPark && (
        <ParkDetail 
          park={selectedPark}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}

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
              <p className="text-gray-600 mb-2">parques@guadalajara.gob.mx</p>
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
    </PublicLayout>
  );
};

export default Parks;