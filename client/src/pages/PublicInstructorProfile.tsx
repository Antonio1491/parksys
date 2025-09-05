import React from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Star, 
  MessageCircle, 
  MapPin, 
  Award, 
  Calendar,
  User,
  Users,
  Mail,
  Phone,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PublicInstructorEvaluationForm from '@/components/PublicInstructorEvaluationForm';
import InstructorEvaluationsList from '@/components/InstructorEvaluationsList';
import AdSpace from '@/components/AdSpace';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Instructor {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  bio?: string;
  experienceYears: number;
  specialties: string;
  certifications?: string[];
  qualifications?: string;
  profileImageUrl?: string;
  status: string;
  createdAt: string;
  preferredParkName?: string;
  averageRating?: number;
}

function PublicInstructorProfile() {
  const { id } = useParams<{ id: string }>();
  const instructorId = parseInt(id || '0');

  const { data: instructor, isLoading, error } = useQuery<Instructor>({
    queryKey: [`/api/instructors/${instructorId}`],
    enabled: !!instructorId && instructorId > 0,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil del instructor...</p>
        </div>
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <User className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Instructor no encontrado</h1>
          <p className="text-gray-600 mb-6">No pudimos encontrar la información de este instructor.</p>
          <Link href="/instructors">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a instructores
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const specialtiesArray = instructor.specialties 
    ? (Array.isArray(instructor.specialties) 
        ? instructor.specialties 
        : instructor.specialties.split(',').map(s => s.trim()))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/instructors">
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a instructores
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {instructor.profileImageUrl ? (
              <img 
                src={
                  // En Replit development, usar URL completa del backend
                  window.location.hostname.includes('replit.') || import.meta.env.DEV
                    ? `${window.location.protocol}//${window.location.host}${instructor.profileImageUrl}` 
                    : instructor.profileImageUrl
                } 
                alt={instructor.fullName}
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  console.error('Error loading instructor image:', instructor.profileImageUrl);
                  console.error('Full error:', e);
                }}
                onLoad={() => {
                  console.log('✅ Instructor image loaded successfully:', instructor.profileImageUrl);
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{instructor.fullName}</h1>
              <div className="flex items-center gap-3 mt-2">
                {instructor.preferredParkName && (
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {instructor.preferredParkName}
                  </p>
                )}
                {instructor.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-gray-700 font-medium">
                      {instructor.averageRating}/5
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Información del Instructor */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Información del Instructor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Experiencia */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Experiencia</label>
                  <p className="font-semibold text-gray-900">
                    {instructor.experienceYears} años
                  </p>
                </div>

                {/* Especialidades */}
                {specialtiesArray.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Especialidades</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {specialtiesArray.map((specialty, index) => (
                        <Badge key={index} className="bg-purple-100 text-purple-800">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estado */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <Badge 
                    className={instructor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {instructor.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                {/* Contacto */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Contacto</h4>
                  
                  {instructor.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Mail className="h-4 w-4" />
                      <span>{instructor.email}</span>
                    </div>
                  )}
                  
                  {instructor.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{instructor.phone}</span>
                    </div>
                  )}
                </div>

                {/* Fecha de ingreso */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">Instructor desde</label>
                  <p className="text-gray-700 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(instructor.createdAt)}
                  </p>
                </div>

                {/* Botón de evaluación */}
                <div className="border-t pt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Evaluar Instructor
                      </Button>
                    </DialogTrigger>
                    <DialogContent 
                      className="max-w-2xl max-h-[90vh] overflow-y-auto"
                      aria-describedby="evaluation-description"
                    >
                      <DialogHeader>
                        <DialogTitle>Evaluar a {instructor.fullName}</DialogTitle>
                        <DialogDescription id="evaluation-description">
                          Comparte tu experiencia para ayudar a otros visitantes.
                        </DialogDescription>
                      </DialogHeader>
                      <PublicInstructorEvaluationForm
                        instructorId={instructor.id}
                        instructorName={instructor.fullName}
                        onSuccess={() => {
                          // El dialog se cerrará automáticamente por el estado del formulario
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Espacio Publicitario - Debajo de Información del Instructor */}
            <div className="mt-6">
              <AdSpace spaceId="13" position="card" pageType="instructor-profile" />
            </div>
          </div>

          {/* Evaluaciones y Bio */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Biografía */}
            {instructor.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    Acerca del Instructor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{instructor.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Certificaciones */}
            {instructor.certifications && instructor.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    Certificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {instructor.certifications.map((certification, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">{certification}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Experiencia Profesional */}
            {instructor.qualifications && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-600" />
                    Experiencia Profesional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 leading-relaxed">{instructor.qualifications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evaluaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Evaluaciones de Visitantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InstructorEvaluationsList instructorId={instructor.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicInstructorProfile;