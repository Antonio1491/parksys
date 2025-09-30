// Tipos para el módulo de voluntariado
export interface Volunteer {
  id: number;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  emergencyContact: string | null;
  address: string | null;
  birthdate: Date | null;
  skills: string | null;
  availability: string | null;
  status: string;
  profileImageUrl: string | null;
  totalHours?: number;
  participations?: Participation[];
  evaluations?: Evaluation[];
  recognitions?: Recognition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Participation {
  id: number;
  volunteerId: number;
  parkId: number;
  activityId: number | null;
  activityName: string;
  activityDate: string;
  hoursContributed: number;
  supervisorId: number | null;
  notes: string | null;
  createdAt: Date;
}

export interface Evaluation {
  id: number;
  volunteerId: number;
  parkId: number;
  evaluatorId: number;
  skills: number;
  attitude: number;
  punctuality: number;
  teamwork: number;
  leadership: number;
  overallScore: number;
  comments: string | null;
  evaluationDate: Date;
  createdAt: Date;
}

export interface Recognition {
  id: number;
  volunteerId: number;
  title: string;
  description: string | null;
  awardDate: Date;
  awardType: string;
  imagePath: string | null;
  createdAt: Date;
}

// Otros tipos de la aplicación que pueden ser necesarios...
export interface Park {
  id: number;
  name: string;
  parkType: string;
  description: string | null;
  address: string;
  postalCode: string | null;
  latitude: string;
  longitude: string;
  area: string | null;
  foundationYear: number | null;
  hasAccessibility: boolean;
  hasSportsAreas: boolean;
  hasPlayground: boolean;
  hasRestrooms: boolean;
  openingHours: string | null;
  administrator: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  videoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}