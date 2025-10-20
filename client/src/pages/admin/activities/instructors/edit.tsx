import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  Upload, 
  X, 
  FileSymlink,
  Calendar,
  DollarSign,
  Clock,
  ArrowLeft,
  Save
} from 'lucide-react';

// Interface para los datos del instructor
interface InstructorFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialties: string[];
  experienceYears: number;
  bio?: string;
  preferredParkId?: number;
  profileImageFile?: File | null;
  qualifications?: string;
  availability?: string;
  hourlyRate?: number;
  experience?: string;
  curriculumFile?: File | null;
}

export default function EditInstructorPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extraer ID de la URL
  const pathParts = location.split('/');
  const id = pathParts[pathParts.length - 1];
  
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [formData, setFormData] = useState<InstructorFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialties: [],
    experienceYears: 1,
    bio: '',
    preferredParkId: undefined,
    qualifications: '',
    availability: '',
    hourlyRate: 0,
    experience: '',
    profileImageFile: null,
    curriculumFile: null,
  });

  // Obtener datos del instructor
  const { data: instructor, isLoading, isError } = useQuery({
    queryKey: [`/api/instructors/${id}`],
    enabled: !!id,
  });

  // Obtener lista de parques para selector
  const { data: parksResponse } = useQuery({
    queryKey: ['/api/parks'],
  });
  const parks = Array.isArray(parksResponse?.data) ? parksResponse.data : [];
  
  // Debug: Log parks data
  useEffect(() => {
    console.log('🔍 DEBUG: Parks data:', parks);
    console.log('🔍 DEBUG: Parks count:', parks?.length || 0);
    if (parks && parks.length > 0) {
      console.log('🔍 DEBUG: Primera park:', parks[0]);
    }
  }, [parks]);

  // Cargar datos del instructor en el formulario
  useEffect(() => {
    if (instructor && typeof instructor === 'object') {
      const instructorData = instructor as any;
      
      // Debug: Log instructor data
      console.log('🔍 DEBUG: Datos del instructor cargados:', instructorData);
      console.log('🔍 DEBUG: preferredParkId:', instructorData.preferredParkId, typeof instructorData.preferredParkId);
      
      // Procesar especialidades
      let processedSpecialties: string[] = [];
      if (instructorData.specialties) {
        if (Array.isArray(instructorData.specialties)) {
          processedSpecialties = instructorData.specialties;
        } else if (typeof instructorData.specialties === 'string') {
          try {
            // Intentar parsear como JSON
            if (instructorData.specialties.startsWith('[') || instructorData.specialties.startsWith('{')) {
              const parsed = JSON.parse(instructorData.specialties);
              processedSpecialties = Array.isArray(parsed) ? parsed : [parsed];
            } else if (instructorData.specialties.includes(',')) {
              // Separar por comas
              processedSpecialties = instructorData.specialties.split(',').map((s: string) => s.trim());
            } else {
              // Un solo elemento
              processedSpecialties = [instructorData.specialties.trim()];
            }
          } catch (e) {
            // Si falla el parsing, usar como está
            processedSpecialties = [instructorData.specialties];
          }
        }
      }

      const newFormData = {
        firstName: instructorData.firstName || '',
        lastName: instructorData.lastName || '',
        email: instructorData.email || '',
        phone: instructorData.phone || '',
        specialties: processedSpecialties,
        experienceYears: instructorData.experienceYears || 1,
        bio: instructorData.bio || '',
        preferredParkId: instructorData.preferredParkId || undefined,
        qualifications: instructorData.qualifications || '',
        availability: instructorData.availability || '',
        hourlyRate: instructorData.hourlyRate || 0,
        experience: instructorData.experience || '',
        profileImageFile: null,
        curriculumFile: null,
      };
      
      console.log('🔍 DEBUG: Form data preparada:', newFormData);
      console.log('🔍 DEBUG: preferredParkId en form data:', newFormData.preferredParkId, typeof newFormData.preferredParkId);
      
      setFormData(newFormData);

      // Cargar imagen de perfil existente
      if (instructorData.profileImageUrl) {
        setProfileImagePreview(instructorData.profileImageUrl);
      }
    }
  }, [instructor]);

  // Mutación para actualizar instructor
  const updateInstructorMutation = useMutation({
    mutationFn: async (data: InstructorFormData) => {
      // Preparar FormData para envío con archivos
      const formDataToSend = new FormData();
      
      // Crear objeto con datos del instructor
      const instructorData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        specialties: data.specialties,
        experienceYears: data.experienceYears,
        experience: data.experience || '', // El servidor lo mapeará a bio
        qualifications: data.qualifications || '',
        availability: data.availability || '',
        hourlyRate: data.hourlyRate || 0,
        preferredParkId: data.preferredParkId || undefined
      };
      
      // Agregar datos como JSON en campo 'data'
      formDataToSend.append('data', JSON.stringify(instructorData));
      
      // Agregar archivos si existen
      if (data.profileImageFile) {
        formDataToSend.append('profileImage', data.profileImageFile);
      }
      
      if (data.curriculumFile) {
        formDataToSend.append('curriculum', data.curriculumFile);
      }

      const response = await fetch(`/api/instructors/${id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar instructor');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Instructor actualizado',
        description: 'Los datos del instructor han sido actualizados exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/instructors'] });
      queryClient.invalidateQueries({ queryKey: [`/api/instructors/${id}`] });
      setLocation(ROUTES.admin.activities.instructors.list);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al actualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Manejar cambios en el formulario
  const handleChange = (field: keyof InstructorFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar imagen de perfil
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
      handleChange('profileImageFile', file);
    }
  };

  // Manejar curriculum
  const handleCurriculumUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange('curriculumFile', file);
    }
  };

  // Manejar especialidades
  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      const newSpecialties = [...formData.specialties, specialtyInput.trim()];
      handleChange('specialties', newSpecialties);
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    const newSpecialties = formData.specialties.filter(s => s !== specialty);
    handleChange('specialties', newSpecialties);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa los campos de nombre, apellido y email.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.specialties.length === 0) {
      toast({
        title: 'Especialidades requeridas',
        description: 'Por favor agrega al menos una especialidad.',
        variant: 'destructive',
      });
      return;
    }

    updateInstructorMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Cargando...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a587] mx-auto mb-4"></div>
            <p>Cargando datos del instructor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout title="Error">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error al cargar los datos del instructor</p>
            <Button onClick={() => setLocation(ROUTES.admin.activities.instructors.list)}>
              Volver a la lista
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Editar Instructor">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => setLocation(ROUTES.admin.activities.instructors.list)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editar Instructor</h1>
              <p className="text-muted-foreground">
                Actualiza la información del instructor {(instructor as any)?.firstName} {(instructor as any)?.lastName}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Foto de perfil */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Foto de Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={profileImagePreview || undefined} />
                      <AvatarFallback className="text-2xl">
                        {formData.firstName?.[0]}{formData.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="profile-image"
                      />
                      <label htmlFor="profile-image">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" />
                            Cambiar foto
                          </span>
                        </Button>
                      </label>
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center">
                      Formatos: JPG, PNG. Máx: 5MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Columna derecha - Formulario principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información personal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">Nombre *</label>
                    <Input
                      id="firstName"
                      placeholder="Nombre del instructor"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">Apellido *</label>
                    <Input
                      id="lastName"
                      placeholder="Apellido del instructor"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email *</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">Teléfono</label>
                    <Input
                      id="phone"
                      placeholder="(33) 1234-5678"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Información profesional */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="mr-2 h-5 w-5" />
                    Información Profesional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="experienceYears" className="text-sm font-medium">Años de Experiencia</label>
                      <Input
                        id="experienceYears"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.experienceYears}
                        onChange={(e) => handleChange('experienceYears', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="hourlyRate" className="text-sm font-medium">Tarifa por Hora (MXN)</label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.hourlyRate}
                        onChange={(e) => handleChange('hourlyRate', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="availability" className="text-sm font-medium">Disponibilidad</label>
                      <Select value={formData.availability} onValueChange={(value) => handleChange('availability', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona disponibilidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Tiempo completo</SelectItem>
                          <SelectItem value="part-time">Medio tiempo</SelectItem>
                          <SelectItem value="weekends">Fines de semana</SelectItem>
                          <SelectItem value="evenings">Tardes</SelectItem>
                          <SelectItem value="mornings">Mañanas</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Especialidades */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Especialidades *</label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Ej: Yoga, Danza, Deportes acuáticos"
                          value={specialtyInput}
                          onChange={(e) => setSpecialtyInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                        />
                        <Button type="button" onClick={addSpecialty} variant="outline">
                          Agregar
                        </Button>
                      </div>
                      
                      {formData.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="bg-[#00a587]/10 text-[#00a587]">
                              {specialty}
                              <button
                                type="button"
                                onClick={() => removeSpecialty(specialty)}
                                className="ml-2 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Agrega las especialidades una por una
                    </p>
                  </div>

                  {/* Curriculum */}
                  <div className="space-y-2">
                    <label htmlFor="curriculumFile" className="text-sm font-medium">Curriculum Vitae</label>
                    <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                      {formData.curriculumFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileSymlink className="h-5 w-5 text-blue-500" />
                            <span className="text-sm text-gray-700 truncate max-w-[200px]">
                              {formData.curriculumFile.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleChange('curriculumFile', null)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <label
                            htmlFor="curriculumUpload"
                            className="cursor-pointer inline-flex items-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <FileSymlink className="h-4 w-4" />
                            Subir CV
                            <input
                              id="curriculumUpload"
                              type="file"
                              accept=".pdf,.doc,.docx"
                              className="hidden"
                              onChange={handleCurriculumUpload}
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            Formatos: PDF, DOC, DOCX. Máx: 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información adicional */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Información Adicional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="preferredParkId" className="text-sm font-medium">Parque Preferido (Opcional)</label>
                    <Select value={formData.preferredParkId?.toString() || "no-preference"} onValueChange={(value) => handleChange('preferredParkId', value === "no-preference" ? undefined : parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un parque" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-preference">Sin preferencia</SelectItem>
                        {Array.isArray(parks) ? parks.map((park: any) => (
                          <SelectItem key={park.id} value={park.id.toString()}>
                            {park.name}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="qualifications" className="text-sm font-medium">Cualificaciones</label>
                    <Textarea
                      id="qualifications"
                      placeholder="Describe las certificaciones, títulos o cualificaciones del instructor..."
                      value={formData.qualifications}
                      onChange={(e) => handleChange('qualifications', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="experience" className="text-sm font-medium">Experiencia / Biografía</label>
                    <Textarea
                      id="experience"
                      placeholder="Describe la experiencia profesional y biografía del instructor..."
                      value={formData.experience}
                      onChange={(e) => handleChange('experience', e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(ROUTES.admin.activities.instructors.list)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateInstructorMutation.isPending}
                  className="bg-[#00a587] hover:bg-[#067f5f]"
                >
                  {updateInstructorMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}