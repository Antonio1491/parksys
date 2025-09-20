import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';

interface CategoriaAmbu {
  id: number;
  nombre: string;
  descripcion?: string;
  tarifaBase: number;
  activa: boolean;
  createdAt: string;
}

interface CategoriaFormData {
  nombre: string;
  descripcion: string;
  tarifaBase: number;
  activa: boolean;
}

export default function CategoriasEventosAmbu() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaAmbu | null>(null);
  const [formData, setFormData] = useState<CategoriaFormData>({
    nombre: '',
    descripcion: '',
    tarifaBase: 0,
    activa: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener categorías
  const { data: categorias = [], isLoading, error } = useQuery({
    queryKey: ['/api/eventos-ambu/categorias'],
    queryFn: () => apiRequest('/api/eventos-ambu/categorias')
  });

  // Crear categoría
  const createMutation = useMutation({
    mutationFn: (data: CategoriaFormData) => 
      apiRequest('/api/eventos-ambu/categorias', {
        method: 'POST',
        data: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/eventos-ambu/categorias'] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado exitosamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear la categoría",
        variant: "destructive"
      });
    }
  });

  // Actualizar categoría
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoriaFormData }) =>
      apiRequest(`/api/eventos-ambu/categorias/${id}`, {
        method: 'PUT',
        data: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/eventos-ambu/categorias'] });
      setDialogOpen(false);
      resetForm();
      setEditingCategoria(null);
      toast({
        title: "Categoría actualizada",
        description: "La categoría se ha actualizado exitosamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la categoría",
        variant: "destructive"
      });
    }
  });

  // Eliminar categoría
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/eventos-ambu/categorias/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/eventos-ambu/categorias'] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría se ha eliminado exitosamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la categoría",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tarifaBase: 0,
      activa: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategoria) {
      updateMutation.mutate({ id: editingCategoria.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (categoria: CategoriaAmbu) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      tarifaBase: categoria.tarifaBase,
      activa: categoria.activa
    });
    setDialogOpen(true);
  };

  const handleDelete = (categoria: CategoriaAmbu) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`)) {
      deleteMutation.mutate(categoria.id);
    }
  };

  const openCreateDialog = () => {
    setEditingCategoria(null);
    resetForm();
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando categorías...</div>
      </div>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert className="max-w-md mx-auto mt-8">
          <AlertDescription>
            Error al cargar las categorías. Por favor, intenta nuevamente.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorías de Eventos AMBU</h1>
          <p className="text-gray-600 mt-2">
            Gestiona las categorías disponibles para eventos en parques urbanos
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-[#00a587] hover:bg-[#067f5f]">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
              <DialogDescription>
                {editingCategoria 
                  ? 'Modifica los datos de la categoría seleccionada.'
                  : 'Crea una nueva categoría para eventos AMBU.'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Categoría</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="ej. Fotografía Social"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción detallada de la categoría"
                />
              </div>


              <div>
                <Label htmlFor="tarifaBase">Tarifa Base (MXN)</Label>
                <Input
                  id="tarifaBase"
                  type="number"
                  value={formData.tarifaBase}
                  onChange={(e) => setFormData({ ...formData, tarifaBase: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={formData.activa}
                  onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                  className="rounded border-gray-300 text-[#00a587] focus:ring-[#00a587]"
                />
                <Label htmlFor="activa">Categoría activa</Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00a587] hover:bg-[#067f5f]"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingCategoria ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categorias.map((categoria: CategoriaAmbu) => (
          <Card key={categoria.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#00a587]" />
                  {categoria.nombre}
                </CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(categoria)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(categoria)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Badge variant={categoria.activa ? 'default' : 'secondary'}>
                  {categoria.activa ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {categoria.descripcion && (
                <CardDescription className="mb-3">
                  {categoria.descripcion}
                </CardDescription>
              )}
              
              <div className="text-2xl font-bold text-[#00a587]">
                ${categoria.tarifaBase.toFixed(2)} MXN
              </div>
              <div className="text-sm text-gray-500">Tarifa base</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categorias.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay categorías configuradas
            </h3>
            <p className="text-gray-500 mb-4">
              Comienza creando tu primera categoría de eventos AMBU.
            </p>
            <Button onClick={openCreateDialog} className="bg-[#00a587] hover:bg-[#067f5f]">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Categoría
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    </AdminLayout>
  );
}