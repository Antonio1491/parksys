import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExtendedPark } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
// Filtros completamente eliminados para simplificar interfaz
import ParksMap from '@/components/ParksMap';
import ParksList from '@/components/ParksList';
import ParkDetail from '@/components/ParkDetail';
import ExtendedParksList from '@/components/ExtendedParksList';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MapPin, Trees, Users, Search, Compass, Phone, Mail } from 'lucide-react';
const heroImage = "/images/parks-hero.jpg";
const logoImage = "/images/logo-ambu.png";
import AdSpaceIntelligent from '@/components/AdSpaceIntelligent';
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
    park.name.trim() !== '' && !park.isDeleted
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando parques...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow bg-gray-50">
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

        {/* Banner publicitario que respeta el contenedor */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-8 mb-8 border">
          <div className="relative h-[150px]">
            {/* Banner de Gatorade como ejemplo directo */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600">
              <div className="flex items-center justify-between w-full px-8">
                <div className="text-white">
                  <h2 className="text-4xl font-black mb-2">GATORADE</h2>
                  <p className="text-lg font-semibold opacity-90">FUEL YOUR FIRE</p>
                  <p className="text-sm mt-2">¡Hidratación que potencia tu rendimiento!</p>
                </div>
                <div className="text-right text-white">
                  <div className="w-16 h-24 bg-white/20 rounded-lg flex flex-col items-center justify-center mb-2">
                    <div className="w-10 h-16 bg-orange-400 rounded-md relative">
                      <div className="w-8 h-3 bg-white rounded-sm absolute top-1 left-1"></div>
                      <div className="text-xs text-white font-bold absolute top-4 left-2">G</div>
                    </div>
                  </div>
                  <p className="text-xs opacity-80">Bebida deportiva</p>
                </div>
                <div className="absolute top-4 right-4 opacity-30 text-2xl">
                  ⚡ ⚡ ⚡
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Espacio Publicitario - Footer */}
        <div className="mt-8 mb-6">
          <AdSpaceIntelligent 
            pageType="parks" 
            position="footer" 
            layoutConfig={{
              responsive: true,
              maxWidth: "100%",
              minHeight: "80px"
            }}
            enableAnalytics={true}
            className="w-full"
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
      </main>

      {/* Footer institucional */}
      <footer className="bg-gradient-to-b from-[#067f5f] to-[#00a587] text-white">
        {/* Logo y descripción principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <img 
              src={logoImage} 
              alt="Agencia Metropolitana de Bosques Urbanos" 
              className="h-16 w-auto mx-auto mb-6 filter brightness-0 invert"
            />
            <h2 className="text-2xl font-bold mb-4">Agencia Metropolitana de Bosques Urbanos</h2>
            <p className="text-lg text-emerald-100 max-w-3xl mx-auto">
              Fortalecemos el tejido social a través de espacios verdes que conectan comunidades, 
              promueven la sostenibilidad y mejoran la calidad de vida en nuestra área metropolitana.
            </p>
          </div>

          {/* Enlaces organizados en columnas */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-[#bcd256] mb-4">Parques</h4>
              <ul className="space-y-2 text-sm text-emerald-100">
                <li><a href="/parks" className="hover:text-white transition-colors">Directorio</a></li>
                <li><a href="/activities" className="hover:text-white transition-colors">Actividades</a></li>
                <li><a href="/tree-species" className="hover:text-white transition-colors">Arbolado</a></li>
                <li><a href="/concessions" className="hover:text-white transition-colors">Concesiones</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#bcd256] mb-4">Comunidad</h4>
              <ul className="space-y-2 text-sm text-emerald-100">
                <li><a href="/volunteers" className="hover:text-white transition-colors">Voluntarios</a></li>
                <li><a href="/instructors" className="hover:text-white transition-colors">Instructores</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Eventos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Noticias</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#bcd256] mb-4">Servicios</h4>
              <ul className="space-y-2 text-sm text-emerald-100">
                <li><a href="#" className="hover:text-white transition-colors">Mantenimiento</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Consultoría</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Capacitación</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Evaluación</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#bcd256] mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm text-emerald-100">
                <li><a href="#" className="hover:text-white transition-colors">Guías</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Manuales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Biblioteca</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Investigación</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#bcd256] mb-4">Transparencia</h4>
              <ul className="space-y-2 text-sm text-emerald-100">
                <li><a href="#" className="hover:text-white transition-colors">Informes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Presupuesto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Licitaciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Auditoría</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#bcd256] mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-emerald-100">
                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Accesibilidad</a></li>
              </ul>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="border-t border-emerald-500/30 pt-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-[#bcd256] mb-2">Dirección</h4>
                <p className="text-emerald-100 text-sm">
                  Av. Alcalde 1351, Miraflores<br/>
                  44270 Guadalajara, Jalisco
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#bcd256] mb-2">Contacto</h4>
                <p className="text-emerald-100 text-sm">
                  Tel: (33) 3837-4400<br/>
                  bosques@guadalajara.gob.mx
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#bcd256] mb-2">Horarios</h4>
                <p className="text-emerald-100 text-sm">
                  Lunes a Viernes: 8:00 - 15:00<br/>
                  Fines de semana: Espacios abiertos
                </p>
              </div>
            </div>
            
            <div className="text-sm text-emerald-200">
              © {new Date().getFullYear()} Agencia Metropolitana de Bosques Urbanos de Guadalajara. 
              Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Parks;