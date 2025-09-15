import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertConsumableCategorySchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui/page-header';
import { 
  FolderPlus, Edit2, Trash2, Tag, FolderOpen, 
  TreePine, Settings, Plus, ChevronRight, Package,
  Wrench, Hammer, Search, Filter, X, ChevronLeft, 
  LayoutGrid, List, ChevronDown, Upload, FileText, 
  Download, Droplets, Brush, Shirt, Shield, Lightbulb, Car
} from 'lucide-react';

// ===== TIPOS Y ESQUEMAS =====

interface ConsumableCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  parentId: number | null;
  parentName?: string;
  createdAt: string;
  updatedAt: string;
  childrenCount?: number;
  hasChildren?: boolean;
  level?: number;
  pathNames?: string;
}

// Extender el schema compartido para reglas de UI adicionales
const categorySchema = insertConsumableCategorySchema.extend({
  icon: z.string().min(1, "Selecciona un ícono"),
  color: z.string().min(4, "Selecciona un color"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres")
});

type CategoryFormData = z.infer<typeof categorySchema>;

// ===== ÍCONOS DISPONIBLES PARA ALMACÉN =====
const WAREHOUSE_ICONS = [
  { value: 'package', label: 'Material de Oficina', icon: Package },
  { value: 'wrench', label: 'Herramientas', icon: Wrench },
  { value: 'hammer', label: 'Construcción', icon: Hammer },
  { value: 'droplets', label: 'Productos Químicos', icon: Droplets },
  { value: 'brush', label: 'Limpieza', icon: Brush },
  { value: 'treePine', label: 'Jardinería', icon: TreePine },
  { value: 'shirt', label: 'Uniformes', icon: Shirt },
  { value: 'shield', label: 'Seguridad', icon: Shield },
  { value: 'lightbulb', label: 'Iluminación', icon: Lightbulb },
  { value: 'car', label: 'Vehículos', icon: Car },
  { value: 'settings', label: 'Equipos', icon: Settings },
  { value: 'tag', label: 'General', icon: Tag },
];

// ===== COLORES DISPONIBLES =====
const AVAILABLE_COLORS = [
  { value: '#00a587', label: 'Verde Principal', bg: 'bg-green-600' },
  { value: '#067f5f', label: 'Verde Parques', bg: 'bg-green-700' },
  { value: '#3B82F6', label: 'Azul', bg: 'bg-blue-500' },
  { value: '#10B981', label: 'Verde', bg: 'bg-emerald-500' },
  { value: '#F59E0B', label: 'Naranja', bg: 'bg-amber-500' },
  { value: '#6366F1', label: 'Índigo', bg: 'bg-indigo-500' },
  { value: '#EC4899', label: 'Rosa', bg: 'bg-pink-500' },
  { value: '#8B5CF6', label: 'Púrpura', bg: 'bg-violet-500' },
  { value: '#EF4444', label: 'Rojo', bg: 'bg-red-500' },
  { value: '#14B8A6', label: 'Teal', bg: 'bg-teal-500' },
];

// ===== COMPONENTE PRINCIPAL =====
const WarehouseCategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ConsumableCategory | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  
  // Estado para manejar categorías expandidas en vista jerárquica
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'principal' | 'subcategoria'>('all');
  const [selectedIcon, setSelectedIcon] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'compact' | 'extended'>('compact');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Formulario
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'package',
      color: '#00a587',
      parentId: null,
    },
  });

  // ===== CONSULTAS =====
  
  // Todas las categorías
  const { data: allCategories = [], isLoading } = useQuery<ConsumableCategory[]>({
    queryKey: ['/api/warehouse/categories'],
  });

  // Categorías principales
  const { data: parentCategories = [] } = useQuery<ConsumableCategory[]>({
    queryKey: ['/api/warehouse/categories/parents'],
  });

  // Estructura de árbol
  const { data: treeStructure = [] } = useQuery<ConsumableCategory[]>({
    queryKey: ['/api/warehouse/categories/tree/structure'],
  });

  // ===== LÓGICA DE FILTROS Y PAGINACIÓN =====
  
  // Obtener iconos únicos de las categorías
  const uniqueIcons = useMemo(() => {
    const icons = Array.from(new Set(allCategories.map(cat => cat.icon)));
    return icons.sort();
  }, [allCategories]);

  // Aplicar filtros
  const filteredCategories = useMemo(() => {
    let filtered = allCategories;

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (category.parentName?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(category => {
        if (selectedType === 'principal') return category.parentId === null;
        if (selectedType === 'subcategoria') return category.parentId !== null;
        return true;
      });
    }

    // Filtro por icono
    if (selectedIcon !== 'all') {
      filtered = filtered.filter(category => category.icon === selectedIcon);
    }

    return filtered;
  }, [allCategories, searchTerm, selectedType, selectedIcon]);

  // Paginación
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  // Reset página cuando cambian filtros
  const resetPage = () => {
    setCurrentPage(1);
  };

  // ===== MUTACIONES =====
  
  // Crear categoría
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await apiRequest('/api/warehouse/categories', { method: 'POST', data });
      return response;
    },
    onSuccess: (response) => {
      console.log('Categoría creada exitosamente:', response);
      
      // Forzar refetch inmediato de todas las queries
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/categories/parents'] });
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/categories/tree/structure'] });
      
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "✅ Categoría creada",
        description: "La categoría se ha creado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Error al crear la categoría",
        variant: "destructive",
      });
    },
  });

  // Actualizar categoría
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryFormData }) => {
      const response = await apiRequest(`/api/warehouse/categories/${id}`, { method: 'PUT', data });
      return response;
    },
    onSuccess: () => {
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/categories/parents'] });
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/categories/tree/structure'] });
      
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      form.reset();
      toast({
        title: "✅ Categoría actualizada",
        description: "La categoría se ha actualizado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Error al actualizar la categoría",
        variant: "destructive",
      });
    },
  });

  // Eliminar categoría
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/warehouse/categories/${id}`, { method: 'DELETE' });
      return response;
    },
    onSuccess: () => {
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/categories/parents'] });
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/categories/tree/structure'] });
      
      toast({
        title: "✅ Categoría eliminada",
        description: "La categoría se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Error al eliminar la categoría",
        variant: "destructive",
      });
    },
  });

  // ===== FUNCIONES DE MANEJO =====
  
  const handleCreate = (data: CategoryFormData) => {
    const finalData = {
      ...data,
      parentId: selectedParentId || data.parentId || null,
    };
    createMutation.mutate(finalData);
  };

  const handleEdit = (category: ConsumableCategory) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      parentId: category.parentId,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: CategoryFormData) => {
    if (!selectedCategory) return;
    updateMutation.mutate({ id: selectedCategory.id, data });
  };

  const handleDelete = (category: ConsumableCategory) => {
    if (window.confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const openCreateDialog = (parentId: number | null = null) => {
    setSelectedParentId(parentId);
    form.reset({
      name: '',
      description: '',
      icon: 'package',
      color: '#00a587',
      parentId: parentId,
    });
    setIsCreateDialogOpen(true);
  };

  // Funciones para expandir/contraer categorías
  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const expandAll = () => {
    const allParentIds = parentCategories.filter(cat => {
      const children = allCategories.filter(child => child.parentId === cat.id);
      return children.length > 0;
    }).map(cat => cat.id);
    setExpandedCategories(new Set(allParentIds));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // ===== COMPONENTES DE RENDERIZADO =====
  
  const renderIcon = (iconName: string, size = 20) => {
    const IconComponent = WAREHOUSE_ICONS.find(i => i.value === iconName)?.icon || Package;
    return <IconComponent size={size} />;
  };

  const CategoryCard = ({ category, isSubcategory = false }: { category: ConsumableCategory; isSubcategory?: boolean }) => (
    <Card className={`transition-all hover:shadow-md ${isSubcategory ? 'ml-6 border-l-4' : ''}`} 
          style={isSubcategory ? { borderLeftColor: category.color } : {}}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
              {renderIcon(category.icon, 24)}
            </div>
            <div>
              <h3 className="font-semibold text-lg" data-testid={`category-name-${category.id}`}>{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-600 mt-1" data-testid={`category-description-${category.id}`}>
                  {category.description}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {category.parentName && (
                  <Badge variant="outline" className="text-xs">
                    📁 {category.parentName}
                  </Badge>
                )}
                {category.hasChildren && (
                  <Badge variant="secondary" className="text-xs">
                    {category.childrenCount} subcategoría(s)
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!isSubcategory && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openCreateDialog(category.id)}
                data-testid={`button-add-subcategory-${category.id}`}
              >
                <Plus size={16} />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(category)}
              data-testid={`button-edit-${category.id}`}
            >
              <Edit2 size={16} />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(category)}
              data-testid={`button-delete-${category.id}`}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con PageHeader component */}
        <PageHeader
          title="Categorías de Consumibles"
          subtitle="Gestión de categorías para productos y materiales del almacén"
          icon={<Package />}
          actions={[
            <Button 
              key="nueva-categoria"
              onClick={() => openCreateDialog()}
              data-testid="button-create-category"
            >
              <FolderPlus size={16} className="mr-2" />
              Nueva Categoría
            </Button>
          ]}
        />

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Categorías</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-categories">
                    {allCategories.length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categorías Principales</p>
                  <p className="text-2xl font-bold" data-testid="stat-parent-categories">
                    {parentCategories.length}
                  </p>
                </div>
                <FolderOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Subcategorías</p>
                  <p className="text-2xl font-bold" data-testid="stat-subcategories">
                    {allCategories.filter(cat => cat.parentId !== null).length}
                  </p>
                </div>
                <Tag className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activas</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="stat-active-categories">
                    {allCategories.length}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter size={20} />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    resetPage();
                  }}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              <Select value={selectedType} onValueChange={(value: any) => {
                setSelectedType(value);
                resetPage();
              }}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder="Tipo de categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="principal">Principales</SelectItem>
                  <SelectItem value="subcategoria">Subcategorías</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedIcon} onValueChange={(value) => {
                setSelectedIcon(value);
                resetPage();
              }}>
                <SelectTrigger data-testid="select-icon">
                  <SelectValue placeholder="Filtrar por ícono" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los íconos</SelectItem>
                  {uniqueIcons.map(icon => {
                    const iconConfig = WAREHOUSE_ICONS.find(i => i.value === icon);
                    return (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          {iconConfig && renderIcon(icon, 16)}
                          {iconConfig?.label || icon}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger data-testid="select-view-mode">
                  <SelectValue placeholder="Modo de vista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={16} />
                      Compacta
                    </div>
                  </SelectItem>
                  <SelectItem value="extended">
                    <div className="flex items-center gap-2">
                      <List size={16} />
                      Extendida
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de contenido */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list" data-testid="tab-list">Lista</TabsTrigger>
            <TabsTrigger value="hierarchy" data-testid="tab-hierarchy">Jerarquía</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Cargando categorías...</p>
                </CardContent>
              </Card>
            ) : paginatedCategories.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron categorías</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => openCreateDialog()}
                    data-testid="button-create-first-category"
                  >
                    <FolderPlus size={16} className="mr-2" />
                    Crear primera categoría
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedCategories.map(category => (
                    <CategoryCard 
                      key={category.id} 
                      category={category}
                      isSubcategory={category.parentId !== null}
                    />
                  ))}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Mostrando {startIndex + 1}-{Math.min(endIndex, filteredCategories.length)} de {filteredCategories.length} categorías
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft size={16} />
                        Anterior
                      </Button>
                      <span className="flex items-center px-3 py-1 text-sm">
                        {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        data-testid="button-next-page"
                      >
                        Siguiente
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="hierarchy" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Estructura Jerárquica</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandAll} data-testid="button-expand-all">
                  Expandir Todo
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll} data-testid="button-collapse-all">
                  Contraer Todo
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {parentCategories.map(category => {
                const children = allCategories.filter(child => child.parentId === category.id);
                const isExpanded = expandedCategories.has(category.id);
                
                return (
                  <div key={category.id} className="space-y-2">
                    <Card className="border-l-4" style={{ borderLeftColor: category.color }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {children.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(category.id)}
                                className="p-1 h-8 w-8"
                                data-testid={`button-toggle-${category.id}`}
                              >
                                {isExpanded ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </Button>
                            )}
                            {children.length === 0 && <div className="w-8" />}
                            
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                              {renderIcon(category.icon, 24)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg" data-testid={`hierarchy-category-name-${category.id}`}>
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className="text-sm text-gray-600">{category.description}</p>
                              )}
                              <div className="flex gap-2 mt-1">
                                <Badge variant="default" className="text-xs">Principal</Badge>
                                {children.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {children.length} subcategoría(s)
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCreateDialog(category.id)}
                              data-testid={`button-add-subcategory-hierarchy-${category.id}`}
                            >
                              <Plus size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(category)}
                              data-testid={`button-edit-hierarchy-${category.id}`}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(category)}
                              data-testid={`button-delete-hierarchy-${category.id}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {isExpanded && children.map(child => (
                      <div key={child.id} className="ml-8">
                        <CategoryCard category={child} isSubcategory={true} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Diálogo de Crear Categoría */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nueva Categoría de Consumibles</DialogTitle>
              <DialogDescription>
                Crea una nueva categoría para organizar los productos y materiales del almacén.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la categoría</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Herramientas de Jardinería" 
                          {...field} 
                          data-testid="input-category-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción de la categoría..."
                          {...field}
                          data-testid="input-category-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ícono</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category-icon">
                              <SelectValue placeholder="Selecciona un ícono" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WAREHOUSE_ICONS.map(icon => (
                              <SelectItem key={icon.value} value={icon.value}>
                                <div className="flex items-center gap-2">
                                  {renderIcon(icon.value, 16)}
                                  {icon.label}
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
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category-color">
                              <SelectValue placeholder="Selecciona un color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AVAILABLE_COLORS.map(color => (
                              <SelectItem key={color.value} value={color.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded ${color.bg}`} />
                                  {color.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {parentCategories.length > 0 && (
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría padre (opcional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))}
                          value={field.value?.toString() || "null"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-parent-category">
                              <SelectValue placeholder="Selecciona categoría padre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">Sin categoría padre (Principal)</SelectItem>
                            {parentCategories.map(parent => (
                              <SelectItem key={parent.id} value={parent.id.toString()}>
                                <div className="flex items-center gap-2">
                                  {renderIcon(parent.icon, 16)}
                                  {parent.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={createMutation.isPending}
                    data-testid="button-cancel-create"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-confirm-create"
                  >
                    {createMutation.isPending ? "Creando..." : "Crear Categoría"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Editar Categoría */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Categoría</DialogTitle>
              <DialogDescription>
                Modifica la información de la categoría seleccionada.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la categoría</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Herramientas de Jardinería" 
                          {...field} 
                          data-testid="input-edit-category-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción de la categoría..."
                          {...field}
                          data-testid="input-edit-category-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ícono</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-category-icon">
                              <SelectValue placeholder="Selecciona un ícono" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WAREHOUSE_ICONS.map(icon => (
                              <SelectItem key={icon.value} value={icon.value}>
                                <div className="flex items-center gap-2">
                                  {renderIcon(icon.value, 16)}
                                  {icon.label}
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
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-category-color">
                              <SelectValue placeholder="Selecciona un color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AVAILABLE_COLORS.map(color => (
                              <SelectItem key={color.value} value={color.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded ${color.bg}`} />
                                  {color.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {parentCategories.length > 0 && (
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría padre (opcional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))}
                          value={field.value?.toString() || "null"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-parent-category">
                              <SelectValue placeholder="Selecciona categoría padre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">Sin categoría padre (Principal)</SelectItem>
                            {parentCategories
                              .filter(parent => parent.id !== selectedCategory?.id)
                              .map(parent => (
                                <SelectItem key={parent.id} value={parent.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    {renderIcon(parent.icon, 16)}
                                    {parent.name}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={updateMutation.isPending}
                    data-testid="button-cancel-edit"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-confirm-edit"
                  >
                    {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default WarehouseCategoriesPage;