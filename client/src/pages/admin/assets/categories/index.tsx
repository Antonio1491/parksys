import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  TreePine, Settings, Plus, ChevronRight, Building2,
  Wrench, Car, Lightbulb, Camera, Wifi, Search,
  Filter, X, ChevronLeft, LayoutGrid, List, ChevronDown
} from 'lucide-react';

// ===== TIPOS Y ESQUEMAS =====

interface AssetCategory {
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

const categorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  icon: z.string().min(1, "Selecciona un ícono"),
  color: z.string().min(4, "Selecciona un color"),
  parentId: z.number().nullable().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// ===== ÍCONOS DISPONIBLES =====
const AVAILABLE_ICONS = [
  { value: 'building2', label: 'Infraestructura', icon: Building2 },
  { value: 'wrench', label: 'Herramientas', icon: Wrench },
  { value: 'car', label: 'Vehículos', icon: Car },
  { value: 'lightbulb', label: 'Iluminación', icon: Lightbulb },
  { value: 'camera', label: 'Seguridad', icon: Camera },
  { value: 'wifi', label: 'Tecnología', icon: Wifi },
  { value: 'tag', label: 'General', icon: Tag },
  { value: 'settings', label: 'Equipos', icon: Settings },
  { value: 'treePine', label: 'Jardinería', icon: TreePine },
  { value: 'folderOpen', label: 'Categoría', icon: FolderOpen },
];

// ===== COLORES DISPONIBLES =====
const AVAILABLE_COLORS = [
  { value: '#3B82F6', label: 'Azul', bg: 'bg-blue-500' },
  { value: '#10B981', label: 'Verde', bg: 'bg-emerald-500' },
  { value: '#F59E0B', label: 'Naranja', bg: 'bg-amber-500' },
  { value: '#6366F1', label: 'Índigo', bg: 'bg-indigo-500' },
  { value: '#EC4899', label: 'Rosa', bg: 'bg-pink-500' },
  { value: '#8B5CF6', label: 'Púrpura', bg: 'bg-violet-500' },
  { value: '#EF4444', label: 'Rojo', bg: 'bg-red-500' },
  { value: '#14B8A6', label: 'Teal', bg: 'bg-teal-500' },
  { value: '#067f5f', label: 'Verde Parques', bg: 'bg-green-700' },
  { value: '#00a587', label: 'Verde Principal', bg: 'bg-green-600' },
];

// ===== COMPONENTE PRINCIPAL =====
const AssetCategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  
  // Estado para manejar categorías expandidas en vista jerárquica
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  
  // Estado para controlar expansión en Estructura de Árbol
  const [showSubcategoriesInTree, setShowSubcategoriesInTree] = useState(true);
  
  // Estado para paginación en Estructura de Árbol
  const [treeCurrentPage, setTreeCurrentPage] = useState(1);
  
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
      icon: 'tag',
      color: '#3B82F6',
      parentId: null,
    },
  });

  // ===== CONSULTAS =====
  
  // Todas las categorías
  const { data: allCategories = [], isLoading } = useQuery<AssetCategory[]>({
    queryKey: ['/api/asset-categories'],
  });



  // Categorías principales
  const { data: parentCategories = [] } = useQuery<AssetCategory[]>({
    queryKey: ['/api/asset-categories/parents'],
  });

  // Estructura de árbol
  const { data: treeStructure = [] } = useQuery<AssetCategory[]>({
    queryKey: ['/api/asset-categories/tree/structure'],
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
      const response = await apiRequest('/api/asset-categories', { method: 'POST', data });
      return await response.json();
    },
    onSuccess: (response) => {
      console.log('Categoría creada exitosamente:', response);
      
      // Forzar refetch inmediato de todas las queries
      queryClient.refetchQueries({ queryKey: ['/api/asset-categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/asset-categories/parents'] });
      queryClient.refetchQueries({ queryKey: ['/api/asset-categories/tree/structure'] });
      
      // También invalidar después del refetch
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/asset-categories'] });
        queryClient.invalidateQueries({ queryKey: ['/api/asset-categories/parents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/asset-categories/tree/structure'] });
      }, 100);
      
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
      const response = await apiRequest(`/api/asset-categories/${id}`, { method: 'PUT', data });
      return await response.json();
    },
    onSuccess: () => {
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ['/api/asset-categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/asset-categories/parents'] });
      queryClient.refetchQueries({ queryKey: ['/api/asset-categories/tree/structure'] });
      
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
      const response = await apiRequest(`/api/asset-categories/${id}`, { method: 'DELETE' });
      return await response.json();
    },
    onSuccess: () => {
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ['/api/asset-categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/asset-categories/parents'] });
      queryClient.refetchQueries({ queryKey: ['/api/asset-categories/tree/structure'] });
      
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

  const handleEdit = (category: AssetCategory) => {
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

  const handleDelete = (category: AssetCategory) => {
    if (window.confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const openCreateDialog = (parentId: number | null = null) => {
    setSelectedParentId(parentId);
    form.reset({
      name: '',
      description: '',
      icon: 'tag',
      color: '#3B82F6',
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
    const IconComponent = AVAILABLE_ICONS.find(i => i.value === iconName)?.icon || Tag;
    return <IconComponent size={size} />;
  };

  const CategoryCard = ({ category, isSubcategory = false }: { category: AssetCategory; isSubcategory?: boolean }) => (
    <Card className={`transition-all hover:shadow-md ${isSubcategory ? 'ml-6 border-l-4' : ''}`} 
          style={isSubcategory ? { borderLeftColor: category.color } : {}}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
              {renderIcon(category.icon, 24)}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
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
              >
                <Plus size={16} />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(category)}
            >
              <Edit2 size={16} />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(category)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Componente para vista extendida de categorías con expandir/contraer
  const ExtendedCategoryCard = ({ category }: { category: AssetCategory }) => {
    const children = allCategories.filter(cat => cat.parentId === category.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    
    // Si es una subcategoría, mostrar vista simple
    if (category.parentId) {
      return (
        <Card className="transition-all hover:shadow-md ml-8 border-l-4" 
              style={{ borderLeftColor: category.color }}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                    {renderIcon(category.icon, 20)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-medium text-gray-900">{category.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        Subcategoría
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-gray-600 text-sm">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 ml-11">
                  <div className="flex items-center gap-1">
                    <Tag size={12} />
                    <span>ID: {category.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(category)}
                  className="text-green-600 hover:bg-green-50 h-8 w-8 p-0"
                >
                  <Edit2 size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(category)}
                  className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Vista para categorías principales con expandir/contraer
    return (
      <div className="space-y-2">
        <Card className="transition-all hover:shadow-md border-l-4" 
              style={{ borderLeftColor: category.color }}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  {/* Botón expandir/contraer para categorías con hijos */}
                  {hasChildren && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(category.id)}
                      className="p-1 h-8 w-8 hover:bg-gray-100 self-start"
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-blue-600" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-600" />
                      )}
                    </Button>
                  )}
                  {!hasChildren && <div className="w-8" />}
                  
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                    {renderIcon(category.icon, 24)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <Badge variant="default" className="text-xs">
                        Principal
                      </Badge>
                      {hasChildren && (
                        <Badge variant="outline" className="text-xs">
                          {children.length} subcategoría(s)
                        </Badge>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-gray-600 text-sm leading-relaxed">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500 ml-12">
                  <div className="flex items-center gap-2">
                    <Tag size={14} />
                    <span>ID: {category.id}</span>
                  </div>
                  {hasChildren && (
                    <div className="flex items-center gap-2">
                      <ChevronRight size={14} />
                      <span>{children.length} subcategorías</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openCreateDialog(category.id)}
                  className="text-blue-600 hover:bg-blue-50"
                >
                  <Plus size={16} className="mr-1" />
                  Subcategoría
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(category)}
                  className="text-green-600 hover:bg-green-50"
                >
                  <Edit2 size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(category)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subcategorías expandidas */}
        {hasChildren && isExpanded && (
          <div className="space-y-2 border-l-2 border-gray-200 pl-4 ml-4">
            {children.map(child => (
              <ExtendedCategoryCard key={child.id} category={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 w-full">
        {/* Header con PageHeader component */}
        <PageHeader
          title="Categorías de Activos"
          subtitle="Gestiona las categorías jerárquicas para organizar tus activos"
          icon={<Tag />}
          actions={[
            <Button 
              key="nueva-categoria"
              onClick={() => openCreateDialog()}
              variant="principal"
            >
              <FolderPlus className="mr-2" size={20} />
              Nueva Categoría Principal
            </Button>
          ]}
        />

      {/* Tabs de navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">
            <div className="flex items-center gap-2">
              Lista Completa
              <Filter size={14} className="text-blue-500" />
            </div>
          </TabsTrigger>
          <TabsTrigger value="hierarchy">Vista Jerárquica</TabsTrigger>
          <TabsTrigger value="tree">Estructura de Árbol</TabsTrigger>
        </TabsList>

        {/* Vista Jerárquica */}
        <TabsContent value="hierarchy" className="space-y-6">
          {/* Controles de expandir/contraer */}
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="text-blue-600 hover:bg-blue-50"
            >
              <ChevronDown size={16} className="mr-2" />
              Expandir Todo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight size={16} className="mr-2" />
              Contraer Todo
            </Button>
          </div>

          {parentCategories.map(parent => {
            const children = allCategories.filter(cat => cat.parentId === parent.id);
            const hasChildren = children.length > 0;
            const isExpanded = expandedCategories.has(parent.id);
            
            return (
              <div key={parent.id} className="space-y-2">
                {/* Categoría padre con botón de expandir/contraer */}
                <Card className="transition-all hover:shadow-md border-l-4" 
                      style={{ borderLeftColor: parent.color }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Botón expandir/contraer */}
                        {hasChildren && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(parent.id)}
                            className="p-1 h-8 w-8 hover:bg-gray-100"
                          >
                            {isExpanded ? (
                              <ChevronDown size={16} className="text-blue-600" />
                            ) : (
                              <ChevronRight size={16} className="text-gray-600" />
                            )}
                          </Button>
                        )}
                        {!hasChildren && <div className="w-8" />}
                        
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${parent.color}20`, color: parent.color }}>
                          {renderIcon(parent.icon, 24)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{parent.name}</h3>
                          {parent.description && (
                            <p className="text-sm text-gray-600 mt-1">{parent.description}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              Principal
                            </Badge>
                            {hasChildren && (
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
                          onClick={() => openCreateDialog(parent.id)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Plus size={16} className="mr-1" />
                          Subcategoría
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(parent)}
                          className="text-green-600 hover:bg-green-50"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(parent)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subcategorías (se muestran solo si está expandido) */}
                {hasChildren && isExpanded && (
                  <div className="ml-8 space-y-2 border-l-2 border-gray-200 pl-4">
                    {children.map(child => (
                      <Card key={child.id} className="transition-all hover:shadow-sm border-l-4" 
                            style={{ borderLeftColor: child.color }}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${child.color}20`, color: child.color }}>
                                {renderIcon(child.icon, 20)}
                              </div>
                              <div>
                                <h4 className="font-medium text-base">{child.name}</h4>
                                {child.description && (
                                  <p className="text-sm text-gray-600 mt-1">{child.description}</p>
                                )}
                                <Badge variant="outline" className="text-xs mt-1">
                                  Subcategoría
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(child)}
                                className="text-green-600 hover:bg-green-50 h-8 w-8 p-0"
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(child)}
                                className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Categorías sin padre */}
          {allCategories.filter(cat => !cat.parentId && !parentCategories.find(p => p.id === cat.id)).map(category => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </TabsContent>

        {/* Lista Completa con Filtros y Paginación */}
        <TabsContent value="list" className="space-y-6">
          {/* Panel de Filtros */}
          <Card className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Buscar por nombre, descripción o categoría padre..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      resetPage();
                    }}
                    className="pl-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        resetPage();
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X size={14} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Filtro por Tipo */}
              <div>
                <Select 
                  value={selectedType} 
                  onValueChange={(value: 'all' | 'principal' | 'subcategoria') => {
                    setSelectedType(value);
                    resetPage();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Filter size={16} />
                        Todos los tipos
                      </div>
                    </SelectItem>
                    <SelectItem value="principal">
                      <div className="flex items-center gap-2">
                        <FolderOpen size={16} />
                        Principales
                      </div>
                    </SelectItem>
                    <SelectItem value="subcategoria">
                      <div className="flex items-center gap-2">
                        <ChevronRight size={16} />
                        Subcategorías
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Icono */}
              <div>
                <Select 
                  value={selectedIcon} 
                  onValueChange={(value) => {
                    setSelectedIcon(value);
                    resetPage();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Tag size={16} />
                        Todos los iconos
                      </div>
                    </SelectItem>
                    {uniqueIcons.map(iconName => {
                      const IconComponent = AVAILABLE_ICONS.find(i => i.value === iconName)?.icon || Tag;
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <IconComponent size={16} />
                            {AVAILABLE_ICONS.find(i => i.value === iconName)?.label || iconName}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Estadísticas de Filtros */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {paginatedCategories.length} de {filteredCategories.length} categorías
                {filteredCategories.length !== allCategories.length && 
                  ` (${allCategories.length} en total)`
                }
              </div>
              
              {(searchTerm || selectedType !== 'all' || selectedIcon !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                    setSelectedIcon('all');
                    setCurrentPage(1);
                  }}
                  className="text-gray-600"
                >
                  <X size={14} className="mr-1" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </Card>

          {/* Controles de Vista */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredCategories.length)} de {filteredCategories.length} categorías
            </div>
            <div className="flex items-center gap-4">
              {/* Controles de expandir/contraer para vista extendida */}
              {viewMode === 'extended' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={expandAll}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <ChevronDown size={14} className="mr-1" />
                    Expandir Todo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={collapseAll}
                    className="text-gray-600 hover:bg-gray-50"
                  >
                    <ChevronRight size={14} className="mr-1" />
                    Contraer Todo
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Vista:</span>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('compact')}
                    className="rounded-r-none border-r-0"
                  >
                    <LayoutGrid size={16} className="mr-1" />
                    Compacta
                  </Button>
                  <Button
                    variant={viewMode === 'extended' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('extended')}
                    className="rounded-l-none"
                  >
                    <List size={16} className="mr-1" />
                    Extendida
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Grid/Lista de Categorías Filtradas */}
          {viewMode === 'compact' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedCategories.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* En vista extendida, solo mostrar categorías principales - las subcategorías se expanden */}
              {paginatedCategories
                .filter(category => !category.parentId)
                .map(category => (
                  <ExtendedCategoryCard key={category.id} category={category} />
                ))
              }
            </div>
          )}



          {/* Mensaje si no hay resultados */}
          {filteredCategories.length === 0 && (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No se encontraron categorías</h3>
                <p>Prueba ajustando los filtros o términos de búsqueda</p>
              </div>
            </Card>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <Card className="p-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages} - Mostrando {startIndex + 1}-{Math.min(endIndex, filteredCategories.length)} de {filteredCategories.length} categorías
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Botón Anterior */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </Button>

                  {/* Números de página */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (pageNumber > totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className={currentPage === pageNumber ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Botón Siguiente */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Estructura de Árbol */}
        <TabsContent value="tree" className="space-y-2">
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Estructura de Árbol de Categorías</h3>
              
              {/* Control de Expansión Global */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSubcategoriesInTree(!showSubcategoriesInTree);
                  setTreeCurrentPage(1); // Reset a página 1 cuando cambie el estado
                }}
                className="flex items-center gap-2"
              >
                {showSubcategoriesInTree ? (
                  <>
                    <ChevronDown size={16} />
                    Contraer Todo
                  </>
                ) : (
                  <>
                    <ChevronRight size={16} />
                    Expandir Todo
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Contador de elementos visibles */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Mostrando: {Math.min(itemsPerPage, treeStructure.filter(node => showSubcategoriesInTree || node.level === 0).length - (treeCurrentPage - 1) * itemsPerPage)} de {treeStructure.filter(node => showSubcategoriesInTree || node.level === 0).length} categorías
              </span>
              <span>
                Estado: {showSubcategoriesInTree ? 'EXPANDIDO' : 'CONTRAÍDO'} | 
                Página {treeCurrentPage} de {Math.ceil(treeStructure.filter(node => showSubcategoriesInTree || node.level === 0).length / itemsPerPage)}
              </span>
            </div>
          </div>

          {treeStructure
            .filter(node => showSubcategoriesInTree || node.level === 0)
            .slice((treeCurrentPage - 1) * itemsPerPage, treeCurrentPage * itemsPerPage)
            .map(node => (
            <Card key={node.id} className="transition-all hover:shadow-md border-l-4" 
                  style={{ borderLeftColor: node.color }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div style={{ marginLeft: `${(node.level || 0) * 32}px` }} className="flex items-center gap-3">
                    {/* Indicador de nivel */}
                    {node.level && node.level > 0 && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: node.level }, (_, i) => (
                          <div key={i} className="w-1 h-4 bg-gray-300 rounded"></div>
                        ))}
                        <ChevronRight size={16} className="text-gray-500" />
                      </div>
                    )}
                    
                    {/* Icono y contenido */}
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${node.color}20`, color: node.color }}>
                      {renderIcon(node.icon, 20)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">{node.name}</span>
                        
                        {/* Badge de nivel */}
                        <Badge variant={node.level === 0 ? "default" : "secondary"} className="text-xs">
                          {node.level === 0 ? "Principal" : `Nivel ${node.level}`}
                        </Badge>
                        
                        {/* Ruta jerárquica */}
                        {node.pathNames && (
                          <Badge variant="outline" className="text-xs">
                            📁 {node.pathNames}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Descripción si existe */}
                      {allCategories.find(c => c.id === node.id)?.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {allCategories.find(c => c.id === node.id)?.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex gap-2 ml-4">
                    {node.level === 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCreateDialog(node.id)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Plus size={14} className="mr-1" />
                        Sub
                      </Button>
                    )}
                    
                    {/* Indicador de subcategorías ocultas */}
                    {node.level === 0 && !showSubcategoriesInTree && (
                      allCategories.filter(c => c.parentId === node.id).length > 0 && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-300 text-yellow-700">
                          +{allCategories.filter(c => c.parentId === node.id).length} sub
                        </Badge>
                      )
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(allCategories.find(c => c.id === node.id)!)}
                      className="text-green-600 hover:bg-green-50"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(allCategories.find(c => c.id === node.id)!)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Controles de paginación para Estructura de Árbol */}
          {treeStructure.filter(node => showSubcategoriesInTree || node.level === 0).length > itemsPerPage && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Página {treeCurrentPage} de {Math.ceil(treeStructure.filter(node => showSubcategoriesInTree || node.level === 0).length / itemsPerPage)} - Mostrando {((treeCurrentPage - 1) * itemsPerPage) + 1}-{Math.min(treeCurrentPage * itemsPerPage, treeStructure.filter(node => showSubcategoriesInTree || node.level === 0).length)} de {treeStructure.filter(node => showSubcategoriesInTree || node.level === 0).length} categorías
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTreeCurrentPage(Math.max(1, treeCurrentPage - 1))}
                  disabled={treeCurrentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </Button>
                
                {/* Números de página */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(treeStructure.filter(node => showSubcategoriesInTree || node.level === 0).length / itemsPerPage)) }, (_, i) => {
                    const totalPages = Math.ceil(treeStructure.filter(node => showSubcategoriesInTree || node.level === 0).length / itemsPerPage);
                    let startPage = Math.max(1, treeCurrentPage - 2);
                    let endPage = Math.min(totalPages, startPage + 4);
                    
                    if (endPage - startPage < 4) {
                      startPage = Math.max(1, endPage - 4);
                    }
                    
                    const pageNumber = startPage + i;
                    
                    if (pageNumber <= totalPages) {
                      return (
                        <Button
                          key={pageNumber}
                          variant={pageNumber === treeCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTreeCurrentPage(pageNumber)}
                          className={pageNumber === treeCurrentPage ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {pageNumber}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTreeCurrentPage(Math.min(Math.ceil(treeStructure.filter(node => showSubcategoriesInTree || node.level === 0).length / itemsPerPage), treeCurrentPage + 1))}
                  disabled={treeCurrentPage >= Math.ceil(treeStructure.filter(node => showSubcategoriesInTree || node.level === 0).length / itemsPerPage)}
                  className="flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
          
          {/* Mensaje si no hay estructura */}
          {treeStructure.length === 0 && (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <TreePine size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No hay estructura de árbol disponible</h3>
                <p>Crea algunas categorías principales y subcategorías para ver la estructura</p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Estadísticas */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{allCategories.length}</div>
            <div className="text-sm text-gray-600">Total Categorías</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{parentCategories.length}</div>
            <div className="text-sm text-gray-600">Categorías Principales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {allCategories.filter(c => c.parentId).length}
            </div>
            <div className="text-sm text-gray-600">Subcategorías</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.max(...treeStructure.map(n => n.level || 0)) + 1}
            </div>
            <div className="text-sm text-gray-600">Niveles Máximos</div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Crear/Editar */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedCategory(null);
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? 'Nueva Categoría' : 'Editar Categoría'}
            </DialogTitle>
            <DialogDescription>
              {isCreateDialogOpen 
                ? 'Crea una nueva categoría para organizar tus activos'
                : 'Modifica los datos de la categoría seleccionada'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(isCreateDialogOpen ? handleCreate : handleUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Mobiliario Urbano" {...field} />
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
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe brevemente esta categoría..."
                        className="resize-none"
                        rows={3}
                        {...field}
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
                      <FormLabel>Ícono *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar ícono" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AVAILABLE_ICONS.map(icon => (
                            <SelectItem key={icon.value} value={icon.value}>
                              <div className="flex items-center gap-2">
                                <icon.icon size={16} />
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
                      <FormLabel>Color *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AVAILABLE_COLORS.map(color => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${color.bg}`}></div>
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

              {isCreateDialogOpen && (
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría Padre (opcional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))} 
                        value={field.value ? field.value.toString() : selectedParentId?.toString() || "null"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría padre" />
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
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
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

export default AssetCategoriesPage;