import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import ROUTES from "@/routes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { ReturnHeader } from "@/components/ui/return-header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAuth } from "firebase/auth";
import SpaceForm from "@/components/admin/advertising/SpaceForm";
import type { AdSpace, SpaceFormData } from "@/types/advertising";

export default function EditSpacePage() {
  const [, params] = useRoute(ROUTES.admin.advertising.spaces.edit.path);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const spaceId = params?.id ? parseInt(params.id) : null;

  // Query para obtener el espacio
  const { data: spaceData, isLoading } = useQuery<{
    success: boolean;
    data: AdSpace[];
  }>({
    queryKey: ["/api/advertising/spaces"],
    enabled: !!spaceId,
  });

  const space = spaceData?.data?.find((s) => s.id === spaceId);

  // Mutation para actualizar espacio
  const updateMutation = useMutation({
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

      const response = await fetch(`/api/advertising/spaces/${spaceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar espacio");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/spaces"] });
      toast({
        title: "Espacio actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      });
      setLocation(ROUTES.admin.advertising.spaces.list);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: SpaceFormData) => {
    setIsSubmitting(true);
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation(ROUTES.admin.advertising.spaces.list);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#00a587]" />
        </div>
      </AdminLayout>
    );
  }

  if (!space) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Espacio no encontrado</p>
          <Button onClick={handleCancel} variant="outline">
            Volver a Espacios
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto">
        {/* Header con ReturnHeader */}
        <ReturnHeader />
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold">
            Editar Espacio Publicitario
          </h1>
          <p className="text-gray-600 mt-2">
            Edita los detalles del espacio publicitario seleccionado
          </p>
        </div>

        {/* Formulario */}
        <SpaceForm
          space={space}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </AdminLayout>
  );
}