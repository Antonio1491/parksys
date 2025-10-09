import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tag, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/ui/page-header';

// Schema de validación para editar categorías
const categorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  description: z.string().optional(),
  color: z.string().default("#00a587"),
  icon: z.string().default("tag"),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// Página de gestión de categorías de actividades
const ActivityCategoriesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener categorías de actividades
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/activity-categories'],
    retry: 1,
  });

  // Obtener actividades para contar por categoría
  const { data: activities = [] } = useQuery({
    queryKey: ['/api/activities'],
    retry: 1,
  });

  // Formulario para editar categorías
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#00a587",
      icon: "tag",
      isActive: true,
    },
  });

  // Formulario para crear categorías
  const createForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#00a587",
      icon: "tag",
      isActive: true,
    },
  });

  // Mutación para crear categoría
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return apiRequest('/api/activity-categories', {
        method: 'POST',
        data: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activity-categories'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Categoría creada",
        description: "La nueva categoría se creó correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la categoría.",
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar categoría
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: number; updates: CategoryFormData }) => {
      return apiRequest(`/api/activity-categories/${data.id}`, {
        method: 'PUT',
        data: data.updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activity-categories'] });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      toast({
        title: "Categoría actualizada",
        description: "La categoría se actualizó correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la categoría.",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar categoría
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      return apiRequest(`/api/activity-categories/${categoryId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activity-categories'] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría se eliminó correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la categoría.",
        variant: "destructive",
      });
    },
  });

  // Función para abrir el diálogo de edición
  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    form.reset({
      name: category.name || "",
      description: category.description || "",
      color: category.color || "#00a587",
      icon: category.icon || "tag",
      isActive: category.isActive !== false,
    });
    setIsEditDialogOpen(true);
  };

  // Función para crear nueva categoría
  const handleCreateCategory = () => {
    setIsCreateDialogOpen(true);
    createForm.reset({
      name: "",
      description: "",
      color: "#00a587",
      icon: "tag",
      isActive: true,
    });
  };

  // Función para enviar el formulario de creación
  const handleSubmitCreate = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data);
  };

  // Función para enviar el formulario de edición
  const handleSubmitEdit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        updates: data,
      });
    }
  };

  // Función para eliminar categoría
  const handleDeleteCategory = (categoryId: number) => {
    deleteCategoryMutation.mutate(categoryId);
  };

  // Contar actividades por categoría (usar la misma lógica que activities.tsx)
  const categoryCounts = Array.isArray(activities) ? activities.reduce((acc: any, activity: any) => {
    // Usar la misma lógica de obtención de categoría que activities.tsx
    let categoryName = 'Sin categoría';
    
    if (activity.category) {
      categoryName = activity.category;
    } else if (activity.categoryName) {
      categoryName = activity.categoryName;
    }
    
    acc[categoryName] = (acc[categoryName] || 0) + 1;
    return acc;
  }, {}) : {};

  // Función para obtener los colores de las categorías (igual que en activities.tsx)
  const getCategoryColors = (categoryName: string) => {
    switch (categoryName) {
      case 'Arte y Cultura':
        return 'bg-green-100 text-green-800';
      case 'Recreación y Bienestar':
        return 'bg-blue-100 text-blue-800';
      case 'Eventos de Temporada':
        return 'bg-orange-100 text-orange-800';
      case 'Deportivo':
        return 'bg-red-100 text-red-800';
      case 'Comunidad':
        return 'bg-purple-100 text-purple-800';
      case 'Naturaleza y Ciencia':
        return 'bg-teal-100 text-teal-800';
      case 'Fitness y Ejercicio':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Crear datos de categorías basados en los datos del servidor
  const categoryData = (categories as any[])
    .map((category: any) => ({
      id: category.id,
      name: category.name,
      description: category.description || '',
      count: categoryCounts[category.name] || 0,
      color: category.color || '#00a587',
      icon: category.icon || 'calendar',
      isActive: category.isActive !== false
    }))
    .filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con PageHeader component */}
        <PageHeader
          title="Categorías"
          subtitle="Gestión de categorías para actividades en parques"
          icon={<Tag />}
          actions={[
            <Button 
              key="nueva-categoria"
              variant="primary"
              onClick={handleCreateCategory}
            >
              <Plus size={16} />
              Nueva Categoría
            </Button>
          ]}
        />

          {/* Barra de búsqueda y contador */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between gap-4">
              {/* Campo de búsqueda a la izquierda */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar categorías"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
  
              {/* Contador de categorías a la derecha */}
              <div className="flex items-center gap-2 bg-[#ceefea] px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-gray-700">Categorías Registradas</span>
                <span className="text-sm font-bold text-gray-900">|</span>
                <span className="text-sm font-bold text-gray-900">{categoryData.length}</span>
              </div>
            </div>
          </div>

          {/* Tabla de categorías */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left w-[30%]">Nombre</TableHead>
                  <TableHead className="text-left w-[35%]">Descripción</TableHead>
                  <TableHead className="text-left w-[20%]">Actividades</TableHead>
                  <TableHead className="text-left w-[15%]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Cargando categorías...
                    </TableCell>
                  </TableRow>
                ) : categoryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No se encontraron categorías
                    </TableCell>
                  </TableRow>
                ) : (
                  categoryData.map((category, index) => (
                    <TableRow key={category.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-4 w-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: category.color }}
                            title={`Color: ${category.color}`}
                          />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {category.description}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="border border-gray-300 text-gray-800"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.count} actividades
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            disabled={updateCategoryMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={deleteCategoryMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. La categoría "{category.name}" será eliminada permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

        {/* Diálogo de edición */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Categoría</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmitEdit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la categoría</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Arte y Cultura" {...field} />
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
                          placeholder="Descripción opcional de la categoría..."
                          {...field}
                        />
                      </FormControl>
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
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { name: 'Verde lima', hex: '#cff9c5' },
                            { name: 'Azul cielo', hex: '#c5efff' },
                            { name: 'Lila', hex: '#f1e3ff' },
                            { name: 'Coral', hex: '#f9cac5' },
                            { name: 'Amarillo', hex: '#f7f6c6' },
                            { name: 'Naranja', hex: '#efcda5' },
                            { name: 'Azul', hex: '#a6b2ed' },
                            { name: 'Verde', hex: '#99dd9c' },
                            { name: 'Cyan', hex: '#a6e2df' },
                            { name: 'Rosa', hex: '#e0a6d2' },
                          ].map((color) => (
                            <button
                              key={color.hex}
                              type="button"
                              onClick={() => field.onChange(color.hex)}
                              className={`w-full h-10 rounded-md border-2 transition-all ${
                                field.value === color.hex 
                                  ? 'border-gray-900 scale-110' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Estado de la categoría
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          {field.value ? "Categoría activa y disponible" : "Categoría inactiva (no se muestra en formularios)"}
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={updateCategoryMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateCategoryMutation.isPending}
                  >
                    {updateCategoryMutation.isPending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Diálogo de creación */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nueva Categoría</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleSubmitCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la categoría</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Arte y Cultura" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción opcional de la categoría..."
                          {...field}
                        />
                      </FormControl>
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
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { name: 'Verde lima', hex: '#cff9c5' },
                            { name: 'Azul cielo', hex: '#c5efff' },
                            { name: 'Lila', hex: '#f1e3ff' },
                            { name: 'Coral', hex: '#f9cac5' },
                            { name: 'Amarillo', hex: '#f7f6c6' },
                            { name: 'Naranja', hex: '#efcda5' },
                            { name: 'Azul', hex: '#a6b2ed' },
                            { name: 'Verde', hex: '#99dd9c' },
                            { name: 'Cyan', hex: '#a6e2df' },
                            { name: 'Rosa', hex: '#e0a6d2' },
                          ].map((color) => (
                            <button
                              key={color.hex}
                              type="button"
                              onClick={() => field.onChange(color.hex)}
                              className={`w-full h-10 rounded-md border-2 transition-all ${
                                field.value === color.hex 
                                  ? 'border-gray-900 scale-110' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Estado de la categoría
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          {field.value ? "Categoría activa y disponible" : "Categoría inactiva (no se muestra en formularios)"}
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={createCategoryMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createCategoryMutation.isPending}
                  >
                    {createCategoryMutation.isPending ? "Creando..." : "Crear categoría"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ActivityCategoriesPage;