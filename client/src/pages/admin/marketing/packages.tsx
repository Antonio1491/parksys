import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, PackagePlus, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/ui/page-header';

interface SponsorshipPackage {
  id: number;
  name: string;
  description: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
}


const SponsorshipPackagesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SponsorshipPackage | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: ''
  });

  const { data: packages = [], isLoading } = useQuery<SponsorshipPackage[]>({
    queryKey: ['/api/sponsorship-packages'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sponsorship-packages', {
      method: 'POST',
      data,
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
        data,
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
      description: '',
      amount: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "La aportación debe ser un número válido mayor a 0.",
        variant: "destructive",
      });
      return;
    }
    
    const submitData = {
      ...formData,
      amount: formData.amount // Enviar como string
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
      description: packageItem.description || '',
      amount: String(packageItem.amount || '')
    });
  };


  const filteredPackages = (packages as SponsorshipPackage[]).filter((packageItem: SponsorshipPackage) => {
    const matchesSearch = packageItem.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
                variant="primary" 
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="mr-2 stroke-[4]" />
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
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Nombre del Paquete*</Label>
                    <Input
                      id="name"
                      data-testid="input-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      placeholder="Ej: Paquete Oro Premium"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      data-testid="input-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                      placeholder="Describe el paquete de patrocinio..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">Aportación*</Label>
                    <Input
                      id="amount"
                      data-testid="input-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({...prev, amount: e.target.value}))}
                      placeholder="0.00"
                      required
                    />
                  </div>
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
              data-testid="input-search"
            />
          </div>
        </div>
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
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(packageItem)}
                      data-testid={`button-edit-${packageItem.id}`}
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
                      data-testid={`button-delete-${packageItem.id}`}
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
                    <span className="font-semibold text-lg" data-testid={`text-amount-${packageItem.id}`}>
                      ${new Intl.NumberFormat('es-MX', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      }).format(Number(packageItem.amount))}
                    </span>
                  </div>
                  
                  {packageItem.description && (
                    <div>
                      <p className="text-sm text-gray-600" data-testid={`text-description-${packageItem.id}`}>
                        {packageItem.description}
                      </p>
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
            {searchTerm 
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