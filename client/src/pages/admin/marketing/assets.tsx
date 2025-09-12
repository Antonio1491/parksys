import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Package, MapPin, Users, DollarSign, Star, Clock, Building, Link2, Unlink, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/ui/page-header';

interface SponsorAsset {
  id: number;
  sponsorId: number;
  contractId?: number;
  assetType: string;
  assetName: string;
  parkLocation?: string;
  sponsorshipLevel: string;
  logoPlacement?: string;
  impressionsPerDay?: number;
  displayDuration?: string;
  maintenanceRequirement?: string;
  installationCost?: string;
  monthlyFee?: string;
  specialRequirements?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  sponsor?: {
    name: string;
    category: string;
    tier: number;
  };
  contract?: {
    id: number;
    status: string;
  };
}

interface Sponsor {
  id: number;
  name: string;
  category: string;
  tier: number;
}

interface Contract {
  id: number;
  sponsorId: number;
  status: string;
  sponsor?: {
    name: string;
  };
}

interface PhysicalAsset {
  id: number;
  name: string;
  description?: string;
  serialNumber?: string;
  categoryId?: number;
  parkId: number;
  locationDescription?: string;
  status: string;
}

interface SponsorshipAssetLink {
  id: number;
  contractId: number;
  assetId: number;
  branding: string;
  createdAt: string;
  updatedAt: string;
  contractStatus?: string;
  sponsorName?: string;
  sponsorTier?: number;
  assetName?: string;
  assetCategory?: number;
  assetParkId?: number;
}

const assetTypeColors = {
  banners: 'bg-blue-100 text-blue-800',
  digital_screens: 'bg-green-100 text-green-800',
  park_furniture: 'bg-orange-100 text-orange-800',
  infrastructure: 'bg-purple-100 text-purple-800',
  signage: 'bg-yellow-100 text-yellow-800'
};

const levelColors = {
  premium: 'bg-blue-100 text-blue-800',
  standard: 'bg-green-100 text-green-800',
  basic: 'bg-orange-100 text-orange-800'
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  maintenance: 'bg-orange-100 text-orange-800',
  inactive: 'bg-red-100 text-red-800'
};

const statusLabels = {
  active: 'Activo',
  pending: 'Pendiente',
  maintenance: 'En Mantenimiento',
  inactive: 'Inactivo'
};

export default function SponsoredAssetsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<SponsorAsset | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    sponsorId: '',
    contractId: 'none',
    assetType: '',
    assetName: '',
    parkLocation: '',
    sponsorshipLevel: 'standard',
    logoPlacement: '',
    impressionsPerDay: '',
    displayDuration: '',
    maintenanceRequirement: '',
    installationCost: '',
    monthlyFee: '',
    specialRequirements: '',
    status: 'pending'
  });

  // Asset linking functionality
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkFormData, setLinkFormData] = useState({
    contractId: '',
    assetId: '',
    branding: ''
  });
  const [selectedLinkContract, setSelectedLinkContract] = useState<string>('');

  // Fetch sponsor assets
  const { data: sponsorAssets = [], isLoading } = useQuery({
    queryKey: ['/api/sponsor-assets'],
    queryFn: () => apiRequest('/api/sponsor-assets').then(res => res.data || [])
  });

  // Fetch sponsors
  const { data: sponsors = [] } = useQuery({
    queryKey: ['/api/sponsors'],
    queryFn: () => apiRequest('/api/sponsors').then(res => res.data || [])
  });

  // Fetch contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ['/api/sponsorship-contracts'],
    queryFn: () => apiRequest('/api/sponsorship-contracts').then(res => res.data || [])
  });

  // Fetch all physical assets (like events fetches all events)
  const { data: physicalAssets = [] } = useQuery({
    queryKey: ['/api/assets'],
    queryFn: () => apiRequest('/api/assets').then(res => res.data || [])
  });

  // Fetch sponsorship asset links
  const { data: sponsorshipAssetLinks = [] } = useQuery({
    queryKey: ['/api/sponsorship-assets'],
    queryFn: () => apiRequest('/api/sponsorship-assets').then(res => res.data || [])
  });

  // Create sponsor asset mutation
  const createAssetMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sponsor-assets', {
      method: 'POST',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Activo patrocinado creado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsor-assets'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al crear activo patrocinado',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update sponsor asset mutation
  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest(`/api/sponsor-assets/${id}`, {
      method: 'PUT',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Activo patrocinado actualizado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsor-assets'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al actualizar activo patrocinado',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete sponsor asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sponsor-assets/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: 'Activo patrocinado eliminado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsor-assets'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al eliminar activo patrocinado',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Link asset with contract mutation
  const linkAssetMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sponsorship-assets', {
      method: 'POST',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Activo vinculado al contrato exitosamente' });
      // Invalidate both query keys for proper cache management
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets/available-for-sponsorship', selectedLinkContract] });
      setIsLinkDialogOpen(false);
      resetLinkForm();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.status === 409 
        ? 'Este activo ya está vinculado a este contrato'
        : error.message;
      toast({ 
        title: 'Error al vincular activo',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // Unlink asset from contract mutation
  const unlinkAssetMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sponsorship-assets/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: 'Activo desvinculado del contrato exitosamente' });
      // Invalidate both query keys for proper cache management
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets/available-for-sponsorship', selectedLinkContract] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al desvincular activo',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const filteredAssets = sponsorAssets.filter((asset: SponsorAsset) => {
    const matchesSearch = asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.sponsor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.parkLocation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || filterType === 'all' || asset.assetType === filterType;
    const matchesStatus = !filterStatus || filterStatus === 'all' || asset.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      sponsorId: '',
      contractId: 'none',
      assetType: '',
      assetName: '',
      parkLocation: '',
      sponsorshipLevel: 'standard',
      logoPlacement: '',
      impressionsPerDay: '',
      displayDuration: '',
      maintenanceRequirement: '',
      installationCost: '',
      monthlyFee: '',
      specialRequirements: '',
      status: 'pending'
    });
    setSelectedAsset(null);
  };

  const handleEdit = (asset: SponsorAsset) => {
    setSelectedAsset(asset);
    setFormData({
      sponsorId: asset.sponsorId?.toString() || '',
      contractId: asset.contractId ? asset.contractId.toString() : 'none',
      assetType: asset.assetType || '',
      assetName: asset.assetName || '',
      parkLocation: asset.parkLocation || '',
      sponsorshipLevel: asset.sponsorshipLevel || 'standard',
      logoPlacement: asset.logoPlacement || '',
      impressionsPerDay: asset.impressionsPerDay?.toString() || '',
      displayDuration: asset.displayDuration || '',
      maintenanceRequirement: asset.maintenanceRequirement || '',
      installationCost: asset.installationCost || '',
      monthlyFee: asset.monthlyFee || '',
      specialRequirements: asset.specialRequirements || '',
      status: asset.status || 'pending'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      sponsorId: parseInt(formData.sponsorId),
      contractId: formData.contractId && formData.contractId !== 'none' ? parseInt(formData.contractId) : null,
      impressionsPerDay: formData.impressionsPerDay ? parseInt(formData.impressionsPerDay) : null
    };
    
    if (selectedAsset) {
      updateAssetMutation.mutate({ id: selectedAsset.id, data: payload });
    } else {
      createAssetMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este activo patrocinado?')) {
      deleteAssetMutation.mutate(id);
    }
  };

  const getAvailableContracts = (sponsorId: string) => {
    return contracts.filter((contract: Contract) => 
      contract.sponsorId.toString() === sponsorId && contract.status === 'active'
    );
  };

  const resetLinkForm = () => {
    setLinkFormData({
      contractId: '',
      assetId: '',
      branding: ''
    });
    setSelectedLinkContract('');
  };

  const handleLinkAsset = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      contractId: parseInt(linkFormData.contractId),
      assetId: parseInt(linkFormData.assetId),
      branding: linkFormData.branding
    };
    
    linkAssetMutation.mutate(payload);
  };

  const handleUnlinkAsset = (linkId: number) => {
    if (confirm('¿Estás seguro de que deseas desvincular este activo del contrato?')) {
      unlinkAssetMutation.mutate(linkId);
    }
  };

  const getActiveContracts = () => {
    return contracts.filter((contract: Contract) => contract.status === 'active');
  };

  // Following the successful events pattern with getUnlinkedAssets
  const getUnlinkedAssets = () => {
    // Get already linked assets for the selected contract
    const selectedContractId = parseInt(selectedLinkContract);
    if (!selectedContractId) {
      return physicalAssets.filter((asset: PhysicalAsset) => asset.status === 'active');
    }
    
    // Frontend filtering fallback to prevent 409s
    const linkedAssetIds = sponsorshipAssetLinks
      .filter((link: SponsorshipAssetLink) => link.contractId === selectedContractId)
      .map((link: SponsorshipAssetLink) => link.assetId);
    
    return physicalAssets.filter((asset: PhysicalAsset) => 
      asset.status === 'active' && !linkedAssetIds.includes(asset.id)
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Activos" 
          subtitle='Gestión de activos patrocinados y sus detalles'
          icon={<Package />}
          actions={[
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="primary"
                  onClick={resetForm}>
                  <Plus className="mr-2 stroke-[4]" />
                  Nuevo Activo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedAsset ? 'Editar Activo Patrocinado' : 'Nuevo Activo Patrocinado'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sponsorId">Patrocinador *</Label>
                      <Select value={formData.sponsorId} onValueChange={(value) => setFormData({ ...formData, sponsorId: value, contractId: '' })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar patrocinador" />
                        </SelectTrigger>
                        <SelectContent>
                          {sponsors.map((sponsor: Sponsor) => (
                            <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                              {sponsor.name} (Tier {sponsor.tier})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="contractId">Contrato</Label>
                      <Select value={formData.contractId} onValueChange={(value) => setFormData({ ...formData, contractId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar contrato (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin contrato específico</SelectItem>
                          {getAvailableContracts(formData.sponsorId).map((contract: Contract) => (
                            <SelectItem key={contract.id} value={contract.id.toString()}>
                              Contrato #{contract.id} - {contract.sponsor?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="assetType">Tipo de Activo *</Label>
                      <Select value={formData.assetType} onValueChange={(value) => setFormData({ ...formData, assetType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="banners">Banners</SelectItem>
                          <SelectItem value="digital_screens">Pantallas Digitales</SelectItem>
                          <SelectItem value="park_furniture">Mobiliario de Parque</SelectItem>
                          <SelectItem value="infrastructure">Infraestructura</SelectItem>
                          <SelectItem value="signage">Señalización</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="assetName">Nombre del Activo *</Label>
                      <Input
                        id="assetName"
                        value={formData.assetName}
                        onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="parkLocation">Ubicación en el Parque</Label>
                      <Input
                        id="parkLocation"
                        value={formData.parkLocation}
                        onChange={(e) => setFormData({ ...formData, parkLocation: e.target.value })}
                        placeholder="Ej: Entrada principal, Área de juegos..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="sponsorshipLevel">Nivel de Patrocinio</Label>
                      <Select value={formData.sponsorshipLevel} onValueChange={(value) => setFormData({ ...formData, sponsorshipLevel: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="standard">Estándar</SelectItem>
                          <SelectItem value="basic">Básico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="logoPlacement">Colocación del Logo</Label>
                      <Input
                        id="logoPlacement"
                        value={formData.logoPlacement}
                        onChange={(e) => setFormData({ ...formData, logoPlacement: e.target.value })}
                        placeholder="Ej: Esquina superior derecha"
                      />
                    </div>
                    <div>
                      <Label htmlFor="impressionsPerDay">Impresiones por Día</Label>
                      <Input
                        id="impressionsPerDay"
                        type="number"
                        value={formData.impressionsPerDay}
                        onChange={(e) => setFormData({ ...formData, impressionsPerDay: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="displayDuration">Duración de Exhibición</Label>
                      <Input
                        id="displayDuration"
                        value={formData.displayDuration}
                        onChange={(e) => setFormData({ ...formData, displayDuration: e.target.value })}
                        placeholder="Ej: 6 meses, 1 año"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maintenanceRequirement">Requerimientos de Mantenimiento</Label>
                      <Input
                        id="maintenanceRequirement"
                        value={formData.maintenanceRequirement}
                        onChange={(e) => setFormData({ ...formData, maintenanceRequirement: e.target.value })}
                        placeholder="Ej: Limpieza semanal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="installationCost">Costo de Instalación</Label>
                      <Input
                        id="installationCost"
                        value={formData.installationCost}
                        onChange={(e) => setFormData({ ...formData, installationCost: e.target.value })}
                        placeholder="$0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthlyFee">Cuota Mensual</Label>
                      <Input
                        id="monthlyFee"
                        value={formData.monthlyFee}
                        onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                        placeholder="$0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Estado</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="maintenance">En Mantenimiento</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialRequirements">Requerimientos Especiales</Label>
                    <Textarea
                      id="specialRequirements"
                      value={formData.specialRequirements}
                      onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                      rows={3}
                      placeholder="Requerimientos específicos del activo..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createAssetMutation.isPending || updateAssetMutation.isPending}>
                      {createAssetMutation.isPending || updateAssetMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ]}
        />

        {/* Asset Linking Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Vincular Activos Físicos con Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label>Contrato de Patrocinio</Label>
                <Select 
                  value={selectedLinkContract} 
                  onValueChange={(value) => {
                    setSelectedLinkContract(value);
                    setLinkFormData({ ...linkFormData, contractId: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar contrato activo" />
                  </SelectTrigger>
                  <SelectContent>
                    {getActiveContracts().map((contract: Contract) => (
                      <SelectItem key={contract.id} value={contract.id.toString()}>
                        Contrato #{contract.id} - {contract.sponsor?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => {
                  if (!selectedLinkContract) {
                    toast({ 
                      title: 'Selecciona un contrato', 
                      description: 'Debes seleccionar un contrato para vincular activos.',
                      variant: 'destructive'
                    });
                    return;
                  }
                  setIsLinkDialogOpen(true);
                }}
                data-testid="button-link-asset"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Vincular Activo
              </Button>
            </div>
            
            {/* Asset Linking Dialog */}
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Vincular Activo Físico</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleLinkAsset} className="space-y-4">
                  <div>
                    <Label htmlFor="assetId">Activo Físico *</Label>
                    <Select 
                      value={linkFormData.assetId} 
                      onValueChange={(value) => setLinkFormData({ ...linkFormData, assetId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar activo" />
                      </SelectTrigger>
                      <SelectContent>
                        {getUnlinkedAssets().map((asset: PhysicalAsset) => (
                          <SelectItem key={asset.id} value={asset.id.toString()}>
                            {asset.name} {asset.serialNumber ? `(${asset.serialNumber})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="branding">Configuración de Branding *</Label>
                    <Textarea
                      id="branding"
                      value={linkFormData.branding}
                      onChange={(e) => setLinkFormData({ ...linkFormData, branding: e.target.value })}
                      placeholder="Ej: Logo en esquina superior derecha, 15x10cm, colores corporativos..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={linkAssetMutation.isPending}>
                      {linkAssetMutation.isPending ? 'Vinculando...' : 'Vincular'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Linked Assets Table */}
        {sponsorshipAssetLinks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Activos Vinculados a Contratos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Activo</th>
                      <th className="text-left p-2">Contrato</th>
                      <th className="text-left p-2">Patrocinador</th>
                      <th className="text-left p-2">Branding</th>
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsorshipAssetLinks.map((link: SponsorshipAssetLink) => (
                      <tr key={link.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="font-medium">{link.assetName}</div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">Contrato #{link.contractId}</Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {link.sponsorName}
                            {link.sponsorTier && (
                              <Badge className="text-xs">
                                Tier {link.sponsorTier}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="max-w-xs truncate" title={link.branding}>
                            {link.branding}
                          </div>
                        </td>
                        <td className="p-2 text-sm text-gray-500">
                          {new Date(link.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="p-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUnlinkAsset(link.id)}
                            data-testid={`button-unlink-${link.id}`}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Buscar activos</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Buscar por activo, patrocinador o ubicación..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Label>Tipo de Activo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="banners">Banners</SelectItem>
                    <SelectItem value="digital_screens">Pantallas Digitales</SelectItem>
                    <SelectItem value="park_furniture">Mobiliario</SelectItem>
                    <SelectItem value="infrastructure">Infraestructura</SelectItem>
                    <SelectItem value="signage">Señalización</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Label>Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="maintenance">En Mantenimiento</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset: SponsorAsset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {asset.assetName}
                    </CardTitle>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge className={statusColors[asset.status as keyof typeof statusColors]}>
                        {statusLabels[asset.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge className={assetTypeColors[asset.assetType as keyof typeof assetTypeColors]}>
                        {asset.assetType.replace('_', ' ')}
                      </Badge>
                      <Badge className={levelColors[asset.sponsorshipLevel as keyof typeof levelColors]}>
                        {asset.sponsorshipLevel}
                      </Badge>
                      {asset.sponsor && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Tier {asset.sponsor.tier}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(asset)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(asset.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Patrocinador
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{asset.sponsor?.name}</div>
                      <div className="text-gray-600">{asset.sponsor?.category}</div>
                    </div>
                  </div>

                  {asset.parkLocation && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Ubicación
                      </h4>
                      <div className="text-sm text-gray-600">{asset.parkLocation}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {asset.impressionsPerDay && asset.impressionsPerDay > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Impresiones
                        </h5>
                        <div className="text-sm text-gray-600">{asset.impressionsPerDay}/día</div>
                      </div>
                    )}

                    {asset.displayDuration && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Duración
                        </h5>
                        <div className="text-sm text-gray-600">{asset.displayDuration}</div>
                      </div>
                    )}
                  </div>

                  {(asset.installationCost || asset.monthlyFee) && (
                    <div className="p-3 bg-gray-50 rounded">
                      <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Costos
                      </h5>
                      <div className="space-y-1 text-sm">
                        {asset.installationCost && (
                          <div>Instalación: {asset.installationCost}</div>
                        )}
                        {asset.monthlyFee && (
                          <div>Mensual: {asset.monthlyFee}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {asset.logoPlacement && (
                    <div className="text-sm">
                      <span className="font-medium">Logo:</span> {asset.logoPlacement}
                    </div>
                  )}

                  {asset.maintenanceRequirement && (
                    <div className="text-sm">
                      <span className="font-medium">Mantenimiento:</span> {asset.maintenanceRequirement}
                    </div>
                  )}
                </div>

                {asset.specialRequirements && (
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <h5 className="font-medium text-blue-900 mb-2">Requerimientos Especiales</h5>
                    <p className="text-sm text-blue-700">{asset.specialRequirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAssets.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                {searchTerm || filterType || filterStatus 
                  ? 'No se encontraron activos patrocinados que coincidan con los filtros.'
                  : 'No hay activos patrocinados registrados aún.'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}