import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Mail, Phone, Globe, MapPin, Star, Building, User, Handshake } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui/page-header';

interface Sponsor {
  id: number;
  name: string;
  sector: string;
  logo_url?: string;
  status: string;
  website_url?: string;
  representative?: string;
  contact_info?: {
    phone?: string;
    email?: string;
    social_media?: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
    };
    additional_contacts?: {
      secondary_phone?: string;
      secondary_email?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  "Activo": "bg-green-100 text-green-800",
  "Inactivo": "bg-gray-100 text-gray-800",
  "Suspendido": "bg-red-100 text-red-800"
};

export default function SponsorsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    logo_url: '',
    status: 'Activo',
    website_url: '',
    representative: '',
    contact_info: {
      phone: '',
      email: '',
      social_media: {
        facebook: '',
        twitter: '',
        linkedin: '',
        instagram: ''
      },
      additional_contacts: {
        secondary_phone: '',
        secondary_email: ''
      }
    }
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
                         sponsor.contact_info?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = !filterSector || filterSector === 'all' || sponsor.sector === filterSector;
    const matchesStatus = !filterStatus || filterStatus === 'all' || sponsor.status === filterStatus;
    
    return matchesSearch && matchesSector && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      sector: '',
      logo_url: '',
      status: 'Activo',
      website_url: '',
      representative: '',
      contact_info: {
        phone: '',
        email: '',
        social_media: {
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: ''
        },
        additional_contacts: {
          secondary_phone: '',
          secondary_email: ''
        }
      }
    });
    setSelectedSponsor(null);
  };

  const handleEdit = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setFormData({
      name: sponsor.name || '',
      sector: sponsor.sector || '',
      logo_url: sponsor.logo_url || '',
      status: sponsor.status || 'Activo',
      website_url: sponsor.website_url || '',
      representative: sponsor.representative || '',
      contact_info: {
        phone: sponsor.contact_info?.phone || '',
        email: sponsor.contact_info?.email || '',
        social_media: {
          facebook: sponsor.contact_info?.social_media?.facebook || '',
          twitter: sponsor.contact_info?.social_media?.twitter || '',
          linkedin: sponsor.contact_info?.social_media?.linkedin || '',
          instagram: sponsor.contact_info?.social_media?.instagram || ''
        },
        additional_contacts: {
          secondary_phone: sponsor.contact_info?.additional_contacts?.secondary_phone || '',
          secondary_email: sponsor.contact_info?.additional_contacts?.secondary_email || ''
        }
      }
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSponsor) {
      updateSponsorMutation.mutate({ 
        id: selectedSponsor.id, 
        data: formData
      });
    } else {
      createSponsorMutation.mutate(formData);
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
          title="Patrocinadores"
          subtitle='Gestión de patrocinadores y sus niveles de patrocinio'
          icon={<Handshake />}
          actions={[
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="primary"
                  onClick={resetForm}>
                  <Plus className="mr-2 stroke-[4]" />
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
                      <Label htmlFor="name">Nombre del Patrocinador *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sector">Sector Económico *</Label>
                      <Input
                        id="sector"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        placeholder="Ej: Tecnología, Salud, Educación..."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="logo_url">URL del Logo</Label>
                      <Input
                        id="logo_url"
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Estado</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Activo">Activo</SelectItem>
                          <SelectItem value="Inactivo">Inactivo</SelectItem>
                          <SelectItem value="Suspendido">Suspendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="website_url">Sitio Web</Label>
                      <Input
                        id="website_url"
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="representative">Representante/Contacto</Label>
                      <Input
                        id="representative"
                        value={formData.representative}
                        onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                        placeholder="Nombre del contacto principal"
                      />
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Información de Contacto</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact_phone">Teléfono</Label>
                        <Input
                          id="contact_phone"
                          value={formData.contact_info.phone}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            contact_info: { ...formData.contact_info, phone: e.target.value }
                          })}
                          placeholder="+52 33 1234-5678"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_email">Email</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={formData.contact_info.email}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            contact_info: { ...formData.contact_info, email: e.target.value }
                          })}
                          placeholder="contacto@empresa.com"
                        />
                      </div>
                    </div>

                    {/* Redes Sociales */}
                    <h5 className="font-medium text-gray-700 text-sm">Redes Sociales</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={formData.contact_info.social_media.facebook}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            contact_info: { 
                              ...formData.contact_info, 
                              social_media: { ...formData.contact_info.social_media, facebook: e.target.value }
                            }
                          })}
                          placeholder="https://facebook.com/empresa"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={formData.contact_info.social_media.linkedin}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            contact_info: { 
                              ...formData.contact_info, 
                              social_media: { ...formData.contact_info.social_media, linkedin: e.target.value }
                            }
                          })}
                          placeholder="https://linkedin.com/company/empresa"
                        />
                      </div>
                      <div>
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          value={formData.contact_info.social_media.twitter}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            contact_info: { 
                              ...formData.contact_info, 
                              social_media: { ...formData.contact_info.social_media, twitter: e.target.value }
                            }
                          })}
                          placeholder="https://twitter.com/empresa"
                        />
                      </div>
                      <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.contact_info.social_media.instagram}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            contact_info: { 
                              ...formData.contact_info, 
                              social_media: { ...formData.contact_info.social_media, instagram: e.target.value }
                            }
                          })}
                          placeholder="https://instagram.com/empresa"
                        />
                      </div>
                    </div>

                    {/* Contactos Adicionales */}
                    <h5 className="font-medium text-gray-700 text-sm">Contactos Adicionales</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="secondary_phone">Teléfono Secundario</Label>
                        <Input
                          id="secondary_phone"
                          value={formData.contact_info.additional_contacts.secondary_phone}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            contact_info: { 
                              ...formData.contact_info, 
                              additional_contacts: { ...formData.contact_info.additional_contacts, secondary_phone: e.target.value }
                            }
                          })}
                          placeholder="+52 33 8765-4321"
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondary_email">Email Secundario</Label>
                        <Input
                          id="secondary_email"
                          type="email"
                          value={formData.contact_info.additional_contacts.secondary_email}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            contact_info: { 
                              ...formData.contact_info, 
                              additional_contacts: { ...formData.contact_info.additional_contacts, secondary_email: e.target.value }
                            }
                          })}
                          placeholder="contacto2@empresa.com"
                        />
                      </div>
                    </div>
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
          ]}
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
                <Label>Sector</Label>
                <Select value={filterSector} onValueChange={setFilterSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los sectores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los sectores</SelectItem>
                    <SelectItem value="Tecnología">Tecnología</SelectItem>
                    <SelectItem value="Salud">Salud</SelectItem>
                    <SelectItem value="Educación">Educación</SelectItem>
                    <SelectItem value="Financiero">Financiero</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Alimentario">Alimentario</SelectItem>
                    <SelectItem value="Construcción">Construcción</SelectItem>
                    <SelectItem value="Automotriz">Automotriz</SelectItem>
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
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                    <SelectItem value="Suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>


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
                      <Badge variant="outline">{sponsor.sector}</Badge>
                      <Badge className={statusColors[sponsor.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
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
                  {sponsor.contact_info?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      {sponsor.contact_info.email}
                    </div>
                  )}
                  {sponsor.contact_info?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      {sponsor.contact_info.phone}
                    </div>
                  )}
                  {sponsor.website_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {sponsor.website_url}
                      </a>
                    </div>
                  )}
                  {sponsor.logo_url && (
                    <div className="mt-3">
                      <img src={sponsor.logo_url} alt={`${sponsor.name} logo`} className="h-8 object-contain" />
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
                {searchTerm || filterSector || filterStatus 
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