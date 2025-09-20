import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CreditCard, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { EventPaymentForm } from './EventPaymentForm';
import { apiRequest } from '@/lib/queryClient';

// Configurar Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

// Schema de validación para el formulario
const registrationSchema = z.object({
  participantName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  participantEmail: z.string().email('Debe proporcionar un email válido'),
  participantPhone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  notes: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface EventData {
  id: number;
  title: string;
  capacity?: number;
  registrationType: string;
  startDate: string;
  registrationDeadline?: string;
  price?: number;
  isFree?: boolean;
  requiresApproval?: boolean;
  registrations?: any[];
  // Unified discount fields
  discountSeniors?: number;
  discountStudents?: number;
  discountFamilies?: number;
  discountDisability?: number;
  discountEarlyBird?: number;
  discountEarlyBirdDeadline?: string;
}

interface EventRegistrationFormProps {
  event: EventData;
}

export function EventRegistrationForm({ event }: EventRegistrationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationFormData | null>(null);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      participantName: '',
      participantEmail: '',
      participantPhone: '',
      notes: '',
    },
  });

  // Mutación para inscripción gratuita
  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      return apiRequest(`/api/events/${event.id}/register`, {
        method: 'POST',
        data: {
          fullName: data.participantName,
          email: data.participantEmail,
          phone: data.participantPhone,
          notes: data.notes,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: '¡Inscripción exitosa!',
        description: event.requiresApproval 
          ? 'Tu solicitud ha sido enviada y será revisada. Recibirás una confirmación por correo electrónico.'
          : 'Te has inscrito exitosamente. Recibirás una confirmación por correo electrónico.',
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error en la inscripción',
        description: error.message || 'No se pudo completar la inscripción. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: RegistrationFormData) => {
    const hasPrice = event.price && event.price > 0 && !event.isFree;
    
    if (hasPrice) {
      // Si hay precio, mostrar formulario de pago
      setRegistrationData(data);
      setShowPayment(true);
    } else {
      // Si es gratuito, registrar directamente
      registerMutation.mutate(data);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setRegistrationData(null);
    form.reset();
    toast({
      title: '¡Pago e inscripción exitosos!',
      description: 'Tu pago ha sido procesado y te has inscrito exitosamente al evento.',
    });
    queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}`] });
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: 'Error en el pago',
      description: error,
      variant: 'destructive',
    });
  };

  if (event.registrationType !== 'registration') {
    return null;
  }

  // Verificar si hay capacidad disponible
  const registeredCount = event.registrations?.length || 0;
  const hasCapacity = !event.capacity || registeredCount < event.capacity;

  // Verificar si la fecha límite ha pasado
  const isDeadlinePassed = event.registrationDeadline 
    ? new Date() > new Date(event.registrationDeadline)
    : false;

  // Verificar si el evento ya pasó
  const isEventPassed = new Date() > new Date(event.startDate);

  if (!hasCapacity || isDeadlinePassed || isEventPassed) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-gray-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Inscripciones no disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            {!hasCapacity && 'El evento ha alcanzado su capacidad máxima.'}
            {isDeadlinePassed && 'La fecha límite de inscripción ha pasado.'}
            {isEventPassed && 'Este evento ya ha finalizado.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showPayment && registrationData) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-green-600 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Completar Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise}>
            <EventPaymentForm
              eventId={event.id.toString()}
              event={{
                id: event.id,
                title: event.title,
                price: event.price || 0,
                isFree: event.isFree,
              }}
              participantData={{
                fullName: registrationData.participantName,
                email: registrationData.participantEmail,
                phone: registrationData.participantPhone,
                additionalInfo: registrationData.notes,
              }}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Elements>
          <Button
            variant="outline"
            onClick={() => setShowPayment(false)}
            className="mt-4 w-full"
          >
            Cancelar pago
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-green-600 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          ¡Inscríbete a este evento!
        </CardTitle>
        <p className="text-sm text-gray-600">
          Completa el formulario para registrarte
          {event.requiresApproval && " (sujeto a aprobación)"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información de inscripción */}
        <div className="space-y-2 bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Plazas disponibles:</span>
            <span className="font-medium text-green-600">
              {event.capacity 
                ? `${event.capacity - registeredCount} de ${event.capacity} personas`
                : 'Sin límite'
              }
            </span>
          </div>
          {event.registrationDeadline && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Fecha límite:</span>
              <span className="font-medium text-orange-600">
                {format(new Date(event.registrationDeadline), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          )}
          {event.price && event.price > 0 && !event.isFree && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Precio:</span>
              <span className="font-medium text-green-600">
                ${event.price} MXN
              </span>
            </div>
          )}
        </div>

        {/* Formulario de inscripción */}
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              {...form.register('participantName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Tu nombre completo"
            />
            {form.formState.errors.participantName && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.participantName.message}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico *
            </label>
            <input
              type="email"
              {...form.register('participantEmail')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="tu@email.com"
            />
            {form.formState.errors.participantEmail && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.participantEmail.message}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              {...form.register('participantPhone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
            {form.formState.errors.participantPhone && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.participantPhone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentarios adicionales
            </label>
            <textarea
              {...form.register('notes')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder="¿Alguna pregunta o información adicional?"
            />
          </div>

          <Button 
            type="submit" 
            disabled={registerMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {registerMutation.isPending ? 'Procesando...' : 
              (event.isFree || !event.price || event.price === 0 
                ? 'Inscribirse gratis'
                : `Inscribirse - $${event.price} MXN`
              )
            }
          </Button>
        </form>

        <p className="text-xs text-gray-500 text-center">
          {event.requiresApproval 
            ? "Tu solicitud será revisada y recibirás una confirmación por correo electrónico"
            : "Recibirás una confirmación inmediata por correo electrónico"
          }
        </p>
      </CardContent>
    </Card>
  );
}