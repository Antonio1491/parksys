import { useState } from "react";
import { useLocation } from "wouter";
import ROUTES from "@/routes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ReturnHeader } from "@/components/ui/return-header";
import { useToast } from "@/hooks/use-toast";
import { getAuth } from "firebase/auth";
import SpaceForm from "@/components/admin/advertising/SpaceForm";
import type { SpaceFormData } from "@/types/advertising";

export default function NewSpacePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mutation para crear espacio
  const createMutation = useMutation({
    mutationFn: async (data: SpaceFormData) => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      // Transformar datos al formato del backend
      const payload = {
        name: data.name,
        description: data.description || null,
        pageType: data.pageType,
        position: data.position,
        dimensions: data.dimensions || null,
        maxFileSize: data.maxFileSize ? parseInt(data.maxFileSize) : 5242880,
        allowedFormats: data.allowedFormats,
        isActive: data.isActive,
      };

      const response = await fetch("/api/advertising/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear espacio");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/spaces"] });
      toast({
        title: "Espacio creado",
        description: "El espacio publicitario ha sido creado exitosamente.",
      });
      setLocation(ROUTES.admin.advertising.spaces.list);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear espacio",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: SpaceFormData) => {
    setIsSubmitting(true);
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation(ROUTES.admin.advertising.spaces.list);
  };

  return (
    <AdminLayout>
      <div className="mx-auto">
        {/* Header con ReturnHeader */}
        <ReturnHeader />
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold">
            Nuevo Espacio Publicitario
          </h1>
          <p className="text-gray-600 mt-2">
            Crea un nuevo espacio publicitario para el sistema
          </p>
        </div>

        {/* Formulario */}
        <SpaceForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </AdminLayout>
  );
}