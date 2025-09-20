import React from 'react';
import { UnifiedPaymentForm, PayableItem } from './UnifiedPaymentForm';

interface SpaceReservation {
  id: number;
  spaceId: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  totalCost: string;
  status: string;
  purpose: string;
  specialRequests?: string;
  // Unified discount fields
  discountSeniors?: number;
  discountStudents?: number;
  discountFamilies?: number;
  discountDisability?: number;
  discountEarlyBird?: number;
  discountEarlyBirdDeadline?: string;
}

interface SpaceData {
  id: number;
  name: string;
  description: string;
  spaceType: string;
  capacity: number;
  hourlyRate: string;
  parkName: string;
  requiresApproval: boolean;
}

interface SpacePaymentFormProps {
  reservation: SpaceReservation;
  space: SpaceData;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export function SpacePaymentForm({ 
  reservation,
  space, 
  onPaymentSuccess, 
  onCancel 
}: SpacePaymentFormProps) {
  
  // Convert space reservation to PayableItem format for UnifiedPaymentForm
  const payableSpace: PayableItem = {
    id: reservation.id,
    title: space.name,
    price: parseFloat(reservation.totalCost),
    isFree: parseFloat(reservation.totalCost) === 0,
    // Map discount fields from reservation
    discountSeniors: reservation.discountSeniors || 0,
    discountStudents: reservation.discountStudents || 0, 
    discountFamilies: reservation.discountFamilies || 0,
    discountDisability: reservation.discountDisability || 0,
    discountEarlyBird: reservation.discountEarlyBird || 0,
    discountEarlyBirdDeadline: reservation.discountEarlyBirdDeadline,
  };

  // Convert reservation contact info to participant data format
  const participantData = {
    fullName: reservation.contactName,
    email: reservation.contactEmail,
    phone: reservation.contactPhone,
    additionalInfo: reservation.specialRequests,
  };

  return (
    <UnifiedPaymentForm
      itemType="space_reservation"
      itemId={reservation.id.toString()}
      item={payableSpace}
      participantData={participantData}
      onSuccess={onPaymentSuccess}
      onError={(error: string) => {
        console.error('Space payment error:', error);
        onCancel(); // For now, treat errors as cancellation
      }}
    />
  );
}

export default SpacePaymentForm;