import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, MapPin, Building, Phone, Calendar, Store, Users, X, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import PublicLayout from '@/components/PublicLayout';
import AdSpace from '@/components/AdSpace';
const heroImage = "/images/concessions-hero.jpg";

interface Concession {
  id: number;
  name: string;
  description: string;
  concession_type_id: number;
  concessionaire_id: number;
  park_id: number;
  specific_location: string;
  start_date: string;
  end_date: string;
  status: string;
  priority: string;
  monthly_payment: string;
  operating_hours: string;
  operating_days: string;
  emergency_contact: string;
  emergency_phone: string;
  concessionTypeName: string;
  concessionTypeDescription: string;
  impactLevel: string;
  concessionaireName: string;
  concessionaireEmail: string;
  concessionairePhone?: string;
  parkName: string;
  parkLocation: string;
  imageCount: number;
  primaryImage?: string;
}

export default function ConcessionsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [parkFilter, setParkFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const { data: concessionsResponse, isLoading } = useQuery({
    queryKey: ['/api/active-concessions'],
  });

  const { data: parksResponse } = useQuery({
    queryKey: ['/api/parks'],
  });

  // El endpoint /api/active-concessions devuelve directamente un array, no un objeto con data
  const concessions = Array.isArray(concessionsResponse) ? concessionsResponse : [];
  const parks = Array.isArray(parksResponse) ? parksResponse : (parksResponse as any)?.data || [];

  // Debug logging
  console.log('🏪 CONCESSIONS DEBUG:', {
    concessionsLength: concessions.length,
    concessionsResponse: concessionsResponse,
    firstConcession: concessions[0],
    parksLength: parks.length
  });



  // Filtrar concesiones activas solamente
  const filteredConcessions = concessions.filter((concession: Concession) => {
    // Solo mostrar concesiones con status "activa"
    if (concession.status !== 'activa') return false;
    
    const matchesSearch = (concession.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (concession.concessionTypeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (concession.specific_location || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || (concession.concessionTypeName || "").includes(typeFilter);
    const matchesPark = parkFilter === "all" || concession.park_id?.toString() === parkFilter;
    
    return matchesSearch && matchesType && matchesPark;
  });

  // Paginación
  const totalPages = Math.ceil(filteredConcessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentConcessions = filteredConcessions.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setParkFilter("all");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative text-white py-24"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Store className="h-10 w-10" />
              <h1 className="font-guttery text-4xl md:text-5xl font-normal">
                Conoce
              </h1>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Servicios Comerciales
            </h2>
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto mb-8">
              Descubre todos los servicios comerciales disponibles en nuestros parques urbanos
            </p>
            <div className="flex items-center justify-center gap-4 text-green-100">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{parks.length} parques</span>
              </div>
              <Separator orientation="vertical" className="h-6 bg-green-300" />
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                <span>{concessions.length} concesiones activas</span>
              </div>
              <Separator orientation="vertical" className="h-6 bg-green-300" />
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{Array.from(new Set(concessions.map((c: Concession) => c.concessionaire_id))).length} concesionarios</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros - Movidos pegados al hero */}
      <div className="py-6" style={{backgroundColor: '#19633c'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg shadow-sm p-4" style={{backgroundColor: '#19633c'}}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 h-4 w-4" />
                <Input
                  placeholder="Buscar concesiones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/90 focus:border-green-400 focus:ring-green-400 placeholder-gray-600"
                />
              </div>

              {/* Filtro por tipo */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-white/90 text-gray-800">
                  <SelectValue placeholder="Tipo de concesión" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="Venta de alimentos">Venta de alimentos</SelectItem>
                  <SelectItem value="Renta de bicicletas">Renta de bicicletas</SelectItem>
                  <SelectItem value="Kiosco de información">Kiosco de información</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro por parque */}
              <Select value={parkFilter} onValueChange={setParkFilter}>
                <SelectTrigger className="bg-white/90 text-gray-800">
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
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-white">
                Mostrando {filteredConcessions.length} de {concessions.length} concesiones
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="bg-white text-gray-900 border-white hover:bg-gray-100"
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Espaciado entre filtros y resultados */}
      <div className="py-8"></div>

      {/* Resultados */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Lista de concesiones - Diseño horizontal */}
        <div className="space-y-4 mb-8">
              {currentConcessions.map((concession: Concession) => (
            <div key={concession.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row h-auto md:h-48">
                {/* Image Section - Horizontal Layout */}
                <div className="w-full md:w-80 h-48 md:h-full bg-gradient-to-br from-[#00a587] via-[#067f5f] to-[#8498a5] relative overflow-hidden flex-shrink-0">
                  {concession.primaryImage ? (
                    <img
                      src={concession.primaryImage}
                      alt={concession.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-center">
                        <Building className="w-12 h-12 mx-auto mb-2 opacity-80" />
                        <p className="text-sm font-medium opacity-90">{concession.concessionTypeName}</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      concession.status === 'activa' || concession.status === 'active'
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {concession.status}
                    </span>
                  </div>
                </div>
                
                {/* Content Section - Expanded to fill remaining space */}
                <div className="flex-1 p-6 flex flex-col justify-between min-h-0">
                  <div className="flex-1">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3">
                      <div className="flex-1 mb-3 lg:mb-0">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {concession.name}
                        </h3>
                        <p className="text-sm text-[#00a587] font-medium">{concession.concessionTypeName}</p>
                      </div>
                      
                      <div className="lg:ml-6">
                        <Link href={`/concession/${concession.id}`}>
                          <Button className="bg-[#00a587] text-white hover:bg-[#067f5f] whitespace-nowrap">
                            Ver detalles
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{concession.specific_location}</span>
                      </div>
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{concession.parkName}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{concession.emergency_phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="text-xs">{new Date(concession.start_date).toLocaleDateString('es-ES')} - {new Date(concession.end_date).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            {[...Array(Math.min(5, totalPages))].map((_, index) => {
              const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + index;
              if (pageNumber > totalPages) return null;
              
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={currentPage === pageNumber ? "bg-[#00a587] text-white" : ""}
                >
                  {pageNumber}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}

        {/* Banner Publicitario al Final */}
        <div className="flex justify-center mb-8">
          <div className="max-w-2xl w-full">
            <AdSpace spaceId="35" position="banner" pageType="concessions" />
          </div>
        </div>
      </div>

      {/* Sección Necesitas más Información */}
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
              <p className="text-gray-600 mb-2">concesiones@parques.gdl.gob.mx</p>
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