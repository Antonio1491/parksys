import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Calculator, Info } from 'lucide-react';

interface CostingSectionProps {
  costRecoveryPercentage: number;
  onCostRecoveryChange: (percentage: number) => void;
  financialNotes?: string;
  onFinancialNotesChange?: (notes: string) => void;
  showAdvancedFields?: boolean;
  className?: string;
}

export function CostingSection({
  costRecoveryPercentage,
  onCostRecoveryChange,
  financialNotes = '',
  onFinancialNotesChange,
  showAdvancedFields = true,
  className = ""
}: CostingSectionProps) {
  
  const getCostRecoveryStatus = (percentage: number) => {
    if (percentage === 0) return { label: 'Gratuito', color: 'bg-green-100 text-green-800' };
    if (percentage <= 25) return { label: 'Recuperación Baja', color: 'bg-blue-100 text-blue-800' };
    if (percentage <= 50) return { label: 'Recuperación Media', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage <= 75) return { label: 'Recuperación Alta', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Recuperación Total', color: 'bg-red-100 text-red-800' };
  };

  const status = getCostRecoveryStatus(costRecoveryPercentage);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-5 w-5 text-green-600" />
          Costeo Financiero
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Porcentaje de recuperación de costos */}
        <div className="space-y-2">
          <Label htmlFor="cost-recovery" className="text-sm font-medium">
            Porcentaje de recuperación de costos
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="cost-recovery"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={costRecoveryPercentage}
              onChange={(e) => onCostRecoveryChange(parseFloat(e.target.value) || 0)}
              className="w-24"
              data-testid="input-cost-recovery"
            />
            <span className="text-sm text-gray-600">%</span>
            <Badge className={status.color} variant="secondary">
              {status.label}
            </Badge>
          </div>
          <div className="text-xs text-gray-600">
            Define qué porcentaje de los costos operativos debe ser recuperado mediante pagos
          </div>
        </div>

        {/* Indicadores de referencia */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs font-medium text-gray-700 mb-2">Referencia de recuperación:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>0%:</span>
              <span className="text-green-600">Actividad gratuita</span>
            </div>
            <div className="flex justify-between">
              <span>30%:</span>
              <span className="text-blue-600">Subsidio municipal</span>
            </div>
            <div className="flex justify-between">
              <span>70%:</span>
              <span className="text-orange-600">Autofinanciada</span>
            </div>
            <div className="flex justify-between">
              <span>100%:</span>
              <span className="text-red-600">Costo completo</span>
            </div>
          </div>
        </div>

        {/* Notas financieras */}
        {showAdvancedFields && onFinancialNotesChange && (
          <div className="space-y-2">
            <Label htmlFor="financial-notes" className="text-sm font-medium">
              Observaciones financieras
            </Label>
            <Textarea
              id="financial-notes"
              placeholder="Justificación del porcentaje de recuperación, consideraciones especiales, criterios de subsidio..."
              value={financialNotes}
              onChange={(e) => onFinancialNotesChange(e.target.value)}
              className="min-h-[80px] text-sm"
              data-testid="textarea-financial-notes"
            />
            <div className="text-xs text-gray-600">
              Documenta la justificación del costeo para el área de finanzas
            </div>
          </div>
        )}

        {/* Información de flujo de aprobación */}
        {showAdvancedFields && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Flujo de aprobación:</strong> Los elementos con costeo definido requieren 
              revisión del área de finanzas antes de ser publicados o activados.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Hook para cálculos de costeo
export function useCostingCalculator() {
  const calculatePriceFromCostRecovery = (
    operationalCost: number, 
    recoveryPercentage: number
  ) => {
    return (operationalCost * recoveryPercentage) / 100;
  };

  const getCostRecoveryRecommendation = (
    itemType: 'activity' | 'event' | 'space_reservation',
    isRecurring: boolean = false
  ) => {
    const recommendations = {
      activity: {
        recurring: 30, // Actividades regulares con subsidio
        oneTime: 50    // Actividades especiales
      },
      event: {
        recurring: 50, // Eventos recurrentes
        oneTime: 70    // Eventos únicos
      },
      space_reservation: {
        recurring: 60, // Reservas regulares
        oneTime: 80    // Reservas comerciales
      }
    };

    return recommendations[itemType][isRecurring ? 'recurring' : 'oneTime'];
  };

  return {
    calculatePriceFromCostRecovery,
    getCostRecoveryRecommendation
  };
}