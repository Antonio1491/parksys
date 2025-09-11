import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Gift, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/ui/page-header';

interface SponsorshipBenefit {
  id: number;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "marketing", label: "Marketing", icon: "📢" },
  { value: "visibility", label: "Visibilidad", icon: "👁️" },
  { value: "branding", label: "Branding", icon: "🎨" },
  { value: "networking", label: "Networking", icon: "🤝" },
  { value: "digital", label: "Digital", icon: "💻" },
  { value: "eventos", label: "Eventos", icon: "🎉" },
  { value: "otros", label: "Otros", icon: "🔗" }
];

const SponsorshipBenefitsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<SponsorshipBenefit | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isActive: true
  });

  const { data: benefits = [], isLoading } = useQuery<SponsorshipBenefit[]>({
    queryKey: ['/api/sponsorship-benefits'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sponsorship-benefits', {
      method: 'POST',
      data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-benefits'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Beneficio creado",
        description: "El beneficio ha sido creado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el beneficio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/sponsorship-benefits/${id}`, {
        method: 'PUT',
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-benefits'] });
      setEditingBenefit(null);
      resetForm();
      toast({
        title: "Beneficio actualizado",
        description: "El beneficio ha sido actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el beneficio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sponsorship-benefits/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-benefits'] });
      toast({
        title: "Beneficio eliminado",
        description: "El beneficio ha sido eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el beneficio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del beneficio es obligatorio.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Error",
        description: "La categoría es obligatoria.",
        variant: "destructive",
      });
      return;
    }

    if (editingBenefit) {
      updateMutation.mutate({ id: editingBenefit.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (benefit: SponsorshipBenefit) => {
    setEditingBenefit(benefit);
    setFormData({
      name: benefit.name,
      description: benefit.description || '',
      category: benefit.category || '',
      isActive: benefit.isActive
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este beneficio?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredBenefits = benefits.filter(benefit => {
    const matchesSearch = benefit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         benefit.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '';
    const matchesCategory = categoryFilter === 'all' || benefit.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && benefit.isActive) ||
                         (statusFilter === 'inactive' && !benefit.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryInfo = (category: string) => {
    const categoryInfo = CATEGORIES.find(cat => cat.value === category);
    return categoryInfo || { value: category, label: category, icon: "🔗" };
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Beneficios de Patrocinio"
        description="Gestiona los beneficios disponibles para los paquetes de patrocinio"
        actions={[
          <Dialog key="create" open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-nuevo-beneficio">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Beneficio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Beneficio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre del Beneficio</Label>
                  <Input
                    id="name"
                    data-testid="input-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Logo en página web principal"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    data-testid="textarea-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe en detalle este beneficio..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    data-testid="switch-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Beneficio activo</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" data-testid="button-save" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="button-cancel"
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ]}
      />

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
            <Input
              placeholder="Buscar beneficios..."
              data-testid="input-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger data-testid="select-filter-category">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="select-filter-status">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            data-testid="button-clear-filters"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      {/* Lista de beneficios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <p>Cargando beneficios...</p>
          </div>
        ) : filteredBenefits.length === 0 ? (
          <div className="p-8 text-center">
            <Gift className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No se encontraron beneficios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beneficio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBenefits.map((benefit) => {
                  const categoryInfo = getCategoryInfo(benefit.category);
                  return (
                    <tr key={benefit.id} data-testid={`row-benefit-${benefit.id}`}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900" data-testid={`text-name-${benefit.id}`}>
                            {benefit.name}
                          </div>
                          {benefit.description && (
                            <div className="text-sm text-gray-500 mt-1" data-testid={`text-description-${benefit.id}`}>
                              {benefit.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {categoryInfo.icon} {categoryInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          benefit.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {benefit.isActive ? '● Activo' : '○ Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500" data-testid={`text-date-${benefit.id}`}>
                        {new Date(benefit.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-${benefit.id}`}
                          onClick={() => handleEdit(benefit)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-${benefit.id}`}
                          onClick={() => handleDelete(benefit.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog de edición */}
      <Dialog open={!!editingBenefit} onOpenChange={(open) => !open && setEditingBenefit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Beneficio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre del Beneficio</Label>
              <Input
                id="edit-name"
                data-testid="input-edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Logo en página web principal"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Categoría</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger data-testid="select-edit-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                data-testid="textarea-edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe en detalle este beneficio..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                data-testid="switch-edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Beneficio activo</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" data-testid="button-update" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                data-testid="button-cancel-edit"
                onClick={() => {
                  setEditingBenefit(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default SponsorshipBenefitsPage;