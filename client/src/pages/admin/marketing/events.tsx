import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Calendar, MapPin, Users, DollarSign, Star, Clock, Link, Unlink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/ui/page-header';
import { format } from 'date-fns';

interface SponsorEvent {
  id: number;
  sponsorId: number;
  contractId?: number;
  eventName: string;
  eventDate: string;
  eventLocation?: string;
  sponsorshipLevel: string;
  logoPlacement?: string;
  exposureMinutes?: number;
  standSize?: string;
  activationBudget?: string;
  specialRequirements?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  sponsor?: {
    name: string;
    category: string;
    tier: number;
  };
  contract?: {
    id: number;
    status: string;
  };
}

interface Sponsor {
  id: number;
  name: string;
  category: string;
  tier: number;
}

interface Contract {
  id: number;
  sponsorId: number;
  status: string;
  number?: string;
  sponsor?: {
    name: string;
  };
}

interface Event {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  status: string;
}

interface LinkedEvent {
  id: number;
  contractId: number;
  eventId: number;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  event: {
    id: number;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    location?: string;
  };
  contract: {
    id: number;
    number?: string;
    sponsorName?: string;
  };
}

const levelColors = {
  principal: 'bg-blue-100 text-blue-800',
  secundario: 'bg-green-100 text-green-800',
  colaborador: 'bg-orange-100 text-orange-800'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado'
};

export default function SponsoredEventsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SponsorEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkFormData, setLinkFormData] = useState({
    contractId: '',
    eventId: '',
    visibility: 'public'
  });
  const [formData, setFormData] = useState({
    sponsorId: '',
    contractId: 'none',
    eventName: '',
    eventDate: '',
    eventLocation: '',
    sponsorshipLevel: 'colaborador',
    logoPlacement: '',
    exposureMinutes: '',
    standSize: '',
    activationBudget: '',
    specialRequirements: '',
    status: 'pending'
  });

  // Fetch sponsor events
  const { data: sponsorEvents = [], isLoading } = useQuery({
    queryKey: ['/api/sponsor-events'],
    queryFn: () => apiRequest('/api/sponsor-events').then(res => res.data || [])
  });

  // Fetch sponsors
  const { data: sponsors = [] } = useQuery({
    queryKey: ['/api/sponsors'],
    queryFn: () => apiRequest('/api/sponsors').then(res => res.data || [])
  });

  // Fetch contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ['/api/sponsorship-contracts'],
    queryFn: () => apiRequest('/api/sponsorship-contracts').then(res => res.data || [])
  });

  // Fetch existing events
  const { data: availableEvents = [] } = useQuery({
    queryKey: ['/api/events'],
    queryFn: () => apiRequest('/api/events').then(res => res.data || [])
  });

  // Fetch linked events
  const { data: linkedEvents = [], isLoading: isLoadingLinked } = useQuery({
    queryKey: ['/api/sponsorship-events-links'],
    queryFn: () => apiRequest('/api/sponsorship-events-links').then(res => res.data || [])
  });

  // Create sponsor event mutation
  const createEventMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sponsor-events', {
      method: 'POST',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Evento patrocinado creado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsor-events'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al crear evento patrocinado',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update sponsor event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest(`/api/sponsor-events/${id}`, {
      method: 'PUT',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Evento patrocinado actualizado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsor-events'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al actualizar evento patrocinado',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete sponsor event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sponsor-events/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: 'Evento patrocinado eliminado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsor-events'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al eliminar evento patrocinado',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Link event with contract mutation
  const linkEventMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sponsorship-events-links', {
      method: 'POST',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Evento vinculado exitosamente con el contrato' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-events-links'] });
      setIsLinkDialogOpen(false);
      resetLinkForm();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.status === 409 
        ? 'Este evento ya está vinculado con este contrato' 
        : error.response?.data?.error || error.message || 'Error al vincular evento';
      
      toast({ 
        title: 'Error al vincular evento',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // Unlink event mutation
  const unlinkEventMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sponsorship-events-links/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: 'Evento desvinculado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-events-links'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al desvincular evento',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const filteredEvents = sponsorEvents.filter((event: SponsorEvent) => {
    const matchesSearch = (event.eventName && event.eventName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (event.sponsor?.name && event.sponsor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (event.eventLocation && event.eventLocation.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = !filterLevel || filterLevel === 'all' || event.sponsorshipLevel === filterLevel;
    const matchesStatus = !filterStatus || filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      sponsorId: '',
      contractId: 'none',
      eventName: '',
      eventDate: '',
      eventLocation: '',
      sponsorshipLevel: 'colaborador',
      logoPlacement: '',
      exposureMinutes: '',
      standSize: '',
      activationBudget: '',
      specialRequirements: '',
      status: 'pending'
    });
    setSelectedEvent(null);
  };

  const resetLinkForm = () => {
    setLinkFormData({
      contractId: '',
      eventId: '',
      visibility: 'public'
    });
  };

  const handleEdit = (event: SponsorEvent) => {
    setSelectedEvent(event);
    setFormData({
      sponsorId: event.sponsorId?.toString() || '',
      contractId: event.contractId ? event.contractId.toString() : 'none',
      eventName: event.eventName || '',
      eventDate: event.eventDate ? format(new Date(event.eventDate), 'yyyy-MM-dd') : '',
      eventLocation: event.eventLocation || '',
      sponsorshipLevel: event.sponsorshipLevel || 'colaborador',
      logoPlacement: event.logoPlacement || '',
      exposureMinutes: event.exposureMinutes?.toString() || '',
      standSize: event.standSize || '',
      activationBudget: event.activationBudget || '',
      specialRequirements: event.specialRequirements || '',
      status: event.status || 'pending'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      sponsorId: parseInt(formData.sponsorId),
      contractId: formData.contractId && formData.contractId !== 'none' ? parseInt(formData.contractId) : null,
      exposureMinutes: formData.exposureMinutes ? parseInt(formData.exposureMinutes) : null
    };
    
    if (selectedEvent) {
      updateEventMutation.mutate({ id: selectedEvent.id, data: payload });
    } else {
      createEventMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este evento patrocinado?')) {
      deleteEventMutation.mutate(id);
    }
  };

  const getAvailableContracts = (sponsorId: string) => {
    return contracts.filter((contract: Contract) => 
      contract.sponsorId && 
      contract.sponsorId.toString() === sponsorId && 
      contract.status === 'active'
    );
  };

  const getActiveContracts = () => {
    return contracts.filter((contract: Contract) => 
      contract && contract.status === 'active'
    );
  };

  const getUnlinkedEvents = () => {
    // Get already linked pairs for the selected contract
    const selectedContractId = parseInt(linkFormData.contractId);
    if (!selectedContractId) {
      return availableEvents.filter((event: Event) => event.status === 'published');
    }
    
    const linkedEventIdsForContract = linkedEvents
      .filter((link: LinkedEvent) => link.contractId === selectedContractId)
      .map((link: LinkedEvent) => link.eventId);
    
    // Return events that are not already linked to THIS specific contract
    return availableEvents.filter((event: Event) => 
      !linkedEventIdsForContract.includes(event.id) && event.status === 'published'
    );
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      contractId: parseInt(linkFormData.contractId),
      eventId: parseInt(linkFormData.eventId),
      visibility: linkFormData.visibility
    };
    
    linkEventMutation.mutate(payload);
  };

  const handleUnlink = (id: number) => {
    if (confirm('¿Estás seguro de que deseas desvincular este evento del contrato?')) {
      unlinkEventMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Eventos"
          subtitle='Gestión de eventos patrocinados y sus detalles'
          icon={<Calendar />}
          actions={[
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={resetLinkForm} data-testid="button-link-event">
                  <Link className="mr-2 h-4 w-4" />
                  Vincular Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Vincular Evento Existente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleLinkSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="contractId">Contrato de Patrocinio *</Label>
                    <Select 
                      value={linkFormData.contractId} 
                      onValueChange={(value) => setLinkFormData({ ...linkFormData, contractId: value })}
                      data-testid="select-contract"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar contrato" />
                      </SelectTrigger>
                      <SelectContent>
                        {getActiveContracts().map((contract: Contract) => (
                          <SelectItem key={contract.id} value={contract.id.toString()}>
                            Contrato #{contract.number || contract.id} - {contract.sponsor?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="eventId">Evento *</Label>
                    <Select 
                      value={linkFormData.eventId} 
                      onValueChange={(value) => setLinkFormData({ ...linkFormData, eventId: value })}
                      data-testid="select-event"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {getUnlinkedEvents().map((event: Event) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            {event.title} - {event.startDate ? format(new Date(event.startDate), 'dd/MM/yyyy') : 'Sin fecha'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="visibility">Visibilidad del Patrocinio</Label>
                    <Select 
                      value={linkFormData.visibility} 
                      onValueChange={(value) => setLinkFormData({ ...linkFormData, visibility: value })}
                      data-testid="select-visibility"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Público</SelectItem>
                        <SelectItem value="private">Privado</SelectItem>
                        <SelectItem value="featured">Destacado</SelectItem>
                        <SelectItem value="banner">Banner Principal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={linkEventMutation.isPending} data-testid="button-submit-link">
                      {linkEventMutation.isPending ? 'Vinculando...' : 'Vincular'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>,
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                     <DialogTrigger asChild>
                       <Button 
                         variant="primary"
                         onClick={resetForm}
                         data-testid="button-new-sponsor-event">
                         <Plus className="mr-2 stroke-[4]" />
                         Nuevo Evento Patrocinado
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                       <DialogHeader>
                         <DialogTitle>
                           {selectedEvent ? 'Editar Evento Patrocinado' : 'Nuevo Evento Patrocinado'}
                         </DialogTitle>
                       </DialogHeader>
                       <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                             <Label htmlFor="sponsorId">Patrocinador *</Label>
                             <Select value={formData.sponsorId} onValueChange={(value) => setFormData({ ...formData, sponsorId: value, contractId: '' })}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Seleccionar patrocinador" />
                               </SelectTrigger>
                               <SelectContent>
                                 {sponsors.map((sponsor: Sponsor) => (
                                   <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                                     {sponsor.name} (Tier {sponsor.tier})
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>
                           <div>
                             <Label htmlFor="contractId">Contrato</Label>
                             <Select value={formData.contractId} onValueChange={(value) => setFormData({ ...formData, contractId: value })}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Seleccionar contrato (opcional)" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="none">Sin contrato específico</SelectItem>
                                 {getAvailableContracts(formData.sponsorId).map((contract: Contract) => (
                                   <SelectItem key={contract.id} value={contract.id.toString()}>
                                     Contrato #{contract.id} - {contract.sponsor?.name}
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>
                           <div>
                             <Label htmlFor="eventName">Nombre del Evento *</Label>
                             <Input
                               id="eventName"
                               value={formData.eventName}
                               onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                               required
                             />
                           </div>
                           <div>
                             <Label htmlFor="eventDate">Fecha del Evento *</Label>
                             <Input
                               id="eventDate"
                               type="date"
                               value={formData.eventDate}
                               onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                               required
                             />
                           </div>
                           <div>
                             <Label htmlFor="eventLocation">Ubicación</Label>
                             <Input
                               id="eventLocation"
                               value={formData.eventLocation}
                               onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                               placeholder="Parque, ciudad..."
                             />
                           </div>
                           <div>
                             <Label htmlFor="sponsorshipLevel">Nivel de Patrocinio</Label>
                             <Select value={formData.sponsorshipLevel} onValueChange={(value) => setFormData({ ...formData, sponsorshipLevel: value })}>
                               <SelectTrigger>
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="principal">Principal</SelectItem>
                                 <SelectItem value="secundario">Secundario</SelectItem>
                                 <SelectItem value="colaborador">Colaborador</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <div>
                             <Label htmlFor="logoPlacement">Colocación del Logo</Label>
                             <Select value={formData.logoPlacement} onValueChange={(value) => setFormData({ ...formData, logoPlacement: value })}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Seleccionar colocación" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="primary">Principal</SelectItem>
                                 <SelectItem value="secondary">Secundario</SelectItem>
                                 <SelectItem value="footer">Pie de página</SelectItem>
                                 <SelectItem value="banner">Banner</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <div>
                             <Label htmlFor="exposureMinutes">Minutos de Exposición</Label>
                             <Input
                               id="exposureMinutes"
                               type="number"
                               value={formData.exposureMinutes}
                               onChange={(e) => setFormData({ ...formData, exposureMinutes: e.target.value })}
                               placeholder="0"
                             />
                           </div>
                           <div>
                             <Label htmlFor="standSize">Tamaño del Stand</Label>
                             <Select value={formData.standSize} onValueChange={(value) => setFormData({ ...formData, standSize: value })}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Seleccionar tamaño" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="premium">Premium</SelectItem>
                                 <SelectItem value="standard">Estándar</SelectItem>
                                 <SelectItem value="small">Pequeño</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <div>
                             <Label htmlFor="activationBudget">Presupuesto de Activación</Label>
                             <Input
                               id="activationBudget"
                               value={formData.activationBudget}
                               onChange={(e) => setFormData({ ...formData, activationBudget: e.target.value })}
                               placeholder="$0.00"
                             />
                           </div>
                           <div>
                             <Label htmlFor="status">Estado</Label>
                             <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                               <SelectTrigger>
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="pending">Pendiente</SelectItem>
                                 <SelectItem value="confirmed">Confirmado</SelectItem>
                                 <SelectItem value="completed">Completado</SelectItem>
                                 <SelectItem value="cancelled">Cancelado</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                         </div>

                         <div>
                           <Label htmlFor="specialRequirements">Requerimientos Especiales</Label>
                           <Textarea
                             id="specialRequirements"
                             value={formData.specialRequirements}
                             onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                             rows={3}
                             placeholder="Requerimientos específicos del evento..."
                           />
                         </div>

                         <div className="flex justify-end gap-2 pt-4">
                           <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                             Cancelar
                           </Button>
                           <Button type="submit" disabled={createEventMutation.isPending || updateEventMutation.isPending}>
                             {createEventMutation.isPending || updateEventMutation.isPending ? 'Guardando...' : 'Guardar'}
                           </Button>
                         </div>
                       </form>
                     </DialogContent>
                   </Dialog>
                   ]}
          />

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Buscar eventos</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Buscar por evento, patrocinador o ubicación..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Label>Nivel de Patrocinio</Label>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los niveles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="secundario">Secundario</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Label>Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              
            </div>
          </CardContent>
        </Card>

        {/* Linked Events Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Eventos Vinculados con Contratos
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Eventos existentes vinculados con contratos de patrocinio
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingLinked ? (
              <div className="flex justify-center py-8">
                <div className="text-sm text-gray-500">Cargando eventos vinculados...</div>
              </div>
            ) : linkedEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay eventos vinculados con contratos</p>
                <p className="text-sm text-gray-400 mt-1">
                  Usa el botón "Vincular Evento" para conectar eventos existentes con contratos de patrocinio
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedEvents.map((linkedEvent: LinkedEvent) => (
                  <div key={linkedEvent.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50" data-testid={`linked-event-${linkedEvent.id}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {linkedEvent.event.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            {linkedEvent.event.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(linkedEvent.event.startDate), 'dd/MM/yyyy')}
                              </span>
                            )}
                            {linkedEvent.event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {linkedEvent.event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {linkedEvent.contract.sponsorName}
                          </div>
                          <div className="text-xs text-gray-500">
                            Contrato #{linkedEvent.contract.number || linkedEvent.contract.id}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`${
                              linkedEvent.visibility === 'public' ? 'bg-green-100 text-green-800' :
                              linkedEvent.visibility === 'private' ? 'bg-gray-100 text-gray-800' :
                              linkedEvent.visibility === 'featured' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {linkedEvent.visibility === 'public' ? 'Público' :
                             linkedEvent.visibility === 'private' ? 'Privado' :
                             linkedEvent.visibility === 'featured' ? 'Destacado' : 'Banner'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlink(linkedEvent.id)}
                      className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`button-unlink-${linkedEvent.id}`}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sponsor Events List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Eventos Patrocinados Personalizados
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Eventos creados específicamente para patrocinadores
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="text-sm text-gray-500">Cargando eventos patrocinados...</div>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay eventos patrocinados personalizados</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Crea nuevos eventos personalizados para patrocinadores específicos
                  </p>
                </div>
              ) : (
                filteredEvents.map((event: SponsorEvent) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {event.eventName}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={statusColors[event.status as keyof typeof statusColors]}>
                        {statusLabels[event.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge className={levelColors[event.sponsorshipLevel as keyof typeof levelColors]}>
                        {event.sponsorshipLevel.charAt(0).toUpperCase() + event.sponsorshipLevel.slice(1)}
                      </Badge>
                      {event.sponsor && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Tier {event.sponsor.tier}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Patrocinador</h4>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{event.sponsor?.name}</div>
                      <div className="text-gray-600">{event.sponsor?.category}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Fecha y Ubicación
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>{format(new Date(event.eventDate), 'dd/MM/yyyy')}</div>
                      {event.eventLocation && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {event.eventLocation}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Exposición</h4>
                    <div className="space-y-1 text-sm">
                      {event.logoPlacement && (
                        <div>Logo: {event.logoPlacement}</div>
                      )}
                      {event.exposureMinutes && event.exposureMinutes > 0 && (
                        <div>{event.exposureMinutes} min</div>
                      )}
                      {event.standSize && (
                        <div>Stand: {event.standSize}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Presupuesto
                    </h4>
                    <div className="space-y-1 text-sm">
                      {event.activationBudget ? (
                        <div>{event.activationBudget}</div>
                      ) : (
                        <div className="text-gray-500">No especificado</div>
                      )}
                    </div>
                  </div>
                </div>

                {event.specialRequirements && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <h5 className="font-medium text-gray-900 mb-2">Requerimientos Especiales</h5>
                    <p className="text-sm text-gray-600">{event.specialRequirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}