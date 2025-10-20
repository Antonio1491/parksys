import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { TreePine, Plus, Edit, Trash2, Leaf, Search, AlertTriangle } from 'lucide-react';
import TreeSpeciesIcon from '@/components/ui/tree-species-icon';

interface TreeSpecies {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  origin: string;
  growthRate: string;
  description: string;
  iconType?: string;
  customIconUrl?: string;
  isEndangered: boolean;
}

interface ParkTreeSpecies {
  id: number;
  parkId: number;
  speciesId: number;
  recommendedQuantity?: number;
  currentQuantity: number;
  plantingZone?: string;
  notes?: string;
  status: string;
  // Datos de la especie
  commonName: string;
  scientificName: string;
  family: string;
  origin: string;
  iconType?: string;
  customIconUrl?: string;
  isEndangered: boolean;
}

interface ParkTreeSpeciesManagerProps {
  parkId: number;
}

const assignmentSchema = z.object({
  speciesId: z.number().min(1, 'Debe seleccionar una especie'),
  recommendedQuantity: z.number().min(1, 'Cantidad debe ser mayor a 0').optional(),
  currentQuantity: z.number().min(0, 'Cantidad actual no puede ser negativa').default(0),
  plantingZone: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default('planificado'),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export default function ParkTreeSpeciesManager({ parkId }: ParkTreeSpeciesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<TreeSpecies | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ParkTreeSpecies | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para especies asignadas al parque
  const { data: assignedSpecies, isLoading: assignedLoading, error: assignedError } = useQuery({
    queryKey: [`/api/parks/${parkId}/tree-species`],
    queryFn: async () => {
      const response = await fetch(`/api/parks/${parkId}/tree-species`);
      if (!response.ok) throw new Error('Error al cargar especies asignadas');
      return response.json();
    },
  });

  // Query para todas las especies disponibles
  const { data: availableSpeciesData, isLoading: availableLoading } = useQuery({
    queryKey: ['/api/tree-species', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(searchTerm && { search: searchTerm })
      });
      const response = await fetch(`/api/tree-species?${params}`);
      if (!response.ok) throw new Error('Error al cargar especies disponibles');
      return response.json();
    },
  });

  // Filtrar especies disponibles (que no estén ya asignadas)
  const assignedSpeciesIds = assignedSpecies?.map((ps: ParkTreeSpecies) => ps.speciesId) || [];
  const availableSpecies = availableSpeciesData?.data?.filter(
    (species: TreeSpecies) => !assignedSpeciesIds.includes(species.id)
  ) || [];

  // Formulario para asignar especies
  const assignForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      currentQuantity: 0,
      status: 'planificado',
    },
  });

  // Formulario para editar asignaciones
  const editForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
  });

  // Mutación para asignar especie al parque
  const assignSpeciesMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      return apiRequest(`/api/parks/${parkId}/tree-species`, {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/tree-species`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tree-species'] });
      setIsAssignDialogOpen(false);
      setSelectedSpecies(null);
      assignForm.reset();
      toast({
        title: 'Éxito',
        description: 'Especie asignada al parque correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al asignar la especie',
        variant: 'destructive',
      });
    },
  });

  // Mutación para editar asignación
  const editAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      return apiRequest(`/api/park-tree-species/${editingAssignment?.id}`, {
        method: 'PUT',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/tree-species`] });
      setIsEditDialogOpen(false);
      setEditingAssignment(null);
      editForm.reset();
      toast({
        title: 'Éxito',
        description: 'Asignación actualizada correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar la asignación',
        variant: 'destructive',
      });
    },
  });

  // Mutación para eliminar asignación
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return apiRequest(`/api/park-tree-species/${assignmentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/tree-species`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tree-species'] });
      toast({
        title: 'Éxito',
        description: 'Especie removida del parque correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al remover la especie',
        variant: 'destructive',
      });
    },
  });

  const handleSelectSpecies = (species: TreeSpecies) => {
    setSelectedSpecies(species);
    assignForm.setValue('speciesId', species.id);
    setIsAssignDialogOpen(true);
  };

  const handleEditAssignment = (assignment: ParkTreeSpecies) => {
    setEditingAssignment(assignment);
    editForm.reset({
      speciesId: assignment.speciesId,
      recommendedQuantity: assignment.recommendedQuantity || undefined,
      currentQuantity: assignment.currentQuantity,
      plantingZone: assignment.plantingZone || '',
      notes: assignment.notes || '',
      status: assignment.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleRemoveAssignment = (assignmentId: number) => {
    if (confirm('¿Está seguro de que desea remover esta especie del parque?')) {
      removeAssignmentMutation.mutate(assignmentId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planificado': return 'bg-yellow-100 text-yellow-800';
      case 'en_desarrollo': return 'bg-blue-100 text-blue-800';
      case 'establecido': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planificado': return 'Planificado';
      case 'en_desarrollo': return 'En Desarrollo';
      case 'establecido': return 'Establecido';
      default: return status;
    }
  };

  if (assignedLoading || availableLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (assignedError) {
    return (
      <div className="text-center py-8 text-red-600">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <p>Error al cargar las especies del parque</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
      {/* Columna izquierda: Especies disponibles */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 mb-4 text-gray-800">
            Disponibles ({availableSpecies.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar especies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-2">
              {availableSpecies.map((species: TreeSpecies) => (
                <div
                  key={species.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectSpecies(species)}
                >
                  <div className="flex items-center gap-3">
                    <TreeSpeciesIcon 
                      iconType={species.iconType}
                      customIconUrl={species.customIconUrl}
                      size={32}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{species.commonName}</h4>
                      <p className="text-sm text-gray-600 italic truncate">{species.scientificName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{species.family}</Badge>
                        <Badge variant={species.origin === 'Nativo' ? 'default' : 'secondary'} className="text-xs">
                          {species.origin}
                        </Badge>
                        {species.isEndangered && (
                          <Badge variant="destructive" className="text-xs">Amenazada</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                </div>
              ))}
              {availableSpecies.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <TreePine className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay especies disponibles</p>
                  {searchTerm && <p className="text-sm">Intenta con otros términos de búsqueda</p>}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Columna derecha: Especies asignadas */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            Asignadas ({assignedSpecies?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-2">
              {assignedSpecies?.map((assignment: ParkTreeSpecies) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <TreeSpeciesIcon 
                      iconType={assignment.iconType}
                      customIconUrl={assignment.customIconUrl}
                      size={32}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{assignment.commonName}</h4>
                      <p className="text-sm text-gray-600 italic truncate">{assignment.scientificName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(assignment.status)}>
                          {getStatusText(assignment.status)}
                        </Badge>
                        {assignment.currentQuantity > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {assignment.currentQuantity} plantados
                          </Badge>
                        )}
                        {assignment.recommendedQuantity && (
                          <Badge variant="secondary" className="text-xs">
                            Meta: {assignment.recommendedQuantity}
                          </Badge>
                        )}
                        {assignment.isEndangered && (
                          <Badge variant="destructive" className="text-xs">Amenazada</Badge>
                        )}
                      </div>
                      {assignment.plantingZone && (
                        <p className="text-xs text-gray-500 mt-1">Zona: {assignment.plantingZone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      className="text-gray-800 hover:text-gray-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!assignedSpecies || assignedSpecies.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <TreePine className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay especies asignadas a este parque</p>
                  <p className="text-sm">Selecciona especies de la columna izquierda</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog para asignar nueva especie */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Asignar Especie al Parque</DialogTitle>
            <DialogDescription>
              Configura los detalles de la asignación de {selectedSpecies?.commonName}
            </DialogDescription>
          </DialogHeader>
          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit((data) => assignSpeciesMutation.mutate(data))} className="space-y-4">
              <FormField
                control={assignForm.control}
                name="recommendedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Recomendada</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Cantidad objetivo a plantar"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignForm.control}
                name="currentQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Actual Plantada</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignForm.control}
                name="plantingZone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona de Plantación (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. Área norte, Sendero principal..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planificado">Planificado</SelectItem>
                        <SelectItem value="en_desarrollo">En Desarrollo</SelectItem>
                        <SelectItem value="establecido">Establecido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones sobre la plantación..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={assignSpeciesMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {assignSpeciesMutation.isPending ? 'Asignando...' : 'Asignar Especie'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar asignación */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Asignación de Especie</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la asignación de {editingAssignment?.commonName}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => editAssignmentMutation.mutate(data))} className="space-y-4">
              <FormField
                control={editForm.control}
                name="recommendedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Recomendada</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Cantidad objetivo a plantar"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="currentQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Actual Plantada</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="plantingZone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona de Plantación</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. Área norte, Sendero principal..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planificado">Planificado</SelectItem>
                        <SelectItem value="en_desarrollo">En Desarrollo</SelectItem>
                        <SelectItem value="establecido">Establecido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones sobre la plantación..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={editAssignmentMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {editAssignmentMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}