import React, { useState } from "react";
import { useParams, Link } from "wouter";
import ROUTES from '@/routes';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, MapPin, Clock, TreePine, Calendar, Users, Wrench, AlertTriangle, FileText, Images, Star, Info, Building, Phone, Mail, Globe, Shield, Edit, Trash2, Plus, Filter, SortAsc, Map as MapIcon, Eye, Download, Settings, Store, MessageSquare, ThumbsUp, CalendarDays } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { MapViewer } from "@/components/ui/map-viewer";
import ParkMultimediaViewer from "@/components/ParkMultimediaViewer";
import ParkTreesInventory from "@/components/ParkTreesInventory";
import ParkAssetsInventory from "@/components/ParkAssetsInventory";
import ParkIncidentsInventory from "@/components/ParkIncidentsInventory";
import ParkVolunteersInventory from "@/components/ParkVolunteersInventory";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ReturnHeader } from "@/components/ui/return-header";

// Esquema para agregar amenidad a parque
const addAmenitySchema = z.object({
  amenityId: z.number().min(1, "Seleccione una amenidad"),
  moduleName: z.string().min(1, "El nombre del módulo es requerido"),
  surfaceArea: z.string().optional(),
  locationLatitude: z.string().optional(),
  locationLongitude: z.string().optional(),
  status: z.string().default("Activa"),
  description: z.string().optional(),
});

// Esquema para editar amenidad de parque
const editAmenitySchema = z.object({
  moduleName: z.string().min(1, "El nombre del módulo es requerido"),
  surfaceArea: z.string().optional(),
  locationLatitude: z.string().optional(),
  locationLongitude: z.string().optional(),
  status: z.string().default("Activa"),
  description: z.string().optional(),
});

type AddAmenityFormData = z.infer<typeof addAmenitySchema>;
type EditAmenityFormData = z.infer<typeof editAmenitySchema>;

// Componentes temporales para las nuevas pestañas
const ParkConcessionsTab = ({ parkId }: { parkId: number }) => {
  const [selectedConcession, setSelectedConcession] = useState<any>(null);
  const [showConcessionDialog, setShowConcessionDialog] = useState(false);
  
  const { data: concessions = [], isLoading } = useQuery({
    queryKey: [`/api/concessions/park/${parkId}`],
  });

  const handleViewConcession = (concession: any) => {
    setSelectedConcession(concession);
    setShowConcessionDialog(true);
  };

  if (isLoading) return <div className="p-4">Cargando concesiones...</div>;
  
  const concessionsArray = Array.isArray(concessions) ? concessions : [];

  return (
    <>
      <div className="space-y-4">
        {concessionsArray.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay concesiones activas en este parque</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {concessionsArray.map((concession: any) => (
              <Card key={concession.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{concession.name}</h4>
                      <p className="text-sm text-gray-600">{concession.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Ubicación: {concession.specific_location}
                      </p>
                      <p className="text-xs text-gray-500">
                        Horario: {concession.operating_hours} | {concession.operating_days}
                      </p>
                      <p className="text-xs text-gray-500">
                        Pago mensual: ${concession.monthly_payment} | Contacto: {concession.emergency_phone}
                      </p>
                      <Badge variant={concession.status === 'activa' ? 'default' : 'secondary'}>
                        {concession.status === 'activa' ? 'Activa' : concession.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewConcession(concession)}>
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles de concesión */}
      <Dialog open={showConcessionDialog} onOpenChange={setShowConcessionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Concesión</DialogTitle>
          </DialogHeader>
          {selectedConcession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Información General</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="font-medium">Nombre:</span> {selectedConcession.name}</p>
                    <p><span className="font-medium">Descripción:</span> {selectedConcession.description}</p>
                    <p><span className="font-medium">Ubicación:</span> {selectedConcession.specific_location}</p>
                    <p><span className="font-medium">Estado:</span> {selectedConcession.status}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Información Operativa</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="font-medium">Horarios:</span> {selectedConcession.operating_hours}</p>
                    <p><span className="font-medium">Días:</span> {selectedConcession.operating_days}</p>
                    <p><span className="font-medium">Pago mensual:</span> ${selectedConcession.monthly_payment}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedConcession.emergency_phone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const ParkReservationsTab = ({ parkId }: { parkId: number }) => {
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: [`/api/space-reservations/park/${parkId}`],
  });

  const handleViewReservation = (reservation: any) => {
    setSelectedReservation(reservation);
    setShowReservationDialog(true);
  };

  if (isLoading) return <div className="p-4">Cargando reservas...</div>;
  
  const reservationsArray = Array.isArray(reservations) ? reservations : [];

  return (
    <>
      <div className="space-y-4">
        {reservationsArray.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay reservas activas en este parque</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reservationsArray.map((reservation: any) => (
              <Card key={reservation.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{reservation.spacename || reservation.contact_name}</h4>
                      <p className="text-sm text-gray-600">{reservation.purpose}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(reservation.reservation_date).toLocaleDateString()} 
                        <span className="ml-2">
                          {reservation.start_time} - {reservation.end_time}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Contacto: {reservation.contact_email} | {reservation.contact_phone}
                      </p>
                      <p className="text-xs text-gray-500">
                        Asistentes: {reservation.expected_attendees} | Costo: ${reservation.total_cost}
                      </p>
                      <Badge variant={reservation.status === 'confirmed' ? 'default' : reservation.status === 'pending' ? 'secondary' : 'destructive'}>
                        {reservation.status === 'confirmed' ? 'Confirmada' : 
                         reservation.status === 'pending' ? 'Pendiente' : 
                         reservation.status === 'cancelled' ? 'Cancelada' : reservation.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewReservation(reservation)}>
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles de reserva */}
      <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Reserva</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Información del Evento</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="font-medium">Nombre del evento:</span> {selectedReservation.spacename}</p>
                    <p><span className="font-medium">Propósito:</span> {selectedReservation.purpose}</p>
                    <p><span className="font-medium">Fecha:</span> {new Date(selectedReservation.reservation_date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Hora:</span> {selectedReservation.start_time} - {selectedReservation.end_time}</p>
                    <p><span className="font-medium">Estado:</span> {selectedReservation.status}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Información de Contacto</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="font-medium">Nombre:</span> {selectedReservation.contact_name}</p>
                    <p><span className="font-medium">Email:</span> {selectedReservation.contact_email}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedReservation.contact_phone}</p>
                    <p><span className="font-medium">Asistentes esperados:</span> {selectedReservation.expected_attendees}</p>
                    <p><span className="font-medium">Costo total:</span> ${selectedReservation.total_cost}</p>
                  </div>
                </div>
              </div>
              {selectedReservation.notes && (
                <div>
                  <h3 className="font-medium text-gray-900">Notas adicionales</h3>
                  <p className="mt-1 text-sm text-gray-600">{selectedReservation.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const ParkCertificationsTab = ({ park }: { park: any }) => {
  if (!park.certificaciones || park.certificaciones.trim().length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No hay certificaciones registradas para este parque</p>
      </div>
    );
  }

  const certifications = park.certificaciones
    .split(',')
    .filter(cert => cert.trim().length > 0)
    .map(cert => cert.trim());

  const isGreenFlag = (certification: string) => {
    const cert = certification.toLowerCase();
    return cert.includes('green flag') || cert.includes('bandera verde');
  };

  const getCertificationIcon = (certification: string) => {
    if (isGreenFlag(certification)) {
      return '🏅'; // Medal for Green Flag
    }
    return '🏆'; // Trophy for other certifications
  };

  const getCertificationColor = (certification: string) => {
    if (isGreenFlag(certification)) {
      return 'bg-green-50 border-green-200';
    }
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {certifications.map((certification, index) => (
          <Card key={index} className={`${getCertificationColor(certification)} transition-all hover:shadow-md`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {getCertificationIcon(certification)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {certification}
                  </h4>
                  {isGreenFlag(certification) && (
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-green-600 text-white">
                        Certificación Internacional
                      </Badge>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    {isGreenFlag(certification) 
                      ? 'Reconocimiento internacional por excelencia en la gestión de espacios verdes urbanos'
                      : 'Certificación que reconoce la calidad y gestión del parque'
                    }
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Vigente</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Shield className="h-3 w-3" />
                      <span>Verificada</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Resumen de Certificaciones</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Total certificaciones:</span>
            <span className="ml-2 text-blue-600">{certifications.length}</span>
          </div>
          <div>
            <span className="font-medium">Internacionales:</span>
            <span className="ml-2 text-green-600">
              {certifications.filter(cert => isGreenFlag(cert)).length}
            </span>
          </div>
          <div>
            <span className="font-medium">Estado:</span>
            <span className="ml-2 text-green-600">Todas vigentes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ParkEventsTab = ({ parkId }: { parkId: number }) => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  
  const { data: events = [], isLoading } = useQuery({
    queryKey: [`/api/parks/${parkId}/events`],
  });

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  if (isLoading) return <div className="p-4">Cargando eventos...</div>;
  
  const eventsArray = Array.isArray(events) ? events : [];

  return (
    <>
      <div className="space-y-4">
        {eventsArray.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay eventos programados en este parque</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {eventsArray.map((event: any) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{event.title}</h4>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tipo: {event.event_type} | Audiencia: {event.target_audience}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.start_date).toLocaleDateString()} 
                        {event.start_time && ` - ${event.start_time}`}
                        {event.end_date && event.end_date !== event.start_date && 
                          ` al ${new Date(event.end_date).toLocaleDateString()}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ubicación: {event.location} | Capacidad: {event.capacity || 'No especificada'}
                      </p>
                      <Badge variant={event.status === 'confirmed' ? 'default' : event.status === 'pending' ? 'secondary' : 'destructive'}>
                        {event.status === 'confirmed' ? 'Confirmado' : 
                         event.status === 'pending' ? 'Pendiente' : 
                         event.status === 'cancelled' ? 'Cancelado' : event.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewEvent(event)}>
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles de evento */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Evento</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Información General</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="font-medium">Título:</span> {selectedEvent.title}</p>
                    <p><span className="font-medium">Tipo:</span> {selectedEvent.event_type}</p>
                    <p><span className="font-medium">Audiencia:</span> {selectedEvent.target_audience}</p>
                    <p><span className="font-medium">Estado:</span> {selectedEvent.status}</p>
                    <p><span className="font-medium">Ubicación:</span> {selectedEvent.location}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Fechas y Logística</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="font-medium">Fecha inicio:</span> {new Date(selectedEvent.start_date).toLocaleDateString()}</p>
                    {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && (
                      <p><span className="font-medium">Fecha fin:</span> {new Date(selectedEvent.end_date).toLocaleDateString()}</p>
                    )}
                    {selectedEvent.start_time && (
                      <p><span className="font-medium">Hora:</span> {selectedEvent.start_time} {selectedEvent.end_time && `- ${selectedEvent.end_time}`}</p>
                    )}
                    <p><span className="font-medium">Capacidad:</span> {selectedEvent.capacity || 'No especificada'}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Descripción</h3>
                <p className="mt-1 text-sm text-gray-600">{selectedEvent.description}</p>
              </div>
              {selectedEvent.organizer_email && (
                <div>
                  <h3 className="font-medium text-gray-900">Organizador</h3>
                  <div className="mt-1 text-sm text-gray-600">
                    <p>Email: {selectedEvent.organizer_email}</p>
                    {selectedEvent.organizer_phone && <p>Teléfono: {selectedEvent.organizer_phone}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Función para mapear nombres de iconos a símbolos Unicode
const getIconSymbol = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    'playground': '🛝',
    'toilet': '🚽',
    'sportsCourt': '🏀',
    'bicycle': '🚴',
    'pets': '🐕',
    'bench': '🪑',
    'fountain': '⛲',
    'parking': '🚗',
    'security': '🔒',
    'wifi': '📶',
    'restaurant': '🍽️',
    'cafe': '☕',
    'garden': '🌺',
    'lake': '🏞️',
    'trail': '🥾'
  };
  
  return iconMap[iconName] || '📍';
};

interface ParkDetails {
  id: number;
  name: string;
  location: string;
  openingHours: string;
  description: string;
  municipality: { name: string };
  
  // Additional basic park information
  parkType?: string;
  address?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  area?: number;
  greenArea?: string;
  foundationYear?: number;
  administrator?: string;
  conservationStatus?: string;
  regulationUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  videoUrl?: string;

  amenities: Array<{
    id: number;
    name: string;
    icon: string;
    description: string;
  }>;
  activities: Array<{
    id: number;
    title: string;
    description: string;
    startDate: string;
    instructorName?: string;
    participantCount: number;
  }>;
  trees: {
    data: Array<{
      id: number;
      speciesId: number;
      condition: string;
      plantedDate?: string;
      lastMaintenance?: string;
      locationDescription?: string;
      code?: string;
    }>;
    stats: {
      total: number;
      good: number;
      regular: number;
      bad: number;
    };
  };
  assets: Array<{
    id: number;
    name: string;
    type: string;
    condition: string;
    location: string;
    acquisitionDate?: string;
    lastMaintenanceDate?: string;
  }>;
  incidents: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  documents: Array<{
    id: number;
    title: string;
    type: string;
    uploadedAt: string;
  }>;
  images: Array<{
    id: number;
    imageUrl: string;
    caption?: string;
    isPrimary: boolean;
  }>;
  evaluations: Array<{
    id: number;
    score: number;
    comments: string;
    evaluatedAt: string;
    evaluatorName: string;
  }>;
  volunteers: Array<{
    id: number;
    fullName: string;
    skills: string;
    isActive: boolean;
  }>;
  stats: {
    totalActivities: number;
    activeVolunteers: number;
    totalTrees: number;
    totalAssets: number;
    averageEvaluation: number;
    pendingIncidents: number;
    activeConcessions: number;
    totalFeedback: number;
    totalEvaluations: number;
    totalReservations: number;
  };
}

// Función para formatear horarios de JSON a texto legible con saltos de línea
function formatOpeningHours(openingHours: string | null): JSX.Element {
  if (!openingHours) return <span>No especificado</span>;
  
  try {
    const schedule = JSON.parse(openingHours);
    const dayNames = {
      monday: 'Lunes',
      tuesday: 'Martes', 
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    
    const enabledDays = Object.entries(schedule)
      .filter(([_, dayInfo]: [string, any]) => dayInfo.enabled)
      .map(([day, dayInfo]: [string, any]) => 
        `${dayNames[day as keyof typeof dayNames]}: ${dayInfo.openTime} - ${dayInfo.closeTime}`
      );
    
    if (enabledDays.length === 0) {
      return <span>Cerrado todos los días</span>;
    }
    
    return (
      <div className="space-y-1">
        {enabledDays.map((daySchedule, index) => (
          <div key={index} className="text-gray-600">{daySchedule}</div>
        ))}
      </div>
    );
  } catch {
    return <span>{openingHours}</span>;
  }
}

export default function AdminParkView() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para modales de amenidades
  const [isAddAmenityModalOpen, setIsAddAmenityModalOpen] = React.useState(false);
  const [isEditAmenityModalOpen, setIsEditAmenityModalOpen] = React.useState(false);
  const [isViewAmenityModalOpen, setIsViewAmenityModalOpen] = React.useState(false);
  const [editingAmenity, setEditingAmenity] = React.useState<any>(null);
  const [viewingAmenity, setViewingAmenity] = React.useState<any>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  // Agregar junto a los otros estados
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  
  // Estados para modal de mapa de activos
  const [isAssetMapModalOpen, setIsAssetMapModalOpen] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState<any>(null);
  
  // Get complete park data from the details API endpoint that has all fields
  const { data: park, isLoading, error, refetch: refetchPark } = useQuery<ParkDetails>({
    queryKey: [`/api/parks/${id}/details`, refreshKey],
    enabled: !!id,
  });

  // Create displayPark object with proper data structure for view - moved before conditional returns
  const displayPark = React.useMemo(() => {
    if (!park) return {
      id: 0,
      name: '',
      location: '',
      openingHours: '',
      description: '',
      municipality: { name: 'No especificado' },
      amenities: [],
      activities: [],
      volunteers: [],
      trees: [],
      assets: [],
      incidents: [],
      documents: [],
      images: [],
      evaluations: [],
      stats: {
        totalActivities: 0,
        activeVolunteers: 0,
        totalTrees: 0,
        totalAssets: 0,
        averageEvaluation: 0,
        pendingIncidents: 0,
        activeConcessions: 0,
        totalFeedback: 0,
        totalEvaluations: 0,
        totalReservations: 0,
        totalEvents: 0
      },
      parkType: 'No especificado',
      address: 'No especificado',
      area: '',
      greenArea: '',
      foundationYear: '',
      postalCode: '',
      contactPhone: '',
      contactEmail: '',
      latitude: 0,
      longitude: 0
    };
    
    return {
      ...park,
      municipality: park.municipality || { name: 'No especificado' },
      documents: park.documents || [],
      parkType: park.parkType || 'No especificado',
      address: park.address || park.location || 'No especificado',
      area: park.area || '',
      greenArea: park.greenArea || '',
      foundationYear: park.foundationYear || '',
      postalCode: park.postalCode || '',
      contactPhone: park.contactPhone || '',
      contactEmail: park.contactEmail || '',
      latitude: park.latitude || 0,
      longitude: park.longitude || 0
    };
  }, [park]);

  // Amenidades disponibles simplificadas - sin consulta automática
  const availableAmenities: any[] = [];

  // Mutación para agregar amenidad al parque
  const addAmenityMutation = useMutation({
    mutationFn: async (data: AddAmenityFormData) => {
      return apiRequest(`/api/parks/${id}/amenities`, {
        method: 'POST',
        data: data,
      });
    },
    onSuccess: () => {
      setIsAddAmenityModalOpen(false);
      toast({
        title: "Amenidad agregada",
        description: "La amenidad se ha agregado al parque exitosamente.",
      });
      
      // Recargar página para mostrar cambios inmediatamente
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar la amenidad al parque.",
        variant: "destructive",
      });
    },
  });

  // Mutación para editar amenidad del parque
  const editAmenityMutation = useMutation({
    mutationFn: async ({ amenityId, data }: { amenityId: number; data: EditAmenityFormData }) => {
      return apiRequest(`/api/parks/${id}/amenities/${amenityId}`, {
        method: 'PUT',
        data: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${id}`] });
      setIsEditAmenityModalOpen(false);
      setEditingAmenity(null);
      toast({
        title: "Amenidad actualizada",
        description: "La amenidad se ha actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la amenidad.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !park) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Parque no encontrado</h2>
          <p className="text-gray-600 mb-4">No se pudo cargar la información del parque.</p>
          <Link href="/admin/parks">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Parques
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      activo: "default",
      pendiente: "secondary",
      critico: "destructive",
      completado: "outline"
    };
    return variants[status.toLowerCase()] || "secondary";
  };

  // Función para exportar a CSV (Opción B)
  const exportToCSV = () => {
    if (!park) {
      toast({
        title: "Error",
        description: "No hay datos del parque para exportar",
        variant: "destructive",
      });
      return;
    }

    // Preparar los datos del parque
    const csvData = [
      ['Campo', 'Valor'],
      ['=== INFORMACIÓN BÁSICA ===', ''],
      ['Nombre del Parque', park.name || ''],
      ['Municipio', park.municipality?.name || ''],
      ['Ubicación', park.location || ''],
      ['Dirección', park.address || ''],
      ['Tipo de Parque', park.parkType || ''],
      ['Código Postal', park.postalCode || ''],
      ['Latitud', park.latitude?.toString() || ''],
      ['Longitud', park.longitude?.toString() || ''],
      ['Área Total (m²)', park.area?.toString() || ''],
      ['Área Verde', park.greenArea || ''],
      ['Año de Fundación', park.foundationYear?.toString() || ''],
      ['Administrador', park.administrator || ''],
      ['Estado de Conservación', park.conservationStatus || ''],
      ['Email de Contacto', park.contactEmail || ''],
      ['Teléfono de Contacto', park.contactPhone || ''],
      ['Descripción', park.description || ''],
      ['', ''],
      ['=== ESTADÍSTICAS ===', ''],
      ['Total de Actividades', park.stats?.totalActivities?.toString() || '0'],
      ['Total de Árboles', park.stats?.totalTrees?.toString() || '0'],
      ['Evaluación Promedio', park.stats?.averageEvaluation?.toFixed(2) || '0.0'],
      ['Total de Eventos', park.stats?.totalEvents?.toString() || '0'],
      ['Incidencias Pendientes', park.stats?.pendingIncidents?.toString() || '0'],
      ['Número de Certificaciones', park.certificaciones ? park.certificaciones.split(',').filter(c => c.trim()).length.toString() : '0'],
      ['Concesiones Activas', park.stats?.activeConcessions?.toString() || '0'],
      ['Voluntarios Activos', park.stats?.activeVolunteers?.toString() || '0'],
      ['Total de Evaluaciones', park.stats?.totalEvaluations?.toString() || '0'],
      ['Total de Reservas', park.stats?.totalReservations?.toString() || '0'],
      ['Total de Retroalimentación', park.stats?.totalFeedback?.toString() || '0'],
    ];

    // Convertir a formato CSV
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Crear el blob y descargar
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `parque_${park.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setIsExportModalOpen(false);
    toast({
      title: "✅ Exportación exitosa",
      description: `Los datos del parque "${park.name}" se han exportado en formato CSV.`,
    });
  };

  // Función para exportar a PDF (Opción C - Reporte completo)
  const exportToPDF = () => {
    if (!park) {
      toast({
        title: "Error",
        description: "No hay datos del parque para exportar",
        variant: "destructive",
      });
      return;
    }

    // Crear una ventana con el contenido para imprimir
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "No se pudo abrir la ventana de impresión. Verifica los permisos del navegador.",
        variant: "destructive",
      });
      return;
    }

    // Preparar certificaciones
    const certifications = park.certificaciones 
      ? park.certificaciones.split(',').filter(cert => cert.trim().length > 0).map(cert => cert.trim())
      : [];

    // Crear el HTML del documento
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ficha del Parque - ${park.name}</title>
        <style>
          @media print {
            @page { margin: 2cm; }
            body { margin: 0; }
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }

          .header {
            text-align: center;
            border-bottom: 3px solid #00a587;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }

          .header h1 {
            color: #00444f;
            margin: 0;
            font-size: 32px;
          }

          .header p {
            color: #666;
            margin: 5px 0;
          }

          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }

          .section-title {
            background: #ceefea;
            color: #00444f;
            padding: 10px 15px;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            border-left: 5px solid #00a587;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }

          .info-item {
            padding: 10px;
            background: #f9f9f9;
            border-radius: 5px;
          }

          .info-label {
            font-weight: bold;
            color: #00444f;
            font-size: 14px;
          }

          .info-value {
            color: #555;
            font-size: 14px;
            margin-top: 3px;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }

          .stat-card {
            background: #f0f8ff;
            border: 2px solid #00a587;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
          }

          .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #00444f;
            margin: 5px 0;
          }

          .stat-label {
            color: #666;
            font-size: 14px;
          }

          .list-item {
            padding: 8px;
            background: #f9f9f9;
            margin-bottom: 8px;
            border-left: 3px solid #00a587;
            padding-left: 12px;
          }

          .certification-item {
            padding: 10px;
            background: #e8f5e9;
            margin-bottom: 10px;
            border-left: 4px solid #4caf50;
            padding-left: 15px;
            display: flex;
            align-items: center;
          }

          .certification-icon {
            font-size: 24px;
            margin-right: 10px;
          }

          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            color: #999;
            font-size: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }

          th {
            background: #00444f;
            color: white;
          }

          tr:hover {
            background: #f5f5f5;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${park.name}</h1>
          <p><strong>📍 ${park.address || park.location}</strong></p>
          <p>${park.municipality?.name || 'Municipio no especificado'}</p>
          <p style="color: #999; font-size: 12px;">Ficha generada el ${new Date().toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <!-- INFORMACIÓN BÁSICA -->
        <div class="section">
          <div class="section-title">📋 Información Básica</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Tipo de Parque</div>
              <div class="info-value">${park.parkType || 'No especificado'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Municipio</div>
              <div class="info-value">${park.municipality?.name || 'No especificado'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Código Postal</div>
              <div class="info-value">${park.postalCode || 'No especificado'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Año de Fundación</div>
              <div class="info-value">${park.foundationYear || 'No especificado'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Área Total</div>
              <div class="info-value">${park.area ? park.area + ' m²' : 'No especificada'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Área Verde</div>
              <div class="info-value">${park.greenArea || 'No especificada'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Coordenadas</div>
              <div class="info-value">${park.latitude && park.longitude ? `${park.latitude}, ${park.longitude}` : 'No especificadas'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Administrador</div>
              <div class="info-value">${park.administrator || 'No especificado'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email de Contacto</div>
              <div class="info-value">${park.contactEmail || 'No especificado'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Teléfono de Contacto</div>
              <div class="info-value">${park.contactPhone || 'No especificado'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Estado de Conservación</div>
              <div class="info-value">${park.conservationStatus || 'No especificado'}</div>
            </div>
          </div>
          ${park.description ? `
            <div class="info-item">
              <div class="info-label">Descripción</div>
              <div class="info-value">${park.description}</div>
            </div>
          ` : ''}
        </div>

        <!-- ESTADÍSTICAS -->
        <div class="section">
          <div class="section-title">📊 Estadísticas del Parque</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Actividades</div>
              <div class="stat-number">${park.stats?.totalActivities || 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Árboles</div>
              <div class="stat-number">${park.stats?.totalTrees || 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Evaluación Promedio</div>
              <div class="stat-number">${park.stats?.averageEvaluation?.toFixed(1) || '0.0'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Eventos</div>
              <div class="stat-number">${park.stats?.totalEvents || 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Incidencias Pendientes</div>
              <div class="stat-number">${park.stats?.pendingIncidents || 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Certificaciones</div>
              <div class="stat-number">${certifications.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Concesiones Activas</div>
              <div class="stat-number">${park.stats?.activeConcessions || 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Reservas</div>
              <div class="stat-number">${park.stats?.totalReservations || 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Evaluaciones Totales</div>
              <div class="stat-number">${park.stats?.totalEvaluations || 0}</div>
            </div>
          </div>
        </div>

        <!-- CERTIFICACIONES -->
        ${certifications.length > 0 ? `
        <div class="section">
          <div class="section-title">🏆 Certificaciones</div>
          ${certifications.map(cert => `
            <div class="certification-item">
              <div class="certification-icon">${cert.toLowerCase().includes('green flag') || cert.toLowerCase().includes('bandera verde') ? '🏅' : '🏆'}</div>
              <div>
                <strong>${cert}</strong>
                ${cert.toLowerCase().includes('green flag') || cert.toLowerCase().includes('bandera verde') ? 
                  '<div style="font-size: 12px; color: #666;">Certificación Internacional</div>' : ''}
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- AMENIDADES -->
        ${park.amenities && park.amenities.length > 0 ? `
        <div class="section">
          <div class="section-title">🎯 Amenidades del Parque</div>
          <table>
            <thead>
              <tr>
                <th>Nombre del Módulo</th>
                <th>Amenidad</th>
                <th>Superficie</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${park.amenities.map(amenity => `
                <tr>
                  <td>${amenity.moduleName || '-'}</td>
                  <td>${amenity.name}</td>
                  <td>${amenity.surfaceArea ? amenity.surfaceArea + ' m²' : '-'}</td>
                  <td>${amenity.status || 'Activa'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- ACTIVIDADES -->
        ${park.activities && park.activities.length > 0 ? `
        <div class="section">
          <div class="section-title">🎨 Actividades Programadas</div>
          ${park.activities.map(activity => `
            <div class="list-item">
              <strong>${activity.title}</strong><br>
              <span style="font-size: 13px; color: #666;">
                📅 ${new Date(activity.startDate).toLocaleDateString('es-MX')}
                ${activity.instructorName ? ` | 👨‍🏫 ${activity.instructorName}` : ''}
                | 👥 ${activity.participantCount} participantes
              </span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="footer">
          <p><strong>ParkSys</strong> - Sistema Integral de Gestión de Parques Urbanos</p>
          <p>Este documento es un reporte oficial generado automáticamente</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 100);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setIsExportModalOpen(false);
    toast({
      title: "✅ Generando PDF",
      description: "Se ha abierto la ventana de impresión. Selecciona 'Guardar como PDF' en tu navegador.",
    });
  };
  
  return (
    <AdminLayout>
      {/* Header con botón volver */}
      <ReturnHeader />
      
      <div className="space-y-4">       
        
      {/* Header */}
      <div className="bg-white p-8 -mx-6 relative">
        {/* Botones de editar */}
        <div className="absolute top-12 right-12 z-10">
          <div className="flex gap-2">
            <Link href={ROUTES.admin.parks.edit.build(park.id)}>
              <Button className="bg-[#a0cc4d] hover:bg-[#00a884] text-white hover:text-white"
                >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Button 
              onClick={() => setIsExportModalOpen(true)}
              className="bg-[#00444f] hover:bg-[#00a587] text-white hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
        
        <div className="flex items-start gap-10">

          <div className="w-80 aspect-[16/10] rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
            {park.primaryImageUrl ? (
              <img
                src={park.primaryImageUrl}
                alt={`Imagen de ${park.name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-sm">Sin imagen</span>
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-[#00444f] mt-4">{displayPark.name}</h1>
            <p className="text-gray-600 flex items-center gap-14 mt-8">
              {/* Dirección */}
              <div className="flex items-center gap-3">
                <div className="p-2">
                  <MapPin className="h-5 w-5 text-[#00444f]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Dirección</p>
                  <p className="text-sm text-gray-900 font-medium mt-1">
                    {displayPark.address || displayPark.location || 'No especificada'}
                  </p>
                </div>
              </div>

              {/* Área */}
              <div className="flex items-start gap-3">
                <div className="p-2">
                  <MapIcon className="h-5 w-5 text-[#00444f]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Área</p>
                  <p className="text-sm text-gray-900 font-medium mt-1">
                    {displayPark.area ? `${parseFloat(displayPark.area).toLocaleString()} ha` : 'No especificada'}
                  </p>
                </div>
              </div>

              {/* Año de Fundación */}
              <div className="flex items-start gap-3">
                <div className="p-2">
                  <Calendar className="h-5 w-5 text-[#00444f]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Fundación</p>
                  <p className="text-sm text-gray-900 font-medium mt-1">
                    {displayPark.foundationYear || 'No especificado'}
                  </p>
                </div>
              </div>

              {/* Administrador */}
              <div className="flex items-start gap-3">
                <div className="p-2">
                  <Users className="h-5 w-5 text-[#00444f]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Administrador</p>
                  <p className="text-sm text-gray-900 font-medium mt-1">
                    {displayPark.administrator || 'No especificado'}
                  </p>
                </div>
              </div>
            </p>

            {/* Descripción del parque */}
            {displayPark.description && (
              <div className="mt-6">
                <p className="text-gray-700 leading-relaxed">
                  {displayPark.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
        
      {/* Stats Cards - Reorganized in two rows */}
        <div className="space-y-4 mb-8">
          {/* Primera fila - 4 tarjetas principales con diseño actualizado */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Evaluación */}
            <Card className="bg-[#ceefea] border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#00444f] rounded-full">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Evaluación</p>
                    <p className="text-3xl font-bold text-[#00444f]">
                      {park.stats?.averageEvaluation?.toFixed(1) || '0.0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reservas */}
            <Card className="bg-[#ceefea] border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#00444f] rounded-full">
                    <CalendarDays className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Reservas</p>
                    <p className="text-3xl font-bold text-[#00444f]">
                      {park.stats?.totalReservations || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eventos */}
            <Card className="bg-[#ceefea] border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#00444f] rounded-full">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Eventos</p>
                    <p className="text-3xl font-bold text-[#00444f]">
                      {park.stats?.totalEvents || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incidencias */}
            <Card className="bg-[#ceefea] border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#00444f] rounded-full">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Incidencias</p>
                    <p className="text-3xl font-bold text-[#00444f]">
                      {park.stats?.pendingIncidents || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="activities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="activities">Actividades</TabsTrigger>
          <TabsTrigger value="concessions">Concesiones</TabsTrigger>
          <TabsTrigger value="reservations">Reservas</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="incidents">Incidencias</TabsTrigger>
          <TabsTrigger value="certifications">Certificaciones</TabsTrigger>
        </TabsList>





        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividades ({park.activities?.length || 0})</CardTitle>
              <CardDescription>Actividades programadas en este parque</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {park.activities?.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{activity.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📅 {new Date(activity.startDate).toLocaleDateString()}</span>
                        {activity.instructorName && <span>👨‍🏫 {activity.instructorName}</span>}
                        <span>👥 {activity.participantCount} participantes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Concesiones Activas ({park.stats?.activeConcessions || 0})</CardTitle>
              <CardDescription>Concesiones comerciales operando en el parque</CardDescription>
            </CardHeader>
            <CardContent>
              <ParkConcessionsTab parkId={parseInt(id || '0')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reservas de Espacios ({park.stats?.totalReservations || 0})</CardTitle>
              <CardDescription>Reservas activas de espacios del parque</CardDescription>
            </CardHeader>
            <CardContent>
              <ParkReservationsTab parkId={parseInt(id || '0')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Programados ({park.stats?.totalEvents || 0})</CardTitle>
              <CardDescription>Eventos activos y programados para el parque</CardDescription>
            </CardHeader>
            <CardContent>
              <ParkEventsTab parkId={parseInt(id || '0')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incidencias ({park.stats?.pendingIncidents || 0})</CardTitle>
              <CardDescription>Reportes e incidencias del parque</CardDescription>
            </CardHeader>
            <CardContent>
              <ParkIncidentsInventory 
                parkId={parseInt(id || '0')} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificaciones ({park.certificaciones ? park.certificaciones.split(',').filter(cert => cert.trim().length > 0).length : 0})</CardTitle>
              <CardDescription>Certificaciones y reconocimientos obtenidos por este parque</CardDescription>
            </CardHeader>
            <CardContent>
              <ParkCertificationsTab park={park} />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Modal para agregar amenidad */}
      <Dialog open={isAddAmenityModalOpen} onOpenChange={setIsAddAmenityModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar módulo</DialogTitle>
          </DialogHeader>
          <AddAmenityForm
            availableAmenities={availableAmenities || []}
            onSubmit={(data) => addAmenityMutation.mutate(data)}
            isLoading={addAmenityMutation.isPending}
            onCancel={() => setIsAddAmenityModalOpen(false)}
            parkData={displayPark}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para editar amenidad */}
      <Dialog open={isEditAmenityModalOpen} onOpenChange={setIsEditAmenityModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Módulo de Amenidad</DialogTitle>
            <DialogDescription>
              Modifique la configuración del módulo de amenidad seleccionado.
            </DialogDescription>
          </DialogHeader>
          {editingAmenity && (
            <EditAmenityForm
              amenity={editingAmenity}
              onSubmit={(data) => editAmenityMutation.mutate({ amenityId: editingAmenity.parkAmenityId, data })}
              isLoading={editAmenityMutation.isPending}
              onCancel={() => {
                setIsEditAmenityModalOpen(false);
                setEditingAmenity(null);
              }}
              parkData={displayPark}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para ver detalles de amenidad */}
      <Dialog open={isViewAmenityModalOpen} onOpenChange={setIsViewAmenityModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Módulo de Amenidad</DialogTitle>
          </DialogHeader>
          {viewingAmenity && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Amenidad</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getIconSymbol(viewingAmenity.amenityIcon)}</span>
                    <p className="font-semibold">
                      {viewingAmenity.amenityName || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nombre del Módulo</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{viewingAmenity.moduleName || 'Sin nombre'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Superficie (m²)</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p>{viewingAmenity.surfaceArea ? `${viewingAmenity.surfaceArea} m²` : 'No especificada'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    viewingAmenity.status === 'Activa' ? 'bg-green-100 text-green-800' :
                    viewingAmenity.status === 'Inactiva' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {viewingAmenity.status || 'Sin estado'}
                  </span>
                </div>
              </div>

              {(viewingAmenity.locationLatitude && viewingAmenity.locationLongitude) && (
                <div>
                  <label className="block text-sm font-medium mb-2">Ubicación en el Parque</label>
                  <div className="border rounded-lg p-3 bg-white overflow-hidden">
                    <div className="w-full h-48 relative mb-2">
                      <MapViewer
                        latitude={typeof park?.latitude === 'string' ? parseFloat(park.latitude) : park?.latitude || 20.6597}
                        longitude={typeof park?.longitude === 'string' ? parseFloat(park.longitude) : park?.longitude || -103.3496}
                        parkName={park?.name || "Parque"}
                        height="192px"
                        selectedLocation={{
                          lat: parseFloat(viewingAmenity.locationLatitude),
                          lng: parseFloat(viewingAmenity.locationLongitude)
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      📍 {parseFloat(viewingAmenity.locationLatitude).toFixed(6)}, {parseFloat(viewingAmenity.locationLongitude).toFixed(6)}
                    </div>
                  </div>
                </div>
              )}

              {viewingAmenity.description && (
                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p>{viewingAmenity.description}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Creación</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">
                    {viewingAmenity.createdAt ? new Date(viewingAmenity.createdAt).toLocaleDateString('es-MX') : 'No disponible'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsViewAmenityModalOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para mostrar ubicación del activo en mapa */}
      <Dialog open={isAssetMapModalOpen} onOpenChange={setIsAssetMapModalOpen}>
        <DialogContent className="max-w-4xl h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Ubicación del Activo: {selectedAsset?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedAsset?.locationDescription && (
                <span className="text-sm text-gray-600">
                  {selectedAsset.locationDescription}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAsset && selectedAsset.latitude && selectedAsset.longitude && (
            <div className="flex-1 h-full">
              <MapViewer
                latitude={selectedAsset.latitude}
                longitude={selectedAsset.longitude}
                parkName={selectedAsset.name}
                height="500px"
                className="w-full"
              />
              
              {/* Información adicional del activo debajo del mapa */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Categoría:</span>
                    <span className="ml-2 text-sm text-gray-600">{selectedAsset.category || 'Sin categoría'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Estado:</span>
                    <span className={`ml-2 inline-block px-2 py-1 text-xs rounded ${
                      selectedAsset.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                      selectedAsset.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                      selectedAsset.condition === 'regular' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedAsset.condition === 'excellent' ? 'Excelente' :
                       selectedAsset.condition === 'good' ? 'Bueno' :
                       selectedAsset.condition === 'regular' ? 'Regular' :
                       selectedAsset.condition === 'poor' ? 'Malo' : 
                       selectedAsset.condition}
                    </span>
                  </div>
                  {selectedAsset.locationDescription && (
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-gray-700">Descripción de ubicación:</span>
                      <p className="mt-1 text-sm text-gray-600">{selectedAsset.locationDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsAssetMapModalOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      {/* Modal de Exportación */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Datos del Parque</DialogTitle>
            <DialogDescription>
              Selecciona el formato en el que deseas exportar la información de {park?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Opción 1: PDF */}
            <button
              onClick={exportToPDF}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#00a587] hover:bg-[#ceefea] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Exportar PDF Completo
                  </h3>
                  <p className="text-sm text-gray-600">
                    Reporte completo con toda la información del parque: datos básicos, estadísticas, certificaciones, amenidades y actividades.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">Recomendado</span>
                    <span>• Formato PDF</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Opción 2: CSV */}
            <button
              onClick={exportToCSV}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#00a587] hover:bg-[#ceefea] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Exportar CSV
                  </h3>
                  <p className="text-sm text-gray-600">
                    Datos básicos y estadísticas del parque en formato CSV. Ideal para análisis en Excel o bases de datos.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>Formato CSV</span>
                    <span>• Compatible con Excel</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsExportModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// Component for displaying amenities in a table format
interface AmenitiesTableProps {
  parkId: number;
  isAddAmenityModalOpen: boolean;
  setIsAddAmenityModalOpen: (open: boolean) => void;
  availableAmenities: any[];
  addAmenityMutation: any;
  parkData?: ParkDetails;
  isEditAmenityModalOpen: boolean;
  setIsEditAmenityModalOpen: (open: boolean) => void;
  editingAmenity: any;
  setEditingAmenity: (amenity: any) => void;
  isViewAmenityModalOpen: boolean;
  setIsViewAmenityModalOpen: (open: boolean) => void;
  viewingAmenity: any;
  setViewingAmenity: (amenity: any) => void;
}

const AmenitiesTable = ({ 
  parkId, 
  isAddAmenityModalOpen, 
  setIsAddAmenityModalOpen, 
  availableAmenities, 
  addAmenityMutation, 
  parkData,
  isEditAmenityModalOpen,
  setIsEditAmenityModalOpen,
  editingAmenity,
  setEditingAmenity,
  isViewAmenityModalOpen,
  setIsViewAmenityModalOpen,
  viewingAmenity,
  setViewingAmenity
}: AmenitiesTableProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Use amenities data from parkData with proper mapping
  const amenitiesArray = Array.isArray(parkData?.amenities) ? parkData.amenities.map(amenity => ({
    ...amenity,
    amenityName: amenity.name,
    amenityIcon: amenity.icon,
    parkAmenityId: amenity.id
  })) : [];
  
  const isLoading = !parkData;
  const error = false;

  // Mutation para eliminar amenidad
  const deleteAmenityMutation = useMutation({
    mutationFn: async (amenityId: number) => {
      await apiRequest(`/api/park-amenities/${amenityId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Amenidad eliminada",
        description: "La amenidad ha sido eliminada exitosamente.",
      });
      // Recargar página para mostrar cambios inmediatamente
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la amenidad.",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar amenidad
  const editAmenityMutation = useMutation({
    mutationFn: async ({ amenityId, data }: { amenityId: number; data: EditAmenityFormData }) => {
      return apiRequest(`/api/parks/${parkId}/amenities/${amenityId}`, {
        method: 'PUT',
        data: data,
      });
    },
    onSuccess: () => {
      setIsEditAmenityModalOpen(false);
      setEditingAmenity(null);
      toast({
        title: "Amenidad actualizada",
        description: "La amenidad se ha actualizado exitosamente.",
      });
      
      // Recargar página para mostrar cambios inmediatamente
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la amenidad.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Amenidades del Parque</CardTitle>
          <CardDescription>Cargando servicios e infraestructura...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Amenidades del Parque</CardTitle>
          <CardDescription>Error al cargar las amenidades</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">No se pudieron cargar las amenidades del parque.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Amenidades del Parque ({amenitiesArray.length})</CardTitle>
            <CardDescription>Servicios e infraestructura disponible</CardDescription>
          </div>

        </div>
      </CardHeader>
      <CardContent>
        {amenitiesArray.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Módulo</TableHead>
                <TableHead>Amenidad</TableHead>
                <TableHead>Superficie (m²)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {amenitiesArray.map((amenity: any) => (
                <TableRow key={amenity.id}>
                  <TableCell>
                    <span className="font-medium">{amenity.moduleName || '-'}</span>
                    {amenity.locationLatitude && amenity.locationLongitude && (
                      <div className="text-xs text-gray-500 mt-1">
                        📍 {parseFloat(amenity.locationLatitude).toFixed(6)}, {parseFloat(amenity.locationLongitude).toFixed(6)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <span className="text-xl">{getIconSymbol(amenity.amenityIcon)}</span>
                    <span className="font-medium">{amenity.amenityName}</span>
                  </TableCell>
                  <TableCell>
                    {amenity.surfaceArea ? `${parseFloat(amenity.surfaceArea).toLocaleString()} m²` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={amenity.status === 'Activa' ? 'default' : 
                               amenity.status === 'Mantenimiento' ? 'secondary' : 'destructive'}
                    >
                      {amenity.status || 'Activa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setViewingAmenity(amenity);
                          setIsViewAmenityModalOpen(true);
                        }}
                        title="Ver detalles"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingAmenity(amenity);
                          setIsEditAmenityModalOpen(true);
                        }}
                        title="Editar amenidad"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar amenidad?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará permanentemente la amenidad "{amenity.moduleName}" 
                              del parque. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAmenityMutation.mutate(amenity.parkAmenityId)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteAmenityMutation.isPending}
                            >
                              {deleteAmenityMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500 italic">No hay amenidades registradas para este parque.</p>
        )}
      </CardContent>
    </Card>
  );
};

// Componente para el formulario de agregar amenidad
interface AddAmenityFormProps {
  availableAmenities: any[];
  onSubmit: (data: AddAmenityFormData) => void;
  isLoading: boolean;
  onCancel: () => void;
  parkData?: ParkDetails;
}

function AddAmenityForm({ availableAmenities, onSubmit, isLoading, onCancel, parkData }: AddAmenityFormProps) {
  const form = useForm<AddAmenityFormData>({
    resolver: zodResolver(addAmenitySchema),
    defaultValues: {
      amenityId: 0,
      moduleName: "",
      surfaceArea: "",
      locationLatitude: "",
      locationLongitude: "",
      status: "Activa",
      description: "",
    },
  });

  // Handler para actualizar coordenadas desde el mapa
  const handleMapClick = (lat: number, lng: number) => {
    form.setValue("locationLatitude", lat.toString());
    form.setValue("locationLongitude", lng.toString());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amenityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amenidad</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una amenidad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableAmenities.map((amenity) => (
                    <SelectItem key={amenity.id} value={amenity.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{getIconSymbol(amenity.icon)}</span>
                        <span>{amenity.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="moduleName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Módulo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Módulo Central, Área Norte..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="surfaceArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Superficie (m²)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Activa">Activa</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Inactiva">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="locationLatitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 20.6597" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locationLongitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitud</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: -103.3496" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Descripción adicional..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sección del mapa interactivo */}
        <div className="space-y-2">
          <FormLabel>Ubicación en el Parque (opcional)</FormLabel>
          <p className="text-sm text-gray-600">Haz clic en el mapa para seleccionar la ubicación del módulo</p>
          <div className="h-64 border rounded-lg overflow-hidden">
            {parkData && (
              <MapViewer
                latitude={parkData.latitude || 20.6597}
                longitude={parkData.longitude || -103.3496}
                parkName={parkData.name}
                height="256px"
                onMapClick={(lat, lng) => {
                  form.setValue("locationLatitude", lat.toString());
                  form.setValue("locationLongitude", lng.toString());
                }}
                selectedLocation={
                  form.watch("locationLatitude") && form.watch("locationLongitude")
                    ? {
                        lat: parseFloat(form.watch("locationLatitude") || "0"),
                        lng: parseFloat(form.watch("locationLongitude") || "0")
                      }
                    : null
                }
              />
            )}
          </div>
          {form.watch("locationLatitude") && form.watch("locationLongitude") && (
            <p className="text-xs text-green-600">
              Coordenadas seleccionadas: {form.watch("locationLatitude")}, {form.watch("locationLongitude")}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Agregando...' : 'Agregar Amenidad'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Componente para el formulario de editar amenidad
interface EditAmenityFormProps {
  amenity: any;
  onSubmit: (data: EditAmenityFormData) => void;
  isLoading: boolean;
  onCancel: () => void;
  parkData?: ParkDetails;
}

function EditAmenityForm({ amenity, onSubmit, isLoading, onCancel, parkData }: EditAmenityFormProps) {
  const form = useForm<EditAmenityFormData>({
    resolver: zodResolver(editAmenitySchema),
    defaultValues: {
      moduleName: amenity.moduleName || "",
      surfaceArea: amenity.surfaceArea || "",
      locationLatitude: amenity.locationLatitude || "",
      locationLongitude: amenity.locationLongitude || "",
      status: amenity.status || "Activa",
      description: amenity.description || "",
    },
  });

  // Handler para actualizar coordenadas desde el mapa
  const handleMapClick = (lat: number, lng: number) => {
    form.setValue("locationLatitude", lat.toString());
    form.setValue("locationLongitude", lng.toString());
  };

  const handleSubmit = (data: EditAmenityFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getIconSymbol(amenity.amenityIcon)}</span>
            <div>
              <h3 className="font-semibold text-blue-900">{amenity.amenityName}</h3>
              <p className="text-sm text-blue-700">Editando módulo de amenidad</p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="moduleName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Módulo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Cancha de Fútbol Norte" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="surfaceArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Superficie (m²)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Activa">Activa</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Inactiva">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="locationLatitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 20.6597" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locationLongitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitud</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: -103.3496" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Descripción adicional..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sección del mapa interactivo */}
        <div className="space-y-2">
          <FormLabel>Ubicación en el Parque (opcional)</FormLabel>
          <p className="text-sm text-gray-600">Haz clic en el mapa para actualizar la ubicación del módulo</p>
          <div className="h-64 border rounded-lg overflow-hidden">
            {parkData && (
              <MapViewer
                latitude={parkData.latitude || 20.6597}
                longitude={parkData.longitude || -103.3496}
                parkName={parkData.name}
                height="256px"
                onMapClick={handleMapClick}
                selectedLocation={
                  form.watch("locationLatitude") && form.watch("locationLongitude")
                    ? {
                        lat: parseFloat(form.watch("locationLatitude") || "0"),
                        lng: parseFloat(form.watch("locationLongitude") || "0")
                      }
                    : null
                }
              />
            )}
          </div>
          {form.watch("locationLatitude") && form.watch("locationLongitude") && (
            <p className="text-xs text-green-600">
              Coordenadas actuales: {form.watch("locationLatitude")}, {form.watch("locationLongitude")}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}