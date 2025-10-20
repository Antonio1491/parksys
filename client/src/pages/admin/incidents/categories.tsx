import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  X,
  Folder,
  FolderPlus,
  AlertTriangle,
  Tag
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interfaz para formulario de categoría
interface CategoryFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

// Componente para formulario de categoría
const CategoryForm: React.FC<CategoryFormProps> = ({
  mode,
  initialData,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || '#3b82f6'); // Azul por defecto

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id,
      name,
      description,
      color
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la categoría</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Daños, Mantenimiento, Seguridad"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el propósito de esta categoría..."
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center space-x-2">
          <input 
            type="color"
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-8 rounded border"
          />
          <span className="text-sm text-gray-500">{color}</span>
        </div>
      </div>
      
      <div className="pt-4 flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {mode === 'create' ? 'Creando...' : 'Actualizando...'}
            </>
          ) : (
            mode === 'create' ? 'Crear categoría' : 'Actualizar categoría'
          )}
        </Button>
      </div>
    </form>
  );
};

// Interfaz para formulario de subcategoría
interface SubcategoryFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  parentCategoryId?: number;
  categories: any[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

// Componente para el formulario de subcategoría
const SubcategoryForm: React.FC<SubcategoryFormProps> = ({
  mode,
  initialData,
  parentCategoryId,
  categories,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.categoryId?.toString() || parentCategoryId?.toString() || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id,
      name,
      description,
      categoryId: parseInt(categoryId)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Categoría principal</Label>
        <select
          id="category"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id.toString()}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la subcategoría</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Juegos infantiles, Iluminación, Baños"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el propósito de esta subcategoría..."
          rows={3}
        />
      </div>
      
      <div className="pt-4 flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !name.trim() || !categoryId}>
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {mode === 'create' ? 'Creando...' : 'Actualizando...'}
            </>
          ) : (
            mode === 'create' ? 'Crear subcategoría' : 'Actualizar subcategoría'
          )}
        </Button>
      </div>
    </form>
  );
};

// Componente para diálogo de confirmación de eliminación
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  itemType: 'category' | 'subcategory';
  itemName: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  itemType,
  itemName
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogDescription>
            {itemType === 'category' 
              ? 'Esta acción eliminará la categoría y todas sus subcategorías. Las incidencias asociadas se mantendrán pero perderán su categorización.'
              : 'Esta acción eliminará la subcategoría. Las incidencias asociadas se mantendrán pero perderán su subcategorización.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center p-4 bg-amber-50 text-amber-800 rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
            <div>
              <p className="font-medium">¿Estás seguro de eliminar {itemType === 'category' ? 'la categoría' : 'la subcategoría'} "{itemName}"?</p>
              <p className="text-sm">Esta acción no se puede deshacer.</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Componente principal para la gestión de categorías
const IncidentCategoriesPage = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para diálogos
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>(undefined);
  
  // Estados para confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'category' | 'subcategory'>('category');
  
  // Consulta de categorías
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['/api/incident-categories'],
    onError: (error) => {
      console.error("Error al cargar categorías:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive"
      });
    }
  });
  
  // Consulta de subcategorías
  const { 
    data: subcategories = [], 
    isLoading: isLoadingSubcategories,
    refetch: refetchSubcategories
  } = useQuery({
    queryKey: ['/api/incident-subcategories'],
    onError: (error) => {
      console.error("Error al cargar subcategorías:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las subcategorías",
        variant: "destructive"
      });
    }
  });
  
  // Mutación para crear categoría
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/incident-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer direct-token-admin',
          'X-User-Id': '1'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Error al crear la categoría');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incident-categories'] });
      setShowCategoryForm(false);
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada correctamente"
      });
    },
    onError: (error) => {
      console.error("Error al crear categoría:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive"
      });
    }
  });
  
  // Mutación para actualizar categoría
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/incident-categories/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer direct-token-admin',
          'X-User-Id': '1'
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          color: data.color
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar la categoría');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incident-categories'] });
      setEditingCategory(null);
      setShowCategoryForm(false);
      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada correctamente"
      });
    },
    onError: (error) => {
      console.error("Error al actualizar categoría:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive"
      });
    }
  });
  
  // Mutación para eliminar categoría
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/incident-categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer direct-token-admin',
          'X-User-Id': '1'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar la categoría');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incident-categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incident-subcategories'] });
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada correctamente"
      });
    },
    onError: (error) => {
      console.error("Error al eliminar categoría:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive"
      });
    }
  });
  
  // Mutación para crear subcategoría
  const createSubcategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/incident-subcategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer direct-token-admin',
          'X-User-Id': '1'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Error al crear la subcategoría');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incident-subcategories'] });
      setShowSubcategoryForm(false);
      setParentCategoryId(undefined);
      toast({
        title: "Subcategoría creada",
        description: "La subcategoría ha sido creada correctamente"
      });
    },
    onError: (error) => {
      console.error("Error al crear subcategoría:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la subcategoría",
        variant: "destructive"
      });
    }
  });
  
  // Mutación para actualizar subcategoría
  const updateSubcategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/incident-subcategories/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer direct-token-admin',
          'X-User-Id': '1'
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          categoryId: data.categoryId
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar la subcategoría');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incident-subcategories'] });
      setEditingSubcategory(null);
      setShowSubcategoryForm(false);
      toast({
        title: "Subcategoría actualizada",
        description: "La subcategoría ha sido actualizada correctamente"
      });
    },
    onError: (error) => {
      console.error("Error al actualizar subcategoría:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la subcategoría",
        variant: "destructive"
      });
    }
  });
  
  // Mutación para eliminar subcategoría
  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/incident-subcategories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer direct-token-admin',
          'X-User-Id': '1'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar la subcategoría');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incident-subcategories'] });
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      toast({
        title: "Subcategoría eliminada",
        description: "La subcategoría ha sido eliminada correctamente"
      });
    },
    onError: (error) => {
      console.error("Error al eliminar subcategoría:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la subcategoría",
        variant: "destructive"
      });
    }
  });
  
  // Filtrar categorías por búsqueda
  const filteredCategories = categories.filter((category: any) => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Agrupar subcategorías por categoría
  const subcategoriesByCategory = subcategories.reduce((acc: any, subcategory: any) => {
    if (!acc[subcategory.categoryId]) {
      acc[subcategory.categoryId] = [];
    }
    acc[subcategory.categoryId].push(subcategory);
    return acc;
  }, {});
  
  // Función para filtrar subcategorías por búsqueda
  const getFilteredSubcategories = (categoryId: number) => {
    if (!subcategoriesByCategory[categoryId]) return [];
    
    return subcategoriesByCategory[categoryId].filter((subcategory: any) =>
      subcategory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subcategory.description && subcategory.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };
  
  // Manejar creación de categoría
  const handleCreateCategory = (data: any) => {
    createCategoryMutation.mutate(data);
  };
  
  // Manejar actualización de categoría
  const handleUpdateCategory = (data: any) => {
    updateCategoryMutation.mutate(data);
  };
  
  // Manejar eliminación de categoría
  const handleDeleteCategory = (category: any) => {
    setItemToDelete(category);
    setDeleteType('category');
    setShowDeleteConfirm(true);
  };
  
  // Confirmar eliminación de categoría
  const confirmDeleteCategory = () => {
    if (itemToDelete && deleteType === 'category') {
      deleteCategoryMutation.mutate(itemToDelete.id);
    }
  };
  
  // Manejar creación de subcategoría
  const handleCreateSubcategory = (data: any) => {
    createSubcategoryMutation.mutate(data);
  };
  
  // Manejar actualización de subcategoría
  const handleUpdateSubcategory = (data: any) => {
    updateSubcategoryMutation.mutate(data);
  };
  
  // Manejar eliminación de subcategoría
  const handleDeleteSubcategory = (subcategory: any) => {
    setItemToDelete(subcategory);
    setDeleteType('subcategory');
    setShowDeleteConfirm(true);
  };
  
  // Confirmar eliminación de subcategoría
  const confirmDeleteSubcategory = () => {
    if (itemToDelete && deleteType === 'subcategory') {
      deleteSubcategoryMutation.mutate(itemToDelete.id);
    }
  };
  
  // Formatear fecha
  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: es });
  };
  
  // Renderizar estado de carga
  if (isLoadingCategories || isLoadingSubcategories) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  // Renderizar error
  if (isErrorCategories) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar categorías</h2>
            <p className="mb-4">No se pudieron cargar las categorías de incidencias.</p>
            <Button onClick={() => refetchCategories()}>
              Reintentar
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header con patrón Card estandarizado */}
        <Card className="p-4 bg-gray-50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-8 h-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">Categorías de incidencias</h1>
              </div>
              <p className="text-gray-600 mt-2">
                Gestión de categorías y subcategorías para clasificar incidencias
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setEditingSubcategory(null);
                  setShowSubcategoryForm(true);
                }}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Nueva subcategoría
              </Button>
              <Button
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva categoría
              </Button>
            </div>
          </div>
        </Card>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar categorías y subcategorías..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Folder className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay categorías</h3>
              <p className="text-gray-500 mb-4">No se encontraron categorías con los criterios de búsqueda.</p>
              <Button onClick={() => setShowCategoryForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primera categoría
              </Button>
            </div>
          ) : (
            filteredCategories.map((category: any) => {
              const matchingSubcategories = getFilteredSubcategories(category.id);
              
              // Si hay búsqueda y no hay subcategorías que coincidan, no mostrar la categoría
              if (searchQuery && matchingSubcategories.length === 0 && 
                  !category.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
                  !category.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
                return null;
              }
              
              return (
                <Card key={category.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 pb-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: category.color || '#3b82f6' }}
                        ></div>
                        <CardTitle>{category.name}</CardTitle>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2 md:mt-0">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setParentCategoryId(category.id);
                            setEditingSubcategory(null);
                            setShowSubcategoryForm(true);
                          }}
                        >
                          <FolderPlus className="h-4 w-4 mr-2" />
                          Añadir subcategoría
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingCategory(category);
                            setShowCategoryForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                    
                    {category.description && (
                      <CardDescription className="mt-2">
                        {category.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {matchingSubcategories.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No hay subcategorías definidas
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Creada</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {matchingSubcategories.map((subcategory: any) => (
                            <TableRow key={subcategory.id}>
                              <TableCell className="font-medium">{subcategory.name}</TableCell>
                              <TableCell className="max-w-md truncate">
                                {subcategory.description || '-'}
                              </TableCell>
                              <TableCell>{formatDate(subcategory.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setEditingSubcategory(subcategory);
                                      setShowSubcategoryForm(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteSubcategory(subcategory)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
      
      {/* Diálogo para crear/editar categoría */}
      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar categoría' : 'Nueva categoría'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Actualiza los detalles de esta categoría de incidencias'
                : 'Crea una nueva categoría para clasificar incidencias'
              }
            </DialogDescription>
          </DialogHeader>
          
          <CategoryForm
            mode={editingCategory ? 'edit' : 'create'}
            initialData={editingCategory}
            onClose={() => {
              setShowCategoryForm(false);
              setEditingCategory(null);
            }}
            onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
            isSubmitting={editingCategory 
              ? updateCategoryMutation.isPending 
              : createCategoryMutation.isPending
            }
          />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para crear/editar subcategoría */}
      <Dialog open={showSubcategoryForm} onOpenChange={setShowSubcategoryForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubcategory ? 'Editar subcategoría' : 'Nueva subcategoría'}
            </DialogTitle>
            <DialogDescription>
              {editingSubcategory 
                ? 'Actualiza los detalles de esta subcategoría'
                : 'Crea una nueva subcategoría para clasificar incidencias de forma más específica'
              }
            </DialogDescription>
          </DialogHeader>
          
          <SubcategoryForm
            mode={editingSubcategory ? 'edit' : 'create'}
            initialData={editingSubcategory}
            parentCategoryId={parentCategoryId}
            categories={categories}
            onClose={() => {
              setShowSubcategoryForm(false);
              setEditingSubcategory(null);
              setParentCategoryId(undefined);
            }}
            onSubmit={editingSubcategory ? handleUpdateSubcategory : handleCreateSubcategory}
            isSubmitting={editingSubcategory 
              ? updateSubcategoryMutation.isPending 
              : createSubcategoryMutation.isPending
            }
          />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmación para eliminar */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={deleteType === 'category' ? confirmDeleteCategory : confirmDeleteSubcategory}
        isDeleting={deleteType === 'category' 
          ? deleteCategoryMutation.isPending 
          : deleteSubcategoryMutation.isPending
        }
        itemType={deleteType}
        itemName={itemToDelete?.name || ''}
      />
    </AdminLayout>
  );
};

export default IncidentCategoriesPage;