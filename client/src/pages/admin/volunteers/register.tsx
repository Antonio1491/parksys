import { useState } from 'react';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, UserPlus, Upload, X, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Schema de validación para registro de voluntarios
const volunteerRegistrationSchema = z.object({
  // Información personal básica
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Debe ser un email válido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  birthDate: z.string().min(1, 'La fecha de nacimiento es requerida'),
  gender: z.enum(['masculino', 'femenino', 'no_especificar']),
  
  // Información de contacto
  address: z.string().min(10, 'La dirección debe tener al menos 10 caracteres'),
  emergencyContactName: z.string().min(2, 'El nombre del contacto de emergencia es requerido'),
  emergencyContactPhone: z.string().min(10, 'El teléfono de emergencia debe tener al menos 10 dígitos'),
  
  // Información de voluntariado
  preferredParkId: z.string().optional(),
  volunteerExperience: z.string().optional(),
  skills: z.string().optional(),
  availability: z.enum(['weekdays', 'weekends', 'evenings', 'mornings', 'flexible']),
  
  // Fotografía del voluntario
  profileImage: z.any().optional(),
  
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
  
  // Municipalidad
  municipalityId: z.number().optional(),
});

type VolunteerRegistrationForm = z.infer<typeof volunteerRegistrationSchema>;

export default function VolunteerRegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<VolunteerRegistrationForm>({
    resolver: zodResolver(volunteerRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      gender: 'no_especificar',
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
          title: 'Imagen subida',
          description: 'La fotografía del voluntario se ha subido correctamente',
        });
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen',
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
  };

  // Mutación para crear voluntario
  const createVolunteerMutation = useMutation({
    mutationFn: async (data: VolunteerRegistrationForm) => {
      const volunteerData = {
        ...data,
        role: 'voluntario',
        username: data.email, // Usar email como username
        password: 'temp123', // Contraseña temporal
        profileImageUrl: uploadedImageUrl, // Incluir la URL de la imagen subida
      };

      const response = await apiRequest('/api/users', {
        method: 'POST',
        data: volunteerData,
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Voluntario registrado',
        description: 'El voluntario ha sido registrado exitosamente',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/volunteers'] });
      setLocation(ROUTES.admin.volunteers.list);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo registrar el voluntario',
        variant: 'destructive',
      });
      console.error('Error registrando voluntario:', error);
    },
  });

  const onSubmit = (data: VolunteerRegistrationForm) => {
    createVolunteerMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header con patrón Card estandarizado */}
        <Card className="p-4 bg-gray-50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus className="w-8 h-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">Registro de Nuevo Voluntario</h1>
              </div>
              <p className="text-gray-600 mt-2">
                Complete la información del voluntario para registrarlo en el sistema
              </p>
            </div>
          </div>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Datos básicos del voluntario</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre" {...field} />
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
                        <Input placeholder="Apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="correo@ejemplo.com" {...field} />
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
                        <Input placeholder="33-1234-5678" {...field} />
                      </FormControl>
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
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Género</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar género" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="femenino">Femenino</SelectItem>
                          <SelectItem value="no_especificar">Prefiero no especificar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo de fotografía del voluntario */}
                <div className="md:col-span-2">
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
                                    Subir fotografía del voluntario
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
                                    id="volunteer-image-upload"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('volunteer-image-upload')?.click()}
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

            {/* Información de Contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
                <CardDescription>Datos de contacto y emergencia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Dirección completa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contacto de Emergencia</FormLabel>
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
                        <FormLabel>Teléfono de Emergencia</FormLabel>
                        <FormControl>
                          <Input placeholder="33-1234-5678" {...field} />
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
                <CardDescription>Experiencia y preferencias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disponibilidad</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar disponibilidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekdays">Entre semana</SelectItem>
                            <SelectItem value="weekends">Fines de semana</SelectItem>
                            <SelectItem value="evenings">Tardes/Noches</SelectItem>
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
                  name="volunteerExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experiencia como Voluntario (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describa su experiencia previa..." {...field} />
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
                      <FormLabel>Habilidades y Talentos (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describa sus habilidades..." {...field} />
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
                <CardDescription>Seleccione las actividades de su interés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                        <FormLabel className="text-sm font-normal">
                          Naturaleza y Medio Ambiente
                        </FormLabel>
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
                        <FormLabel className="text-sm font-normal">
                          Eventos y Actividades
                        </FormLabel>
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
                        <FormLabel className="text-sm font-normal">
                          Educación Ambiental
                        </FormLabel>
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
                        <FormLabel className="text-sm font-normal">
                          Mantenimiento de Parques
                        </FormLabel>
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
                        <FormLabel className="text-sm font-normal">
                          Deportes y Recreación
                        </FormLabel>
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
                        <FormLabel className="text-sm font-normal">
                          Actividades Culturales
                        </FormLabel>
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
                      <FormLabel className="text-sm">
                        Acepto los términos y condiciones del programa de voluntariado y autorizo el tratamiento de mis datos personales conforme a la Ley de Protección de Datos Personales.
                      </FormLabel>
                      <FormMessage />
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
                      <FormLabel className="text-sm">
                        Confirmo que soy mayor de 18 años o cuento con autorización de mis padres o tutores legales.
                      </FormLabel>
                      <FormMessage />
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
                      <FormLabel className="text-sm">
                        Me comprometo a cumplir con el código de conducta del programa de voluntariado y las normativas de seguridad establecidas.
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/admin/volunteers')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createVolunteerMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {createVolunteerMutation.isPending ? 'Registrando...' : 'Registrar Voluntario'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}

