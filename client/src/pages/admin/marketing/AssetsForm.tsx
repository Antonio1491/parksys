import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Package } from 'lucide-react';

// Types
interface Contract {
  id: number;
  number: string;
  sponsor_name: string;
  status: string;
}

interface PhysicalAsset {
  id: number;
  name: string;
  serialNumber?: string;
  status: string;
}

interface SponsorshipAssetLink {
  id: number;
  contractId: number;
  assetId: number;
  branding: string;
}

export default function AssetsForm() {
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    contractId: '',
    assetId: '',
    branding: ''
  });

  // Fetch contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ['/api/sponsorship-contracts'],
    queryFn: () => apiRequest('/api/sponsorship-contracts').then(res => res.data || res || [])
  });

  // Fetch all physical assets
  const { data: physicalAssets = [] } = useQuery({
    queryKey: ['/api/assets'],
    queryFn: () => apiRequest('/api/assets').then(res => res.data || res || [])
  });

  // Fetch sponsorship asset links
  const { data: sponsorshipAssetLinks = [] } = useQuery({
    queryKey: ['/api/sponsorship-assets'],
    queryFn: () => apiRequest('/api/sponsorship-assets').then(res => res.data || [])
  });

  // Link asset with contract mutation
  const linkAssetMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sponsorship-assets', {
      method: 'POST',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Activo vinculado al contrato exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-assets'] });
      setLocation('/admin/marketing/assets');
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

  const getActiveContracts = () => {
    return contracts.filter((contract: Contract) => contract.status === 'activo');
  };

  const getAvailableAssets = () => {
    // Filter assets that are active and not already linked to the selected contract
    const selectedContractId = parseInt(formData.contractId);
    if (!selectedContractId) {
      return physicalAssets.filter((asset: PhysicalAsset) => asset.status === 'active');
    }
    
    const linkedAssetIds = sponsorshipAssetLinks
      .filter((link: SponsorshipAssetLink) => link.contractId === selectedContractId)
      .map((link: SponsorshipAssetLink) => link.assetId);
    
    return physicalAssets.filter((asset: PhysicalAsset) => 
      asset.status === 'active' && !linkedAssetIds.includes(asset.id)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      contractId: parseInt(formData.contractId),
      assetId: parseInt(formData.assetId),
      branding: formData.branding
    };
    
    linkAssetMutation.mutate(payload);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Vincular Activo con Contrato" 
          subtitle="Crear nueva relación entre activo físico y contrato publicitario"
          icon={<Package />}
          actions={[
            <Button key="back" variant="outline" onClick={() => setLocation('/admin/marketing/assets')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          ]}
        />

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="contractId">Contrato de Patrocinio *</Label>
                <Select 
                  value={formData.contractId} 
                  onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                  data-testid="select-contract"
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar contrato activo" />
                  </SelectTrigger>
                  <SelectContent>
                    {getActiveContracts().map((contract: Contract) => (
                      <SelectItem key={contract.id} value={contract.id.toString()}>
                        {contract.number} - {contract.sponsor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="assetId">Activo Físico *</Label>
                <Select 
                  value={formData.assetId} 
                  onValueChange={(value) => setFormData({ ...formData, assetId: value })}
                  data-testid="select-asset"
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar activo disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableAssets().map((asset: PhysicalAsset) => (
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
                  value={formData.branding}
                  onChange={(e) => setFormData({ ...formData, branding: e.target.value })}
                  placeholder="Ej: Logo en esquina superior derecha, Placa conmemorativa, Código QR, etc."
                  rows={3}
                  required
                  data-testid="input-branding"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setLocation('/admin/marketing/assets')}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={linkAssetMutation.isPending || !formData.contractId || !formData.assetId || !formData.branding} 
                  data-testid="button-submit-link"
                >
                  {linkAssetMutation.isPending ? 'Vinculando...' : 'Vincular Activo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}