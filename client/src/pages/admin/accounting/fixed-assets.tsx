import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest } from '@/lib/queryClient';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Calculator, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react';

interface FixedAsset {
  id: number;
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLife: number;
  depreciationMethod: string;
  currentValue: number;
  accumulatedDepreciation: number;
  location: string;
  description?: string;
  status: 'active' | 'disposed' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

interface FixedAssetForm {
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLife: number;
  depreciationMethod: string;
  location: string;
  description?: string;
}

export default function FixedAssetsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState<FixedAssetForm>({
    name: '',
    category: '',
    acquisitionDate: '',
    acquisitionCost: 0,
    usefulLife: 5,
    depreciationMethod: 'straight-line',
    location: '',
    description: ''
  });

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['/api/accounting/fixed-assets'],
    enabled: true
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/accounting/asset-categories'],
    enabled: true
  });

  const createAssetMutation = useMutation({
    mutationFn: (data: FixedAssetForm) => apiRequest('/api/accounting/fixed-assets', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/fixed-assets'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Activo creado",
        description: "El activo fijo ha sido registrado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el activo fijo",
        variant: "destructive",
      });
    }
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FixedAssetForm }) => 
      apiRequest(`/api/accounting/fixed-assets/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/fixed-assets'] });
      setIsDialogOpen(false);
      setEditingAsset(null);
      resetForm();
      toast({
        title: "Activo actualizado",
        description: "El activo fijo ha sido actualizado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el activo fijo",
        variant: "destructive",
      });
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/accounting/fixed-assets/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/fixed-assets'] });
      toast({
        title: "Activo eliminado",
        description: "El activo fijo ha sido eliminado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el activo fijo",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      acquisitionDate: '',
      acquisitionCost: 0,
      usefulLife: 5,
      depreciationMethod: 'straight-line',
      location: '',
      description: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsset) {
      updateAssetMutation.mutate({ id: editingAsset.id, data: formData });
    } else {
      createAssetMutation.mutate(formData);
    }
  };

  const handleEdit = (asset: FixedAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      category: asset.category,
      acquisitionDate: asset.acquisitionDate,
      acquisitionCost: asset.acquisitionCost,
      usefulLife: asset.usefulLife,
      depreciationMethod: asset.depreciationMethod,
      location: asset.location,
      description: asset.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de que desea eliminar este activo fijo?')) {
      deleteAssetMutation.mutate(id);
    }
  };

  const filteredAssets = assets.filter((asset: FixedAsset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || asset.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum: number, asset: FixedAsset) => sum + asset.currentValue, 0);
  const totalDepreciation = assets.reduce((sum: number, asset: FixedAsset) => sum + asset.accumulatedDepreciation, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'disposed':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'disposed':
        return 'Dado de baja';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return 'Desconocido';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/admin/accounting/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Módulo
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Building className="h-8 w-8 mr-3 text-blue-600" />
                Activos Fijos
              </h1>
              <p className="text-gray-600 mt-1">
                Gestión de activos fijos con depreciación automática
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Activo Fijo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAsset ? 'Editar Activo Fijo' : 'Nuevo Activo Fijo'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Activo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobiliario">Mobiliario</SelectItem>
                        <SelectItem value="equipo-computo">Equipo de Cómputo</SelectItem>
                        <SelectItem value="vehiculos">Vehículos</SelectItem>
                        <SelectItem value="maquinaria">Maquinaria</SelectItem>
                        <SelectItem value="edificios">Edificios</SelectItem>
                        <SelectItem value="equipo-oficina">Equipo de Oficina</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acquisitionDate">Fecha de Adquisición</Label>
                    <Input
                      id="acquisitionDate"
                      type="date"
                      value={formData.acquisitionDate}
                      onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acquisitionCost">Costo de Adquisición</Label>
                    <Input
                      id="acquisitionCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.acquisitionCost}
                      onChange={(e) => setFormData({ ...formData, acquisitionCost: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usefulLife">Vida Útil (años)</Label>
                    <Input
                      id="usefulLife"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.usefulLife}
                      onChange={(e) => setFormData({ ...formData, usefulLife: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depreciationMethod">Método de Depreciación</Label>
                    <Select value={formData.depreciationMethod} onValueChange={(value) => setFormData({ ...formData, depreciationMethod: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight-line">Línea Recta</SelectItem>
                        <SelectItem value="declining-balance">Saldos Decrecientes</SelectItem>
                        <SelectItem value="units-production">Unidades de Producción</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAssetMutation.isPending || updateAssetMutation.isPending}>
                    {editingAsset ? 'Actualizar' : 'Crear'} Activo
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Building className="h-4 w-4 mr-2 text-blue-600" />
                Total de Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalAssets}</div>
              <p className="text-xs text-gray-500 mt-1">Activos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                Valor Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-gray-500 mt-1">Valor neto contable</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                Depreciación Acumulada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDepreciation)}</div>
              <p className="text-xs text-gray-500 mt-1">Total depreciado</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2 min-w-[200px]">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar activos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="mobiliario">Mobiliario</SelectItem>
                    <SelectItem value="equipo-computo">Equipo de Cómputo</SelectItem>
                    <SelectItem value="vehiculos">Vehículos</SelectItem>
                    <SelectItem value="maquinaria">Maquinaria</SelectItem>
                    <SelectItem value="edificios">Edificios</SelectItem>
                    <SelectItem value="equipo-oficina">Equipo de Oficina</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="disposed">Dado de baja</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Activos */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Activos Fijos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Fecha Adquisición</TableHead>
                    <TableHead>Costo Original</TableHead>
                    <TableHead>Valor Actual</TableHead>
                    <TableHead>Depreciación</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset: FixedAsset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>{asset.category}</TableCell>
                      <TableCell>{new Date(asset.acquisitionDate).toLocaleDateString('es-MX')}</TableCell>
                      <TableCell>{formatCurrency(asset.acquisitionCost)}</TableCell>
                      <TableCell>{formatCurrency(asset.currentValue)}</TableCell>
                      <TableCell>{formatCurrency(asset.accumulatedDepreciation)}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(asset.status)}>
                          {getStatusText(asset.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(asset)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(asset.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredAssets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
                  ? 'No se encontraron activos con los filtros aplicados' 
                  : 'No hay activos fijos registrados'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}