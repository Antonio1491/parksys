import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { 
  Calendar,
  CalendarDays, 
  Clock, 
  Edit, 
  MapPin, 
  Users, 
  Building, 
  Mail, 
  Phone,
  ClipboardX,
  UserX,
  Star,
  ArrowLeft,
  ChevronRight,
  UserPlus,
  FileCog,
  ListChecks,
  Package,
  PackageX,
  CheckCircle,
  XCircle,
  Trash,
  Plus,
  ExternalLink,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

// Definimos los tipos que necesitamos para los eventos
interface Event {
  id: number;
  title: string;
  description: string | null;
  eventType: string;
  targetAudience: string | null;
  status: string;
  featuredImageUrl: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  isRecurring: boolean;
  recurrencePattern: string | null;
  location: string | null;
  capacity: number | null;
  registrationType: string;
  organizerName: string | null;
  organizerEmail: string | null;
  organizerPhone: string | null;
  geolocation: any | null;
  createdAt: string;
  updatedAt: string;
  createdById: number | null;
  parks: { id: number; name: string; address: string }[];
}

// Tipo para los participantes
interface Participant {
  id: number;
  eventId: number;
  name: string;
  email: string;
  phone: string | null;
  status: string; // registered, confirmed, attended, cancelled
  notes: string | null;
  registrationDate: string;
}

// Tipos para el formulario de registro de participantes
interface RegisterParticipantFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

// Tipo para los recursos
interface Resource {
  id: number;
  eventId: number;
  resourceType: string;
  resourceId: number | null;
  resourceName: string;
  quantity: number;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Tipo para el formulario de recursos
interface ResourceFormData {
  resourceType: string;
  resourceName: string;
  quantity: number;
  notes: string;
  status?: string;
}

// Tipo para las evaluaciones
interface Evaluation {
  id: number;
  eventId: number;
  evaluationType: string;
  score: number;
  comments: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Tipo para el formulario de evaluaciones
interface EvaluationFormData {
  evaluationType: string;
  score: number;
  comments: string;
}

// Tipo para los voluntarios asignados al evento
interface EventVolunteer {
  id: number;
  eventId: number;
  volunteerId: number;
  name: string;
  role: string;
  status: string;
  contactInfo: string | null;
  notes: string | null;
  assignedAt: string;
}

// Tipo para el formulario de voluntarios
interface VolunteerFormData {
  volunteerId: number;
  role: string;
  notes: string;
}

const EventDetailPage = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("details");
  
  // Estados para la gestión de participantes
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState<RegisterParticipantFormData>({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });
  
  // Estados para la gestión de recursos
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [isEditingResource, setIsEditingResource] = useState(false);
  const [currentResourceId, setCurrentResourceId] = useState<number | null>(null);
  const [resourceForm, setResourceForm] = useState<ResourceFormData>({
    resourceType: "espacio",
    resourceName: "",
    quantity: 1,
    notes: "",
  });

  // Estados para la gestión de evaluaciones
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [isEditingEvaluation, setIsEditingEvaluation] = useState(false);
  const [currentEvaluationId, setCurrentEvaluationId] = useState<number | null>(null);
  const [evaluationForm, setEvaluationForm] = useState<EvaluationFormData>({
    evaluationType: "satisfaccion",
    score: 5,
    comments: "",
  });

  // Estados para la gestión de voluntarios
  const [isVolunteerDialogOpen, setIsVolunteerDialogOpen] = useState(false);
  const [isEditingVolunteer, setIsEditingVolunteer] = useState(false);
  const [currentVolunteerId, setCurrentVolunteerId] = useState<number | null>(null);
  const [volunteerForm, setVolunteerForm] = useState<VolunteerFormData>({
    volunteerId: 0,
    role: "asistente",
    notes: "",
  });

  // Obtenemos los datos del evento
  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${id}`],
  });

  // Obtenemos los participantes del evento
  const { data: participants, isLoading: isLoadingParticipants } = useQuery<Participant[]>({
    queryKey: [`/api/events/${id}/participants`],
    enabled: !!id,
  });
  
  // Obtenemos los recursos del evento
  const { data: resources, isLoading: isLoadingResources } = useQuery<Resource[]>({
    queryKey: [`/api/events/${id}/resources`],
    enabled: !!id,
  });
  
  // Obtenemos las evaluaciones del evento
  const { data: evaluations, isLoading: isLoadingEvaluations } = useQuery<Evaluation[]>({
    queryKey: [`/api/events/${id}/evaluations`],
    enabled: !!id,
  });
  
  // Obtenemos los voluntarios asignados al evento
  const { data: volunteers, isLoading: isLoadingVolunteers } = useQuery<EventVolunteer[]>({
    queryKey: [`/api/events/${id}/volunteers`],
    enabled: !!id,
  });
  
  // Obtenemos la lista de todos los voluntarios disponibles para asignar
  const { data: availableVolunteers } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['/api/volunteers/available'],
    enabled: !!id,
  });

  // Mutación para registrar un nuevo participante
  const registerParticipant = useMutation({
    mutationFn: async (data: RegisterParticipantFormData) => {
      const response = await fetch(`/api/events/${id}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Error al registrar participante");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidamos la consulta para actualizar la lista de participantes
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/participants`] });
      setIsRegisterDialogOpen(false);
      setRegisterForm({
        name: "",
        email: "",
        phone: "",
        notes: ""
      });
      toast({
        title: "Participante registrado",
        description: "El participante ha sido registrado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al registrar participante",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutación para asignar un nuevo recurso al evento
  const assignResource = useMutation({
    mutationFn: async (data: ResourceFormData) => {
      const response = await fetch(`/api/events/${id}/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token") || "",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Error al asignar recurso");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidamos la consulta para actualizar la lista de recursos
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/resources`] });
      setIsResourceDialogOpen(false);
      setResourceForm({
        resourceType: "espacio",
        resourceName: "",
        quantity: 1,
        notes: "",
      });
      toast({
        title: "Recurso asignado",
        description: "El recurso ha sido asignado exitosamente al evento.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al asignar recurso",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutación para actualizar un recurso
  const updateResource = useMutation({
    mutationFn: async ({ resourceId, data }: { resourceId: number, data: ResourceFormData }) => {
      const response = await fetch(`/api/events/${id}/resources/${resourceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token") || "",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Error al actualizar recurso");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidamos la consulta para actualizar la lista de recursos
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/resources`] });
      setIsResourceDialogOpen(false);
      setIsEditingResource(false);
      setCurrentResourceId(null);
      setResourceForm({
        resourceType: "espacio",
        resourceName: "",
        quantity: 1,
        notes: "",
      });
      toast({
        title: "Recurso actualizado",
        description: "El recurso ha sido actualizado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar recurso",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutación para cambiar el estado de un recurso
  const updateResourceStatus = useMutation({
    mutationFn: async ({ resourceId, status }: { resourceId: number, status: string }) => {
      const response = await fetch(`/api/events/${id}/resources/${resourceId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token") || "",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error("Error al actualizar estado del recurso");
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidamos la consulta para actualizar la lista de recursos
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/resources`] });
      toast({
        title: "Estado actualizado",
        description: `El recurso ha sido marcado como ${resourceStatusTranslations[variables.status] || variables.status}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutación para eliminar un recurso
  const deleteResource = useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await fetch(`/api/events/${id}/resources/${resourceId}`, {
        method: "DELETE",
        headers: {
          "Authorization": localStorage.getItem("token") || "",
        },
      });
      
      if (!response.ok) {
        throw new Error("Error al eliminar recurso");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidamos la consulta para actualizar la lista de recursos
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/resources`] });
      toast({
        title: "Recurso eliminado",
        description: "El recurso ha sido eliminado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar recurso",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutación para crear una evaluación
  const createEvaluation = useMutation({
    mutationFn: async (data: EvaluationFormData) => {
      const response = await fetch(`/api/events/${id}/evaluations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token") || "",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Error al crear evaluación");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidamos la consulta para actualizar la lista de evaluaciones
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/evaluations`] });
      setIsEvaluationDialogOpen(false);
      setEvaluationForm({
        evaluationType: "satisfaccion",
        score: 5,
        comments: "",
      });
      toast({
        title: "Evaluación creada",
        description: "La evaluación ha sido creada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al crear evaluación",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutación para actualizar una evaluación
  const updateEvaluation = useMutation({
    mutationFn: async ({ evaluationId, data }: { evaluationId: number, data: EvaluationFormData }) => {
      const response = await fetch(`/api/events/${id}/evaluations/${evaluationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token") || "",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Error al actualizar evaluación");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidamos la consulta para actualizar la lista de evaluaciones
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/evaluations`] });
      setIsEvaluationDialogOpen(false);
      setIsEditingEvaluation(false);
      setCurrentEvaluationId(null);
      setEvaluationForm({
        evaluationType: "satisfaccion",
        score: 5,
        comments: "",
      });
      toast({
        title: "Evaluación actualizada",
        description: "La evaluación ha sido actualizada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar evaluación",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutación para eliminar una evaluación
  const deleteEvaluation = useMutation({
    mutationFn: async (evaluationId: number) => {
      const response = await fetch(`/api/events/${id}/evaluations/${evaluationId}`, {
        method: "DELETE",
        headers: {
          "Authorization": localStorage.getItem("token") || "",
        },
      });
      
      if (!response.ok) {
        throw new Error("Error al eliminar evaluación");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidamos la consulta para actualizar la lista de evaluaciones
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/evaluations`] });
      toast({
        title: "Evaluación eliminada",
        description: "La evaluación ha sido eliminada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar evaluación",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutación para asignar un voluntario al evento
  const assignVolunteer = useMutation({
    mutationFn: async (data: VolunteerFormData) => {
      const response = await fetch(`/api/events/${id}/volunteers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token") || "",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Error al asignar voluntario");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidamos la consulta para actualizar la lista de voluntarios
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/volunteers`] });
      setIsVolunteerDialogOpen(false);
      setVolunteerForm({
        volunteerId: 0,
        role: "asistente",
        notes: "",
      });
      toast({
        title: "Voluntario asignado",
        description: "El voluntario ha sido asignado exitosamente al evento.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al asignar voluntario",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutación para actualizar la asignación de un voluntario
  const updateVolunteerAssignment = useMutation({
    mutationFn: async ({ assignmentId, data }: { assignmentId: number, data: Partial<VolunteerFormData> }) => {
      const response = await fetch(`/api/events/${id}/volunteers/${assignmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token") || "",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Error al actualizar asignación del voluntario");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidamos la consulta para actualizar la lista de voluntarios
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/volunteers`] });
      setIsVolunteerDialogOpen(false);
      setIsEditingVolunteer(false);
      setCurrentVolunteerId(null);
      setVolunteerForm({
        volunteerId: 0,
        role: "asistente",
        notes: "",
      });
      toast({
        title: "Asignación actualizada",
        description: "La asignación del voluntario ha sido actualizada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar asignación",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutación para eliminar la asignación de un voluntario
  const removeVolunteerAssignment = useMutation({
    mutationFn: async (assignmentId: number) => {
      const response = await fetch(`/api/events/${id}/volunteers/${assignmentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": localStorage.getItem("token") || "",
        },
      });
      
      if (!response.ok) {
        throw new Error("Error al eliminar asignación del voluntario");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidamos la consulta para actualizar la lista de voluntarios
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/volunteers`] });
      toast({
        title: "Asignación eliminada",
        description: "La asignación del voluntario ha sido eliminada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar asignación",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Función para manejar el envío del formulario de registro de participantes
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerParticipant.mutate(registerForm);
  };
  
  // Función para manejar el envío del formulario de recursos
  const handleResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditingResource && currentResourceId) {
      updateResource.mutate({
        resourceId: currentResourceId,
        data: resourceForm
      });
    } else {
      assignResource.mutate(resourceForm);
    }
  };
  
  // Función para editar un recurso
  const handleEditResource = (resource: Resource) => {
    setIsEditingResource(true);
    setCurrentResourceId(resource.id);
    setResourceForm({
      resourceType: resource.resourceType,
      resourceName: resource.resourceName,
      quantity: resource.quantity,
      notes: resource.notes || "",
    });
    setIsResourceDialogOpen(true);
  };
  
  // Función para cambiar el estado de un recurso
  const handleResourceStatusChange = (resourceId: number, status: string) => {
    updateResourceStatus.mutate({ resourceId, status });
  };
  
  // Función para eliminar un recurso
  const handleDeleteResource = (resourceId: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este recurso?")) {
      deleteResource.mutate(resourceId);
    }
  };
  
  // Función para manejar el envío del formulario de evaluaciones
  const handleEvaluationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditingEvaluation && currentEvaluationId) {
      updateEvaluation.mutate({
        evaluationId: currentEvaluationId,
        data: evaluationForm
      });
    } else {
      createEvaluation.mutate(evaluationForm);
    }
  };
  
  // Función para editar una evaluación
  const handleEditEvaluation = (evaluation: Evaluation) => {
    setIsEditingEvaluation(true);
    setCurrentEvaluationId(evaluation.id);
    setEvaluationForm({
      evaluationType: evaluation.evaluationType,
      score: evaluation.score,
      comments: evaluation.comments || "",
    });
    setIsEvaluationDialogOpen(true);
  };
  
  // Función para eliminar una evaluación
  const handleDeleteEvaluation = (evaluationId: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta evaluación?")) {
      deleteEvaluation.mutate(evaluationId);
    }
  };
  
  // Función para manejar el envío del formulario de voluntarios
  const handleVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditingVolunteer && currentVolunteerId) {
      updateVolunteerAssignment.mutate({
        assignmentId: currentVolunteerId,
        data: volunteerForm
      });
    } else {
      assignVolunteer.mutate(volunteerForm);
    }
  };
  
  // Función para editar la asignación de un voluntario
  const handleEditVolunteer = (volunteer: EventVolunteer) => {
    setIsEditingVolunteer(true);
    setCurrentVolunteerId(volunteer.id);
    setVolunteerForm({
      volunteerId: volunteer.volunteerId,
      role: volunteer.role,
      notes: volunteer.notes || "",
    });
    setIsVolunteerDialogOpen(true);
  };
  
  // Función para eliminar la asignación de un voluntario
  const handleDeleteVolunteer = (assignmentId: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta asignación de voluntario?")) {
      removeVolunteerAssignment.mutate(assignmentId);
    }
  };

  // Si está cargando, mostramos un spinner
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <PageHeader
            title="Cargando evento..."
            description="Obteniendo información del evento"
            actions={
              <Button variant="outline" onClick={() => navigate("/admin/events")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            }
          />
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  // Si hay un error, mostramos un mensaje
  if (error || !event) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <PageHeader
            title="Error"
            description="No se pudo cargar la información del evento"
            actions={
              <Button variant="outline" onClick={() => navigate("/admin/events")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            }
          />
          <Card className="bg-destructive/10 border-destructive">
            <CardHeader>
              <CardTitle>Error al cargar el evento</CardTitle>
              <CardDescription>
                No se pudo obtener la información del evento. Verifica que el ID sea correcto.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // Mapa de colores para los diferentes tipos de eventos
  const typeColorMap: Record<string, string> = {
    cultural: "bg-indigo-100 text-indigo-800 border-indigo-300",
    sports: "bg-green-100 text-green-800 border-green-300",
    environmental: "bg-emerald-100 text-emerald-800 border-emerald-300",
    social: "bg-orange-100 text-orange-800 border-orange-300",
    educational: "bg-blue-100 text-blue-800 border-blue-300",
    default: "bg-gray-100 text-gray-800 border-gray-300",
  };

  // Traducir tipos de eventos a español
  const eventTypeTranslations: Record<string, string> = {
    cultural: "Cultural",
    sports: "Deportivo",
    environmental: "Ambiental",
    social: "Social",
    educational: "Educativo",
  };

  // Mapa de colores para los diferentes estados
  const statusColorMap: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    published: "bg-green-100 text-green-800",
    canceled: "bg-red-100 text-red-800",
    postponed: "bg-amber-100 text-amber-800",
    completed: "bg-blue-100 text-blue-800",
    default: "bg-gray-100 text-gray-800",
  };

  // Traducir estados a español
  const statusTranslations: Record<string, string> = {
    draft: "Borrador",
    published: "Publicado",
    canceled: "Cancelado",
    postponed: "Pospuesto",
    completed: "Completado",
  };

  // Traducir estados de participantes a español
  const participantStatusTranslations: Record<string, string> = {
    registered: "Registrado",
    confirmed: "Confirmado",
    attended: "Asistió",
    cancelled: "Cancelado",
  };
  
  // Traducir tipos de recursos a español
  const resourceTypeTranslations: Record<string, string> = {
    espacio: "Espacio",
    equipamiento: "Equipamiento",
    servicio: "Servicio",
    personal: "Personal",
    otro: "Otro",
  };
  
  // Traducir estados de recursos a español
  const resourceStatusTranslations: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    rejected: "Rechazado",
  };
  
  // Traducir tipos de evaluaciones a español
  const evaluationTypeTranslations: Record<string, string> = {
    satisfaccion: "Satisfacción del público",
    organizacion: "Organización",
    impacto: "Impacto",
    logistica: "Logística",
    participacion: "Participación",
    otro: "Otro",
  };
  
  // Traducir roles de voluntarios a español
  const volunteerRoleTranslations: Record<string, string> = {
    coordinador: "Coordinador",
    asistente: "Asistente",
    logistica: "Logística",
    guia: "Guía/Orientador",
    fotografo: "Fotógrafo",
    seguridad: "Seguridad",
    primeros_auxilios: "Primeros Auxilios",
    otro: "Otro",
  };
  
  // Traducir estados de voluntarios a español
  const volunteerStatusTranslations: Record<string, string> = {
    asignado: "Asignado",
    confirmado: "Confirmado",
    ausente: "Ausente",
    completado: "Completado",
  };

  // Generar un mapa de colores para los diferentes estados de participantes
  const participantStatusColorMap: Record<string, string> = {
    registered: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    attended: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800",
  };

  // Formatear las fechas
  const formattedStartDate = event.startDate
    ? format(new Date(event.startDate), "dd 'de' MMMM 'de' yyyy", { locale: es })
    : "Sin fecha";
  
  const formattedEndDate = event.endDate
    ? format(new Date(event.endDate), "dd 'de' MMMM 'de' yyyy", { locale: es })
    : null;

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <PageHeader
          title={event.title}
          description={
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={typeColorMap[event.eventType] || typeColorMap.default}
              >
                {eventTypeTranslations[event.eventType] || event.eventType}
              </Badge>
              <Badge
                variant="secondary"
                className={statusColorMap[event.status] || statusColorMap.default}
              >
                {statusTranslations[event.status] || event.status}
              </Badge>
            </div>
          }
          actions={
            <>
              <Button variant="outline" onClick={() => navigate("/admin/events")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/admin/events/participants/${id}`}>
                  <Users className="mr-2 h-4 w-4" />
                  Participantes
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/admin/events/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
            </>
          }
        />

        <Tabs
          defaultValue="details"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-6"
        >
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="details">
              <Calendar className="h-4 w-4 mr-2" />
              Detalles
            </TabsTrigger>
            <TabsTrigger value="participants">
              <Users className="h-4 w-4 mr-2" />
              Participantes
            </TabsTrigger>
            <TabsTrigger value="resources">
              <FileCog className="h-4 w-4 mr-2" />
              Recursos
            </TabsTrigger>
            <TabsTrigger value="evaluations">
              <ListChecks className="h-4 w-4 mr-2" />
              Evaluaciones
            </TabsTrigger>
            <TabsTrigger value="volunteers">
              <UserPlus className="h-4 w-4 mr-2" />
              Voluntarios
            </TabsTrigger>
          </TabsList>

          {/* Pestaña de Detalles */}
          <TabsContent value="details" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Información Principal */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Información del Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {event.featuredImageUrl && (
                    <div className="overflow-hidden rounded-lg mb-6">
                      <img
                        src={event.featuredImageUrl?.startsWith('/uploads/') 
                          ? `/api/storage/file/${encodeURIComponent(event.featuredImageUrl.replace(/^\//, ''))}`
                          : event.featuredImageUrl
                        }
                        alt={event.title}
                        className="w-full h-auto object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-base mb-2">Descripción</h3>
                    <p className="text-gray-700">{event.description || "Sin descripción"}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-base mb-2">Fecha</h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formattedStartDate}
                          {formattedEndDate && formattedStartDate !== formattedEndDate && (
                            <> al {formattedEndDate}</>
                          )}
                        </span>
                      </div>
                    </div>

                    {(event.startTime || event.endTime) && (
                      <div>
                        <h3 className="font-semibold text-base mb-2">Horario</h3>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {event.startTime || ""}
                            {event.startTime && event.endTime && " a "}
                            {event.endTime || ""}
                          </span>
                        </div>
                      </div>
                    )}

                    {event.location && (
                      <div>
                        <h3 className="font-semibold text-base mb-2">Ubicación</h3>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    )}

                    {event.capacity && (
                      <div>
                        <h3 className="font-semibold text-base mb-2">Capacidad</h3>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{event.capacity} personas</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Información del organizador y parques */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Organizador</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {event.organizerName && (
                      <div>
                        <h3 className="font-semibold text-base mb-1">Nombre</h3>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{event.organizerName}</span>
                        </div>
                      </div>
                    )}

                    {event.organizerEmail && (
                      <div>
                        <h3 className="font-semibold text-base mb-1">Email</h3>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${event.organizerEmail}`}
                            className="text-blue-600 hover:underline"
                          >
                            {event.organizerEmail}
                          </a>
                        </div>
                      </div>
                    )}

                    {event.organizerPhone && (
                      <div>
                        <h3 className="font-semibold text-base mb-1">Teléfono</h3>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`tel:${event.organizerPhone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {event.organizerPhone}
                          </a>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Parques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {event.parks && event.parks.length > 0 ? (
                      <ul className="space-y-2">
                        {event.parks.map((park) => (
                          <li key={park.id} className="border-b pb-2 last:border-0">
                            <div className="font-medium">{park.name}</div>
                            <div className="text-sm text-muted-foreground">{park.address}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">
                        No hay parques asociados a este evento.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Pestaña de Participantes */}
          <TabsContent value="participants" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Participantes Registrados</CardTitle>
                  <CardDescription>
                    {isLoadingParticipants
                      ? "Cargando participantes..."
                      : participants && participants.length > 0
                      ? `${participants.length} participante${participants.length > 1 ? "s" : ""} registrado${participants.length > 1 ? "s" : ""}`
                      : "No hay participantes registrados para este evento."}
                  </CardDescription>
                </div>
                <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Registrar Participante
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Registrar Nuevo Participante</DialogTitle>
                      <DialogDescription>
                        Complete el formulario para registrar un nuevo participante en el evento.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRegisterSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Nombre completo</Label>
                          <Input
                            id="name"
                            placeholder="Nombre del participante"
                            value={registerForm.name}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, name: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={registerForm.email}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, email: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone">Teléfono (opcional)</Label>
                          <Input
                            id="phone"
                            placeholder="Teléfono de contacto"
                            value={registerForm.phone}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, phone: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="notes">Notas (opcional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Información adicional"
                            value={registerForm.notes}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, notes: e.target.value })
                            }
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsRegisterDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={registerParticipant.isPending}>
                          {registerParticipant.isPending ? "Registrando..." : "Registrar Participante"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingParticipants ? (
                  <div className="py-8 flex justify-center">
                    <LoadingSpinner />
                  </div>
                ) : participants && participants.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha de registro
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participants.map((participant) => (
                          <tr key={participant.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium">{participant.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">{participant.email}</div>
                              {participant.phone && (
                                <div className="text-sm text-gray-500">{participant.phone}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant="secondary"
                                className={
                                  participantStatusColorMap[participant.status] ||
                                  participantStatusColorMap.default
                                }
                              >
                                {participantStatusTranslations[participant.status] || participant.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(participant.registrationDate), "dd/MM/yyyy HH:mm", {
                                locale: es,
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/participants/${participant.id}`)}
                              >
                                <span className="sr-only">Ver detalles</span>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Sin participantes</h3>
                    <p className="text-gray-500 mb-4">
                      No hay participantes registrados para este evento.
                    </p>
                    <Button
                      onClick={() => setIsRegisterDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Registrar Participante
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Recursos */}
          <TabsContent value="resources" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recursos Necesarios</CardTitle>
                  <CardDescription>
                    Gestiona los recursos necesarios para el evento.
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setIsEditingResource(false);
                    setCurrentResourceId(null);
                    setResourceForm({
                      resourceType: "espacio",
                      resourceName: "",
                      quantity: 1,
                      notes: "",
                    });
                    setIsResourceDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar Recurso
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingResources ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Cargando recursos...</p>
                    </div>
                  </div>
                ) : resources && resources.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Tipo</th>
                          <th className="text-left p-3 font-medium">Nombre</th>
                          <th className="text-left p-3 font-medium">Cantidad</th>
                          <th className="text-left p-3 font-medium">Estado</th>
                          <th className="text-left p-3 font-medium">Notas</th>
                          <th className="text-right p-3 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resources.map((resource) => (
                          <tr key={resource.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              {resourceTypeTranslations[resource.resourceType] || resource.resourceType}
                            </td>
                            <td className="p-3 font-medium">{resource.resourceName}</td>
                            <td className="p-3">{resource.quantity}</td>
                            <td className="p-3">
                              <Badge 
                                variant={
                                  resource.status === "confirmed" ? "success" : 
                                  resource.status === "rejected" ? "destructive" : 
                                  "outline"
                                }
                              >
                                {resourceStatusTranslations[resource.status] || resource.status}
                              </Badge>
                            </td>
                            <td className="p-3">{resource.notes || "-"}</td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditResource(resource)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                {resource.status !== "confirmed" ? (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleResourceStatusChange(resource.id, "confirmed")}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleResourceStatusChange(resource.id, "pending")}
                                  >
                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteResource(resource.id)}
                                >
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay recursos asignados</h3>
                    <p className="text-gray-500 mb-4 max-w-lg mx-auto">
                      Aún no se han asignado recursos a este evento. Haz clic en "Asignar Recurso" para comenzar.
                    </p>
                    <p className="text-gray-500 mb-4 max-w-lg mx-auto">
                      Esta funcionalidad permitirá asignar personal, equipamiento y materiales
                      necesarios para cada evento.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Evaluaciones */}
          <TabsContent value="evaluations" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Evaluaciones del Evento</CardTitle>
                  <CardDescription>
                    Gestiona las evaluaciones y métricas de desempeño del evento.
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setIsEditingEvaluation(false);
                  setCurrentEvaluationId(null);
                  setEvaluationForm({
                    evaluationType: "satisfaccion",
                    score: 5,
                    comments: "",
                  });
                  setIsEvaluationDialogOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Evaluación
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingEvaluations ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  evaluations && evaluations.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        {evaluations.map((evaluation) => (
                          <Card key={evaluation.id} className="overflow-hidden">
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="font-normal">
                                    {evaluationTypeTranslations[evaluation.evaluationType] || evaluation.evaluationType}
                                  </Badge>
                                  <div className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < evaluation.score ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                                      />
                                    ))}
                                    <span className="ml-2 text-sm font-medium">{evaluation.score}/5</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditEvaluation(evaluation)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEvaluation(evaluation.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {evaluation.comments && (
                                <div className="mt-2 text-sm text-gray-600">
                                  {evaluation.comments}
                                </div>
                              )}
                              <div className="mt-2 text-xs text-gray-400">
                                {new Date(evaluation.createdAt).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                                {evaluation.createdBy && ` por ${evaluation.createdBy}`}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <ClipboardX className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-lg font-medium">Sin evaluaciones</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        No hay evaluaciones registradas para este evento. Agrega una evaluación para comenzar.
                      </p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Voluntarios */}
          <TabsContent value="volunteers" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Voluntarios Asignados</CardTitle>
                  <CardDescription>
                    Gestiona los voluntarios que participarán en el evento.
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setIsEditingVolunteer(false);
                    setCurrentVolunteerId(null);
                    setVolunteerForm({
                      volunteerId: 0,
                      role: "asistente",
                      notes: "",
                    });
                    setIsVolunteerDialogOpen(true);
                  }}
                  disabled={!availableVolunteers || availableVolunteers.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Asignar Voluntario
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingVolunteers ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  volunteers && volunteers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Asignado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {volunteers.map((volunteer) => (
                          <TableRow key={volunteer.id}>
                            <TableCell className="font-medium">{volunteer.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {volunteerRoleTranslations[volunteer.role] || volunteer.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                volunteer.status === "confirmado" ? "bg-green-100 text-green-800" :
                                volunteer.status === "ausente" ? "bg-red-100 text-red-800" :
                                volunteer.status === "completado" ? "bg-blue-100 text-blue-800" :
                                "bg-yellow-100 text-yellow-800"
                              }>
                                {volunteerStatusTranslations[volunteer.status] || volunteer.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(volunteer.assignedAt).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleEditVolunteer(volunteer)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar asignación</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDeleteVolunteer(volunteer.id)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Eliminar asignación</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-6">
                      <UserX className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-lg font-medium">Sin voluntarios asignados</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        No hay voluntarios asignados a este evento. Asigna voluntarios para comenzar.
                      </p>
                      {(!availableVolunteers || availableVolunteers.length === 0) && (
                        <p className="mt-4 text-sm text-amber-600">
                          No hay voluntarios disponibles en el sistema. Primero debes registrar voluntarios.
                        </p>
                      )}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo para registrar participante */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar nuevo participante</DialogTitle>
            <DialogDescription>
              Complete el formulario para registrar un nuevo participante en el evento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={registerForm.notes}
                  onChange={(e) => setRegisterForm({ ...registerForm, notes: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={registerParticipant.isPending}>
                {registerParticipant.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar participante"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para asignar o editar recurso */}
      <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditingResource ? "Editar recurso" : "Asignar nuevo recurso"}</DialogTitle>
            <DialogDescription>
              {isEditingResource 
                ? "Actualice la información del recurso asignado al evento." 
                : "Complete el formulario para asignar un nuevo recurso al evento."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResourceSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resourceType" className="text-right">
                  Tipo
                </Label>
                <Select 
                  value={resourceForm.resourceType}
                  onValueChange={(value) => setResourceForm({ ...resourceForm, resourceType: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="espacio">Espacio</SelectItem>
                    <SelectItem value="equipamiento">Equipamiento</SelectItem>
                    <SelectItem value="servicio">Servicio</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resourceName" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="resourceName"
                  value={resourceForm.resourceName}
                  onChange={(e) => setResourceForm({ ...resourceForm, resourceName: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Cantidad
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={resourceForm.quantity}
                  onChange={(e) => setResourceForm({ ...resourceForm, quantity: parseInt(e.target.value) || 1 })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={resourceForm.notes}
                  onChange={(e) => setResourceForm({ ...resourceForm, notes: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsResourceDialogOpen(false);
                  setIsEditingResource(false);
                  setCurrentResourceId(null);
                  setResourceForm({
                    resourceType: "espacio",
                    resourceName: "",
                    quantity: 1,
                    notes: "",
                  });
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={assignResource.isPending || updateResource.isPending}
              >
                {(assignResource.isPending || updateResource.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditingResource ? "Actualizando..." : "Asignando..."}
                  </>
                ) : (
                  isEditingResource ? "Actualizar recurso" : "Asignar recurso"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para agregar o editar evaluación */}
      <Dialog open={isEvaluationDialogOpen} onOpenChange={setIsEvaluationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditingEvaluation ? "Editar evaluación" : "Agregar evaluación"}</DialogTitle>
            <DialogDescription>
              {isEditingEvaluation 
                ? "Actualice la información de la evaluación del evento." 
                : "Complete el formulario para agregar una nueva evaluación del evento."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEvaluationSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="evaluationType" className="text-right">
                  Tipo
                </Label>
                <Select 
                  value={evaluationForm.evaluationType}
                  onValueChange={(value) => setEvaluationForm({...evaluationForm, evaluationType: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="satisfaccion">Satisfacción del público</SelectItem>
                    <SelectItem value="organizacion">Organización</SelectItem>
                    <SelectItem value="impacto">Impacto</SelectItem>
                    <SelectItem value="logistica">Logística</SelectItem>
                    <SelectItem value="participacion">Participación</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="score" className="text-right">
                  Puntuación
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Button
                        key={i}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="p-0 h-8 w-8"
                        onClick={() => setEvaluationForm({
                          ...evaluationForm,
                          score: i + 1
                        })}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            i < evaluationForm.score
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      </Button>
                    ))}
                  </div>
                  <span className="ml-2 text-sm font-medium">{evaluationForm.score}/5</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comments" className="text-right">
                  Comentarios
                </Label>
                <Textarea
                  id="comments"
                  value={evaluationForm.comments}
                  onChange={(e) => setEvaluationForm({...evaluationForm, comments: e.target.value})}
                  className="col-span-3"
                  placeholder="Comentarios adicionales sobre la evaluación"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEvaluationDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createEvaluation.isPending || updateEvaluation.isPending}>
                {createEvaluation.isPending || updateEvaluation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para asignar o editar voluntario */}
      <Dialog open={isVolunteerDialogOpen} onOpenChange={setIsVolunteerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditingVolunteer ? "Editar asignación" : "Asignar voluntario"}</DialogTitle>
            <DialogDescription>
              {isEditingVolunteer 
                ? "Actualice la información de la asignación del voluntario." 
                : "Complete el formulario para asignar un voluntario al evento."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVolunteerSubmit}>
            <div className="grid gap-4 py-4">
              {!isEditingVolunteer && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="volunteerId" className="text-right">
                    Voluntario
                  </Label>
                  <Select 
                    value={volunteerForm.volunteerId.toString()} 
                    onValueChange={(value) => setVolunteerForm({...volunteerForm, volunteerId: parseInt(value)})}
                    disabled={isEditingVolunteer}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar voluntario" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVolunteers?.map((volunteer) => (
                        <SelectItem key={volunteer.id} value={volunteer.id.toString()}>
                          {volunteer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rol
                </Label>
                <Select 
                  value={volunteerForm.role}
                  onValueChange={(value) => setVolunteerForm({...volunteerForm, role: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coordinador">Coordinador</SelectItem>
                    <SelectItem value="asistente">Asistente</SelectItem>
                    <SelectItem value="logistica">Logística</SelectItem>
                    <SelectItem value="guia">Guía/Orientador</SelectItem>
                    <SelectItem value="fotografo">Fotógrafo</SelectItem>
                    <SelectItem value="seguridad">Seguridad</SelectItem>
                    <SelectItem value="primeros_auxilios">Primeros Auxilios</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={volunteerForm.notes}
                  onChange={(e) => setVolunteerForm({...volunteerForm, notes: e.target.value})}
                  className="col-span-3"
                  placeholder="Notas adicionales sobre la asignación"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsVolunteerDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={assignVolunteer.isPending || updateVolunteerAssignment.isPending}>
                {assignVolunteer.isPending || updateVolunteerAssignment.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default EventDetailPage;