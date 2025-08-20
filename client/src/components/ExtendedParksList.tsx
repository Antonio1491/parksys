import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ExtendedPark, Amenity } from '@shared/schema';
import { MapPin, Clock, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AmenityIcon from './AmenityIcon';
const greenFlagLogo = "/images/green-flag-logo.jpg";

interface ExtendedParksListProps {
  parks: ExtendedPark[];
  isLoading: boolean;
  onParkSelect: (park: ExtendedPark) => void;
}

// Función para generar slug del parque
const generateParkSlug = (parkName: string, parkId: number) => {
  return parkName
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + parkId;
};

function ExtendedParksList({ parks, isLoading, onParkSelect }: ExtendedParksListProps) {
  // Función para verificar si el parque tiene certificaciones
  const hasCertifications = (park: ExtendedPark) => {
    return park.certificaciones && park.certificaciones.trim().length > 0;
  };

  // Función para verificar si el parque tiene Green Flag Award
  const hasGreenFlag = (park: ExtendedPark) => {
    if (!park.certificaciones) return false;
    const certs = park.certificaciones.toLowerCase();
    return certs.includes('green flag') || certs.includes('bandera verde');
  };

  // Función para obtener el número de certificaciones
  const getCertificationsCount = (park: ExtendedPark) => {
    if (!park.certificaciones) return 0;
    return park.certificaciones.split(',').filter(cert => cert.trim().length > 0).length;
  };

  // Amenidades simplificadas - sin consulta automática
  const amenities: Amenity[] = [];

  const getAmenityName = (amenityId: number) => {
    const amenity = amenities.find(a => a.id === amenityId);
    return amenity ? amenity.name : 'Amenidad';
  };

  const getAmenityIcon = (amenityId: number) => {
    const amenity = amenities.find(a => a.id === amenityId);
    return amenity ? amenity.icon : 'default';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton que simula la nueva distribución de grilla */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse aspect-[3/2]">
              <div className="w-full h-full bg-gray-200"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse aspect-[3/2]">
              <div className="w-full h-full bg-gray-200"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse aspect-[16/6]">
            <div className="w-full h-full bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (parks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-gray-500 text-lg mb-2">No se encontraron parques</div>
        <div className="text-gray-400">Intenta ajustar los criterios de búsqueda</div>
      </div>
    );
  }

  // Función para renderizar una tarjeta de parque
  const renderParkCard = (park: ExtendedPark, size: 'normal' | 'large' | 'wide' = 'normal') => {
    const aspectRatio = size === 'wide' ? 'aspect-[16/6]' : size === 'large' ? 'aspect-[3/2]' : 'aspect-[3/2]';
    const textSize = size === 'wide' ? 'text-xl md:text-2xl' : size === 'large' ? 'text-lg' : 'text-base md:text-lg';
    
    return (
      <Link 
        key={park.id}
        href={`/parque/${generateParkSlug(park.name, park.id)}`}
        className="group cursor-pointer"
      >
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className={`relative ${aspectRatio} overflow-hidden`}>
            {park.primaryImage ? (
              <img
                src={park.primaryImage}
                alt={park.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                <MapPin className={`text-primary-600 ${size === 'wide' ? 'h-16 w-16' : 'h-12 w-12'}`} />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Badge de certificaciones */}
            {hasCertifications(park) && (
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                {hasGreenFlag(park) && (
                  <img 
                    src={greenFlagLogo} 
                    alt="Green Flag Award" 
                    className={`object-contain bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-green-500/30 ${size === 'wide' ? 'h-20 w-28' : 'h-16 w-24'}`}
                    title="Green Flag Award"
                  />
                )}
                <Badge 
                  variant="secondary" 
                  className="bg-blue-600/90 text-white text-xs backdrop-blur-sm border-blue-500/30"
                >
                  {getCertificationsCount(park)} Certificación{getCertificationsCount(park) !== 1 ? 'es' : ''}
                </Badge>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className={`text-white font-semibold drop-shadow-lg ${textSize}`}>
                {park.name}
              </h3>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* Fila 1: 2 tarjetas grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {parks.slice(0, 2).map((park) => renderParkCard(park, 'large'))}
      </div>

      {/* Fila 2: 3 tarjetas normales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {parks.slice(2, 5).map((park) => renderParkCard(park, 'normal'))}
      </div>

      {/* Fila 3: 1 tarjeta ancha */}
      <div className="grid grid-cols-1 gap-4">
        {parks.slice(5, 6).map((park) => renderParkCard(park, 'wide'))}
      </div>

      {/* Fila 4: 2 tarjetas grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {parks.slice(6, 8).map((park) => renderParkCard(park, 'large'))}
      </div>

      {/* Fila 5: 3 tarjetas normales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {parks.slice(8, 11).map((park) => renderParkCard(park, 'normal'))}
      </div>

      {/* Fila 6: 2 tarjetas grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {parks.slice(11, 13).map((park) => renderParkCard(park, 'large'))}
      </div>

      {/* Tarjetas adicionales si hay más de 13 parques - continúa el patrón */}
      {parks.length > 13 && (
        <div className="space-y-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Más Parques</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {parks.slice(13).map((park) => renderParkCard(park, 'normal'))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExtendedParksList;