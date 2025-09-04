/**
 * GESTOR COMPLETO DE VOLUNTARIOS PARA PARQUES - INTERFAZ DE DOS COLUMNAS
 * ====================================================================
 * 
 * Componente integral para gestión de voluntarios de parques
 * con funcionalidades de asignar y desasignar voluntarios
 * mediante una interfaz intuitiva de dos columnas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Users, Mail, Phone, Search, Filter, User } from 'lucide-react';

/**
 * INTERFACES PARA TIPADO TYPESCRIPT
 * ================================
 */

interface Volunteer {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  skills?: string;
  status: string;
  age?: number;
  gender?: string;
  availability?: string;
  experience?: string;
  interestAreas?: string;
  createdAt: string;
  preferredParkId?: number;
  profileImageUrl?: string;
}

interface ParkVolunteersManagerProps {
  parkId: number;
}

const statusTranslations: Record<string, string> = {
  'active': 'Activo',
  'inactive': 'Inactivo',
  'pending': 'Pendiente',
  'suspended': 'Suspendido'
};

export default function ParkVolunteersManager({ parkId }: ParkVolunteersManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Consulta para obtener voluntarios asignados al parque
  const { data: assignedVolunteers = [], isLoading: assignedLoading } = useQuery<Volunteer[]>({
    queryKey: [`/api/parks/${parkId}/volunteers`],
    queryFn: async () => {
      console.log('🔍 FRONTEND: Cargando voluntarios asignados para parque', parkId);
      const response = await fetch(`/api/parks/${parkId}/volunteers`, {
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error cargando voluntarios asignados');
      const data = await response.json();
      console.log('✅ FRONTEND: Voluntarios asignados cargados:', data);
      return data;
    },
    enabled: !!parkId
  });

  // Consulta para obtener todos los voluntarios disponibles
  const { data: allVolunteers = [], isLoading: allVolunteersLoading, error: allVolunteersError } = useQuery<Volunteer[]>({
    queryKey: ['/api/volunteers'],
    queryFn: async () => {
      console.log('🔍 FRONTEND: Cargando TODOS los voluntarios disponibles');
      const response = await fetch('/api/volunteers', {
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) {
        console.error('❌ FRONTEND: Error en respuesta de /api/volunteers:', response.status, response.statusText);
        throw new Error(`Error cargando voluntarios disponibles: ${response.status}`);
      }
      const data = await response.json();
      console.log('✅ FRONTEND: Todos los voluntarios cargados:', data.length, data);
      return data;
    }
  });

  // Filtrar voluntarios disponibles (excluir los ya asignados)
  const assignedIds = assignedVolunteers.map(v => v.id);
  const availableVolunteers = allVolunteers.filter(volunteer => 
    !assignedIds.includes(volunteer.id) && (volunteer.status === 'active' || volunteer.status === 'activo')
  );

  // Debug logs
  console.log('🔍 DEBUG: allVolunteers:', allVolunteers.length);
  console.log('🔍 DEBUG: assignedIds:', assignedIds);
  console.log('🔍 DEBUG: availableVolunteers:', availableVolunteers.length);
  console.log('🔍 DEBUG: allVolunteersLoading:', allVolunteersLoading);
  console.log('🔍 DEBUG: allVolunteersError:', allVolunteersError);

  // Aplicar filtros a voluntarios disponibles
  const filteredAvailableVolunteers = availableVolunteers.filter(volunteer => {
    const matchesSearch = searchTerm === '' || 
      volunteer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.skills?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || volunteer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Debug del filtro adicional
  console.log('🔍 DEBUG: searchTerm:', searchTerm);
  console.log('🔍 DEBUG: statusFilter:', statusFilter);
  console.log('🔍 DEBUG: filteredAvailableVolunteers:', filteredAvailableVolunteers.length);
  console.log('🔍 DEBUG: primer voluntario ejemplo:', filteredAvailableVolunteers[0]);

  // Mutación para asignar voluntario al parque
  const assignVolunteerMutation = useMutation({
    mutationFn: async (volunteerId: number) => {
      const response = await fetch(`/api/parks/${parkId}/volunteers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        },
        body: JSON.stringify({ volunteerId })
      });
      if (!response.ok) throw new Error('Error asignando voluntario');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/volunteers`] });
      queryClient.invalidateQueries({ queryKey: ['/api/volunteers'] });
      toast({
        title: "Voluntario asignado",
        description: "El voluntario ha sido asignado correctamente al parque",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al asignar voluntario al parque",
        variant: "destructive",
      });
    }
  });

  // Mutación para remover voluntario del parque
  const removeVolunteerMutation = useMutation({
    mutationFn: async (volunteerId: number) => {
      const response = await fetch(`/api/parks/${parkId}/volunteers/${volunteerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error removiendo voluntario');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/volunteers`] });
      queryClient.invalidateQueries({ queryKey: ['/api/volunteers'] });
      toast({
        title: "Voluntario removido",
        description: "El voluntario ha sido removido correctamente del parque",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al remover voluntario del parque",
        variant: "destructive",
      });
    }
  });

  const handleAssignVolunteer = (volunteerId: number) => {
    assignVolunteerMutation.mutate(volunteerId);
  };

  const handleRemoveVolunteer = (volunteerId: number) => {
    removeVolunteerMutation.mutate(volunteerId);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary",
      pending: "outline",
      suspended: "destructive"
    };
    return variants[status] || "secondary";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  console.log('🎯 RENDERIZANDO ParkVolunteersManager con:', filteredAvailableVolunteers.length, 'voluntarios');
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* COLUMNA IZQUIERDA: Voluntarios Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Voluntarios Disponibles ({filteredAvailableVolunteers.length})
          </CardTitle>
          
          {/* Filtros */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar voluntarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              <Filter className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredAvailableVolunteers.map((volunteer) => (
              <div key={volunteer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{volunteer.fullName}</h4>
                      <Badge variant={getStatusBadge(volunteer.status)}>
                        {statusTranslations[volunteer.status] || volunteer.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">{volunteer.email}</span>
                      </div>
                      
                      {volunteer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{volunteer.phone}</span>
                        </div>
                      )}
                      
                      {volunteer.skills && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-700">Habilidades:</span>
                          <span className="text-gray-600">{volunteer.skills}</span>
                        </div>
                      )}
                      
                      {volunteer.age && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{volunteer.age} años</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Registrado:</span>
                        <span className="text-gray-600">{formatDate(volunteer.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleAssignVolunteer(volunteer.id)}
                    disabled={assignVolunteerMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Asignar
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredAvailableVolunteers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-2">No hay voluntarios disponibles</p>
                <p className="text-sm">Todos los voluntarios activos ya están asignados a parques.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* COLUMNA DERECHA: Voluntarios Asignados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Voluntarios Asignados ({assignedVolunteers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {assignedVolunteers.map((volunteer) => (
              <div key={volunteer.id} className="border rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{volunteer.fullName}</h4>
                      <Badge variant={getStatusBadge(volunteer.status)}>
                        {statusTranslations[volunteer.status] || volunteer.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">{volunteer.email}</span>
                      </div>
                      
                      {volunteer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{volunteer.phone}</span>
                        </div>
                      )}
                      
                      {volunteer.skills && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-700">Habilidades:</span>
                          <span className="text-gray-600">{volunteer.skills}</span>
                        </div>
                      )}
                      
                      {volunteer.interestAreas && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-700">Intereses:</span>
                          <span className="text-gray-600">{volunteer.interestAreas}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveVolunteer(volunteer.id)}
                    disabled={removeVolunteerMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </div>
            ))}
            
            {assignedVolunteers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-2">No hay voluntarios asignados</p>
                <p className="text-sm">Selecciona voluntarios de la columna izquierda para asignarlos a este parque.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}