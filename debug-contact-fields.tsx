import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Esquema simplificado solo para campos de contacto
const contactFormSchema = z.object({
  organizer_name: z.string().optional().nullable(),
  organizer_organization: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const DebugContactFields: React.FC = () => {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      organizer_name: "",
      organizer_organization: "",
      contact_email: "",
      contact_phone: "",
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    console.log("DEBUG - Datos del formulario de contacto:", data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">DEBUG: Campos de Contacto</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sección de Información de Contacto */}
            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
              <h3 className="text-lg font-medium mb-4 text-green-800">
                📞 Información de Contacto
              </h3>
              <p className="text-sm text-green-600 mb-4">
                CAMPOS INCLUIDOS: Nombre del Contacto, Empresa/Organización, Email, Teléfono
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="organizer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-800 font-semibold">Nombre del Contacto</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Nombre completo del responsable"
                          {...field}
                          value={field.value || ""}
                          className="bg-white border-2 border-green-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizer_organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-800 font-semibold">Empresa / Organización</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Nombre de la empresa u organización"
                          {...field}
                          value={field.value || ""}
                          className="bg-white border-2 border-green-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-800 font-semibold">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="correo@ejemplo.com"
                          {...field}
                          value={field.value || ""}
                          className="bg-white border-2 border-green-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-800 font-semibold">Teléfono</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          {...field}
                          value={field.value || ""}
                          className="bg-white border-2 border-green-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Probar Formulario de Contacto
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default DebugContactFields;