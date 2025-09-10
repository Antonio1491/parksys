import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, FileText, Calendar, DollarSign, Package, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/ui/page-header';
import { format } from 'date-fns';

interface SponsorshipContract {
  id: number;
  number: string;
  sponsor_id: number;
  type: 'paquete' | 'activo' | 'evento' | 'otro';
  package_id?: number;
  amount: string;
  start_date: string;
  end_date: string;
  status: 'activo' | 'vencido' | 'en_negociacion' | 'en_revision';
  notes?: string;
  sponsor_name?: string;
  sponsor_logo?: string;
  package_name?: string;
  package_level?: number;
  package_duration?: number;
  package_benefits?: string[];
}

interface SponsorshipPackage {
  id: number;
  name: string;
  category: string;
  level: number;
  price: string;
  duration: number;
  benefits: string[];
  isActive: boolean;
}

interface Sponsor {
  id: number;
  name: string;
  sector: string; // Corregido para coincidir con la BD
}

const statusColors = {
  activo: 'bg-green-100 text-green-800',
  vencido: 'bg-red-100 text-red-800',
  en_negociacion: 'bg-blue-100 text-blue-800',
  en_revision: 'bg-yellow-100 text-yellow-800'
};

const statusLabels = {
  activo: 'Activo',
  vencido: 'Vencido',
  en_negociacion: 'En Negociación',
  en_revision: 'En Revisión'
};

const typeLabels = {
  paquete: 'Paquete',
  activo: 'Activo',
  evento: 'Evento',
  otro: 'Otro'
};

export default function ContractsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedContract, setSelectedContract] = useState<SponsorshipContract | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    sponsorId: '',
    type: 'paquete' as 'paquete' | 'activo' | 'evento' | 'otro',
    packageId: '',
    amount: '',
    startDate: '',
    endDate: '',
    status: 'en_negociacion' as 'activo' | 'vencido' | 'en_negociacion' | 'en_revision',
    notes: ''
  });

  // Fetch contracts
  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ['/api/sponsorship-contracts'],
    queryFn: () => apiRequest('/api/sponsorship-contracts').then(res => res.data || res || [])
  });

  // Fetch packages
  const { data: packages = [] } = useQuery({
    queryKey: ['/api/sponsorship-packages'],
    queryFn: () => apiRequest('/api/sponsorship-packages').then(res => res.data || [])
  });

  // Fetch sponsors
  const { data: sponsors = [] } = useQuery({
    queryKey: ['/api/sponsors'],
    queryFn: () => apiRequest('/api/sponsors').then(res => res || [])
  });

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sponsorship-contracts', {
      method: 'POST',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Contrato creado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-contracts'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al crear contrato',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update contract mutation
  const updateContractMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest(`/api/sponsorship-contracts/${id}`, {
      method: 'PUT',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Contrato actualizado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-contracts'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al actualizar contrato',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete contract mutation
  const deleteContractMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sponsorship-contracts/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: 'Contrato eliminado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-contracts'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al eliminar contrato',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const filteredContracts = contracts.filter((contract: SponsorshipContract) => {
    const matchesSearch = contract.sponsor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.package_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || filterStatus === 'all' || contract.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      number: '',
      sponsorId: '',
      type: 'paquete',
      packageId: '',
      amount: '',
      startDate: '',
      endDate: '',
      status: 'en_negociacion',
      notes: ''
    });
    setSelectedContract(null);
  };

  const handleEdit = (contract: SponsorshipContract) => {
    setSelectedContract(contract);
    setFormData({
      number: contract.number || '',
      sponsorId: contract.sponsor_id?.toString() || '',
      type: contract.type || 'paquete',
      packageId: contract.package_id?.toString() || '',
      amount: contract.amount || '',
      startDate: contract.start_date ? format(new Date(contract.start_date), 'yyyy-MM-dd') : '',
      endDate: contract.end_date ? format(new Date(contract.end_date), 'yyyy-MM-dd') : '',
      status: contract.status || 'en_negociacion',
      notes: contract.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      sponsorId: parseInt(formData.sponsorId),
      packageId: formData.packageId ? parseInt(formData.packageId) : null // nullable para tipos que no son paquete
    };
    
    if (selectedContract) {
      updateContractMutation.mutate({ 
        id: selectedContract.id, 
        data: submitData
      });
    } else {
      createContractMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este contrato?')) {
      deleteContractMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Contratos"
          subtitle="Gestiona los contratos de patrocinio activos y en desarrollo"
          icon={<FileText />}
          actions={[
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="primary"
                  onClick={resetForm}>
                  <Plus className="mr-2 stroke-[4]" />
                  Nuevo Contrato
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedContract ? 'Editar Contrato' : 'Nuevo Contrato'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="number">Número de Contrato *</Label>
                      <Input
                        id="number"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        placeholder="CT-2024-001"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sponsorId">Patrocinador *</Label>
                      <Select value={formData.sponsorId} onValueChange={(value) => setFormData({ ...formData, sponsorId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar patrocinador" />
                        </SelectTrigger>
                        <SelectContent>
                          {sponsors.map((sponsor: Sponsor) => (
                            <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                              {sponsor.name} ({sponsor.sector})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="type">Tipo de Contrato *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paquete">Paquete</SelectItem>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="evento">Evento</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.type === 'paquete' && (
                      <div>
                        <Label htmlFor="packageId">Paquete de Patrocinio</Label>
                        <Select value={formData.packageId} onValueChange={(value) => setFormData({ ...formData, packageId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar paquete" />
                          </SelectTrigger>
                          <SelectContent>
                            {packages.map((pkg: SponsorshipPackage) => (
                              <SelectItem key={pkg.id} value={pkg.id.toString()}>
                                {pkg.name} - ${pkg.price} ({pkg.duration} meses)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="startDate">Fecha de Inicio *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Fecha de Fin *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Monto *</Label>
                      <Input
                        id="amount"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Estado</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="vencido">Vencido</SelectItem>
                          <SelectItem value="en_negociacion">En Negociación</SelectItem>
                          <SelectItem value="en_revision">En Revisión</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Observaciones</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      placeholder="Observaciones del contrato..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createContractMutation.isPending || updateContractMutation.isPending}>
                      {createContractMutation.isPending || updateContractMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ]}
          />

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Buscar contratos</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Buscar por patrocinador o paquete..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-full md:w-48">
                <Label>Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                    <SelectItem value="terminated">Terminado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map((contract: SponsorshipContract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {contract.number} - {contract.sponsor_name || 'Sin patrocinador'}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={statusColors[contract.status as keyof typeof statusColors]}>
                        {statusLabels[contract.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge variant="outline">
                        {typeLabels[contract.type as keyof typeof typeLabels]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(contract)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(contract.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Vigencia
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>Inicio: {format(new Date(contract.start_date), 'dd/MM/yyyy')}</div>
                      <div>Fin: {format(new Date(contract.end_date), 'dd/MM/yyyy')}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Financieros
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>Monto: ${contract.amount}</div>
                      <div>Tipo: {typeLabels[contract.type as keyof typeof typeLabels]}</div>
                    </div>
                  </div>
                  
                  {contract.type === 'paquete' && contract.package_name && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Paquete
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div>Nombre: {contract.package_name}</div>
                        {contract.package_level && <div>Nivel: {contract.package_level}</div>}
                        {contract.package_duration && <div>Duración: {contract.package_duration} meses</div>}
                        {contract.package_benefits && contract.package_benefits.length > 0 && (
                          <div>
                            <div className="font-medium mt-2">Beneficios:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {contract.package_benefits.slice(0, 3).map((benefit, index) => (
                                <li key={index} className="text-xs">{benefit}</li>
                              ))}
                              {contract.package_benefits.length > 3 && (
                                <li className="text-xs text-gray-500">+{contract.package_benefits.length - 3} más...</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {contract.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <h5 className="font-medium text-gray-900 mb-2">Observaciones</h5>
                    <p className="text-sm text-gray-600">{contract.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">Cargando contratos...</div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-red-500">
                Error: {error.message || 'Error al cargar contratos'}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredContracts.length === 0 && !isLoading && !error && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                {searchTerm || filterStatus 
                  ? 'No se encontraron contratos que coincidan con los filtros.'
                  : 'No hay contratos registrados aún.'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}