import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export interface DiscountOption {
  id: string;
  label: string;
  percentage: number;
  description: string;
}

export interface DiscountableItem {
  // Campos de descuentos
  discountSeniors?: number;
  discountStudents?: number;
  discountFamilies?: number;
  discountDisability?: number;
  discountEarlyBird?: number;
  discountEarlyBirdDeadline?: string;
}

interface UnifiedDiscountSelectorProps {
  item: DiscountableItem;
  selectedDiscount: string;
  onDiscountChange: (discountId: string, percentage: number) => void;
  className?: string;
}

export function UnifiedDiscountSelector({ 
  item, 
  selectedDiscount, 
  onDiscountChange, 
  className = "" 
}: UnifiedDiscountSelectorProps) {
  
  // Función para obtener descuentos disponibles (extraída de ActivityPaymentForm)
  const getAvailableDiscounts = (): DiscountOption[] => {
    const discounts: DiscountOption[] = [];
    
    if ((item.discountSeniors || 0) > 0) {
      discounts.push({
        id: 'seniors',
        label: '🧓 Adultos mayores (65+)',
        percentage: item.discountSeniors || 0,
        description: 'Descuento para personas de 65 años en adelante'
      });
    }
    
    if ((item.discountStudents || 0) > 0) {
      discounts.push({
        id: 'students',
        label: '🎓 Estudiantes',
        percentage: item.discountStudents || 0,
        description: 'Descuento para estudiantes con credencial válida'
      });
    }
    
    if ((item.discountFamilies || 0) > 0) {
      discounts.push({
        id: 'families',
        label: '👨‍👩‍👧‍👦 Familias numerosas',
        percentage: item.discountFamilies || 0,
        description: 'Descuento para familias con 3 o más hijos'
      });
    }
    
    if ((item.discountDisability || 0) > 0) {
      discounts.push({
        id: 'disability',
        label: '♿ Personas con discapacidad',
        percentage: item.discountDisability || 0,
        description: 'Descuento para personas con discapacidad'
      });
    }
    
    // Verificar si el descuento early bird está disponible
    if ((item.discountEarlyBird || 0) > 0 && item.discountEarlyBirdDeadline) {
      const deadlineDate = new Date(item.discountEarlyBirdDeadline);
      const currentDate = new Date();
      
      if (currentDate <= deadlineDate) {
        discounts.push({
          id: 'early_bird',
          label: '⏰ Inscripción temprana',
          percentage: item.discountEarlyBird || 0,
          description: `Válido hasta ${deadlineDate.toLocaleDateString('es-ES')}`
        });
      }
    }
    
    return discounts;
  };

  const availableDiscounts = getAvailableDiscounts();

  // Manejar cambio de descuento
  const handleDiscountChange = (discountId: string) => {
    if (discountId === 'none') {
      onDiscountChange(discountId, 0);
    } else {
      const discount = availableDiscounts.find(d => d.id === discountId);
      onDiscountChange(discountId, discount?.percentage || 0);
    }
  };

  // Si no hay descuentos disponibles, no mostrar el selector
  if (availableDiscounts.length === 0) {
    return null;
  }

  return (
    <div className={`bg-blue-50 p-3 rounded-lg text-sm ${className}`}>
      <Label className="text-sm font-medium mb-2 block">💰 Descuentos disponibles</Label>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="no-discount"
            name="discount"
            value="none"
            checked={selectedDiscount === 'none'}
            onChange={(e) => handleDiscountChange(e.target.value)}
            className="text-blue-600"
            data-testid="radio-discount-none"
          />
          <label htmlFor="no-discount" className="text-sm">Sin descuento</label>
        </div>
        {availableDiscounts.map((discount) => (
          <div key={discount.id} className="flex items-center space-x-2">
            <input
              type="radio"
              id={discount.id}
              name="discount"
              value={discount.id}
              checked={selectedDiscount === discount.id}
              onChange={(e) => handleDiscountChange(e.target.value)}
              className="text-blue-600"
              data-testid={`radio-discount-${discount.id}`}
            />
            <label htmlFor={discount.id} className="flex-1">
              <div className="text-sm">
                {discount.label} <Badge variant="secondary">{discount.percentage}%</Badge>
              </div>
              <div className="text-xs text-gray-600">{discount.description}</div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook personalizado para usar el selector de descuentos
export function useDiscountCalculator() {
  const calculateDiscountedPrice = (originalPrice: number, discountPercentage: number) => {
    return originalPrice * (1 - discountPercentage / 100);
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('es-MX')} MXN`;
  };

  return {
    calculateDiscountedPrice,
    formatPrice
  };
}