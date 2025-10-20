import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import ROUTES from "@/routes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Edit, Camera, Upload, X } from "lucide-react";

// Esquema de validación para editar voluntario
const editVolunteerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  
  // Información personal
  gender: z.enum(['masculino', 'femenino', 'no_especificar']),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  
  // Información de contacto de emergencia
  emergencyContactName: z.string().min(1, 'El nombre del contacto de emergencia es requerido'),
  emergencyContactPhone: z.string().min(10, 'El teléfono de emergencia debe tener al menos 10 dígitos'),
  
  // Información de voluntariado
  preferredParkId: z.string().optional(),
  volunteerExperience: z.string().optional(),
  skills: z.string().optional(),
  availability: z.enum(['weekdays', 'weekends', 'evenings', 'mornings', 'flexible']),
  
  // Áreas de interés
  interestNature: z.boolean().optional(),
  interestEvents: z.boolean().optional(),
  interestEducation: z.boolean().optional(),
  interestMaintenance: z.boolean().optional(),
  interestSports: z.boolean().optional(),
  interestCultural: z.boolean().optional(),
  
  // Consentimientos legales
  legalConsent: z.boolean().refine(val => val === true, 'Debe aceptar los términos legales'),
  ageConsent: z.boolean().refine(val => val === true, 'Debe confirmar ser mayor de edad'),
  conductConsent: z.boolean().refine(val => val === true, 'Debe aceptar el código de conducta'),
  
  // Fotografía del voluntario
  profileImage: z.any().optional(),
  
  // Municipalidad
  municipalityId: z.number().optional(),
});

type EditVolunteerForm = z.infer<typeof editVolunteerSchema>;

export default function EditVolunteerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [match, params] = useRoute(ROUTES.admin.volunteers.edit.path);
  const volunteerId = params?.id;
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<EditVolunteerForm>({
    resolver: zodResolver(editVolunteerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'no_especificar',
      birthDate: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      preferredParkId: '',
      volunteerExperience: '',
      skills: '',
      availability: 'flexible',
      interestNature: false,
      interestEvents: false,
      interestEducation: false,
      interestMaintenance: false,
      interestSports: false,
      interestCultural: false,
      legalConsent: false,
      ageConsent: false,
      conductConsent: false,
      municipalityId: 2, // Guadalajara por defecto
      profileImage: null,
    },
  });

  // Función para manejar la subida de imagen
  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('volunteerId', volunteerId); // Agregar ID del voluntario

      const response = await apiRequest('/api/upload/volunteer-profile', {
        method: 'POST',
        data: formData,
        headers: {
          // No enviar Content-Type para permitir que el navegador lo establezca automáticamente
        },
      });

      if (response.url) {
        setUploadedImageUrl(response.url);
        setImageFile(file);
        form.setValue('profileImage', file);
        toast({
          title: 'Imagen actualizada',
          description: 'La fotografía del voluntario se ha actualizado correctamente',
        });
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Función para remover la imagen
  const handleRemoveImage = () => {
    setUploadedImageUrl(null);
    setImageFile(null);
    form.setValue('profileImage', null);
    toast({
      title: 'Imagen removida',
      description: 'La fotografía del voluntario ha sido removida',
    });
  };

  // Obtener datos del voluntario
  const { data: volunteerData, isLoading: isLoadingVolunteer } = useQuery({
    queryKey: ['/api/volunteers', volunteerId],
    queryFn: async () => {
      const response = await fetch(`/api/volunteers/${volunteerId}`, {
        headers: {
          'Authorization': 'Bearer direct-token',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Error al obtener datos del voluntario');
      return response.json();
    },
    enabled: !!volunteerId,
  });

  // Obtener parques para el selector
  const { data: parksResponse, isLoading: isLoadingParks, error: parksError } = useQuery({
    queryKey: ['/api/parks'],
    queryFn: async () => {
      const response = await fetch('/api/parks', {
        headers: {
          'Authorization': 'Bearer direct-token',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Error al obtener parques');
      return response.json();
    }
  });
  
  // Los parques vienen directamente como array, no dentro de un objeto 'data'
  const parks = Array.isArray(parksResponse) ? parksResponse : (parksResponse?.data || []);
  
  // Debug logging para parques
  useEffect(() => {
    console.log('Parques procesados:', { 
      parksResponse, 
      parks, 
      parksCount: parks.length,
      isLoadingParks, 
      parksError: parksError?.message 
    });
  }, [parksResponse, parks, isLoadingParks, parksError]);

  // Llenar el formulario cuando se cargan los datos
  useEffect(() => {
    if (volunteerData) {
      console.log('Datos del voluntario recibidos:', volunteerData);
      
      // Si el voluntario tiene una imagen de perfil, mostrarla
      const imageUrl = volunteerData.profileImageUrl || volunteerData.profile_image_url;
      if (imageUrl) {
        setUploadedImageUrl(imageUrl);
      }
      
      // Obtener firstName y lastName - usar los campos separados si están disponibles, 
      // sino separar el nombre completo
      let firstName = volunteerData.firstName || '';
      let lastName = volunteerData.lastName || '';
      
      // Si no tenemos firstName y lastName separados, usar full_name
      if (!firstName && !lastName && volunteerData.full_name) {
        const fullName = volunteerData.full_name;
        const nameParts = fullName.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      console.log('Nombres procesados:', { firstName, lastName, full_name: volunteerData.full_name });
      console.log('PreferredParkId actual:', volunteerData.preferredParkId, 'tipo:', typeof volunteerData.preferredParkId);
      console.log('Áreas de interés del voluntario:', {
        interestNature: volunteerData.interestNature,
        interestEvents: volunteerData.interestEvents,
        interestEducation: volunteerData.interestEducation,
        interestMaintenance: volunteerData.interestMaintenance,
        interestSports: volunteerData.interestSports,
        interestCultural: volunteerData.interestCultural
      });
      
      // Parsear áreas de interés si están en JSON
      let interestAreas = [];
      try {
        if (volunteerData.interest_areas) {
          if (typeof volunteerData.interest_areas === 'string') {
            interestAreas = JSON.parse(volunteerData.interest_areas);
          } else if (Array.isArray(volunteerData.interest_areas)) {
            interestAreas = volunteerData.interest_areas;
          }
        }
      } catch (e) {
        console.error('Error parsing interest areas:', e);
        interestAreas = [];
      }
      
      form.reset({
        firstName: firstName,
        lastName: lastName,
        email: volunteerData.email || '',
        phone: volunteerData.phone || '',
        gender: volunteerData.gender || 'no_especificar',
        birthDate: volunteerData.birth_date || '',
        address: volunteerData.address || '',
        emergencyContactName: volunteerData.emergencyContactName || volunteerData.emergency_contact || '',
        emergencyContactPhone: volunteerData.emergencyContactPhone || volunteerData.emergency_phone || '',
        preferredParkId: volunteerData.preferredParkId || volunteerData.preferred_park_id?.toString() || '',
        volunteerExperience: volunteerData.volunteerExperience || volunteerData.previous_experience || '',
        skills: volunteerData.skills || '',
        availability: volunteerData.available_hours || 'flexible',
        interestNature: volunteerData.interestNature || interestAreas.includes('naturaleza') || interestAreas.includes('nature') || false,
        interestEvents: volunteerData.interestEvents || interestAreas.includes('eventos') || interestAreas.includes('events') || false,
        interestEducation: volunteerData.interestEducation || interestAreas.includes('educacion') || interestAreas.includes('education') || false,
        interestMaintenance: volunteerData.interestMaintenance || interestAreas.includes('mantenimiento') || interestAreas.includes('maintenance') || false,
        interestSports: volunteerData.interestSports || interestAreas.includes('deportes') || interestAreas.includes('sports') || false,
        interestCultural: volunteerData.interestCultural || interestAreas.includes('cultural') || interestAreas.includes('culture') || false,
        legalConsent: volunteerData.legal_consent !== false,
        ageConsent: true,
        conductConsent: true,
        municipalityId: 2,
        profileImage: volunteerData.profile_image_url || null,
      });
    }
  }, [volunteerData, form]);

  // Mutación para actualizar voluntario
  const updateVolunteerMutation = useMutation({
    mutationFn: async (data: EditVolunteerForm) => {
      console.log('🚀 Enviando datos al servidor:', data);
      const response = await apiRequest(`/api/volunteers/${volunteerId}`, {
        method: 'PUT',
        data: data, // Cambiar de 'body' a 'data' para consistency con apiRequest
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Voluntario actualizado',
        description: 'Los datos del voluntario han sido actualizados exitosamente',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/volunteers'] });
      setLocation(ROUTES.admin.volunteers.list);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el voluntario',
        variant: 'destructive',
      });
      console.error('Error actualizando voluntario:', error);
    },
  });

  const onSubmit = (data: EditVolunteerForm) => {
    updateVolunteerMutation.mutate(data);
  };

  if (isLoadingVolunteer) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <p>Cargando datos del voluntario...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation(ROUTES.admin.volunteers.list)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Voluntarios
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Edit className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight">Editar Voluntario</h1>
          </div>
          <p className="text-muted-foreground">
            Actualice la información del voluntario
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Datos básicos del voluntario</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingrese el nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingrese el apellido" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ejemplo@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de teléfono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Género</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="femenino">Femenino</SelectItem>
                            <SelectItem value="no_especificar">No especificar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Nacimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disponibilidad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekdays">Días de semana</SelectItem>
                            <SelectItem value="weekends">Fines de semana</SelectItem>
                            <SelectItem value="evenings">Tardes</SelectItem>
                            <SelectItem value="mornings">Mañanas</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Dirección completa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo de fotografía del voluntario */}
                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="profileImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Fotografía del Voluntario (Opcional)
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {!uploadedImageUrl ? (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <Upload className="h-8 w-8 text-gray-400" />
                                  <p className="text-sm text-gray-600">
                                    Subir o cambiar fotografía del voluntario
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    JPG, PNG o WEBP (máx. 5MB)
                                  </p>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleImageUpload(file);
                                      }
                                    }}
                                    className="hidden"
                                    id="volunteer-image-upload-edit"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('volunteer-image-upload-edit')?.click()}
                                    disabled={isUploadingImage}
                                  >
                                    {isUploadingImage ? 'Subiendo...' : 'Seleccionar Imagen'}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative inline-block">
                                <img
                                  src={uploadedImageUrl}
                                  alt="Foto del voluntario"
                                  className="w-32 h-32 object-cover rounded-lg border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                  onClick={handleRemoveImage}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Información de Contacto de Emergencia */}
            <Card>
              <CardHeader>
                <CardTitle>Contacto de Emergencia</CardTitle>
                <CardDescription>Información de contacto en caso de emergencia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del contacto</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono de emergencia</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de teléfono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Información de Voluntariado */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Voluntariado</CardTitle>
                <CardDescription>Preferencias y experiencia del voluntario</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="preferredParkId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parque Preferido</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              isLoadingParks 
                                ? "Cargando parques..." 
                                : parksError 
                                  ? "Error al cargar parques" 
                                  : "Seleccione un parque"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin preferencia</SelectItem>
                          {parks && parks.length > 0 ? (
                            parks.map((park: any) => (
                              <SelectItem key={park.id} value={park.id.toString()}>
                                {park.name}
                              </SelectItem>
                            ))
                          ) : isLoadingParks ? (
                            <SelectItem value="loading" disabled>Cargando parques...</SelectItem>
                          ) : (
                            <SelectItem value="no_parks" disabled>No hay parques disponibles</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="volunteerExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experiencia Previa</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describa su experiencia previa como voluntario..." 
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Habilidades y Talentos</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describa sus habilidades y talentos..." 
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Áreas de Interés */}
            <Card>
              <CardHeader>
                <CardTitle>Áreas de Interés</CardTitle>
                <CardDescription>Seleccione las áreas en las que le gustaría participar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="interestNature"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Naturaleza y Medio Ambiente</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interestEvents"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Eventos y Actividades</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interestEducation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Educación Ambiental</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interestMaintenance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Mantenimiento y Jardinería</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interestSports"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Deportes y Recreación</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interestCultural"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Actividades Culturales</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Consentimientos Legales */}
            <Card>
              <CardHeader>
                <CardTitle>Consentimientos Legales</CardTitle>
                <CardDescription>Aceptación de términos y condiciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="legalConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Acepto los términos y condiciones legales</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ageConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Confirmo que soy mayor de edad</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conductConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Acepto el código de conducta del voluntario</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/admin/volunteers')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateVolunteerMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateVolunteerMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}