import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, PackagePlus, DollarSign, Gift, X, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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

interface SponsorshipBenefit {
  id: number;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PackageBenefit {
  id: number;
  packageId: number;
  benefitId: number;
  quantity: number;
  customValue: string;
  benefitName: string;
  benefitDescription: string;
  benefitCategory: string;
}

// Para formulario de beneficios
interface BenefitFormData {
  benefitId: number;
  quantity: number;
  customValue: string;
}


const SponsorshipPackagesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SponsorshipPackage | null>(null);

  // Estados para gestión de beneficios
  const [showBenefitsSection, setShowBenefitsSection] = useState(false);
  const [benefitFormData, setBenefitFormData] = useState<BenefitFormData>({
    benefitId: 0,
    quantity: 1,
    customValue: ''
  });
  
  // Para beneficios temporales durante creación
  const [tempBenefits, setTempBenefits] = useState<Array<{
    benefitId: number;
    quantity: number;
    customValue: string;
    benefitName: string;
    benefitDescription: string;
    benefitCategory: string;
  }>>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: ''
  });

  const { data: packages = [], isLoading } = useQuery<SponsorshipPackage[]>({
    queryKey: ['/api/sponsorship-packages'],
    queryFn: () => apiRequest('/api/sponsorship-packages').then(res => res.data || res || [])
  });

  // Query para obtener todos los beneficios disponibles
  const { data: availableBenefits = [] } = useQuery<SponsorshipBenefit[]>({
    queryKey: ['/api/sponsorship-benefits'],
    queryFn: () => apiRequest('/api/sponsorship-benefits').then(res => res.data || res || [])
  });

  // Query para obtener beneficios del paquete cuando se edita
  const { data: packageBenefits = [], refetch: refetchPackageBenefits, isLoading: benefitsLoading } = useQuery<PackageBenefit[]>({
    queryKey: ['/api/sponsorship-packages', editingPackage?.id, 'benefits'],
    queryFn: () => apiRequest(`/api/sponsorship-packages/${editingPackage?.id}/benefits`).then(res => res.data || res || []),
    enabled: !!editingPackage?.id,
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
      // Solo cerrar el modal si no está en modo de edición de beneficios
      if (!showBenefitsSection) {
        setEditingPackage(null);
        resetForm();
      }
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

  // Mutaciones para beneficios de paquetes
  const addBenefitMutation = useMutation({
    mutationFn: ({ packageId, data }: { packageId: number; data: any }) => 
      apiRequest(`/api/sponsorship-packages/${packageId}/benefits`, {
        method: 'POST',
        data,
      }),
    onSuccess: () => {
      refetchPackageBenefits();
      setBenefitFormData({ benefitId: 0, quantity: 1, customValue: '' });
      toast({
        title: "Beneficio agregado",
        description: "El beneficio ha sido agregado al paquete exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar el beneficio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const removeBenefitMutation = useMutation({
    mutationFn: ({ packageId, benefitId }: { packageId: number; benefitId: number }) => 
      apiRequest(`/api/sponsorship-packages/${packageId}/benefits/${benefitId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      refetchPackageBenefits();
      toast({
        title: "Beneficio eliminado",
        description: "El beneficio ha sido eliminado del paquete exitosamente.",
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
      amount: ''
    });
    // Solo ocultar la sección de beneficios si no está editando
    if (!editingPackage) {
      setShowBenefitsSection(false);
    }
    setBenefitFormData({ benefitId: 0, quantity: 1, customValue: '' });
    setTempBenefits([]);
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
      amount: formData.amount, // Enviar como string
      // Incluir beneficios temporales solo en modo creación
      ...((!editingPackage && tempBenefits.length > 0) ? { 
        benefits: tempBenefits.map(b => ({
          benefitId: b.benefitId,
          quantity: b.quantity,
          customValue: b.customValue
        }))
      } : {})
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
    setShowBenefitsSection(true); // Mostrar beneficios al editar
    setShowCreateDialog(true); // Asegurar que el modal esté abierto
  };

  // Función para agregar beneficio al paquete (edición) o a lista temporal (creación)
  const handleAddBenefit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!benefitFormData.benefitId) return;

    if (editingPackage) {
      // Modo edición: agregar directo al paquete
      addBenefitMutation.mutate({
        packageId: editingPackage.id,
        data: {
          benefitId: benefitFormData.benefitId,
          quantity: benefitFormData.quantity,
          customValue: benefitFormData.customValue
        }
      });
    } else {
      // Modo creación: agregar a lista temporal
      const selectedBenefit = availableBenefits.find(b => b.id === benefitFormData.benefitId);
      if (selectedBenefit) {
        // Verificar que no esté ya agregado
        if (tempBenefits.find(b => b.benefitId === benefitFormData.benefitId)) {
          toast({
            title: "Beneficio duplicado",
            description: "Este beneficio ya ha sido agregado al paquete.",
            variant: "destructive",
          });
          return;
        }

        setTempBenefits(prev => [...prev, {
          benefitId: benefitFormData.benefitId,
          quantity: benefitFormData.quantity,
          customValue: benefitFormData.customValue,
          benefitName: selectedBenefit.name,
          benefitDescription: selectedBenefit.description,
          benefitCategory: selectedBenefit.category
        }]);

        // Resetear formulario de beneficio
        setBenefitFormData({ benefitId: 0, quantity: 1, customValue: '' });

        toast({
          title: "Beneficio agregado",
          description: "El beneficio se agregará al crear el paquete.",
        });
      }
    }
  };

  // Función para remover beneficio del paquete (edición) o de lista temporal (creación)
  const handleRemoveBenefit = (relationId: number) => {
    if (editingPackage) {
      // Modo edición: remover del paquete
      if (confirm('¿Estás seguro de que quieres eliminar este beneficio del paquete?')) {
        removeBenefitMutation.mutate({
          packageId: editingPackage.id,
          benefitId: relationId
        });
      }
    } else {
      // Modo creación: remover de lista temporal
      setTempBenefits(prev => prev.filter(b => b.benefitId !== relationId));
      toast({
        title: "Beneficio eliminado",
        description: "El beneficio ha sido eliminado de la lista temporal.",
      });
    }
  };

  // Función para obtener el icono de la categoría
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Visibilidad':
        return <Star className="h-4 w-4" />;
      case 'Acceso':
        return <Gift className="h-4 w-4" />;
      case 'Branding':
        return <Edit className="h-4 w-4" />;
      case 'Otro':
        return <Plus className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
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
                setShowBenefitsSection(false);
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

                {/* Botón para mostrar beneficios en modo creación */}
                {!editingPackage && !showBenefitsSection && (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBenefitsSection(true)}
                      className="flex items-center gap-2"
                      data-testid="button-show-benefits"
                    >
                      <Gift className="h-4 w-4" />
                      Agregar Beneficios al Paquete
                    </Button>
                  </div>
                )}

                {/* Sección de Beneficios Incluidos - Visible al editar o cuando se activa en creación */}
                {(editingPackage || showBenefitsSection) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-semibold">Beneficios Incluidos</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {editingPackage ? packageBenefits.length : tempBenefits.length} beneficio{(editingPackage ? packageBenefits.length : tempBenefits.length) !== 1 ? 's' : ''}
                          </Badge>
                          {!editingPackage && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowBenefitsSection(false)}
                              className="text-gray-500 hover:text-gray-700"
                              data-testid="button-hide-benefits"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Lista de beneficios actuales - edición o temporales - creación */}
                      {((editingPackage && packageBenefits.length > 0) || (!editingPackage && tempBenefits.length > 0)) && (
                        <div className="space-y-2">
                          {editingPackage ? (
                            // Mostrar beneficios del paquete (modo edición)
                            packageBenefits.map((benefit) => (
                              <Card key={benefit.id} className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {getCategoryIcon(benefit.benefitCategory)}
                                    <div className="flex-1">
                                      <div className="font-medium">{benefit.benefitName}</div>
                                      <div className="text-sm text-gray-600">
                                        {benefit.benefitDescription}
                                      </div>
                                      <div className="flex items-center gap-3 mt-1">
                                        <Badge variant="secondary" className="text-xs">
                                          {benefit.benefitCategory}
                                        </Badge>
                                        {benefit.quantity > 1 && (
                                          <span className="text-xs text-gray-500">
                                            Cantidad: {benefit.quantity}
                                          </span>
                                        )}
                                        {benefit.customValue && (
                                          <span className="text-xs text-gray-500">
                                            Valor: {benefit.customValue}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveBenefit(benefit.id)}
                                    disabled={removeBenefitMutation.isPending}
                                    data-testid={`button-remove-benefit-${benefit.id}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))
                          ) : (
                            // Mostrar beneficios temporales (modo creación)
                            tempBenefits.map((benefit, index) => (
                              <Card key={`temp-${benefit.benefitId}-${index}`} className="p-3 bg-blue-50 border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {getCategoryIcon(benefit.benefitCategory)}
                                    <div className="flex-1">
                                      <div className="font-medium">{benefit.benefitName}</div>
                                      <div className="text-sm text-gray-600">
                                        {benefit.benefitDescription}
                                      </div>
                                      <div className="flex items-center gap-3 mt-1">
                                        <Badge variant="secondary" className="text-xs">
                                          {benefit.benefitCategory}
                                        </Badge>
                                        {benefit.quantity > 1 && (
                                          <span className="text-xs text-gray-500">
                                            Cantidad: {benefit.quantity}
                                          </span>
                                        )}
                                        {benefit.customValue && (
                                          <span className="text-xs text-gray-500">
                                            Valor: {benefit.customValue}
                                          </span>
                                        )}
                                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                                          Temporal
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveBenefit(benefit.benefitId)}
                                    data-testid={`button-remove-temp-benefit-${benefit.benefitId}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))
                          )}
                        </div>
                      )}

                      {/* Formulario para agregar nuevo beneficio */}
                      <Card className="p-4 bg-gray-50">
                        <div className="space-y-3">
                          <h4 className="font-medium">Agregar Nuevo Beneficio</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="benefit-select">Beneficio*</Label>
                                <Select 
                                  value={benefitFormData.benefitId > 0 ? benefitFormData.benefitId.toString() : ""} 
                                  onValueChange={(value) => setBenefitFormData(prev => ({...prev, benefitId: parseInt(value)}))}
                                >
                                  <SelectTrigger data-testid="select-benefit">
                                    <SelectValue placeholder="Selecciona un beneficio" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableBenefits
                                      .filter(benefit => benefit.isActive)
                                      .map((benefit) => (
                                        <SelectItem key={benefit.id} value={benefit.id.toString()}>
                                          <div className="flex items-center gap-2">
                                            {getCategoryIcon(benefit.category)}
                                            <span>{benefit.name}</span>
                                            <Badge variant="outline" className="text-xs ml-2">
                                              {benefit.category}
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="quantity">Cantidad</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  min="1"
                                  value={benefitFormData.quantity}
                                  onChange={(e) => setBenefitFormData(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                                  data-testid="input-quantity"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="custom-value">Valor Personalizado (Opcional)</Label>
                              <Input
                                id="custom-value"
                                value={benefitFormData.customValue}
                                onChange={(e) => setBenefitFormData(prev => ({...prev, customValue: e.target.value}))}
                                placeholder="Ej: Logo de 300x150px, Mención de 30 segundos"
                                data-testid="input-custom-value"
                              />
                            </div>
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                onClick={(e) => handleAddBenefit(e)}
                                disabled={!benefitFormData.benefitId || addBenefitMutation.isPending}
                                className="flex items-center gap-2"
                                data-testid="button-add-benefit"
                              >
                                <Plus className="h-4 w-4" />
                                {addBenefitMutation.isPending ? 'Agregando...' : 'Agregar Beneficio'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setEditingPackage(null);
                      setShowBenefitsSection(false);
                      resetForm();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
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