import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, PackagePlus, DollarSign, Calendar, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/ui/page-header';

interface SponsorshipPackage {
  id: number;
  name: string;
  category: string;
  level: number;
  price: string;
  duration: number;
  benefits: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categoryColors = {
  nivel1: 'bg-red-100 text-red-800',
  nivel2: 'bg-orange-100 text-orange-800',
  nivel3: 'bg-yellow-100 text-yellow-800',
  nivel4: 'bg-green-100 text-green-800',
  nivel5: 'bg-blue-100 text-blue-800',
  nivel6: 'bg-indigo-100 text-indigo-800',
  nivel7: 'bg-purple-100 text-purple-800',
  nivel8: 'bg-pink-100 text-pink-800',
  nivel9: 'bg-gray-100 text-gray-800',
  nivel10: 'bg-black text-white'
};

const categoryLabels = {
  nivel1: 'Cobre',
  nivel2: 'Bronce',
  nivel3: 'Plata',
  nivel4: 'Oro',
  nivel5: 'Platino',
  nivel6: 'Diamante',
  nivel7: 'Esmeralda',
  nivel8: 'Rubí',
  nivel9: 'Zafiro',
  nivel10: 'Elite'
};

const SponsorshipPackagesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SponsorshipPackage | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    level: 1,
    price: '',
    duration: 12,
    benefits: [''],
    isActive: true
  });

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['/api/sponsorship-packages'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sponsorship-packages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-packages'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Paquete creado",
        description: "El paquete de patrocinio ha sido creado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el paquete. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/sponsorship-packages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-packages'] });
      setEditingPackage(null);
      resetForm();
      toast({
        title: "Paquete actualizado",
        description: "El paquete ha sido actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sponsorship-packages/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-packages'] });
      toast({
        title: "Paquete eliminado",
        description: "El paquete ha sido eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el paquete. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      level: 1,
      price: '',
      duration: 12,
      benefits: [''],
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
      price: parseFloat(formData.price)
    };

    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (packageItem: SponsorshipPackage) => {
    setEditingPackage(packageItem);
    setFormData({
      name: packageItem.name,
      category: packageItem.category,
      level: packageItem.level,
      price: packageItem.price,
      duration: packageItem.duration,
      benefits: packageItem.benefits.length > 0 ? packageItem.benefits : [''],
      isActive: packageItem.isActive
    });
  };

  const addBenefit = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) => i === index ? value : benefit)
    }));
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const filteredPackages = packages.filter((packageItem: SponsorshipPackage) => {
    const matchesSearch = packageItem.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || packageItem.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Paquetes"
        subtitle="Gestión de membresías y paquetes de beneficios"
        icon={<PackagePlus className="h-6 w-6" />}
        actions={[
          <Dialog 
            key="create-dialog"
            open={showCreateDialog || !!editingPackage} 
            onOpenChange={(open) => {
              if (!open) {
                setShowCreateDialog(false);
                setEditingPackage(null);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button 
                variant="default" 
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Paquete
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPackage ? 'Editar Paquete' : 'Nuevo Paquete de Patrocinio'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Nombre del Paquete*</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      placeholder="Ej: Paquete Oro Premium"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Categoría*</Label>
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label} ({key})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="level">Nivel*</Label>
                    <Input
                      id="level"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.level}
                      onChange={(e) => setFormData(prev => ({...prev, level: parseInt(e.target.value)}))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Precio*</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duración (meses)*</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({...prev, duration: parseInt(e.target.value)}))}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.checked}))}
                    />
                    <Label htmlFor="isActive">Paquete Activo</Label>
                  </div>
                </div>
                
                <div>
                  <Label>Beneficios</Label>
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                        placeholder="Describe un beneficio..."
                      />
                      {formData.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeBenefit(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBenefit}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Beneficio
                  </Button>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setEditingPackage(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingPackage ? 'Actualizar' : 'Crear'} Paquete
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ]}
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar paquetes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Paquetes */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">Cargando paquetes...</div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPackages.map((packageItem: SponsorshipPackage) => (
            <Card key={packageItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{packageItem.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        className={categoryColors[packageItem.category as keyof typeof categoryColors]}
                      >
                        {categoryLabels[packageItem.category as keyof typeof categoryLabels]}
                      </Badge>
                      <Badge variant={packageItem.isActive ? "default" : "secondary"}>
                        {packageItem.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(packageItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('¿Estás seguro de que quieres eliminar este paquete?')) {
                          deleteMutation.mutate(packageItem.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-lg">${packageItem.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>{packageItem.duration} meses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span>Nivel {packageItem.level}</span>
                  </div>
                  
                  {packageItem.benefits && packageItem.benefits.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Beneficios:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {packageItem.benefits.slice(0, 3).map((benefit, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-green-500 mt-1">•</span>
                            {benefit}
                          </li>
                        ))}
                        {packageItem.benefits.length > 3 && (
                          <li className="text-gray-400 italic">
                            +{packageItem.benefits.length - 3} beneficios más...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredPackages.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <PackagePlus className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Sin paquetes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || categoryFilter !== 'all' 
              ? 'No se encontraron paquetes con los filtros aplicados.'
              : 'Comienza creando tu primer paquete de patrocinio.'
            }
          </p>
        </div>
      )}
    </AdminLayout>
  );
};

export default SponsorshipPackagesPage;