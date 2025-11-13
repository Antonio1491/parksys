import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CampaignForm } from "./CampaignForm";
import type { AdCampaign, CampaignFormData } from "@/types/advertising";

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: AdCampaign;
  onSubmit: (data: CampaignFormData) => void;
  isSubmitting?: boolean;
}

export function CampaignDialog({
  open,
  onOpenChange,
  campaign,
  onSubmit,
  isSubmitting = false,
}: CampaignDialogProps) {
  const isEditing = !!campaign;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#00444f]">
            {isEditing ? "Editar Campaña" : "Nueva Campaña Publicitaria"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la campaña existente."
              : "Completa los datos para crear una nueva campaña publicitaria."}
          </DialogDescription>
        </DialogHeader>

        <CampaignForm
          campaign={campaign}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}