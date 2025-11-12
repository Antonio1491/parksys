import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { ReturnHeader } from "@/components/ui/return-header";
import AdminLayout from "@/components/AdminLayout";
import AdvertisementForm from "@/components/admin/advertising/AdvertisementForm";
import type { AdCampaign, AdvertisementFormData } from "@/types/advertising";
import ROUTES from "@/routes";

export default function NewAdvertisement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Query para obtener campañas
  const { data: campaignsResponse } = useQuery({
    queryKey: ["/api/advertising/campaigns"],
  });

  const campaigns: AdCampaign[] = campaignsResponse?.data || [];

  // Mutation para crear
  const createMutation = useMutation({
    mutationFn: async (data: AdvertisementFormData) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const token = await user.getIdToken();

      const response = await fetch("/api/advertising/advertisements", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/advertisements"] });
      toast({
        title: "Éxito",
        description: "Anuncio creado correctamente",
      });
      setLocation(ROUTES.admin.advertising.advertisements.list);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el anuncio",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AdvertisementFormData) => {
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation(ROUTES.admin.advertising.advertisements.list);
  };

  return (
    <AdminLayout>
      <div className="mx-auto">
        <ReturnHeader />
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold">
            Nuevo Anuncio
          </h1>
          <p className="text-gray-600 mt-2">
            Crea un nuevo anuncio publicitario para el sistema
          </p>
        </div>
        <AdvertisementForm
          campaigns={campaigns}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </AdminLayout>
  );
}