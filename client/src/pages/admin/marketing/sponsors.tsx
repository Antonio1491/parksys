import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Mail, Phone, Globe, MapPin, Star, Building, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/ui/page-header';

interface Sponsor {
  id: number;
  name: string;
  category: string;
  logo?: string;
  tier: number;
  representative?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contractValue?: string;
  eventsSponsored?: number;
  renewalProbability?: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const tierNames = {
  1: "Diamante",
  2: "Platino",
  3: "Oro",
  4: "Plata",
  5: "Bronce",
  6: "Cobre",
  7: "Hierro",
  8: "Zinc",
  9: "Estaño",
  10: "Plomo"
};

const tierColors = {
  1: "bg-blue-100 text-blue-800",
  2: "bg-gray-100 text-gray-800", 
  3: "bg-yellow-100 text-yellow-800",
  4: "bg-gray-50 text-gray-600",
  5: "bg-orange-100 text-orange-800",
  6: "bg-red-100 text-red-800",
  7: "bg-slate-100 text-slate-800",
  8: "bg-zinc-100 text-zinc-800",
  9: "bg-stone-100 text-stone-800",
  10: "bg-neutral-100 text-neutral-800"
};

export default function SponsorsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    tier: '1',
    representative: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    contractValue: '',
    status: 'activo',
    notes: ''
  });

  // Fetch sponsors
  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ['/api/sponsors'],
    queryFn: () => apiRequest('/api/sponsors').then(res => res.data || [])
  });

  // Create sponsor mutation
  const createSponsorMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sponsors', {
      method: 'POST',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Patrocinador creado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsors'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al crear patrocinador',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update sponsor mutation
  const updateSponsorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest(`/api/sponsors/${id}`, {
      method: 'PUT',
      data
    }),
    onSuccess: () => {
      toast({ title: 'Patrocinador actualizado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsors'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al actualizar patrocinador',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete sponsor mutation
  const deleteSponsorMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sponsors/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: 'Patrocinador eliminado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsors'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error al eliminar patrocinador',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const filteredSponsors = sponsors.filter((sponsor: Sponsor) => {
    const matchesSearch = sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sponsor.representative?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sponsor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || sponsor.category === filterCategory;
    const matchesStatus = !filterStatus || sponsor.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      tier: '1',
      representative: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      contractValue: '',
      status: 'activo',
      notes: ''
    });
    setSelectedSponsor(null);
  };

  const handleEdit = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setFormData({
      name: sponsor.name || '',
      category: sponsor.category || '',
      tier: sponsor.tier?.toString() || '1',
      representative: sponsor.representative || '',
      email: sponsor.email || '',
      phone: sponsor.phone || '',
      website: sponsor.website || '',
      address: sponsor.address || '',
      city: sponsor.city || '',
      state: sponsor.state || '',
      zipCode: sponsor.zipCode || '',
      contractValue: sponsor.contractValue || '',
      status: sponsor.status || 'activo',
      notes: sponsor.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSponsor) {
      updateSponsorMutation.mutate({ 
        id: selectedSponsor.id, 
        data: { ...formData, tier: parseInt(formData.tier) }
      });
    } else {
      createSponsorMutation.mutate({ ...formData, tier: parseInt(formData.tier) });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este patrocinador?')) {
      deleteSponsorMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gestión de Patrocinadores"
          description="Administra patrocinadores, contratos y relaciones comerciales"
        />

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Buscar patrocinadores</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Buscar por nombre, representante o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Label>Categoría</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las categorías</SelectItem>
                    <SelectItem value="corporativo">Corporativo</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="institucional">Institucional</SelectItem>
                    <SelectItem value="ong">ONG</SelectItem>
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
                    <SelectItem value="">Todos los estados</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Patrocinador
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedSponsor ? 'Editar Patrocinador' : 'Nuevo Patrocinador'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nombre de la Empresa *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Categoría *</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="corporativo">Corporativo</SelectItem>
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="institucional">Institucional</SelectItem>
                            <SelectItem value="ong">ONG</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="tier">Nivel de Patrocinio</Label>
                        <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(tierNames).map(([tier, name]) => (
                              <SelectItem key={tier} value={tier}>
                                Nivel {tier} - {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Estado</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="inactivo">Inactivo</SelectItem>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="suspendido">Suspendido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="representative">Representante</Label>
                        <Input
                          id="representative"
                          value={formData.representative}
                          onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Sitio Web</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="contractValue">Valor del Contrato</Label>
                        <Input
                          id="contractValue"
                          value={formData.contractValue}
                          onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                          placeholder="$0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Ciudad</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Notas Adicionales</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createSponsorMutation.isPending || updateSponsorMutation.isPending}>
                        {createSponsorMutation.isPending || updateSponsorMutation.isPending ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Sponsors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSponsors.map((sponsor: Sponsor) => (
            <Card key={sponsor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {sponsor.name}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{sponsor.category}</Badge>
                      <Badge className={tierColors[sponsor.tier as keyof typeof tierColors] || 'bg-gray-100 text-gray-800'}>
                        <Star className="h-3 w-3 mr-1" />
                        {tierNames[sponsor.tier as keyof typeof tierNames] || `Nivel ${sponsor.tier}`}
                      </Badge>
                      <Badge variant={sponsor.status === 'activo' ? 'default' : 'secondary'}>
                        {sponsor.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(sponsor)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(sponsor.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sponsor.representative && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      {sponsor.representative}
                    </div>
                  )}
                  {sponsor.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      {sponsor.email}
                    </div>
                  )}
                  {sponsor.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      {sponsor.phone}
                    </div>
                  )}
                  {sponsor.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {sponsor.website}
                      </a>
                    </div>
                  )}
                  {(sponsor.city || sponsor.state) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {[sponsor.city, sponsor.state].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {sponsor.contractValue && (
                    <div className="mt-3 p-2 bg-green-50 rounded">
                      <div className="text-sm text-green-600 font-medium">
                        Valor del Contrato: {sponsor.contractValue}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSponsors.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                {searchTerm || filterCategory || filterStatus 
                  ? 'No se encontraron patrocinadores que coincidan con los filtros.'
                  : 'No hay patrocinadores registrados aún.'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}