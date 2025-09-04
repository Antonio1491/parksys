import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Map, ArrowRight, MapPin, Trees, Users, Calendar, Sparkles, TrendingUp, Zap, Leaf, Shield, Heart, BookOpen, GraduationCap, Target, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ParkCard from '@/components/ParkCard';
import AdSpace from '@/components/AdSpace';
import { ExtendedPark } from '@shared/schema';
const logoImage = "/images/logo-ambu.png";

const Home: React.FC = () => {
  // Estado para forzar actualización de anuncios estáticos
  const [forceUpdateKey, setForceUpdateKey] = useState(Date.now());
  
  // Estado para el índice del carousel
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Escuchar cambios en localStorage para actualizar anuncios
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adForceUpdate') {
        console.log('🔄 Forzando actualización de anuncios en /home por cambio en localStorage');
        setForceUpdateKey(Date.now());
      }
    };

    const handleCustomUpdate = (e: CustomEvent) => {
      console.log('🔄 Forzando actualización de anuncios en /home por evento personalizado');
      setForceUpdateKey(Date.now());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adForceUpdate', handleCustomUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adForceUpdate', handleCustomUpdate as EventListener);
    };
  }, []);
  
  // Fetch a few featured parks
  const { data: parksResponse, isLoading } = useQuery<ExtendedPark[]>({
    queryKey: ['/api/parks'],
  });
  
  // Fetch sponsors para la sección de patrocinadores
  const { data: sponsors = [], isLoading: sponsorsLoading } = useQuery<any[]>({
    queryKey: ['/api/sponsors'],
  });
  
  // Fetch eventos para la sección de eventos
  const { data: eventsResponse = [], isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ['/api/events'],
  });
  
  const allParks = parksResponse || [];
  
  // Filtrar parques sin nombre o marcados como eliminados
  const featuredParks = allParks.filter(park => 
    park.name.trim() !== '' && !park.isDeleted
  );
  
  // Obtener eventos destacados (máximo 3 para la página de inicio)
  const featuredEvents = (eventsResponse || [])
    .filter((event: any) => event.featuredImageUrl) // Solo eventos con imagen
    .slice(0, 3); // Limitar a 3 eventos
  
  // Función para formatear fechas
  const formatEventDate = (startDate: string, endDate: string, startTime?: string) => {
    const start = new Date(startDate);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long' 
    };
    
    if (startTime) {
      return `${start.toLocaleDateString('es-ES', options)} a las ${startTime}`;
    }
    return start.toLocaleDateString('es-ES', options);
  };
  
  // Funciones de navegación del carousel
  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev === featuredParks.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? featuredParks.length - 1 : prev - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-avanzar carousel cada 5 segundos
  useEffect(() => {
    if (featuredParks.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredParks.length]);

  // Función para generar resumen del parque
  const generateParkSummary = (park: ExtendedPark) => {
    const activitiesCount = park.activities?.length || 0;
    const amenitiesCount = park.amenities?.length || 0;
    const area = park.area ? `${park.area} m²` : 'No especificada';
    const parkType = park.parkType || 'Parque urbano';
    
    return {
      activitiesCount,
      amenitiesCount,
      area,
      parkType
    };
  };
  
  return (
    <main className="flex-1">
      {/* 🌟 HERO SECTION - Inspirado en bosquesamg.mx */}
      <section className="relative min-h-screen bg-black overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/hero-background.jpg')"
            }}
          ></div>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-screen flex items-center">
          <div className="max-w-3xl">
            {/* Título principal */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Conoce los
              <span className="block">Parques de México</span>
            </h1>
            
            {/* Subtítulo */}
            <p className="text-2xl md:text-3xl text-gray-200 mb-8 leading-relaxed max-w-2xl">
              Por un futuro más verde,<br />
              árbol por árbol.
            </p>
            
            {/* Badge */}
            <div className="inline-flex items-center bg-black/55 text-white px-8 py-4 rounded-lg text-lg font-semibold mb-6 border border-white/30">
              <MapPin className="mr-3 h-5 w-5" />
              México
            </div>

            {/* Botones CTA */}
            <div className="flex flex-col gap-4 mb-12 items-start">
              <Link href="/parks">
                <Button size="lg" className="bg-[#aaaf4f] hover:bg-[#9ca047] text-white font-semibold px-8 py-4 text-lg rounded-lg transition-all duration-300 hover:scale-105 shadow-xl">
                  <Map className="mr-3 h-5 w-5" />
                  Nuestros parques
                </Button>
              </Link>
              <Link href="/activities">
                <Button size="lg" className="bg-white border-2 border-white text-[#aaaf4f] hover:bg-gray-50 hover:text-[#9ca047] font-semibold px-8 py-4 text-lg rounded-lg transition-all duration-300 hover:scale-105 shadow-lg">
                  <Calendar className="mr-3 h-5 w-5" />
                  Actividades
                </Button>
              </Link>
            </div>
            


          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
      

      {/* 🎯 FEATURED PARKS SECTION RENOVADO */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
              <span style={{ fontFamily: 'Guttery Regular, Georgia, Times, serif', color: '#51a19f', fontWeight: '300' }}>Nuestros</span><br />
              <span style={{ color: '#19633c' }}>Parques Urbanos</span>
            </h2>
            <p className="text-2xl font-bold text-gray-600 max-w-4xl mx-auto leading-relaxed">
              espacios para respirar, convivir y disfrutar
            </p>
          </div>
          
          {/* Carousel de pantalla completa */}
          <div className="relative mb-12 h-[500px] w-screen left-1/2 transform -translate-x-1/2">
            <div className="flex items-center h-full w-full overflow-hidden">
              {isLoading ? (
                // Loading skeleton
                <div className="flex w-full h-full items-center justify-center">
                  <div className="w-[70vw] h-full">
                    <Card className="animate-pulse rounded-3xl overflow-hidden shadow-xl h-full w-full">
                      <div className="h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
                    </Card>
                  </div>
                </div>
              ) : featuredParks.length > 0 ? (
                <div className="flex items-center h-full w-full">
                  {/* Carousel container con vista de 3 tarjetas */}
                  <div className="flex items-center justify-center h-full w-full px-8">
                    {/* Tarjeta anterior (parcial izquierda) */}
                    {featuredParks.length > 1 && (
                      <div className="w-[15vw] h-[90%] opacity-70 scale-95 mr-4">
                        <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-lg">
                          <div 
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${featuredParks[(currentIndex - 1 + featuredParks.length) % featuredParks.length]?.primaryImage || featuredParks[(currentIndex - 1 + featuredParks.length) % featuredParks.length]?.mainImageUrl || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'})`
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40" />
                          <div className="absolute inset-0 flex items-end p-4">
                            <h3 className="text-white font-semibold text-lg truncate">
                              {featuredParks[(currentIndex - 1 + featuredParks.length) % featuredParks.length]?.name}
                            </h3>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tarjeta central (principal) */}
                    <div className="w-[70vw] h-full scale-105 z-20 mx-2">
                      <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl group">
                        {/* Imagen de fondo */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={{
                            backgroundImage: `url(${featuredParks[currentIndex]?.primaryImage || featuredParks[currentIndex]?.mainImageUrl || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'})`
                          }}
                        />
                        
                        {/* Overlay degradado */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        
                        {/* Green Flag Award */}
                        {(featuredParks[currentIndex]?.id === 5 || featuredParks[currentIndex]?.id === 18 || featuredParks[currentIndex]?.id === 4) && (
                          <div className="absolute top-6 right-6 z-30">
                            <img 
                              src="/images/green-flag-award.png" 
                              alt="Green Flag Award" 
                              className="h-20 w-28 object-contain bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Contenido principal */}
                        <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-12 text-white">
                          <div className="max-w-4xl">
                            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">
                              {featuredParks[currentIndex]?.name}
                            </h2>
                            
                            {/* Resumen del parque */}
                            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 mb-4 inline-block">
                              {(() => {
                                const summary = generateParkSummary(featuredParks[currentIndex]);
                                return (
                                  <div className="flex flex-col space-y-1 text-white">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold">Actividades:</span>
                                      <span className="text-base font-bold ml-4">{summary.activitiesCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold">Amenidades:</span>
                                      <span className="text-base font-bold ml-4">{summary.amenitiesCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold">Superficie:</span>
                                      <span className="text-sm font-bold ml-4">{summary.area}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold">Tipo:</span>
                                      <span className="text-sm font-bold ml-4">{summary.parkType}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                            
                            <Link href={`/parque/${featuredParks[currentIndex]?.name.toLowerCase().replace(/\s+/g, '-')}-${featuredParks[currentIndex]?.id}`}>
                              <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-2xl">
                                Conoce más
                                <ArrowRight className="ml-3 h-5 w-5" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta siguiente (parcial derecha) */}
                    {featuredParks.length > 1 && (
                      <div className="w-[15vw] h-[90%] opacity-70 scale-95 ml-4">
                        <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-lg">
                          <div 
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${featuredParks[(currentIndex + 1) % featuredParks.length]?.primaryImage || featuredParks[(currentIndex + 1) % featuredParks.length]?.mainImageUrl || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'})`
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40" />
                          <div className="absolute inset-0 flex items-end p-4">
                            <h3 className="text-white font-semibold text-lg truncate">
                              {featuredParks[(currentIndex + 1) % featuredParks.length]?.name}
                            </h3>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trees className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-xl text-gray-500 mb-4">No hay parques disponibles en este momento</p>
                    <p className="text-gray-400">Pronto estarán disponibles más espacios verdes</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Controles de navegación */}
            {featuredParks.length > 1 && (
              <>
                {/* Flecha izquierda */}
                <button
                  onClick={prevSlide}
                  className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 z-40"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
                
                {/* Flecha derecha */}
                <button
                  onClick={nextSlide}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 z-40"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            )}
          </div>
          
          <div className="text-center mb-12">
            <Link href="/parks">
              <Button size="lg" className="bg-[#19633c] hover:bg-[#145530] text-white font-bold px-10 py-4 text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                Encuentra tu parque favorito
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
          
          {/* Banner publicitario */}
          <div className="w-full my-12">
            <AdSpace 
              spaceId={14} 
              position="banner" 
              pageType="homepage" 
              className="w-full"
            />
          </div>
        </div>
      </section>
      
      {/* EVENTOS SECTION */}
      <section className="py-24" style={{ backgroundColor: '#19633c' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              <span style={{ fontFamily: 'Guttery Regular, Georgia, Times, serif', color: '#ffffff', fontWeight: '300' }}>Disfruta los</span><br />
              <span style={{ color: '#bcd256' }}>Magníficos Eventos</span>
            </h2>
            <p className="text-2xl font-bold text-white max-w-4xl mx-auto leading-relaxed">
              Entérate de todas las actividades recreativas y culturales.
            </p>
          </div>

          {/* Grid de eventos destacados */}
          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-xl h-[500px] flex flex-col animate-pulse">
                  <div className="h-2/3 bg-gray-200"></div>
                  <div className="h-1/3 p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredEvents.map((event: any, index: number) => {
                // Colores dinámicos basados en el tipo de evento
                const eventColors = [
                  { bg: 'bg-orange-100/90', icon: 'text-orange-600', text: 'text-orange-600' },
                  { bg: 'bg-green-100/90', icon: 'text-green-600', text: 'text-green-600' },
                  { bg: 'bg-purple-100/90', icon: 'text-purple-600', text: 'text-purple-600' }
                ];
                const colors = eventColors[index % eventColors.length];
                
                // Enlace dinámico usando el ID real del evento
                const eventLink = `/event/${event.id}`;
                
                return (
                  <Link key={event.id} href={eventLink}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 h-[500px] flex flex-col cursor-pointer">
                      <div className="h-2/3 relative overflow-hidden">
                        <img 
                          src={event.featuredImageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute top-4 left-4 w-12 h-12 ${colors.bg} backdrop-blur-sm rounded-xl flex items-center justify-center`}>
                          <Calendar className={`h-6 w-6 ${colors.icon}`} />
                        </div>
                      </div>
                      <div className="h-1/3 p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                        </div>
                        <div className={`flex items-center text-sm ${colors.text} font-semibold`}>
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatEventDate(event.startDate, event.endDate, event.startTime)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-white py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Próximamente nuevos eventos</p>
              <p className="text-lg opacity-75">Mantente atento a nuestras próximas actividades</p>
            </div>
          )}

          {/* Botón para ver todos los eventos si hay eventos disponibles */}
          {featuredEvents.length > 0 && (
            <div className="text-center">
              <Link href="/events">
                <Button size="lg" className="bg-[#bcd256] hover:bg-[#a8bd4a] text-[#19633c] font-bold px-10 py-4 text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  Ver todos los eventos
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 🏛️ AGENCIA DE BOSQUES URBANOS SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">
              <span style={{ fontFamily: 'Guttery Regular, Georgia, Times, serif', color: '#51a19f', fontWeight: '300' }}>Conoce la</span><br />
              <span style={{ color: '#19633c' }}>Agencia Metropolitana<br />de Bosques Urbanos</span>
            </h2>
            <p className="text-xl font-bold text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Somos un Organismo Público Descentralizado que gestiona y conserva los parques del Área<br />
              Metropolitana de Guadalajara con el objetivo de garantizar el derecho humano a un ambiente sano.
            </p>
          </div>
          
          <div className="grid grid-cols-5 gap-8">
            {/* Columna 2/5 - Texto descriptivo */}
            <div className="col-span-2 flex items-center">
              <div className="text-left">
                <h3 className="leading-tight">
                  <span style={{ fontFamily: 'Guttery Regular, Georgia, Times, serif', color: '#51a19f', fontSize: '3rem', fontWeight: '300' }}>Nuestro</span><br />
                  <span style={{ color: '#51a19f', fontSize: '2.25rem', fontWeight: '400' }}>modelo de gestión</span><br />
                  <span style={{ color: '#19633c', fontSize: '1.5rem', fontWeight: '700' }}>se compone de 4 ejes principales</span>
                </h3>
              </div>
            </div>

            {/* Columna 3/5 - Tarjetas horizontales */}
            <div className="col-span-3">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Eje 1: Gestión y Mantenimiento */}
                <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-102">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#51a19f' }}>
                      <Trees className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Gestión y Mantenimiento</h3>
                    </div>
                  </CardContent>
                </Card>

                {/* Eje 2: Educación Ambiental */}
                <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-102">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#51a19f' }}>
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Educación Ambiental</h3>
                    </div>
                  </CardContent>
                </Card>

                {/* Eje 3: Participación Ciudadana */}
                <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-102">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#51a19f' }}>
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Participación Ciudadana</h3>
                    </div>
                  </CardContent>
                </Card>

                {/* Eje 4: Desarrollo Sustentable */}
                <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-102">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#51a19f' }}>
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Desarrollo Sustentable</h3>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CENTRO METROPOLITANO DE CONSERVACIÓN DE VIDA SILVESTRE URBANO */}
      <section className="py-24" style={{ backgroundColor: '#19633c' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-7 gap-8">
            {/* Columna 5/7 - Imagen (lado izquierdo) */}
            <div className="col-span-5 flex items-center">
              <div className="relative w-full">
                <div className="aspect-[5/3] bg-gradient-to-br from-emerald-200 to-teal-200 rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/attached_assets/CMC2_1754778732652.png"
                    alt="Centro de Conservación de Vida Silvestre - Guacamayas"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Columna 2/7 - Texto (lado derecho) */}
            <div className="col-span-2 flex items-center">
              <div className="text-right">
                <h2 className="leading-tight mb-6">
                  <span style={{ fontFamily: 'Guttery Regular, Georgia, Times, serif', color: '#aaaf4f', fontSize: '3rem', fontWeight: '300' }}>Comprometidos</span><br />
                  <span style={{ color: '#aaaf4f', fontSize: '2.5rem', fontWeight: '400' }}>con la naturaleza</span>
                </h2>
                <p className="text-xl text-green-100 leading-relaxed mb-6 font-bold">
                  Tenemos programas de educación<br />
                  y protección de la flora y fauna
                </p>
                
                <Button size="lg" className="bg-white hover:bg-gray-50 text-gray-900 font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 border border-gray-200 shadow-md">
                  Ver más
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* PATROCINADORES */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Call to action para patrocinadores - MOVIDO ARRIBA */}
          <div className="text-right mb-16">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-16 shadow-xl mb-16 relative overflow-hidden min-h-[400px] flex flex-col justify-center items-end"
              style={{
                backgroundImage: `url('/attached_assets/excited-family-volunteers-celebrating-their-garbag-2025-08-03-03-10-39-utc_1754779889027.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Overlay negro con 50% opacidad */}
              <div className="absolute inset-0 bg-black opacity-50 rounded-3xl"></div>
              
              {/* Contenido con z-index para estar sobre el overlay */}
              <div className="relative z-10">
                <h3 className="text-4xl font-bold text-white mb-4 text-right">¿Quieres colaborar con nosotros?</h3>
                <p className="text-white mb-6 text-xl font-medium text-right">
                  Únete a nuestras alianzas estratégicas y contribuye al desarrollo sostenible de la zona metropolitana
                </p>
                <div className="flex gap-4 justify-end">
                  <Button size="lg" className="bg-white hover:bg-gray-50 font-bold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg" style={{ color: '#51a19f' }}>
                    Ser Voluntario
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" className="bg-white hover:bg-gray-50 font-bold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg" style={{ color: '#51a19f' }}>
                    Servicio Social
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl mb-8">
              <span style={{ color: '#51a19f', fontFamily: 'Guttery Regular, serif', fontWeight: '300' }}>Gracias a nuestros</span>
              <br />
              <span style={{ color: '#19633c' }} className="font-bold">Patrocinadores</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-bold">
              Bosques para Siempre es un programa que funciona como eje rector para la construcción y seguimiento en las alianzas, donativos y/o patrocinios.
            </p>
          </div>
          
          {/* Grid de patrocinadores */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            {sponsorsLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="group">
                  <div className="bg-white rounded-2xl p-4 shadow-lg">
                    <div className="text-center">
                      <div className="w-full h-20 mx-auto bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : sponsors.length > 0 ? (
              // Mostrar patrocinadores reales
              sponsors
                .filter((sponsor: any) => sponsor.status === 'activo' && sponsor.logo) // Solo activos con logo
                .map((sponsor: any, index: number) => (
                  <div key={sponsor.id || index} className="group">
                    <div 
                      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                      onClick={() => {
                        if (sponsor.websiteUrl) {
                          window.open(sponsor.websiteUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      <div className="text-center flex items-center justify-center h-full">
                        <div className="group-hover:scale-105 transition-transform duration-300">
                          <img 
                            src={sponsor.logo} 
                            alt={`Logo de ${sponsor.name}`}
                            className="w-full h-20 mx-auto object-contain rounded-lg"
                            onError={(e) => {
                              // Fallback si la imagen no carga
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="w-full h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-3xl hidden">
                            🏢
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              // Fallback cuando no hay patrocinadores
              <div className="col-span-full text-center py-8">
                <div className="text-gray-400 text-lg mb-2">🤝</div>
                <p className="text-gray-500">Próximamente más patrocinadores se unirán a nuestra causa</p>
              </div>
            )}
          </div>
          
          {/* Botón CTA para ser patrocinador */}
          <div className="text-center mt-16">
            <Button size="lg" className="bg-white hover:bg-gray-50 font-bold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg" style={{ color: '#51a19f' }}>
              ¿Quieres ser patrocinador?
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

        </div>
      </section>

      
      {/* Footer inspirado en bosquesamg.mx */}
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

          {/* Enlaces organizados en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
            {/* Columna 1 */}
            <div className="space-y-3">
              <Link href="/" className="block text-white hover:text-[#bcd256] transition-colors">
                Inicio
              </Link>
              <Link href="/about" className="block text-white hover:text-[#bcd256] transition-colors">
                Nosotros
              </Link>
              <Link href="/activities" className="block text-white hover:text-[#bcd256] transition-colors">
                Eventos
              </Link>
            </div>

            {/* Columna 2 */}
            <div className="space-y-3">
              <Link href="/parks" className="block text-white hover:text-[#bcd256] transition-colors">
                Bosques Urbanos
              </Link>
              <Link href="/education" className="block text-white hover:text-[#bcd256] transition-colors">
                Educación Ambiental
              </Link>
              <Link href="/wildlife-rescue" className="block text-white hover:text-[#bcd256] transition-colors">
                Rescate de Fauna
              </Link>
            </div>

            {/* Columna 3 */}
            <div className="space-y-3">
              <Link href="/transparency" className="block text-white hover:text-[#bcd256] transition-colors">
                Transparencia
              </Link>
              <Link href="/bids" className="block text-white hover:text-[#bcd256] transition-colors">
                Licitaciones
              </Link>
              <Link href="/blog" className="block text-white hover:text-[#bcd256] transition-colors">
                Blog
              </Link>
            </div>

            {/* Columna 4 */}
            <div className="space-y-3">
              <Link href="/faq" className="block text-white hover:text-[#bcd256] transition-colors">
                Preguntas Frecuentes
              </Link>
              <Link href="/help" className="block text-white hover:text-[#bcd256] transition-colors">
                Quiero Ayudar
              </Link>
              <Link href="/contact" className="block text-white hover:text-[#bcd256] transition-colors">
                Contacto
              </Link>
            </div>

            {/* Columna 5 - Servicios */}
            <div className="space-y-3">
              <h4 className="font-semibold text-[#bcd256] mb-2">Servicios</h4>
              <Link href="/instructors" className="block text-white hover:text-[#bcd256] transition-colors">
                Instructores
              </Link>
              <Link href="/concessions" className="block text-white hover:text-[#bcd256] transition-colors">
                Concesiones
              </Link>
              <Link href="/tree-species" className="block text-white hover:text-[#bcd256] transition-colors">
                Especies Arbóreas
              </Link>
            </div>

            {/* Columna 6 - Participación */}
            <div className="space-y-3">
              <h4 className="font-semibold text-[#bcd256] mb-2">Participa</h4>
              <Link href="/volunteers" className="block text-white hover:text-[#bcd256] transition-colors">
                Voluntariado
              </Link>
              <Link href="/reports" className="block text-white hover:text-[#bcd256] transition-colors">
                Reportar Incidentes
              </Link>
              <Link href="/suggestions" className="block text-white hover:text-[#bcd256] transition-colors">
                Sugerencias
              </Link>
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
    </main>
  );
};

export default Home;