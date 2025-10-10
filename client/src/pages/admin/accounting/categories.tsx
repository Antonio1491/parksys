import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { FolderTree, Plus, Edit, Trash2, Search, ChevronRight, ChevronLeft, Eye, Filter, Grid, List, FileText, Building, CreditCard, PiggyBank, Wallet } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';

const categorySchema = z.object({
  code: z.string().min(1, 'Código es requerido'),
  name: z.string().min(1, 'Nombre es requerido'),
  level: z.enum(['1', '2', '3', '4', '5']),
  parent_id: z.string().optional(),
  sat_code: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  type: z.enum(['activo', 'pasivo', 'capital', 'ingreso', 'costo', 'gasto']),
  nature: z.enum(['deudora', 'acreedora']),
  account_type: z.enum(['mayor', 'movimiento']),
  color: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function AccountingCategories() {
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('1');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategoryForView, setSelectedCategoryForView] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['/api/accounting/categories'],
    enabled: true
  });

  const categories = categoriesData?.categories || [];

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      code: '',
      name: '',
      level: '1',
      parent_id: 'none',
      sat_code: 'none',
      description: '',
      is_active: true,
      type: 'activo',
      nature: 'deudora',
      account_type: 'mayor',
      color: '#00a587',
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest('/api/accounting/sync-financial-categories', {
      method: 'POST',
      body: JSON.stringify({})
    }),
    onSuccess: () => {
      toast({
        title: "Sincronización exitosa",
        description: "Las categorías financieras se han sincronizado con las categorías contables"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/categories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error en sincronización",
        description: error.message || "No se pudo sincronizar con el módulo financiero",
        variant: "destructive"
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => apiRequest('/api/accounting/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Categoría creada",
        description: "La categoría contable ha sido creada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/categories'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al crear la categoría contable.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) => 
      apiRequest(`/api/accounting/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Categoría actualizada",
        description: "La categoría contable ha sido actualizada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/categories'] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al actualizar la categoría contable.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/accounting/categories/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      toast({
        title: "Categoría eliminada",
        description: "La categoría contable ha sido eliminada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/categories'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al eliminar la categoría contable.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CategoryFormData) => {
    // Convert "none" to null for parent_id and sat_code
    const formData = {
      ...data,
      parent_id: data.parent_id === "none" ? null : data.parent_id,
      sat_code: data.sat_code === "none" ? null : data.sat_code
    };
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    form.reset({
      code: category.code,
      name: category.name,
      level: category.level,
      parent_id: category.parent_id ? category.parent_id.toString() : 'none',
      sat_code: category.sat_code || 'none',
      description: category.description || '',
      is_active: category.is_active,
      type: category.type || 'activo',
      nature: category.nature || 'deudora',
      account_type: category.account_type || 'mayor',
      color: category.color || '#00a587',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar esta categoría?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewCategory = (category: any) => {
    setSelectedCategoryForView(category);
    setIsViewDialogOpen(true);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedLevel, statusFilter]);

  const filteredCategories = categories?.filter((category: any) => {
    const matchesSearch = category.name.toLowerCase().includes(search.toLowerCase()) ||
                         category.code.toLowerCase().includes(search.toLowerCase()) ||
                         (category.sat_code && category.sat_code.toLowerCase().includes(search.toLowerCase()));
    const matchesLevel = selectedLevel === 'all' || category.level === parseInt(selectedLevel);
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && category.is_active) ||
                         (statusFilter === 'inactive' && !category.is_active);
    return matchesSearch && matchesLevel && matchesStatus;
  }) || [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-green-100 text-green-800',
      5: 'bg-blue-100 text-blue-800',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getLevelName = (level: number) => {
    const names = {
      1: 'Nivel A',
      2: 'Nivel B', 
      3: 'Nivel C',
      4: 'Nivel D',
      5: 'Nivel E'
    };
    return names[level as keyof typeof names] || `Nivel ${level}`;
  };

  const getLevelIcon = (level: number) => {
    const icons = {
      1: <Building className="h-5 w-5" />,
      2: <CreditCard className="h-5 w-5" />,
      3: <PiggyBank className="h-5 w-5" />,
      4: <Wallet className="h-5 w-5" />,
      5: <FileText className="h-5 w-5" />
    };
    return icons[level as keyof typeof icons] || <FolderTree className="h-5 w-5" />;
  };

  const getParentCategories = (level: string) => {
    if (!categories) return [];
    const parentLevels = {
      '2': [1],
      '3': [1, 2],
      '4': [1, 2, 3],
      '5': [1, 2, 3, 4],
    };
    const validLevels = parentLevels[level as keyof typeof parentLevels] || [];
    return categories.filter((cat: any) => validLevels.includes(cat.level));
  };

  // Calcular estadísticas por nivel
  const levelStats = categories.reduce((acc: any, cat: any) => {
    const level = cat.level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  // Obtener códigos SAT disponibles para el selector
  const availableSatCodes = categories.filter((cat: any) => cat.sat_code && cat.sat_code.trim() !== '')
    .map((cat: any) => ({ code: cat.sat_code, name: cat.name }))
    .filter((item: any, index: number, self: any[]) => 
      index === self.findIndex((t: any) => t.code === item.code)
    )
    .sort((a: any, b: any) => a.code.localeCompare(b.code));

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
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
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
          <div>
            <div className="flex items-center gap-2">
              <FolderTree className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Categorías Contables</h1>
            </div>
            <p className="text-gray-600 mt-2">Gestión del catálogo de cuentas contables jerárquico</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4 mr-2" />
              Tarjetas
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>

            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              variant="outline"
              size="sm"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Finanzas'}
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCategory(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Categoría
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" aria-describedby="category-form-description">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                  </DialogTitle>
                  <p id="category-form-description" className="text-sm text-muted-foreground">
                    {editingCategory ? 'Modifica los datos de la categoría contable' : 'Crea una nueva categoría contable con código SAT oficial'}
                  </p>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: 1.1.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nivel</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione nivel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">Nivel A</SelectItem>
                                <SelectItem value="2">Nivel B</SelectItem>
                                <SelectItem value="3">Nivel C</SelectItem>
                                <SelectItem value="4">Nivel D</SelectItem>
                                <SelectItem value="5">Nivel E</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre de la categoría" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="activo">Activo</SelectItem>
                                <SelectItem value="pasivo">Pasivo</SelectItem>
                                <SelectItem value="capital">Capital</SelectItem>
                                <SelectItem value="ingreso">Ingreso</SelectItem>
                                <SelectItem value="costo">Costo</SelectItem>
                                <SelectItem value="gasto">Gasto</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Naturaleza</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione naturaleza" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="deudora">Deudora</SelectItem>
                                <SelectItem value="acreedora">Acreedora</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="account_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Cuenta</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione tipo de cuenta" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mayor">Mayor</SelectItem>
                                <SelectItem value="movimiento">de Movimiento</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sat_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código SAT</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione código SAT" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Sin código SAT</SelectItem>
                                {availableSatCodes.map((cat: any) => (
                                  <SelectItem key={cat.code} value={cat.code}>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-mono text-blue-600">{cat.code}</span>
                                      <span>- {cat.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="parent_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría Padre</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione categoría padre" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Sin categoría padre</SelectItem>
                                {getParentCategories(form.watch('level')).map((cat: any) => (
                                  <SelectItem key={cat.id} value={cat.id.toString()}>
                                    {cat.code} - {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Input placeholder="Descripción de la categoría" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {editingCategory ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por código, nombre o SAT..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  <SelectItem value="1">Nivel A</SelectItem>
                  <SelectItem value="2">Nivel B</SelectItem>
                  <SelectItem value="3">Nivel C</SelectItem>
                  <SelectItem value="4">Nivel D</SelectItem>
                  <SelectItem value="5">Nivel E</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {filteredCategories.length} categorías
                </Badge>
                {filteredCategories.length !== categories.length && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setSelectedLevel('all');
                      setStatusFilter('all');
                    }}
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs por nivel */}
        <Tabs value={selectedLevel} onValueChange={setSelectedLevel}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="1">Nivel A</TabsTrigger>
            <TabsTrigger value="2">Nivel B</TabsTrigger>
            <TabsTrigger value="3">Nivel C</TabsTrigger>
            <TabsTrigger value="4">Nivel D</TabsTrigger>
            <TabsTrigger value="5">Nivel E</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedLevel} className="mt-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {[1, 2, 3, 4, 5].map((level) => (
                <Card key={level}>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        {getLevelIcon(level)}
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{levelStats[level] || 0}</div>
                        <p className="text-sm text-muted-foreground">
                          {getLevelName(level)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Categories Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCategories.map((category: any) => (
                  <Card key={category.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getLevelIcon(category.level)}
                          <Badge className={getLevelColor(category.level)}>
                            {getLevelName(category.level)}
                          </Badge>
                        </div>
                        <Badge variant={category.is_active ? 'default' : 'secondary'}>
                          {category.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Código: <span className="font-mono font-semibold">{category.code}</span></div>
                        {category.sat_code && (
                          <div className="flex items-center space-x-2">
                            <span>SAT: <span className="font-mono font-semibold text-blue-600">{category.sat_code}</span></span>
                            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                              Oficial
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.description && (
                          <p className="text-sm text-gray-600">{category.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Naturaleza: {category.account_nature === 'debit' ? 'Deudora' : 'Acreedora'}
                          </span>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCategory(category)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nivel
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Código
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SAT
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentCategories.map((category: any) => (
                          <tr key={category.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {getLevelIcon(category.level)}
                                <Badge className={`ml-2 ${getLevelColor(category.level)}`}>
                                  {getLevelName(category.level)}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono text-sm">{category.code}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {category.name}
                              </div>
                              {category.description && (
                                <div className="text-sm text-gray-500">
                                  {category.description}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {category.sat_code ? (
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-sm font-semibold text-blue-600">{category.sat_code}</span>
                                  <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                    Oficial
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                {category.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewCategory(category)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(category)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(category.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredCategories.length)} de {filteredCategories.length} categorías
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? 'bg-[#00a587] hover:bg-[#067f5f]' : ''}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog para ver categoría */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Detalles de la Categoría
              </DialogTitle>
            </DialogHeader>
            {selectedCategoryForView && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Código</label>
                    <p className="mt-1 text-sm font-mono">{selectedCategoryForView.code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nivel</label>
                    <div className="mt-1 flex items-center space-x-2">
                      {getLevelIcon(selectedCategoryForView.level)}
                      <Badge className={getLevelColor(selectedCategoryForView.level)}>
                        {getLevelName(selectedCategoryForView.level)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p className="mt-1 text-sm">{selectedCategoryForView.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Código SAT</label>
                    <p className="mt-1 text-sm font-mono">{selectedCategoryForView.sat_code || 'No asignado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <div className="mt-1">
                      <Badge variant={selectedCategoryForView.is_active ? 'default' : 'secondary'}>
                        {selectedCategoryForView.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Naturaleza de la Cuenta</label>
                  <p className="mt-1 text-sm">
                    {selectedCategoryForView.account_nature === 'debit' ? 'Deudora' : 'Acreedora'}
                  </p>
                </div>
                {selectedCategoryForView.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Descripción</label>
                    <p className="mt-1 text-sm">{selectedCategoryForView.description}</p>
                  </div>
                )}
                {selectedCategoryForView.full_path && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ruta Jerárquica</label>
                    <p className="mt-1 text-sm font-mono">{selectedCategoryForView.full_path}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                    <p className="mt-1 text-sm">
                      {selectedCategoryForView.created_at 
                        ? new Date(selectedCategoryForView.created_at).toLocaleDateString('es-MX')
                        : 'No disponible'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Última Actualización</label>
                    <p className="mt-1 text-sm">
                      {selectedCategoryForView.updated_at 
                        ? new Date(selectedCategoryForView.updated_at).toLocaleDateString('es-MX')
                        : 'No disponible'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}