import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { ReturnHeader } from "@/components/ui/return-header";
import AdvertisementForm from "@/components/admin/advertising/AdvertisementForm";
import type { Advertisement, AdCampaign, AdvertisementFormData } from "@/types/advertising";
import ROUTES from "@/routes";

export default function EditAdvertisement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const params = useParams();
  const id = params.id;

  // Query para obtener el anuncio
  const { data: advertisementResponse, isLoading: isLoadingAd } = useQuery({
    queryKey: ["/api/advertising/advertisements", id],
    queryFn: async () => {
      const response = await fetch(`/api/advertising/advertisements/${id}`);
      if (!response.ok) throw new Error("Error al cargar");
      return response.json();
    },
    enabled: !!id,
  });

  const advertisement: Advertisement | undefined = advertisementResponse?.data;

  // Query para obtener campañas
  const { data: campaignsResponse } = useQuery({
    queryKey: ["/api/advertising/campaigns"],
  });

  const campaigns: AdCampaign[] = campaignsResponse?.data || [];

  // Mutation para actualizar
  const updateMutation = useMutation({
    mutationFn: async (data: AdvertisementFormData) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const token = await user.getIdToken();

      const response = await fetch(`/api/advertising/advertisements/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/advertisements", id] });
      toast({
        title: "Éxito",
        description: "Anuncio actualizado correctamente",
      });
      setLocation(ROUTES.admin.advertising.advertisements.list);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el anuncio",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AdvertisementFormData) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation(ROUTES.admin.advertising.advertisements.list);
  };

  if (isLoadingAd) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!advertisement) {
    return (
      <AdminLayout>
        <div className="space-y-6 max-w-4xl">
          <Button variant="outline" onClick={handleCancel}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver a la lista
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto">
        <ReturnHeader />
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold">
            Editar Anuncio
          </h1>
          <p className="text-gray-600 mt-2">
            Edita los detalles del anuncio "{advertisement.title}" para el sistema de publicidad
          </p>
        </div>
        <AdvertisementForm
          advertisement={advertisement}
          campaigns={campaigns}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </AdminLayout>
  );
}