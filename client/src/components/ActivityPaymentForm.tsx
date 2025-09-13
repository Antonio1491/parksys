import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, DollarSign, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ActivityPaymentFormProps {
  activityId: string;
  activity?: {
    id: number;
    title: string;
    price: string | number;
    isFree?: boolean;
    isPriceRandom?: boolean;
    parkName?: string;
    // Campos de descuentos
    discountSeniors?: number;
    discountStudents?: number;
    discountFamilies?: number;
    discountDisability?: number;
    discountEarlyBird?: number;
    discountEarlyBirdDeadline?: string;
  };
  participantData: {
    fullName: string;
    email: string;
    phone?: string;
    additionalInfo?: string;
  };
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function ActivityPaymentForm({ 
  activityId,
  activity, 
  participantData, 
  onSuccess, 
  onError 
}: ActivityPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<string>('none');
  const [discountPercentage, setDiscountPercentage] = useState(0);

  // Determine if this is a suggested price (random pricing)
  const isPriceRandom = activity?.isPriceRandom || false;
  const basePrice = parseFloat(activity?.price?.toString() || '0');

  // Función para obtener descuentos disponibles
  const getAvailableDiscounts = () => {
    const discounts = [];
    
    if ((activity?.discountSeniors || 0) > 0) {
      discounts.push({
        id: 'seniors',
        label: '🧓 Adultos mayores (65+)',
        percentage: activity.discountSeniors || 0,
        description: 'Descuento para personas de 65 años en adelante'
      });
    }
    
    if ((activity?.discountStudents || 0) > 0) {
      discounts.push({
        id: 'students',
        label: '🎓 Estudiantes',
        percentage: activity.discountStudents || 0,
        description: 'Descuento para estudiantes con credencial válida'
      });
    }
    
    if ((activity?.discountFamilies || 0) > 0) {
      discounts.push({
        id: 'families',
        label: '👨‍👩‍👧‍👦 Familias numerosas',
        percentage: activity.discountFamilies || 0,
        description: 'Descuento para familias con 3 o más hijos'
      });
    }
    
    if ((activity?.discountDisability || 0) > 0) {
      discounts.push({
        id: 'disability',
        label: '♿ Personas con discapacidad',
        percentage: activity.discountDisability || 0,
        description: 'Descuento para personas con discapacidad'
      });
    }
    
    // Verificar si el descuento early bird está disponible
    if ((activity?.discountEarlyBird || 0) > 0 && activity?.discountEarlyBirdDeadline) {
      const deadlineDate = new Date(activity.discountEarlyBirdDeadline);
      const currentDate = new Date();
      
      if (currentDate <= deadlineDate) {
        discounts.push({
          id: 'early_bird',
          label: '⏰ Inscripción temprana',
          percentage: activity.discountEarlyBird || 0,
          description: `Válido hasta ${deadlineDate.toLocaleDateString('es-ES')}`
        });
      }
    }
    
    return discounts;
  };

  const availableDiscounts = getAvailableDiscounts();

  // Función para calcular el precio con descuento
  const calculateDiscountedPrice = (originalPrice: number, discount: number) => {
    return originalPrice * (1 - discount / 100);
  };

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

  // Manejar cambio de descuento
  const handleDiscountChange = (discountId: string) => {
    setSelectedDiscount(discountId);
    
    if (discountId === 'none') {
      setDiscountPercentage(0);
    } else {
      const discount = availableDiscounts.find(d => d.id === discountId);
      setDiscountPercentage(discount?.percentage || 0);
    }
  };

  // Payment processing mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch(`/api/activities/${activityId}/create-payment-intent`, {
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

      // Step 3: Create registration and confirm payment in backend
      const registrationResponse = await fetch(`/api/activities/${activity!.id}/complete-payment-registration`, {
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

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('es-MX')} MXN`;
  };

  if (activity?.isFree) {
    return (
      <div className="w-full">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta actividad es gratuita. No se requiere pago.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Selección de descuentos */}
      {availableDiscounts.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg text-sm">
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
      )}

      {/* Resumen compacto */}
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
          <span className="text-lg font-bold text-green-600">
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
            />
          </div>
        )}
      </div>

      {/* Formulario de pago compacto */}
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
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={!stripe || processing}
            className="flex-1 h-9"
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