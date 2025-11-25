import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Grid, List, Star, Phone, Mail, Award, Clock, User, MessageSquare, Users, MapPin, Trees, Calendar } from 'lucide-react';
import PublicInstructorEvaluationForm from '@/components/PublicInstructorEvaluationForm';
import PublicLayout from '@/components/PublicLayout';
import AdSpaceIntelligent from '@/components/AdSpaceIntelligent';
import ROUTES from '@/routes';

const heroImage = "/images/instructor-hero.jpg";

// Imágenes de galería para instructores en parques
const galleryImages = [
  {
    src: "/attached_assets/happy-volunteers-with-seedlings-and-garden-tools-2024-09-27-13-54-22-utc (1)_1754955545591.jpg",
    alt: "Instructores trabajando con voluntarios en jardinería"
  },
  {
    src: "/attached_assets/jardin-japones_1754950415873.jpg", 
    alt: "Instructor guiando en el jardín japonés"
  },
  {
    src: "/attached_assets/download-7_1754927049169.jpg",
    alt: "Actividades grupales en parque"
  },
  {
    src: "/attached_assets/People_23-02_1752941117659.jpg",
    alt: "Instructores con participantes"
  }
];

// Tipo de datos para un instructor
interface Instructor {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  specialties?: string;
  experience_years: number;
  status: string;
  profile_image_url?: string;
  created_at?: string;
  rating?: number;
}

const InstructorsPage: React.FC = () => {
  // Helper function para procesar especialidades
  const getSpecialtiesArray = (specialties: string | string[] | undefined) => {
    if (!specialties) return [];
    
    // Si ya es un array, devolverlo
    if (Array.isArray(specialties)) return specialties;
    
    // Si es un string, procesar diferentes formatos
    if (typeof specialties === 'string') {
      // Formato PostgreSQL array: {"Yoga","Danzas Ocultas"}
      if (specialties.startsWith('{') && specialties.endsWith('}')) {
        // Remover llaves y dividir por comas, luego limpiar comillas
        const cleanedString = specialties.slice(1, -1); // Quitar { y }
        return cleanedString
          .split(',')
          .map(s => s.trim().replace(/^"/, '').replace(/"$/, '')) // Quitar comillas
          .filter(s => s.length > 0);
      }
      
      // Intentar parsear como JSON array estándar
      try {
        const parsed = JSON.parse(specialties);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Si falla el parsing JSON, usar split por comas
      }
      
      // Formato separado por comas: "Yoga,Meditación,Bienestar"
      return specialties.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    
    return [];
  };

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [evaluationInstructor, setEvaluationInstructor] = useState<Instructor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCount, setShowCount] = useState(3); // Inicialmente mostrar 3
  const itemsPerPage = 12;
  
  // Obtener datos de instructores de la ruta correcta para la página pública
  const { data: apiResponse = [], isLoading } = useQuery<any>({
    queryKey: ['/public-api/instructors/public'],
  });
  
  // Verificar qué estructura de datos tenemos
  let rawData: any[] = [];
  
  if (Array.isArray(apiResponse)) {
    rawData = apiResponse;
  } else if (apiResponse && 'data' in apiResponse) {
    rawData = apiResponse.data || [];
  } else if (apiResponse && typeof apiResponse === 'object') {
    rawData = [apiResponse];
  }
  
  // Eliminar duplicados usando Map con ID como clave
  const instructorsMap = new Map<number, Instructor>();
  
  // Procesar solamente entradas válidas y adaptar formato de campos
  rawData.forEach((data: any) => {
    if (data && data.id && !instructorsMap.has(data.id)) {
      const instructor: Instructor = {
        id: data.id,
        full_name: data.fullName || data.full_name || '',
        email: data.email || '',
        phone: data.phoneNumber || data.phone || '',
        specialties: data.specialties || '',
        experience_years: data.experience || data.experience_years || 0,
        status: data.status || 'active',
        profile_image_url: data.profileImageUrl || data.profile_image_url || null,
        created_at: data.createdAt || data.created_at || '',
        rating: data.rating || null
      };
      
      instructorsMap.set(data.id, instructor);
    }
  });
  
  // Convertir el Map a array
  const instructors = Array.from(instructorsMap.values());
  
  // Extraer especialidades únicas para el filtro
  const allSpecialties = new Set<string>();
  instructors.forEach(instructor => {
    if (instructor.specialties) {
      const specialtiesArray = getSpecialtiesArray(instructor.specialties);
      
      specialtiesArray.forEach(specialty => {
        const trimmed = typeof specialty === 'string' ? specialty.trim() : '';
        if (trimmed) allSpecialties.add(trimmed);
      });
    }
  });
  
  // Filtrar instructores
  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch = searchTerm === '' || 
      instructor.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = specialtyFilter === '' || specialtyFilter === 'all' || 
      (instructor.specialties && instructor.specialties.toLowerCase().includes(specialtyFilter.toLowerCase()));
    
    const matchesExperience = experienceFilter === '' || experienceFilter === 'all' || 
      (experienceFilter === '1-3' && instructor.experience_years >= 1 && instructor.experience_years <= 3) ||
      (experienceFilter === '4-7' && instructor.experience_years >= 4 && instructor.experience_years <= 7) ||
      (experienceFilter === '8+' && instructor.experience_years >= 8);
    
    return matchesSearch && matchesSpecialty && matchesExperience;
  });

  // Mostrar instructores progresivamente (3, 12, 21, etc.)
  const currentInstructors = filteredInstructors.slice(0, showCount);
  const hasMoreInstructors = filteredInstructors.length > showCount;
  const remainingCount = Math.min(9, filteredInstructors.length - showCount);

  // Reset showCount cuando cambian los filtros
  React.useEffect(() => {
    setShowCount(3);
  }, [searchTerm, specialtyFilter, experienceFilter]);

  const handleShowMore = () => {
    setShowCount(prev => prev + 9);
  };

  const handleShowLess = () => {
    setShowCount(3);
  };

  const openProfile = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setProfileDialogOpen(true);
  };

  const openEvaluation = (instructor: Instructor) => {
    setEvaluationInstructor(instructor);
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <PublicLayout>
      <div className="bg-gray-50">


      {/* Hero Section - Estilo Activities */}
      <section 
        className="relative py-24 px-4 text-center text-white"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <User className="h-10 w-10" />
              <h1 className="font-guttery text-4xl md:text-5xl font-normal">
                Conoce a
              </h1>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              Nuestros Instructores
            </h2>
          </div>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Profesionales experimentados comprometidos con crear experiencias únicas en nuestros parques.
            Descubre su experiencia y especialidades.
          </p>
        </div>
      </section>

      {/* Instructores en Acción - Sección Completa */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* Textos */}
          <div className="mb-12">
            <p className="text-gray-900 font-bold text-xl text-center max-w-2xl mx-auto mb-12">
              Conoce la experiencia y dedicación de nuestros instructores profesionales en los parques de Guadalajara
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-[#51a19f] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{instructors.length}+</div>
              <div className="text-lg text-gray-600 font-medium">Instructores Certificados</div>
            </div>
            
            <div className="text-center">
              <div className="bg-[#51a19f] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-10 w-10 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{allSpecialties.size}</div>
              <div className="text-lg text-gray-600 font-medium">Especialidades Disponibles</div>
            </div>
            
            <div className="text-center">
              <div className="bg-[#51a19f] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">30+</div>
              <div className="text-lg text-gray-600 font-medium">Sesiones Mensuales</div>
            </div>
            
            <div className="text-center">
              <div className="bg-[#51a19f] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-10 w-10 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">4.8</div>
              <div className="text-lg text-gray-600 font-medium">Calificación Promedio</div>
            </div>
          </div>

          {/* Galería */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-64">
              {/* Imagen principal - ocupa 2x2 - Clase de yoga masiva en el parque */}
              <div className="col-span-2 row-span-2 relative cursor-pointer group">
                <img 
                  src="/attached_assets/yoga_1754962456656.jpg"
                  alt="Instructor de yoga dirigiendo una clase masiva al aire libre en el parque"
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg" />
              </div>
              
              {/* Imagen 1 - Sesión de entrenamiento grupal */}
              <div className="relative cursor-pointer group">
                <img 
                  src="/attached_assets/yoga 1_1754962456652.jpg"
                  alt="Instructor dirigiendo sesión de entrenamiento físico grupal al aire libre"
                  className="w-full h-full object-cover rounded-lg shadow-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg" />
              </div>
              
              {/* Imagen 2 - Actividad dinámica en grupo */}
              <div className="relative cursor-pointer group">
                <img 
                  src="/attached_assets/yoga 2_1754962456653.jpg"
                  alt="Instructor guiando actividad dinámica y divertida con participantes saltando"
                  className="w-full h-full object-cover rounded-lg shadow-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg" />
              </div>
              
              {/* Imagen 3 - Entrenamiento personalizado */}
              <div className="relative cursor-pointer group">
                <img 
                  src="/attached_assets/yoga 3_1754962456654.jpg"
                  alt="Instructora proporcionando entrenamiento personalizado en ejercicios funcionales"
                  className="w-full h-full object-cover rounded-lg shadow-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg" />
              </div>
              
              {/* Imagen 4 - Taller educativo al aire libre */}
              <div className="relative cursor-pointer group">
                <img 
                  src="/attached_assets/yoga 4_1754962456655.jpg"
                  alt="Instructores conduciendo taller educativo y de capacitación al aire libre"
                  className="w-full h-full object-cover rounded-lg shadow-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Panel de filtros y búsqueda - Estilo Volunteers */}
      <section className="sticky top-0 z-10 border-b border-gray-200 shadow-sm bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Búsqueda */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                  <Input
                    placeholder="Buscar instructores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger className="w-44 border-gray-300">
                    <Award className="h-4 w-4 mr-2 text-green-600" />
                    <SelectValue placeholder="Especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Array.from(allSpecialties).map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="w-40 border-gray-300">
                    <Clock className="h-4 w-4 mr-2 text-green-600" />
                    <SelectValue placeholder="Experiencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="1-3">1-3 años</SelectItem>
                    <SelectItem value="4-7">4-7 años</SelectItem>
                    <SelectItem value="8+">8+ años</SelectItem>
                  </SelectContent>
                </Select>

                {/* Toggle de vista */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`h-8 px-3 ${viewMode === 'grid' ? 'bg-green-600 text-white hover:bg-green-700' : 'hover:bg-gray-200'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`h-8 px-3 ${viewMode === 'list' ? 'bg-green-600 text-white hover:bg-green-700' : 'hover:bg-gray-200'}`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Botón de limpiar filtros */}
                {(searchTerm || specialtyFilter || experienceFilter) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSpecialtyFilter('');
                      setExperienceFilter('');
                    }}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>


        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
            {/* Vista Grid */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentInstructors.map((instructor) => (
              <Card key={instructor.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white">
                <CardHeader className="text-center pb-2">
                  <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-primary/10">
                    <AvatarImage 
                      src={instructor.profile_image_url || undefined} 
                      alt={instructor.full_name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-600 text-white font-semibold text-lg">
                      {instructor.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {instructor.full_name}
                  </CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1 text-primary">
                    <Award className="h-4 w-4" />
                    {instructor.experience_years} años de experiencia
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Especialidades */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {getSpecialtiesArray(instructor.specialties).slice(0, 2).map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-primary/10 text-primary">
                          {specialty}
                        </Badge>
                      ))}
                      {getSpecialtiesArray(instructor.specialties).length > 2 && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          +{getSpecialtiesArray(instructor.specialties).length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex justify-center mb-4">
                    {renderStars(instructor.rating || 0)}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openProfile(instructor)}
                      className="flex-1 text-primary border-primary hover:bg-primary hover:text-white"
                    >
                      <User className="h-4 w-4 mr-1" />
                      Ver Perfil
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => openEvaluation(instructor)}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Evaluar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Evaluar a {instructor.full_name}</DialogTitle>
                          <DialogDescription>
                            Comparte tu experiencia con este instructor
                          </DialogDescription>
                        </DialogHeader>
                        <PublicInstructorEvaluationForm 
                          instructorId={instructor.id} 
                          instructorName={instructor.full_name}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Vista Lista */}
        {viewMode === 'list' && (
          <div className="space-y-4 mb-8">
            {currentInstructors.map((instructor) => (
              <Card key={instructor.id} className="hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 ring-4 ring-primary/10">
                        <AvatarImage 
                          src={instructor.profile_image_url || undefined} 
                          alt={instructor.full_name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary-600 text-white font-semibold">
                          {instructor.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">{instructor.full_name}</h3>
                        <div className="flex items-center gap-2 text-primary mb-2">
                          <Award className="h-4 w-4" />
                          <span>{instructor.experience_years} años de experiencia</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {getSpecialtiesArray(instructor.specialties).map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        {renderStars(instructor.rating || 0)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openProfile(instructor)}
                        className="text-primary border-primary hover:bg-primary hover:text-white"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Ver Perfil
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => openEvaluation(instructor)}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Evaluar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Evaluar a {instructor.full_name}</DialogTitle>
                            <DialogDescription>
                              Comparte tu experiencia con este instructor
                            </DialogDescription>
                          </DialogHeader>
                          <PublicInstructorEvaluationForm 
                            instructorId={instructor.id} 
                            instructorName={instructor.full_name}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </div>


        </div>

        {/* Botones Ver Más / Ver Menos */}
        {filteredInstructors.length > 3 && (
          <div className="text-center py-6">
            {hasMoreInstructors ? (
              <Button 
                onClick={handleShowMore}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              >
                Ver más ({remainingCount} instructor{remainingCount !== 1 ? 'es' : ''} restante{remainingCount !== 1 ? 's' : ''})
              </Button>
            ) : showCount > 3 && (
              <Button 
                onClick={handleShowLess}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3"
              >
                Ver menos
              </Button>
            )}
          </div>
        )}

        {/* Estado vacío */}
        {filteredInstructors.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron instructores</h3>
            <p className="text-gray-600 mb-4">
              Intenta ajustar tus filtros o buscar con otros términos
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSpecialtyFilter('all');
                setExperienceFilter('all');
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              Limpiar Filtros
            </Button>
          </div>
        )}

      {/* Dialog para ver perfil completo */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedInstructor && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage 
                      src={selectedInstructor.profile_image_url || undefined} 
                      alt={selectedInstructor.full_name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-600 text-white font-semibold text-lg">
                      {selectedInstructor.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl">{selectedInstructor.full_name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 text-primary">
                      <Award className="h-4 w-4" />
                      {selectedInstructor.experience_years} años de experiencia
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Especialidades */}
                <div>
                  <h4 className="font-semibold mb-2">Especialidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {getSpecialtiesArray(selectedInstructor.specialties).map((specialty, index) => (
                      <Badge key={index} className="bg-primary text-white">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Información de contacto */}
                <div>
                  <h4 className="font-semibold mb-2">Información de Contacto</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedInstructor.email}</span>
                    </div>
                    {selectedInstructor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedInstructor.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {selectedInstructor.rating && (
                  <div>
                    <h4 className="font-semibold mb-2">Calificación</h4>
                    {renderStars(selectedInstructor.rating)}
                  </div>
                )}

                {/* Estado */}
                <div>
                  <h4 className="font-semibold mb-2">Estado</h4>
                  <Badge variant={selectedInstructor.status === 'active' ? 'default' : 'secondary'}>
                    {selectedInstructor.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    asChild 
                    className="flex-1 bg-gradient-to-r from-primary to-primary-600"
                  >
                    <a href={ROUTES.public.instructorProfile.build(selectedInstructor.id)} target="_blank" rel="noopener noreferrer">
                      Ver Perfil Completo
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Sección de Contacto */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Necesitas más información?</h2>
            <p className="text-lg text-gray-600">Nuestro equipo está aquí para ayudarte con consultas sobre instructores</p>
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
              <p className="text-gray-600 mb-2">instructores@parques.gdl.gob.mx</p>
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

export default InstructorsPage;