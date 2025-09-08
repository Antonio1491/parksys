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
  sponsorId: number;
  packageId: number;
  startDate: string;
  endDate: string;
  totalAmount: string;
  status: string;
  terms?: string;
  autoRenewal: boolean;
  paymentSchedule?: string;
  createdAt: string;
  updatedAt: string;
  sponsor?: {
    name: string;
    category: string;
  };
  package?: {
    name: string;
    category: string;
    level: number;
    price: string;
    duration: number;
    benefits: string[];
  };
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
  category: string;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  terminated: 'bg-orange-100 text-orange-800'
};

const statusLabels = {
  draft: 'Borrador',
  active: 'Activo',
  expired: 'Expirado',
  terminated: 'Terminado'
};

export default function ContractsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedContract, setSelectedContract] = useState<SponsorshipContract | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    sponsorId: '',
    packageId: '',
    startDate: '',
    endDate: '',
    totalAmount: '',
    status: 'draft',
    terms: '',
    autoRenewal: false,
    paymentSchedule: 'monthly'
  });

  // Fetch contracts
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['/api/sponsorship-contracts'],
    queryFn: () => apiRequest('/api/sponsorship-contracts').then(res => res.data || [])
  });

  // Fetch packages
  const { data: packages = [] } = useQuery({
    queryKey: ['/api/sponsorship-packages'],
    queryFn: () => apiRequest('/api/sponsorship-packages').then(res => res.data || [])
  });

  // Fetch sponsors
  const { data: sponsors = [] } = useQuery({
    queryKey: ['/api/sponsors'],
    queryFn: () => apiRequest('/api/sponsors').then(res => res.data || [])
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
    const matchesSearch = contract.sponsor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.package?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || filterStatus === 'all' || contract.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      sponsorId: '',
      packageId: '',
      startDate: '',
      endDate: '',
      totalAmount: '',
      status: 'draft',
      terms: '',
      autoRenewal: false,
      paymentSchedule: 'monthly'
    });
    setSelectedContract(null);
  };

  const handleEdit = (contract: SponsorshipContract) => {
    setSelectedContract(contract);
    setFormData({
      sponsorId: contract.sponsorId?.toString() || '',
      packageId: contract.packageId?.toString() || '',
      startDate: contract.startDate ? format(new Date(contract.startDate), 'yyyy-MM-dd') : '',
      endDate: contract.endDate ? format(new Date(contract.endDate), 'yyyy-MM-dd') : '',
      totalAmount: contract.totalAmount || '',
      status: contract.status || 'draft',
      terms: contract.terms || '',
      autoRenewal: contract.autoRenewal || false,
      paymentSchedule: contract.paymentSchedule || 'monthly'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedContract) {
      updateContractMutation.mutate({ 
        id: selectedContract.id, 
        data: {
          ...formData,
          sponsorId: parseInt(formData.sponsorId),
          packageId: parseInt(formData.packageId)
        }
      });
    } else {
      createContractMutation.mutate({
        ...formData,
        sponsorId: parseInt(formData.sponsorId),
        packageId: parseInt(formData.packageId)
      });
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
          title="Contratos de Patrocinio"
          subtitle="Gestiona los contratos de patrocinio activos y en desarrollo"
          icon={<FileText />}
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

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
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
                        <Label htmlFor="sponsorId">Patrocinador *</Label>
                        <Select value={formData.sponsorId} onValueChange={(value) => setFormData({ ...formData, sponsorId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar patrocinador" />
                          </SelectTrigger>
                          <SelectContent>
                            {sponsors.map((sponsor: Sponsor) => (
                              <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                                {sponsor.name} ({sponsor.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="packageId">Paquete de Patrocinio *</Label>
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
                        <Label htmlFor="totalAmount">Monto Total *</Label>
                        <Input
                          id="totalAmount"
                          value={formData.totalAmount}
                          onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                          placeholder="$0.00"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Estado</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Borrador</SelectItem>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="expired">Expirado</SelectItem>
                            <SelectItem value="terminated">Terminado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="paymentSchedule">Cronograma de Pagos</Label>
                        <Select value={formData.paymentSchedule} onValueChange={(value) => setFormData({ ...formData, paymentSchedule: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Mensual</SelectItem>
                            <SelectItem value="quarterly">Trimestral</SelectItem>
                            <SelectItem value="annually">Anual</SelectItem>
                            <SelectItem value="one-time">Pago Único</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="autoRenewal"
                          checked={formData.autoRenewal}
                          onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="autoRenewal">Renovación Automática</Label>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="terms">Términos y Condiciones</Label>
                      <Textarea
                        id="terms"
                        value={formData.terms}
                        onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                        rows={4}
                        placeholder="Términos específicos del contrato..."
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
                      {contract.sponsor?.name} - {contract.package?.name}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={statusColors[contract.status as keyof typeof statusColors]}>
                        {statusLabels[contract.status as keyof typeof statusLabels]}
                      </Badge>
                      {contract.autoRenewal && (
                        <Badge variant="outline">Renovación Automática</Badge>
                      )}
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
                      <div>Inicio: {format(new Date(contract.startDate), 'dd/MM/yyyy')}</div>
                      <div>Fin: {format(new Date(contract.endDate), 'dd/MM/yyyy')}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Financieros
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>Monto Total: {contract.totalAmount}</div>
                      <div>Cronograma: {contract.paymentSchedule}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Paquete
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>Nivel: {contract.package?.level}</div>
                      <div>Duración: {contract.package?.duration} meses</div>
                      {contract.package?.benefits && contract.package.benefits.length > 0 && (
                        <div>
                          <div className="font-medium mt-2">Beneficios:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {contract.package.benefits.slice(0, 3).map((benefit, index) => (
                              <li key={index} className="text-xs">{benefit}</li>
                            ))}
                            {contract.package.benefits.length > 3 && (
                              <li className="text-xs text-gray-500">+{contract.package.benefits.length - 3} más...</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {contract.terms && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <h5 className="font-medium text-gray-900 mb-2">Términos Especiales</h5>
                    <p className="text-sm text-gray-600">{contract.terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContracts.length === 0 && !isLoading && (
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