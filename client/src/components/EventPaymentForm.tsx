import React from 'react';
import { UnifiedPaymentForm, PayableItem } from './UnifiedPaymentForm';

interface EventPaymentFormProps {
  eventId: string;
  event?: {
    id: number;
    title: string;
    price: number;
    isFree?: boolean;
    // Unified discount fields
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

export function EventPaymentForm({ 
  eventId,
  event, 
  participantData, 
  onSuccess, 
  onError 
}: EventPaymentFormProps) {
  
  // Convert event to PayableItem format for UnifiedPaymentForm
  const payableEvent: PayableItem = {
    id: event?.id || 0,
    title: event?.title || '',
    price: event?.price || 0,
    isFree: event?.isFree,
    // Map discount fields
    discountSeniors: event?.discountSeniors || 0,
    discountStudents: event?.discountStudents || 0, 
    discountFamilies: event?.discountFamilies || 0,
    discountDisability: event?.discountDisability || 0,
    discountEarlyBird: event?.discountEarlyBird || 0,
    discountEarlyBirdDeadline: event?.discountEarlyBirdDeadline,
  };

  return (
    <UnifiedPaymentForm
      itemType="event"
      itemId={eventId}
      item={payableEvent}
      participantData={participantData}
      onSuccess={onSuccess}
      onError={onError}
    />
  );
}