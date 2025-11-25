import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import ROUTES from "@/routes";
import { Users, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import PublicLayout from "@/components/PublicLayout";

// Esquema de validación que coincide con el endpoint del backend
const volunteerSchema = z.object({
  fullName: z.string().min(2, "El nombre completo debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phoneNumber: z.string().min(10, "Teléfono debe tener al menos 10 dígitos"),
  birthDate: z.string(),
  address: z.string().min(5, "Dirección debe tener al menos 5 caracteres"),
  emergencyContact: z.string().min(2, "Nombre de contacto debe tener al menos 2 caracteres"),
  emergencyPhone: z.string().min(10, "Teléfono de emergencia debe tener al menos 10 dígitos"),
  occupation: z.string().min(2, "La ocupación es requerida"),
  skills: z.string().min(5, "Describe tus habilidades"),
  availability: z.string().min(1, "Describe tu disponibilidad"),
  interests: z.string().min(5, "Describe tus intereses"),
  previousExperience: z.string(),
  healthConditions: z.string(),
  additionalComments: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, "Debes aceptar los términos y condiciones")
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;



export default function VolunteerRegistration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      birthDate: "",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
      occupation: "",
      skills: "",
      availability: "",
      interests: "",
      previousExperience: "",
      healthConditions: "",
      additionalComments: "",
      termsAccepted: false
    },
  });

  // Query desactivada para simplificar interfaz
  // const { data: municipalities } = useQuery({
  //   queryKey: ["/api/municipalities"],
  // });
  const municipalities: any[] = [];

  const createVolunteerMutation = useMutation({
    mutationFn: async (data: VolunteerFormData) => {
      // Si hay imagen, usar FormData para envío multipart
      if (selectedImage) {
        const formData = new FormData();
        
        // Agregar todos los campos del formulario
        Object.keys(data).forEach(key => {
          const value = data[key as keyof VolunteerFormData];
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });
        
        // Agregar la imagen
        formData.append("profileImage", selectedImage);
        
        const response = await fetch("/api/volunteers/register", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Error al registrar voluntario");
        }
        
        return response.json();
      } else {
        // Sin imagen, usar JSON normal
        return apiRequest("/api/volunteers/register", {
          method: "POST",
          data: data
        });
      }
    },
    onSuccess: () => {
      handleSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al registrar voluntario",
        variant: "destructive",
      });
    },
  });

  const handleSuccess = () => {
    toast({
      title: "¡Registro exitoso!",
      description: "Tu solicitud ha sido enviada. Te contactaremos pronto para confirmar tu registro.",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/volunteers"] });
    setLocation(ROUTES.public.volunteers);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos JPG, PNG o WEBP",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const onSubmit = (data: VolunteerFormData) => {
    createVolunteerMutation.mutate(data);
  };



  return (
    <PublicLayout
      showFooter={false}
    >
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-[#00a587] mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Registro de Voluntario</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Únete a nuestra comunidad de voluntarios y ayuda a mantener nuestros parques hermosos y funcionales
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#00a587] to-[#067f5f] text-white">
            <CardTitle className="text-xl">Información Personal</CardTitle>
            <CardDescription className="text-green-100">
              Completa todos los campos para completar tu registro
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Sección: Fotografía */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Fotografía (Opcional)
                  </h3>
                  
                  <div className="flex flex-col items-center space-y-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Vista previa" 
                          className="w-32 h-32 rounded-full object-cover border-4 border-[#00a587]"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-dashed border-gray-300 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="text-center">
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {imagePreview ? "Cambiar Foto" : "Subir Foto"}
                          </span>
                        </Button>
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        JPG, PNG o WEBP. Máximo 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección: Datos Personales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Datos Personales
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu nombre completo" {...field} />
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
                            <Input type="email" placeholder="tu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="3312345678" {...field} />
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
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ocupación</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu ocupación actual" {...field} />
                          </FormControl>
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
                          <Input placeholder="Tu dirección completa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección: Contacto de Emergencia */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Contacto de Emergencia
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Contacto</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono del Contacto</FormLabel>
                          <FormControl>
                            <Input placeholder="3312345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Sección: Habilidades y Experiencia */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Habilidades y Experiencia
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Habilidades</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe tus habilidades relevantes (jardinería, carpintería, educación, etc.)"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Áreas de Interés</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Áreas donde te gustaría contribuir (mantenimiento, eventos, educación ambiental, etc.)"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experiencia Previa como Voluntario</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Cuéntanos sobre tu experiencia previa como voluntario (opcional)"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="healthConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condiciones de Salud</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Menciona cualquier condición médica que debamos conocer (opcional)"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalComments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comentarios Adicionales (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="¿Hay algo más que te gustaría que sepamos?"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección: Disponibilidad */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Disponibilidad
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disponibilidad</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe tu disponibilidad horaria (ejemplo: Lunes a viernes por las tardes, fines de semana por las mañanas)"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección: Términos y condiciones */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Términos y Condiciones
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Acepto los términos y condiciones del programa de voluntariado
                          </FormLabel>
                          <FormDescription>
                            Al marcar esta casilla, confirmo que he leído y acepto las condiciones 
                            para participar como voluntario en los parques urbanos.
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation(ROUTES.public.volunteers)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#00a587] hover:bg-[#067f5f]"
                    disabled={createVolunteerMutation.isPending}
                  >
                    {createVolunteerMutation.isPending
                      ? "Registrando..."
                      : "Registrarme como Voluntario"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Qué sigue?</h3>
            <p className="text-gray-600">
              Una vez que envíes tu solicitud, nuestro equipo la revisará y te contactaremos 
              en un plazo de 3-5 días hábiles para confirmar tu registro y coordinar tu primera actividad.
            </p>
          </div>
        </div>
      </div>
    </div>
    </PublicLayout>
  );
}