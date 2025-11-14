import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlacementForm } from "./PlacementForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import type { AdPlacement, PlacementFormData } from "@/types/advertising";

interface PlacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: AdPlacement;
}

export function PlacementDialog({
  open,
  onOpenChange,
  placement,
}: PlacementDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mutación para crear placement
  const createMutation = useMutation({
    mutationFn: async (data: PlacementFormData) => {
      // Obtener token de Firebase
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const token = await user.getIdToken();

      const response = await fetch("/api/advertising/placements", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          advertisementId: parseInt(data.advertisementId),
          adSpaceId: parseInt(data.adSpaceId),
          pageType: data.pageType,
          pageId: data.pageId ? parseInt(data.pageId) : null,
          startDate: data.startDate,
          endDate: data.endDate,
          priority: parseInt(data.priority),
          isActive: data.isActive,
          frequency: data.frequency,
          scheduledDays: data.scheduledDays || null,
          scheduledHours: data.scheduledHours || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error creando placement");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/placements"] });
      toast({
        title: "Placement creado",
        description: "El placement se ha creado exitosamente",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Mutación para actualizar placement
  const updateMutation = useMutation({
    mutationFn: async (data: PlacementFormData) => {
      if (!placement?.id) throw new Error("ID de placement no encontrado");

      // Obtener token de Firebase
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const token = await user.getIdToken();

      const response = await fetch(`/api/advertising/placements/${placement.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          advertisementId: parseInt(data.advertisementId),
          adSpaceId: parseInt(data.adSpaceId),
          pageType: data.pageType,
          pageId: data.pageId ? parseInt(data.pageId) : null,
          startDate: data.startDate,
          endDate: data.endDate,
          priority: parseInt(data.priority),
          isActive: data.isActive,
          frequency: data.frequency,
          scheduledDays: data.scheduledDays || null,
          scheduledHours: data.scheduledHours || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error actualizando placement");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/placements"] });
      toast({
        title: "Placement actualizado",
        description: "El placement se ha actualizado exitosamente",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: PlacementFormData) => {
    setIsSubmitting(true);
    if (placement) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {placement ? "Editar Placement" : "Crear Nuevo Placement"}
          </DialogTitle>
        </DialogHeader>

        <PlacementForm
          placement={placement}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}