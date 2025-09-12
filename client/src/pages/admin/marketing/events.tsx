import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Link, Unlink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/ui/page-header';
import { format } from 'date-fns';


interface Event {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  status: string;
}

interface Contract {
  id: number;
  number?: string;
  status: string;
  sponsor_name?: string;
}

interface LinkedEvent {
  id: number;
  contractId: number;
  eventId: number;
  visibility: 'public' | 'private' | 'featured' | 'banner';
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


export default function SponsoredEventsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkFormData, setLinkFormData] = useState({
    contractId: '',
    eventId: '',
    visibility: 'public'
  });


  // Fetch contracts for linking
  const { data: contracts = [], isLoading: isLoadingContracts, error: contractsError } = useQuery({
    queryKey: ['/api/sponsorship-contracts'],
    queryFn: () => {
      console.log('🔍 [DEBUG] Fetching contracts...');
      return apiRequest('/api/sponsorship-contracts').then(res => {
        console.log('✅ [DEBUG] Contracts full response:', res);
        console.log('✅ [DEBUG] Contracts response.data:', res.data);
        console.log('✅ [DEBUG] Contracts direct response:', res);
        return res || [];
      });
    }
  });

  // Fetch existing events
  const { data: availableEvents = [], isLoading: isLoadingEvents, error: eventsError } = useQuery({
    queryKey: ['/api/events'],
    queryFn: () => {
      console.log('🔍 [DEBUG] Fetching events...');
      return apiRequest('/api/events').then(res => {
        console.log('✅ [DEBUG] Events full response:', res);
        console.log('✅ [DEBUG] Events response.data:', res.data);
        console.log('✅ [DEBUG] Events direct response:', res);
        return res || [];
      });
    }
  });

  // Fetch linked events
  const { data: linkedEvents = [], isLoading: isLoadingLinked } = useQuery({
    queryKey: ['/api/sponsorship-events'],
    queryFn: () => apiRequest('/api/sponsorship-events').then(res => res.data || [])
  });


  // Link event with contract mutation
  const linkEventMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sponsorship-events', {
      method: 'POST',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Evento vinculado exitosamente con el contrato' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-events'] });
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
    mutationFn: (id: number) => apiRequest(`/api/sponsorship-events/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: 'Evento desvinculado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-events'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al desvincular evento',
        description: error.message,
        variant: 'destructive'
      });
    }
  });


  const resetLinkForm = () => {
    setLinkFormData({
      contractId: '',
      eventId: '',
      visibility: 'public'
    });
  };


  const getActiveContracts = (): Contract[] => {
    console.log('🔍 [DEBUG] getActiveContracts called. Total contracts:', contracts.length);
    console.log('🔍 [DEBUG] Contracts data:', contracts);
    const filtered = contracts.filter((contract: Contract) => 
      contract && (contract.status === 'active' || contract.status === 'en_negociacion')
    );
    console.log('✅ [DEBUG] Filtered active contracts:', filtered.length, filtered);
    return filtered;
  };

  const getUnlinkedEvents = (): Event[] => {
    console.log('🔍 [DEBUG] getUnlinkedEvents called. Total events:', availableEvents.length);
    console.log('🔍 [DEBUG] Events data:', availableEvents);
    
    // Get already linked pairs for the selected contract
    const selectedContractId = parseInt(linkFormData.contractId);
    if (!selectedContractId) {
      const publishedEvents = availableEvents.filter((event: Event) => event.status === 'published');
      console.log('✅ [DEBUG] Published events (no contract selected):', publishedEvents.length, publishedEvents);
      return publishedEvents;
    }
    
    const linkedEventIdsForContract = linkedEvents
      .filter((link: LinkedEvent) => link.contractId === selectedContractId)
      .map((link: LinkedEvent) => link.eventId);
    
    // Return events that are not already linked to THIS specific contract
    const unlinkedEvents = availableEvents.filter((event: Event) => 
      !linkedEventIdsForContract.includes(event.id) && event.status === 'published'
    );
    console.log('✅ [DEBUG] Unlinked events for contract', selectedContractId, ':', unlinkedEvents.length, unlinkedEvents);
    return unlinkedEvents;
  };

  // Validation helper
  const isFormValid = (): boolean => {
    return !!(linkFormData.contractId && linkFormData.eventId);
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
                            Contrato #{contract.number || contract.id} - {contract.sponsor_name}
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
                    <Button 
                      type="submit" 
                      disabled={linkEventMutation.isPending || !isFormValid()} 
                      data-testid="button-submit-link"
                    >
                      {linkEventMutation.isPending ? 'Vinculando...' : 'Vincular'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ]}
          />


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

      </div>
    </AdminLayout>
  );
}