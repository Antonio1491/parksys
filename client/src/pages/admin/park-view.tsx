import React, { useState } from "react";
import { useParams, Link } from "wouter";
import ROUTES from "@/routes";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Clock,
  TreePine,
  Calendar,
  Users,
  Wrench,
  AlertTriangle,
  Star,
  Building,
  Phone,
  Mail,
  Shield,
  Edit,
  Download,
  Store,
  CalendarDays,
  Map as MapIcon,
  Activity,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { ReturnHeader } from "@/components/ui/return-header";

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

interface ParkDetails {
  id: number;
  name: string;
  location: string;
  openingHours: string;
  description: string;
  municipality: { name: string };
  certificaciones?: string;
  status?: string;

  // Información básica adicional
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

  // Relaciones
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

  // Estadísticas
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
    totalEvents: number;
  };
}

// ============================================================================
// COMPONENTES DE VISUALIZACIÓN (READONLY)
// ============================================================================

/**
 * Tab de Concesiones - Solo lectura
 */
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
                      <p className="text-sm text-gray-600">
                        {concession.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Ubicación: {concession.specific_location}
                      </p>
                      <p className="text-xs text-gray-500">
                        Horario: {concession.operating_hours} |{" "}
                        {concession.operating_days}
                      </p>
                      <p className="text-xs text-gray-500">
                        Pago mensual: ${concession.monthly_payment} | Contacto:{" "}
                        {concession.emergency_phone}
                      </p>
                      <Badge
                        variant={
                          concession.status === "activa"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {concession.status === "activa"
                          ? "Activa"
                          : concession.status}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewConcession(concession)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de detalles de concesión */}
      <Dialog open={showConcessionDialog} onOpenChange={setShowConcessionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedConcession?.name}</DialogTitle>
            <DialogDescription>
              Detalles completos de la concesión
            </DialogDescription>
          </DialogHeader>
          {selectedConcession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo</p>
                  <p className="text-sm">{selectedConcession.concession_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <Badge
                    variant={
                      selectedConcession.status === "activa"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedConcession.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Fecha de inicio
                  </p>
                  <p className="text-sm">
                    {new Date(selectedConcession.start_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Fecha de término
                  </p>
                  <p className="text-sm">
                    {new Date(selectedConcession.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Descripción</p>
                <p className="text-sm">{selectedConcession.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Tab de Reservaciones - Solo lectura
 */
const ParkReservationsTab = ({ parkId }: { parkId: number }) => {
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [showReservationDialog, setShowReservationDialog] = useState(false);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: [`/api/space-reservations?parkId=${parkId}`],
  });

  const handleViewReservation = (reservation: any) => {
    setSelectedReservation(reservation);
    setShowReservationDialog(true);
  };

  if (isLoading) return <div className="p-4">Cargando reservaciones...</div>;

  const reservationsArray = Array.isArray(reservations) ? reservations : [];

  return (
    <>
      <div className="space-y-4">
        {reservationsArray.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay reservaciones registradas</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Espacio</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservationsArray.map((reservation: any) => (
                <TableRow key={reservation.id}>
                  <TableCell className="font-medium">
                    {reservation.space?.name || "N/A"}
                  </TableCell>
                  <TableCell>{reservation.requester_name}</TableCell>
                  <TableCell>
                    {new Date(reservation.reservation_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {reservation.start_time} - {reservation.end_time}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        reservation.status === "confirmed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {reservation.status === "confirmed"
                        ? "Confirmada"
                        : reservation.status === "pending"
                        ? "Pendiente"
                        : "Cancelada"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReservation(reservation)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog de detalles de reservación */}
      <Dialog
        open={showReservationDialog}
        onOpenChange={setShowReservationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de Reservación</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Espacio</p>
                  <p className="text-sm">
                    {selectedReservation.space?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Solicitante
                  </p>
                  <p className="text-sm">{selectedReservation.requester_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contacto</p>
                  <p className="text-sm">{selectedReservation.contact_phone}</p>
                  <p className="text-sm text-gray-400">
                    {selectedReservation.contact_email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Número de asistentes
                  </p>
                  <p className="text-sm">
                    {selectedReservation.expected_attendees}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Propósito del evento
                </p>
                <p className="text-sm">{selectedReservation.purpose}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Tab de Especies Arbóreas - Solo lectura
 */
const ParkTreeSpeciesTab = ({ parkId }: { parkId: number }) => {
  const { data: treeSpecies = [], isLoading } = useQuery({
    queryKey: [`/api/parks/${parkId}/tree-species`],
  });

  if (isLoading) return <div className="p-4">Cargando especies arbóreas...</div>;

  const speciesArray = Array.isArray(treeSpecies) ? treeSpecies : [];

  return (
    <div className="space-y-4">
      {speciesArray.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <TreePine className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No hay especies arbóreas registradas en este parque</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {speciesArray.map((species: any) => (
            <Card key={species.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                    <TreePine className="h-5 w-5 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {species.commonName}
                    </h4>
                    <p className="text-sm text-gray-600 italic">
                      {species.scientificName}
                    </p>
                    {species.count && (
                      <Badge variant="secondary" className="mt-2">
                        {species.count} ejemplar{species.count !== 1 ? 'es' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Tab de Eventos - Solo lectura
 */
const ParkEventsTab = ({ parkId }: { parkId: number }) => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: [`/api/events?parkId=${parkId}`],
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
            <p>No hay eventos programados</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {eventsArray.map((event: any) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{event.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.start_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.start_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.capacity || "Sin límite"}
                        </span>
                      </div>
                      <Badge className="mt-2" variant="secondary">
                        {event.event_type || "Evento"}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewEvent(event)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de detalles de evento */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>{selectedEvent?.description}</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Fecha de inicio:</span>{" "}
                      {new Date(selectedEvent.start_date).toLocaleDateString()}
                    </p>
                    {selectedEvent.end_date && (
                      <p>
                        <span className="font-medium">Fecha de término:</span>{" "}
                        {new Date(selectedEvent.end_date).toLocaleDateString()}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Hora:</span>{" "}
                      {selectedEvent.start_time}
                      {selectedEvent.end_time &&
                        ` - ${selectedEvent.end_time}`}
                    </p>
                    <p>
                      <span className="font-medium">Capacidad:</span>{" "}
                      {selectedEvent.capacity || "No especificada"}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Descripción</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedEvent.description}
                </p>
              </div>
              {selectedEvent.organizer_email && (
                <div>
                  <h3 className="font-medium text-gray-900">Organizador</h3>
                  <div className="mt-1 text-sm text-gray-600">
                    <p>Email: {selectedEvent.organizer_email}</p>
                    {selectedEvent.organizer_phone && (
                      <p>Teléfono: {selectedEvent.organizer_phone}</p>
                    )}
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

/**
 * Tab de Incidentes - Solo lectura (sin botones de edición)
 */
const ParkIncidentsReadonlyTab = ({ parkId }: { parkId: number }) => {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: [`/api/incidents?parkId=${parkId}`],
  });

  const handleViewIncident = (incident: any) => {
    setSelectedIncident(incident);
    setShowIncidentDialog(true);
  };

  if (isLoading) return <div className="p-4">Cargando incidentes...</div>;

  const incidentsArray = Array.isArray(incidents) ? incidents : [];

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      high: { variant: "destructive", label: "Alta" },
      medium: { variant: "default", label: "Media" },
      low: { variant: "secondary", label: "Baja" },
    };
    return variants[priority] || variants.low;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", label: "Pendiente" },
      in_progress: { variant: "default", label: "En Progreso" },
      resolved: { variant: "outline", label: "Resuelto" },
    };
    return variants[status] || variants.pending;
  };

  return (
    <>
      <div className="space-y-4">
        {incidentsArray.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay incidentes registrados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidentsArray.map((incident: any) => {
                const priorityInfo = getPriorityBadge(incident.priority);
                const statusInfo = getStatusBadge(incident.status);
                return (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">
                      {incident.title}
                    </TableCell>
                    <TableCell>{incident.incident_type}</TableCell>
                    <TableCell>
                      <Badge variant={priorityInfo.variant}>
                        {priorityInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(incident.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewIncident(incident)}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog de detalles de incidente */}
      <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedIncident?.title}</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo</p>
                  <p className="text-sm">{selectedIncident.incident_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Prioridad</p>
                  <Badge variant={getPriorityBadge(selectedIncident.priority).variant}>
                    {getPriorityBadge(selectedIncident.priority).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <Badge variant={getStatusBadge(selectedIncident.status).variant}>
                    {getStatusBadge(selectedIncident.status).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Fecha de reporte
                  </p>
                  <p className="text-sm">
                    {new Date(selectedIncident.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Descripción</p>
                <p className="text-sm">{selectedIncident.description}</p>
              </div>
              {selectedIncident.location_description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Ubicación</p>
                  <p className="text-sm">
                    {selectedIncident.location_description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

/**
 * Formatea horarios de JSON a texto legible con saltos de línea
 */
function formatOpeningHours(openingHours: string | null): JSX.Element {
  if (!openingHours) {
    return <span className="text-gray-500">Horarios no especificados</span>;
  }

  try {
    const schedule = JSON.parse(openingHours);
    const days = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];

    return (
      <div className="space-y-1">
        {days.map((day) => {
          const daySchedule = schedule[day];
          if (!daySchedule || !daySchedule.enabled) {
            return (
              <div key={day} className="flex justify-between text-sm">
                <span className="font-medium">{day}:</span>
                <span className="text-gray-500">Cerrado</span>
              </div>
            );
          }
          return (
            <div key={day} className="flex justify-between text-sm">
              <span className="font-medium">{day}:</span>
              <span>
                {daySchedule.openingTime} - {daySchedule.closingTime}
              </span>
            </div>
          );
        })}
      </div>
    );
  } catch (error) {
    return <span className="text-gray-500">{openingHours}</span>;
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AdminParkView() {
  const { id } = useParams();

  // Estados mínimos para modales
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Query principal - Usar endpoint normal que incluye primaryImage
  const {
    data: park,
    isLoading,
    error,
  } = useQuery<ParkDetails>({
    queryKey: [`/api/parks/${id}`],
    enabled: !!id,
  });

  // Calcular cantidad de especies arbóreas
  const { data: treeSpeciesCount = 0 } = useQuery({
    queryKey: [`/api/parks/${id}/tree-species`],
    select: (data) => Array.isArray(data) ? data.length : 0,
    enabled: !!id,
  });

  // Crear objeto displayPark con valores por defecto
  const displayPark = React.useMemo(() => {
    if (!park)
      return {
        id: 0,
        name: "",
        location: "",
        openingHours: "",
        description: "",
        municipality: { name: "No especificado" },
        amenities: [],
        activities: [],
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
          totalEvents: 0,
        },
        parkType: "No especificado",
        address: "No especificado",
        area: 0,
        greenArea: "",
        foundationYear: 0,
        postalCode: "",
        contactPhone: "",
        contactEmail: "",
        latitude: 0,
        longitude: 0,
      };

    return {
      ...park,
      municipality: park.municipality || { name: "No especificado" },
      documents: park.documents || [],
      parkType: park.parkType || "No especificado",
      address: park.address || park.location || "No especificado",
      area: park.area || 0,
      greenArea: park.greenArea || "",
      foundationYear: park.foundationYear || 0,
      postalCode: park.postalCode || "",
      contactPhone: park.contactPhone || "",
      contactEmail: park.contactEmail || "",
      latitude: park.latitude || 0,
      longitude: park.longitude || 0,
    };
  }, [park]);

  // Obtener imagen principal del parque (misma lógica que parks.tsx)
  const primaryImage = React.useMemo(() => {
    if (!park) return null;

    // Usar la misma prioridad que en el listado de parques
    // @ts-ignore - el backend puede enviar estos campos dinámicamente
    return park.primaryImage || park.mainImageUrl || park.primaryImageUrl || null;
  }, [park]);

  // Helper para badges de estado
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;

    const statusConfig: Record<
      string,
      { label: string; className: string }
    > = {
      en_funcionamiento: {
        label: "En funcionamiento",
        className: "bg-green-100 text-green-800",
      },
      operando_parcialmente: {
        label: "Operando parcialmente",
        className: "bg-yellow-100 text-yellow-800",
      },
      en_mantenimiento: {
        label: "En mantenimiento",
        className: "bg-blue-100 text-blue-800",
      },
      cerrado_temporalmente: {
        label: "Cerrado temporalmente",
        className: "bg-red-100 text-red-800",
      },
      cerrado_indefinidamente: {
        label: "Cerrado indefinidamente",
        className: "bg-gray-100 text-gray-800",
      },
      reapertura_proxima: {
        label: "Reapertura próxima",
        className: "bg-purple-100 text-purple-800",
      },
      en_proyecto_construccion: {
        label: "En proyecto / construcción",
        className: "bg-orange-100 text-orange-800",
      },
      uso_restringido: {
        label: "Uso restringido",
        className: "bg-amber-100 text-amber-800",
      },
    };

    const config = statusConfig[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
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
      </AdminLayout>
    );
  }

  // Error state
  if (error || !park) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Parque no encontrado
            </h2>
            <p className="text-gray-600 mb-4">
              No se pudo cargar la información del parque.
            </p>
            <Link href={ROUTES.admin.parks.list}>
              <Button variant="outline">Volver a Parques</Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <AdminLayout>
      {/* Header con botón volver */}
      <ReturnHeader />

      <div className="space-y-4">
        {/* Header del parque */}
        <div className="bg-white p-8 -mx-6 relative">
          {/* Botones de acción - Responsive */}
          {/* Móvil: Arriba de la imagen, 2 columnas con texto completo */}
          <div className="grid grid-cols-2 gap-2 mb-4 lg:hidden">
            <Link href={ROUTES.admin.parks.edit.build(park.id)} className="w-full">
              <Button className="w-full bg-[#a0cc4d] hover:bg-[#00a884] text-white hover:text-white">
                <Edit className="h-4 w-4 mr-2" />
                Gestionar
              </Button>
            </Link>
            <Button
              onClick={() => setIsExportModalOpen(true)}
              className="w-full bg-[#00444f] hover:bg-[#00a587] text-white hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Desktop: Esquina superior derecha */}
          <div className="hidden lg:block absolute top-12 right-12 z-10">
            <div className="flex gap-2">
              <Link href={ROUTES.admin.parks.edit.build(park.id)}>
                <Button className="bg-[#a0cc4d] hover:bg-[#00a884] text-white hover:text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Gestionar
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

          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-10">
            {/* Imagen del parque */}
            <div className="w-full lg:w-80 aspect-[16/10] rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt={`Imagen de ${park.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Información básica */}
            <div className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-[#00444f]">
                  {displayPark.name}
                </h1>
                {park.status && getStatusBadge(park.status)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-14 mt-6 lg:mt-8">
                {/* Dirección */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <MapPin className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">
                      Dirección
                    </p>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {displayPark.address || displayPark.location || "No especificada"}
                    </p>
                  </div>
                </div>

                {/* Superficie (antes "Área") */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <MapIcon className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">
                      Superficie
                    </p>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {displayPark.area
                        ? `${(displayPark.area / 10000).toFixed(2)} ha`
                        : "No especificada"}
                    </p>
                  </div>
                </div>

                {/* Año de Fundación */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <Calendar className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">
                      Fundación
                    </p>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {displayPark.foundationYear || "No especificado"}
                    </p>
                  </div>
                </div>

                {/* Administrador */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <Users className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">
                      Administrador
                    </p>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {displayPark.administrator || "No especificado"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Descripción del parque */}
              {displayPark.description && (
                <div className="mt-4 lg:mt-6">
                  <p className="text-sm lg:text-base text-gray-700 leading-relaxed">
                    {displayPark.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards - NUEVAS MÉTRICAS (sin duplicar tabs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Evaluación Promedio */}
          <Card className="bg-[#ceefea] border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Evaluación
                  </p>
                  <p className="text-3xl font-bold text-[#00444f]">
                    {park.stats?.averageEvaluation?.toFixed(1) || "0.0"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {park.stats?.totalEvaluations || 0} evaluaciones
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actividades */}
          <Card className="bg-[#ceefea] border-0 hidden sm:block">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Actividades</p>
                  <p className="text-3xl font-bold text-[#00444f]">
                    {park.stats?.totalActivities || 0}
                  </p>
                  <p className="text-xs text-gray-500">activas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificaciones */}
          <Card className="bg-[#ceefea] border-0 hidden lg:block">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Certificaciones</p>
                  <p className="text-3xl font-bold text-[#00444f]">
                    {park.certificaciones
                      ? park.certificaciones.split(",").filter((cert) => cert.trim().length > 0).length
                      : 0}
                  </p>
                  <p className="text-xs text-gray-500">activas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activos */}
          <Card className="bg-[#ceefea] border-0 hidden lg:block">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Activos</p>
                  <p className="text-3xl font-bold text-[#00444f]">
                    {park.stats?.totalAssets || 0}
                  </p>
                  <p className="text-xs text-gray-500">inventario</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de visualización */}
        <Tabs defaultValue="activities" className="space-y-6">
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-1">
            <TabsTrigger value="activities" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Actividades (</span>
              <span className="sm:hidden">Act. (</span>
              {park.activities?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="concessions" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Concesiones (</span>
              <span className="sm:hidden">Conc. (</span>
              {park.stats?.activeConcessions || 0})
            </TabsTrigger>
            <TabsTrigger value="reservations" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Reservas (</span>
              <span className="sm:hidden">Res. (</span>
              {park.stats?.totalReservations || 0})
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Eventos (</span>
              <span className="sm:hidden">Eve. (</span>
              {park.stats?.totalEvents || 0})
            </TabsTrigger>
            <TabsTrigger value="incidents" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Incidencias (</span>
              <span className="sm:hidden">Inc. (</span>
              {park.stats?.pendingIncidents || 0})
            </TabsTrigger>
            <TabsTrigger value="tree-species" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Especies (</span>
              <span className="sm:hidden">Esp. (</span>
              {treeSpeciesCount})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Actividades */}
          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Actividades ({park.activities?.length || 0})
                </CardTitle>
                <CardDescription>
                  Actividades programadas en este parque
                </CardDescription>
              </CardHeader>
              <CardContent>
                {park.activities && park.activities.length > 0 ? (
                  <div className="space-y-4">
                    {park.activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{activity.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              📅{" "}
                              {new Date(activity.startDate).toLocaleDateString()}
                            </span>
                            {activity.instructorName && (
                              <span>👤 {activity.instructorName}</span>
                            )}
                            <span>👥 {activity.participantCount} inscritos</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay actividades programadas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Concesiones */}
          <TabsContent value="concessions">
            <ParkConcessionsTab parkId={park.id} />
          </TabsContent>

          {/* Tab: Reservaciones */}
          <TabsContent value="reservations">
            <ParkReservationsTab parkId={park.id} />
          </TabsContent>

          {/* Tab: Eventos */}
          <TabsContent value="events">
            <ParkEventsTab parkId={park.id} />
          </TabsContent>

          {/* Tab: Incidentes - READONLY */}
          <TabsContent value="incidents">
            <ParkIncidentsReadonlyTab parkId={park.id} />
          </TabsContent>

          {/* Tab: Especies Arbóreas */}
          <TabsContent value="tree-species">
            <ParkTreeSpeciesTab parkId={park.id} />
          </TabsContent>
        </Tabs>

        {/* Información de contacto y horarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Horarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios de Apertura
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formatOpeningHours(displayPark.openingHours)}
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayPark.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{displayPark.contactPhone}</span>
                </div>
              )}
              {displayPark.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{displayPark.contactEmail}</span>
                </div>
              )}
              {displayPark.postalCode && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>C.P. {displayPark.postalCode}</span>
                </div>
              )}
              {!displayPark.contactPhone &&
                !displayPark.contactEmail &&
                !displayPark.postalCode && (
                  <p className="text-gray-500">
                    No hay información de contacto disponible
                  </p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Exportar (placeholder) */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Información del Parque</DialogTitle>
            <DialogDescription>
              Selecciona el formato de exportación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button variant="outline" className="w-full">
              Exportar como PDF
            </Button>
            <Button variant="outline" className="w-full">
              Exportar como Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}