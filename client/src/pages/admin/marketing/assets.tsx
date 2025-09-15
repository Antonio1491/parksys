import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Package, MapPin, Users, DollarSign, Star, Clock, Building, Link2, Unlink, Settings } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/ui/page-header';

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

export default function SponsoredAssetsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

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


  // Unlink asset from contract mutation
  const unlinkAssetMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sponsorship-assets/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: 'Activo desvinculado del contrato exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsorship-assets'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al desvincular activo',
        description: error.message,
        variant: 'destructive'
      });
    }
  });



  const handleUnlinkAsset = (linkId: number) => {
    if (confirm('¿Estás seguro de que deseas desvincular este activo del contrato?')) {
      unlinkAssetMutation.mutate(linkId);
    }
  };


  const filteredLinks = sponsorshipAssetLinks.filter((link: SponsorshipAssetLink) => {
    if (!searchTerm.trim()) return true;
    const matchesSearch = (link.assetName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (link.sponsorName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Activos de Marketing" 
          subtitle='Gestión de relaciones entre activos físicos y contratos publicitarios'
          icon={<Package />}
          actions={[
            <Button 
              key="new"
              variant="primary"
              onClick={() => setLocation('/admin/marketing/assets/new')}
              data-testid="button-new-asset-link">
              <Plus className="mr-2 stroke-[4]" />
              Nuevo
            </Button>
          ]}
        />

        {/* Search bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre de activo o patrocinador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Main Content - Asset Links */}
        {filteredLinks.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Activos Vinculados a Contratos ({filteredLinks.length})
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
                    {filteredLinks.map((link: SponsorshipAssetLink) => (
                      <tr key={link.id} className="border-b hover:bg-gray-50" data-testid={`row-asset-link-${link.id}`}>
                        <td className="p-2">
                          <div className="font-medium">{link.assetName || `Activo #${link.assetId}`}</div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">Contrato #{link.contractId}</Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {link.sponsorName || 'Sin nombre'}
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
                          {link.createdAt ? new Date(link.createdAt).toLocaleDateString('es-ES') : '—'}
                        </td>
                        <td className="p-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlinkAsset(link.id)}
                            disabled={unlinkAssetMutation.isPending}
                            data-testid={`button-unlink-${link.id}`}
                          >
                            <Unlink className="h-4 w-4 mr-1" />
                            Desvincular
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Package className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium">No hay activos vinculados</h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'No se encontraron resultados para tu búsqueda'
                      : 'Comienza vinculando activos físicos con contratos publicitarios'
                    }
                  </p>
                </div>
                {!searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/admin/marketing/assets/new')}
                    data-testid="button-create-first-link"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Vincular Primer Activo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}