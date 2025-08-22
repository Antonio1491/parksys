import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, DollarSign, Info, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EventPaymentFormProps {
  eventId: string;
  event?: {
    id: number;
    title: string;
    price: number;
    isFree?: boolean;
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

export function EventPaymentForm({ 
  eventId,
  event, 
  participantData, 
  onSuccess, 
  onError 
}: EventPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const basePrice = event?.price || 0;

  // Payment processing mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch(`/api/events/${eventId}/create-payment-intent`, {
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

    if (basePrice <= 0) {
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
        amount: basePrice,
      });

      // Step 2: Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: participantData.fullName,
              email: participantData.email,
            },
          },
        }
      );

      if (result.error) {
        setPaymentError(result.error.message || 'Error en el pago');
        setProcessing(false);
      } else {
        // Payment succeeded
        toast({
          title: 'Pago exitoso',
          description: 'Tu pago ha sido procesado correctamente',
        });
        onSuccess();
      }
    } catch (error: any) {
      setPaymentError(error.message || 'Error inesperado en el pago');
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="space-y-4">
      {/* Payment summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumen del pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Evento:</span>
            <span className="font-medium text-sm">{event?.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Participante:</span>
            <span className="font-medium text-sm">{participantData.fullName}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total:</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              ${basePrice.toFixed(2)} MXN
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Información de pago
          </CardTitle>
          <CardDescription>
            Ingresa los datos de tu tarjeta para completar el pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Información de la tarjeta
              </label>
              <div className="p-3 border border-gray-300 rounded-md">
                <CardElement options={cardElementOptions} />
              </div>
            </div>

            {paymentError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Tu información de pago está protegida con encriptación SSL. 
                No almacenamos datos de tarjetas de crédito.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              disabled={!stripe || processing}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando pago...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar ${basePrice.toFixed(2)} MXN
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}