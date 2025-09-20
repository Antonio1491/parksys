import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UnifiedDiscountSelector, DiscountableItem, useDiscountCalculator } from './UnifiedDiscountSelector';

export type PayableItemType = 'activity' | 'event' | 'space_reservation';

export interface PayableItem extends DiscountableItem {
  id: number;
  title: string;
  price: string | number;
  isFree?: boolean;
  isPriceRandom?: boolean;
}

interface UnifiedPaymentFormProps {
  itemType: PayableItemType;
  itemId: string;
  item: PayableItem;
  participantData: {
    fullName: string;
    email: string;
    phone?: string;
    additionalInfo?: string;
  };
  onSuccess: () => void;
  onError: (error: string) => void;
  // Endpoints personalizables por tipo de item
  endpoints?: {
    createPaymentIntent?: string;
    completePayment?: string;
  };
}

export function UnifiedPaymentForm({ 
  itemType,
  itemId,
  item, 
  participantData, 
  onSuccess, 
  onError,
  endpoints
}: UnifiedPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { calculateDiscountedPrice, formatPrice } = useDiscountCalculator();
  
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<string>('none');
  const [discountPercentage, setDiscountPercentage] = useState(0);

  // Determine if this is a suggested price (random pricing)
  const isPriceRandom = item?.isPriceRandom || false;
  const basePrice = parseFloat(item?.price?.toString() || '0');

  // Precio final con descuentos aplicados
  const getFinalPrice = () => {
    const originalPrice = isPriceRandom && customAmount 
      ? parseFloat(customAmount) 
      : basePrice;
      
    if (selectedDiscount === 'none' || discountPercentage === 0) {
      return originalPrice;
    }
    
    return calculateDiscountedPrice(originalPrice, discountPercentage);
  };

  // Generar endpoints por defecto basados en el tipo de item
  const getEndpoints = () => {
    if (endpoints) return endpoints;
    
    const baseEndpoints = {
      activity: {
        createPaymentIntent: `/api/activities/${itemId}/create-payment-intent`,
        completePayment: `/api/activities/${item.id}/complete-payment-registration`
      },
      event: {
        createPaymentIntent: `/api/events/${itemId}/create-payment-intent`,
        completePayment: `/api/events/${item.id}/complete-payment-registration`
      },
      space_reservation: {
        createPaymentIntent: `/api/space-reservations/${itemId}/create-payment-intent`,
        completePayment: `/api/space-reservations/${item.id}/complete-payment-registration`
      }
    };
    
    return baseEndpoints[itemType];
  };

  const apiEndpoints = getEndpoints();

  // Payment processing mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch(apiEndpoints.createPaymentIntent, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el pago');
      }
      
      return response.json();
    },
    onError: (error: Error) => {
      setProcessing(false);
      setPaymentError(error.message);
      onError(error.message);
    }
  });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setPaymentError('Stripe no está disponible');
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError('Elemento de tarjeta no encontrado');
      setProcessing(false);
      return;
    }

    // Determine final amount (with discounts applied)
    const finalAmount = getFinalPrice();

    if (finalAmount <= 0) {
      setPaymentError('El monto debe ser mayor a $0');
      setProcessing(false);
      return;
    }

    try {
      // Step 1: Create payment intent
      const paymentIntentData = await createPaymentIntentMutation.mutateAsync({
        customerData: {
          fullName: participantData.fullName,
          email: participantData.email,
          phone: participantData.phone,
        },
        baseAmount: isPriceRandom && customAmount ? parseFloat(customAmount) : basePrice,
        selectedDiscount: selectedDiscount !== 'none' ? selectedDiscount : null,
        customAmount: isPriceRandom && customAmount ? parseFloat(customAmount) : null,
      });

      // Step 2: Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );
      
      if (result.error) {
        console.error('Stripe error:', result.error);
        throw new Error(result.error.message || 'Error procesando el pago');
      }

      // Step 3: Complete registration and confirm payment in backend
      const registrationResponse = await fetch(apiEndpoints.completePayment, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: result.paymentIntent?.id,
          customerData: participantData,
          baseAmount: isPriceRandom && customAmount ? parseFloat(customAmount) : basePrice,
          selectedDiscount: selectedDiscount !== 'none' ? selectedDiscount : null,
          finalAmount: paymentIntentData.amount, // Usar el monto calculado por el servidor
        }),
      });

      if (!registrationResponse.ok) {
        throw new Error('Error completando el registro después del pago');
      }

      const registrationData = await registrationResponse.json();

      // Payment successful - clear form and show success
      setProcessing(false);
      
      onSuccess();

    } catch (error: any) {
      setProcessing(false);
      setPaymentError(error.message || 'Error inesperado en el pago');
      onError(error.message || 'Error inesperado en el pago');
    }
  };

  // Manejar cambio de descuento desde el selector unificado
  const handleDiscountChange = (discountId: string, percentage: number) => {
    setSelectedDiscount(discountId);
    setDiscountPercentage(percentage);
  };

  if (item?.isFree) {
    return (
      <div className="w-full">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Este {itemType === 'activity' ? 'actividad' : itemType === 'event' ? 'evento' : 'espacio'} es gratuito. No se requiere pago.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Selector de descuentos unificado */}
      <UnifiedDiscountSelector
        item={item}
        selectedDiscount={selectedDiscount}
        onDiscountChange={handleDiscountChange}
      />

      {/* Resumen de precios */}
      <div className="bg-gray-50 p-3 rounded-lg text-sm">
        {discountPercentage > 0 && (
          <div className="flex justify-between items-center mb-1 text-gray-600">
            <span>Precio original:</span>
            <span className="line-through">
              {formatPrice(isPriceRandom && customAmount ? parseFloat(customAmount) : basePrice)}
            </span>
          </div>
        )}
        {discountPercentage > 0 && (
          <div className="flex justify-between items-center mb-1 text-green-600">
            <span>Descuento ({discountPercentage}%):</span>
            <span>-{formatPrice((isPriceRandom && customAmount ? parseFloat(customAmount) : basePrice) * discountPercentage / 100)}</span>
          </div>
        )}
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Total a pagar:</span>
          <span className="text-lg font-bold text-green-600" data-testid="text-total-amount">
            {formatPrice(getFinalPrice())}
          </span>
        </div>
        {isPriceRandom && (
          <div className="space-y-2">
            <Label htmlFor="customAmount" className="text-xs">Monto personalizado (opcional)</Label>
            <Input
              id="customAmount"
              type="number"
              min={basePrice}
              step="0.01"
              placeholder={`Mínimo: ${formatPrice(basePrice)}`}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="h-8"
              data-testid="input-custom-amount"
            />
          </div>
        )}
      </div>

      {/* Formulario de pago */}
      <form onSubmit={handlePayment} className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">Información de tarjeta</Label>
          <div className="p-3 border rounded-lg bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '14px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
                hidePostalCode: true,
              }}
            />
          </div>
        </div>

        {/* Error de pago */}
        {paymentError && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">{paymentError}</AlertDescription>
          </Alert>
        )}

        {/* Nota de seguridad */}
        <div className="text-xs text-gray-600 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Pago seguro con encriptación SSL
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onError('Pago cancelado por el usuario')}
            disabled={processing}
            className="flex-1 h-9"
            data-testid="button-cancel-payment"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={!stripe || processing}
            className="flex-1 h-9"
            data-testid="button-complete-payment"
          >
            {processing ? (
              <>
                <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-2" />
                Procesando...
              </>
            ) : (
              `Pagar ${formatPrice(getFinalPrice())}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}