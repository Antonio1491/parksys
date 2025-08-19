import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Calendar, Users, TreePine, GraduationCap, Building, Squirrel, Sparkles, Home } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'park' | 'activity' | 'instructor' | 'volunteer' | 'species' | 'concession' | 'fauna' | 'event' | 'reservation';
  url: string;
  image?: string;
}

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [location, navigate] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Queries para obtener datos
  const { data: parksData } = useQuery({
    queryKey: ['/api/parks'],
    enabled: searchTerm.length >= 2,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['/api/activities'],
    enabled: searchTerm.length >= 2,
  });

  const { data: instructorsData } = useQuery({
    queryKey: ['/api/instructors'],
    enabled: searchTerm.length >= 2,
  });

  const { data: speciesData } = useQuery({
    queryKey: ['/api/tree-species'],
    enabled: searchTerm.length >= 2,
  });

  const { data: concessionsData } = useQuery({
    queryKey: ['/api/concessions'],
    enabled: searchTerm.length >= 2,
  });

  const { data: faunaData } = useQuery({
    queryKey: ['/api/fauna'],
    enabled: searchTerm.length >= 2,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['/api/events'],
    enabled: searchTerm.length >= 2,
  });

  const { data: reservableSpacesData } = useQuery({
    queryKey: ['/api/reservable-spaces'],
    enabled: searchTerm.length >= 2,
  });

  // Procesar resultados de búsqueda
  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const searchLower = searchTerm.toLowerCase();

    // Buscar en parques
    const parks = parksData?.data || parksData || [];
    if (Array.isArray(parks) && parks.length > 0) {
      parks
        .filter((park: any) => 
          park.name?.toLowerCase().includes(searchLower) ||
          park.description?.toLowerCase().includes(searchLower) ||
          park.municipality?.toLowerCase().includes(searchLower)
        )
        .slice(0, 3)
        .forEach((park: any) => {
          searchResults.push({
            id: `park-${park.id}`,
            title: park.name,
            description: `Parque en ${park.municipality || 'Guadalajara'} - ${park.description?.substring(0, 100) || 'Sin descripción'}...`,
            type: 'park',
            url: `/parque/${park.slug || park.name.toLowerCase().replace(/\s+/g, '-')}-${park.id}`,
            image: park.imageUrl
          });
        });
    }

    // Buscar en actividades
    const activities = activitiesData?.data || activitiesData || [];
    if (Array.isArray(activities) && activities.length > 0) {
      activities
        .filter((activity: any) => 
          activity.title?.toLowerCase().includes(searchLower) ||
          activity.description?.toLowerCase().includes(searchLower)
        )
        .slice(0, 3)
        .forEach((activity: any) => {
          searchResults.push({
            id: `activity-${activity.id}`,
            title: activity.title,
            description: `Actividad - ${activity.description?.substring(0, 100) || 'Sin descripción'}...`,
            type: 'activity',
            url: `/activities/${activity.id}`,
            image: activity.imageUrl
          });
        });
    }

    // Buscar en instructores
    const instructors = instructorsData?.data || instructorsData || [];
    if (Array.isArray(instructors) && instructors.length > 0) {
      instructors
        .filter((instructor: any) => {
          const name = instructor.name || instructor.fullName || instructor.full_name || '';
          const specialties = Array.isArray(instructor.specialties) 
            ? instructor.specialties.join(' ').toLowerCase()
            : (instructor.specialties || '').toString().toLowerCase();
          
          return name.toLowerCase().includes(searchLower) ||
                 specialties.includes(searchLower);
        })
        .slice(0, 2)
        .forEach((instructor: any) => {
          const displayName = instructor.name || instructor.fullName || instructor.full_name || 'Instructor';
          const displaySpecialties = Array.isArray(instructor.specialties) 
            ? instructor.specialties.join(', ')
            : (instructor.specialties || 'Especialidades variadas');
            
          searchResults.push({
            id: `instructor-${instructor.id}`,
            title: displayName,
            description: `Instructor - ${displaySpecialties}`,
            type: 'instructor',
            url: `/instructors/${instructor.id}`,
            image: instructor.profileImage || instructor.profileImageUrl
          });
        });
    }

    // Buscar en especies arbóreas
    const species = speciesData?.data || speciesData || [];
    if (Array.isArray(species) && species.length > 0) {
      species
        .filter((specie: any) => 
          specie.common_name?.toLowerCase().includes(searchLower) ||
          specie.scientific_name?.toLowerCase().includes(searchLower)
        )
        .slice(0, 2)
        .forEach((specie: any) => {
          searchResults.push({
            id: `species-${specie.id}`,
            title: specie.common_name,
            description: `Especie arbórea - ${specie.scientific_name}`,
            type: 'species',
            url: `/tree-species/${specie.id}`,
            image: specie.image_url
          });
        });
    }

    // Buscar en concesiones
    const concessions = concessionsData?.data || concessionsData || [];
    if (Array.isArray(concessions) && concessions.length > 0) {
      concessions
        .filter((concession: any) => 
          concession.name?.toLowerCase().includes(searchLower) ||
          concession.description?.toLowerCase().includes(searchLower)
        )
        .slice(0, 2)
        .forEach((concession: any) => {
          searchResults.push({
            id: `concession-${concession.id}`,
            title: concession.name,
            description: `Concesión - ${concession.description?.substring(0, 100) || 'Sin descripción'}...`,
            type: 'concession',
            url: `/concessions/${concession.id}`,
            image: concession.imageUrl
          });
        });
    }

    // Buscar en fauna
    const fauna = faunaData?.data || faunaData || [];
    if (Array.isArray(fauna) && fauna.length > 0) {
      fauna
        .filter((animal: any) => 
          animal.common_name?.toLowerCase().includes(searchLower) ||
          animal.scientific_name?.toLowerCase().includes(searchLower) ||
          animal.habitat?.toLowerCase().includes(searchLower)
        )
        .slice(0, 2)
        .forEach((animal: any) => {
          searchResults.push({
            id: `fauna-${animal.id}`,
            title: animal.common_name || animal.scientific_name,
            description: `Fauna - ${animal.scientific_name} (${animal.habitat || 'Hábitat variado'})`,
            type: 'fauna',
            url: `/fauna/${animal.id}`,
            image: animal.image_url
          });
        });
    }

    // Buscar en eventos
    const events = eventsData?.data || eventsData || [];
    if (Array.isArray(events) && events.length > 0) {
      events
        .filter((event: any) => 
          event.title?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.category?.toLowerCase().includes(searchLower)
        )
        .slice(0, 2)
        .forEach((event: any) => {
          searchResults.push({
            id: `event-${event.id}`,
            title: event.title,
            description: `Evento - ${event.description?.substring(0, 100) || 'Sin descripción'}...`,
            type: 'event',
            url: `/events/${event.id}`,
            image: event.imageUrl
          });
        });
    }

    // Buscar en espacios reservables
    const reservableSpaces = reservableSpacesData?.data || reservableSpacesData || [];
    if (Array.isArray(reservableSpaces) && reservableSpaces.length > 0) {
      reservableSpaces
        .filter((space: any) => 
          space.name?.toLowerCase().includes(searchLower) ||
          space.description?.toLowerCase().includes(searchLower) ||
          space.location?.toLowerCase().includes(searchLower)
        )
        .slice(0, 2)
        .forEach((space: any) => {
          searchResults.push({
            id: `reservation-${space.id}`,
            title: space.name,
            description: `Espacio reservable - ${space.description?.substring(0, 100) || space.location || 'Disponible para reservas'}...`,
            type: 'reservation',
            url: `/reservations/space/${space.id}`,
            image: space.imageUrl
          });
        });
    }

    setResults(searchResults.slice(0, 12)); // Aumentado a 12 resultados
  }, [searchTerm, parksData, activitiesData, instructorsData, speciesData, concessionsData, faunaData, eventsData, reservableSpacesData]);

  const handleResultClick = (url: string) => {
    navigate(url);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    const iconProps = { className: "w-4 h-4" };
    switch (type) {
      case 'park': return <MapPin {...iconProps} />;
      case 'activity': return <Calendar {...iconProps} />;
      case 'instructor': return <GraduationCap {...iconProps} />;
      case 'volunteer': return <Users {...iconProps} />;
      case 'species': return <TreePine {...iconProps} />;
      case 'concession': return <Building {...iconProps} />;
      case 'fauna': return <Squirrel {...iconProps} />;
      case 'event': return <Sparkles {...iconProps} />;
      case 'reservation': return <Home {...iconProps} />;
      default: return <Search {...iconProps} />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'park': return 'Parque';
      case 'activity': return 'Actividad';
      case 'instructor': return 'Instructor';
      case 'volunteer': return 'Voluntario';
      case 'species': return 'Especie';
      case 'concession': return 'Concesión';
      case 'fauna': return 'Fauna';
      case 'event': return 'Evento';
      case 'reservation': return 'Reservación';
      default: return 'Resultado';
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'park': return 'text-green-600 bg-green-50';
      case 'activity': return 'text-blue-600 bg-blue-50';
      case 'instructor': return 'text-purple-600 bg-purple-50';
      case 'volunteer': return 'text-orange-600 bg-orange-50';
      case 'species': return 'text-emerald-600 bg-emerald-50';
      case 'concession': return 'text-gray-600 bg-gray-50';
      case 'fauna': return 'text-amber-600 bg-amber-50';
      case 'event': return 'text-pink-600 bg-pink-50';
      case 'reservation': return 'text-teal-600 bg-teal-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Botón de búsqueda */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
        title="Búsqueda global"
      >
        <Search className="w-5 h-5 text-gray-600" />
      </button>

      {/* Modal de búsqueda */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-25 z-40" />
          
          {/* Modal */}
          <div className="absolute top-12 right-0 w-96 bg-white rounded-xl shadow-xl border z-50 max-h-96 overflow-hidden">
            {/* Header de búsqueda */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar parques, actividades, fauna, eventos, reservaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 outline-none text-sm placeholder-gray-400"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Resultados */}
            <div className="max-h-80 overflow-y-auto">
              {searchTerm.length < 2 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Escribe al menos 2 caracteres para buscar
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No se encontraron resultados para "{searchTerm}"
                </div>
              ) : (
                <div className="p-2">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.url)}
                      className="w-full p-3 hover:bg-gray-50 rounded-lg text-left flex items-start gap-3 transition-colors"
                    >
                      {/* Imagen o icono */}
                      <div className="flex-shrink-0">
                        {result.image ? (
                          <img
                            src={result.image}
                            alt={result.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            {getTypeIcon(result.type)}
                          </div>
                        )}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {result.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {results.length > 0 && (
              <div className="p-3 border-t bg-gray-50 text-center">
                <span className="text-xs text-gray-500">
                  Mostrando {results.length} resultados
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalSearch;