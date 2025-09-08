import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Calendar, MapPin, Users, DollarSign, Star, Clock } from 'lucide-react';
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
  sponsor?: {
    name: string;
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

  const filteredEvents = sponsorEvents.filter((event: SponsorEvent) => {
    const matchesSearch = event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.sponsor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.eventLocation?.toLowerCase().includes(searchTerm.toLowerCase());
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
      contract.sponsorId.toString() === sponsorId && contract.status === 'active'
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Eventos Patrocinados" />

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

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Evento
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
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.map((event: SponsorEvent) => (
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
          ))}
        </div>

        {filteredEvents.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                {searchTerm || filterLevel || filterStatus 
                  ? 'No se encontraron eventos patrocinados que coincidan con los filtros.'
                  : 'No hay eventos patrocinados registrados aún.'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}