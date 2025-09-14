import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Search, Plus, Eye, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Requisition, RequisitionItem, User, Park } from "@shared/schema";

export default function RequisitionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  const { data: requisitions, isLoading } = useQuery({
    queryKey: ['/api/warehouse/requisitions', { 
      search, 
      status: statusFilter,
      priority: priorityFilter
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      
      const response = await fetch(`/api/warehouse/requisitions?${params}`);
      if (!response.ok) throw new Error('Error al cargar requisiciones');
      return response.json();
    }
  });

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'pendiente': 'secondary',
      'aprobada': 'default',
      'en_proceso': 'outline',
      'completada': 'default',
      'rechazada': 'destructive'
    };
    return variants[status] || 'outline';
  };

  const getPriorityVariant = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'alta': 'destructive',
      'media': 'secondary',
      'baja': 'outline'
    };
    return variants[priority] || 'outline';
  };

  const formatStatus = (status: string) => {
    const statuses: Record<string, string> = {
      'pendiente': 'Pendiente',
      'aprobada': 'Aprobada',
      'en_proceso': 'En Proceso',
      'completada': 'Completada',
      'rechazada': 'Rechazada'
    };
    return statuses[status] || status;
  };

  const formatPriority = (priority: string) => {
    const priorities: Record<string, string> = {
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja'
    };
    return priorities[priority] || priority;
  };

  return (
    <div className="space-y-6" data-testid="requisitions-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requisiciones</h1>
          <p className="text-muted-foreground">Solicitudes de materiales y suministros</p>
        </div>
        <Button data-testid="button-add-requisition">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Requisición
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, solicitante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-requisitions"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
          data-testid="select-status-filter"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada</option>
          <option value="en_proceso">En Proceso</option>
          <option value="completada">Completada</option>
          <option value="rechazada">Rechazada</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
          data-testid="select-priority-filter"
        >
          <option value="">Todas las prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>

        <Button variant="outline" data-testid="button-export-requisitions">
          Exportar
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded animate-pulse"></div>
                  <div className="h-6 bg-muted rounded animate-pulse w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4" data-testid="requisitions-list">
          {requisitions?.map((requisition: Requisition & {
            requestedBy?: User;
            approvedBy?: User;
            destinationPark?: Park;
            items?: RequisitionItem[];
          }) => (
            <Card key={requisition.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {requisition.title}
                    </CardTitle>
                    <CardDescription className="font-mono text-sm">
                      REQ-{requisition.id.toString().padStart(6, '0')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getStatusVariant(requisition.status || 'draft')}>
                      {formatStatus(requisition.status || 'draft')}
                    </Badge>
                    {requisition.priority && (
                      <Badge variant={getPriorityVariant(requisition.priority)}>
                        {formatPriority(requisition.priority)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {requisition.description && (
                    <p className="text-sm text-muted-foreground">
                      {requisition.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Solicitante:</span>
                      <p className="font-medium">
                        {requisition.requestedBy?.fullName ?? 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Destino:</span>
                      <p className="font-medium">
                        {requisition.destinationPark?.name ?? 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Fecha necesaria:</span>
                      <p className="font-medium">
                        {requisition.requiredDate 
                          ? new Date(requisition.requiredDate.toString()).toLocaleDateString('es-MX')
                          : 'No especificada'
                        }
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Creada:</span>
                      <p className="font-medium">
                        {requisition.requestDate ? new Date(requisition.requestDate.toString()).toLocaleDateString('es-MX') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {requisition.items && requisition.items.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Artículos solicitados:</span>
                      <div className="mt-2 space-y-1">
                        {requisition.items.slice(0, 3).map((item: RequisitionItem, index: number) => (
                          <div key={index} className="text-sm bg-muted/50 rounded px-2 py-1">
                            <span className="font-medium">{item.requestedQuantity}</span>
                            <span className="text-muted-foreground"> unidades de </span>
                            <span>{item.consumableId}</span>
                          </div>
                        ))}
                        {requisition.items.length > 3 && (
                          <div className="text-sm text-muted-foreground">
                            +{requisition.items.length - 3} artículos más
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {requisition.approvedBy && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Aprobada por:</span>
                      <p className="font-medium">{requisition.approvedBy.fullName ?? 'N/A'}</p>
                      {requisition.approvalDate && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(requisition.approvalDate.toString()).toLocaleString('es-MX')}
                        </p>
                      )}
                    </div>
                  )}

                  {requisition.rejectionReason && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Motivo de rechazo:</span>
                      <p className="text-destructive">{requisition.rejectionReason}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" data-testid={`button-view-${requisition.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                    
                    {requisition.status === 'submitted' && (
                      <>
                        <Button variant="outline" size="sm" className="text-green-600" data-testid={`button-approve-${requisition.id}`}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600" data-testid={`button-reject-${requisition.id}`}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!requisitions || requisitions.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay requisiciones</h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter || priorityFilter
                ? "No se encontraron requisiciones con los filtros aplicados"
                : "Comienza creando tu primera requisición de materiales"
              }
            </p>
            <Button data-testid="button-add-first-requisition">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Requisición
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}