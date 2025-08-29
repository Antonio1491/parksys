import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, FileUp, Filter, ArrowUpDown, Search, Activity } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";
import AmenityIcon from "@/components/AmenityIcon";
import { apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/ui/page-header";

const AVAILABLE_ICONS = [
  { name: "playground", label: "Juegos infantiles" },
  { name: "sports", label: "Deportes" },
  { name: "bathroom", label: "Baños" },
  { name: "parking", label: "Estacionamiento" },
  { name: "restaurant", label: "Restaurante" },
  { name: "bench", label: "Bancas" },
  { name: "fountain", label: "Fuente" },
  { name: "wifi", label: "WiFi" },
  { name: "security", label: "Seguridad" },
  { name: "garden", label: "Jardín" },
  { name: "park", label: "Parque" },
];

interface AmenityFormData {
  name: string;
  icon: string;
  category: string;
  iconType: 'system' | 'custom';
  customIconUrl: string | null;
}

type Amenity = {
  id: number;
  name: string;
  icon: string | null;
  category?: string;
  parksCount?: number;
  totalModules?: number;
  createdAt: Date;
  iconType?: 'system' | 'custom';
  customIconUrl?: string | null;
};

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    recreacion: "Recreación",
    "recreación": "Recreación",
    deportes: "Deportes", 
    servicios: "Servicios",
    naturaleza: "Naturaleza",
    cultura: "Cultura",
    accesibilidad: "Accesibilidad",
    infraestructura: "Infraestructura"
  };
  
  // Si existe en el mapeo predefinido, usarlo
  if (labels[category]) {
    return labels[category];
  }
  
  // Si es una categoría personalizada, convertir a formato legible
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const AdminAmenitiesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentAmenity, setCurrentAmenity] = useState<Amenity | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "parksCount" | "category">("parksCount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState<AmenityFormData>({
    name: "",
    icon: "park",
    category: "servicios",
    iconType: 'system',
    customIconUrl: null
  });

  // Estado para nueva categoría
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Fetch amenities with park count
  const { data: amenitiesData, isLoading } = useQuery({
    queryKey: ["/api/amenities/dashboard"],
  });

  // Query para obtener íconos custom disponibles
  const { data: customIcons } = useQuery({
    queryKey: ["/api/amenities/custom-icons"],
    queryFn: () => apiRequest("/api/amenities/custom-icons"),
  });

  const amenities = amenitiesData?.allAmenities || [];

  // Filtrado y ordenamiento
  const filteredAndSortedAmenities = amenities
    .filter((amenity: Amenity) => {
      const matchesSearch = amenity.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || amenity.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a: Amenity, b: Amenity) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "parksCount":
          aValue = a.parksCount || 0;
          bValue = b.parksCount || 0;
          break;
        case "category":
          aValue = getCategoryLabel(a.category || "");
          bValue = getCategoryLabel(b.category || "");
          break;
        default:
          return 0;
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Cálculos de paginación
  const totalItems = filteredAndSortedAmenities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAmenities = filteredAndSortedAmenities.slice(startIndex, endIndex);

  // Reset página cuando cambien los filtros
  const resetPage = () => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  };

  // useEffect para resetear página cuando cambien filtros
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterCategory, sortBy, sortOrder, currentPage, totalPages]);

  // Obtener categorías únicas para el filtro
  const uniqueCategories = Array.from(
    new Set(amenities.map((amenity: Amenity) => amenity.category).filter(Boolean))
  ).sort();

  // File upload mutation
  const uploadIconMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('icon', file);
      
      const response = await fetch('/api/amenities/upload-icon', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir el icono');
      }
      
      return response.json();
    },
  });

  // Create amenity mutation
  const createAmenity = useMutation({
    mutationFn: async (data: AmenityFormData) => {
      // If custom icon, upload it first
      let finalData = { ...data };
      
      if (data.iconType === 'custom' && uploadedFile) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadIconMutation.mutateAsync(uploadedFile);
          finalData.customIconUrl = uploadResult.iconUrl;
          finalData.icon = 'custom';
        } catch (error) {
          throw new Error('Error al subir el icono personalizado');
        } finally {
          setIsUploading(false);
        }
      }
      
      return apiRequest("/api/amenities", { method: "POST", data: finalData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/dashboard"] });
      toast({ title: "Amenidad creada exitosamente" });
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        icon: "park",
        category: "servicios",
        iconType: 'system',
        customIconUrl: null
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Error al crear amenidad";
      toast({ title: errorMessage, variant: "destructive" });
    },
  });

  // Update amenity mutation
  const updateAmenity = useMutation({
    mutationFn: async (data: AmenityFormData & { id: number }) => {
      return apiRequest(`/api/amenities/${data.id}`, { method: "PUT", data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/dashboard"] });
      toast({ title: "Amenidad actualizada exitosamente" });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error al actualizar amenidad", variant: "destructive" });
    },
  });

  // Delete amenity mutation
  const deleteAmenity = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/amenities/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      // Invalidar múltiples queries para asegurar actualización completa
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ["/api/amenities/dashboard"] });
      
      toast({ title: "Amenidad eliminada exitosamente" });
      setIsDeleteDialogOpen(false);
      setCurrentAmenity(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Amenidad no encontrada";
      toast({ 
        title: "No se puede eliminar", 
        description: errorMessage,
        variant: "destructive" 
      });
      
      // También cerrar el diálogo en caso de error para evitar estados inconsistentes
      setIsDeleteDialogOpen(false);
      setCurrentAmenity(null);
      
      // Refrescar datos para asegurar sincronización con el servidor
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/dashboard"] });
    },
  });

  // Import amenities mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/amenities/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al importar amenidades');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/dashboard"] });
      toast({ 
        title: "Importación exitosa", 
        description: `Se importaron ${data.count} amenidades correctamente` 
      });
      setIsImportDialogOpen(false);
      setImportFile(null);
    },
    onError: () => {
      toast({ title: "Error al importar amenidades", variant: "destructive" });
    },
  });

  const handleEditClick = (amenity: Amenity) => {
    setCurrentAmenity(amenity);
    setFormData({
      name: amenity.name,
      icon: amenity.icon || 'park',
      category: amenity.category || 'servicios',
      iconType: 'system',
      customIconUrl: null
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (amenity: Amenity) => {
    setCurrentAmenity(amenity);
    setIsDeleteDialogOpen(true);
  };

  const handleParksClick = (amenityId: number) => {
    // Navegar a la página de parques con el filtro de amenidad activado
    const url = `/admin/parks?amenity=${amenityId}`;
    setLocation(url);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAmenity.mutate(formData);
  };

  const handleBulkIconUpload = async () => {
    if (!importFile || !Array.isArray(importFile) || importFile.length === 0) return;
    
    const category = newCategoryName || "servicios";
    setIsUploading(true);
    
    try {
      // Create FormData for bulk upload
      const formData = new FormData();
      importFile.forEach((file: File) => {
        formData.append('icons', file);
      });
      formData.append('category', category);
      
      // Use bulk upload endpoint
      const response = await fetch('/api/amenities/bulk-upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la carga masiva');
      }
      
      const result = await response.json();
      
      // Show detailed results
      if (result.successCount > 0) {
        toast({ 
          title: `${result.successCount} amenidades creadas exitosamente`,
          description: result.failedCount > 0 ? `${result.failedCount} archivos fallaron` : undefined
        });
        queryClient.invalidateQueries({ queryKey: ["/api/amenities/dashboard"] });
      }
      
      if (result.failedCount > 0 && result.successCount === 0) {
        toast({ 
          title: "Error en la carga masiva", 
          description: `${result.failedCount} archivos fallaron`,
          variant: "destructive" 
        });
      }
      
      // Close dialog and reset
      setIsImportDialogOpen(false);
      setImportFile(null);
      setNewCategoryName("");
      
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast({ 
        title: "Error en la carga masiva", 
        description: error instanceof Error ? error.message : "Ocurrió un error durante el proceso",
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmenity) {
      updateAmenity.mutate({ ...formData, id: currentAmenity.id });
    }
  };

  const handleDeleteConfirm = () => {
    if (currentAmenity) {
      deleteAmenity.mutate(currentAmenity.id);
    }
  };

  const handleImport = () => {
    if (importFile) {
      importMutation.mutate(importFile);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando amenidades...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header con PageHeader component */}
      <PageHeader
        title="Gestión de Amenidades"
        subtitle="Gestiona las amenidades disponibles para los parques"
        icon={<Activity />}
        actions={[
          <Link key="importar" href="/admin/amenities-import">
            <Button variant="outline" className="bg-white text-gray-900 hover:bg-gray-100">
              <FileUp className="mr-2 h-4 w-4" />
              Importar
            </Button>
          </Link>,
          <Dialog key="nueva-amenidad" open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-gray-900 hover:bg-gray-100">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Amenidad
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Amenidad</DialogTitle>
                <DialogDescription>
                  Agrega una nueva amenidad para asignar a los parques
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre de la amenidad</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej. Juegos infantiles"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoría</Label>
                  {!isCreatingNewCategory ? (
                    <div className="space-y-2">
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recreacion">Recreación</SelectItem>
                          <SelectItem value="deportes">Deportes</SelectItem>
                          <SelectItem value="servicios">Servicios</SelectItem>
                          <SelectItem value="naturaleza">Naturaleza</SelectItem>
                          <SelectItem value="cultura">Cultura</SelectItem>
                          <SelectItem value="accesibilidad">Accesibilidad</SelectItem>
                          <SelectItem value="infraestructura">Infraestructura</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsCreatingNewCategory(true)}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Crear nueva categoría
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Nombre de la nueva categoría"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCategoryName.trim()) {
                              setFormData({ ...formData, category: newCategoryName.toLowerCase().replace(/\s+/g, '_') });
                              setIsCreatingNewCategory(false);
                              setNewCategoryName("");
                            }
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button 
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (newCategoryName.trim()) {
                              setFormData({ ...formData, category: newCategoryName.toLowerCase().replace(/\s+/g, '_') });
                              setIsCreatingNewCategory(false);
                              setNewCategoryName("");
                            }
                          }}
                          disabled={!newCategoryName.trim()}
                        >
                          Agregar
                        </Button>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setIsCreatingNewCategory(false);
                            setNewCategoryName("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                  {formData.category && (
                    <div className="text-sm text-muted-foreground">
                      Categoría seleccionada: {getCategoryLabel(formData.category)}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>Tipo de Icono</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="iconType"
                        value="system"
                        checked={formData.iconType === 'system'}
                        onChange={(e) => setFormData({ ...formData, iconType: e.target.value as 'system' | 'custom' })}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span>Iconos del Sistema</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="iconType"
                        value="custom"
                        checked={formData.iconType === 'custom'}
                        onChange={(e) => setFormData({ ...formData, iconType: e.target.value as 'system' | 'custom' })}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span>Icono Personalizado (PNG)</span>
                    </label>
                  </div>
                </div>

                {formData.iconType === 'system' ? (
                  <div className="grid gap-2">
                    <Label htmlFor="icon">Icono del Sistema</Label>
                    <Select 
                      value={formData.icon} 
                      onValueChange={(value) => setFormData({ ...formData, icon: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un icono" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ICONS.map((icon) => (
                          <SelectItem key={icon.name} value={icon.name}>
                            <div className="flex items-center">
                              <div className="mr-2">
                                <AmenityIcon name={icon.name} size={16} />
                              </div>
                              {icon.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                      <AmenityIcon name={formData.icon} size={20} />
                      <span className="text-sm text-gray-600">Vista previa del icono seleccionado</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div>
                      <Label>Íconos Personalizados Disponibles</Label>
                      {customIcons && customIcons.length > 0 ? (
                        <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg mt-2 max-h-48 overflow-y-auto">
                          {customIcons.map((customIcon: any) => (
                            <div 
                              key={customIcon.name}
                              className={`p-2 border rounded cursor-pointer hover:bg-blue-50 ${
                                formData.customIconUrl === customIcon.custom_icon_url ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                              onClick={() => setFormData({ 
                                ...formData, 
                                customIconUrl: customIcon.custom_icon_url, 
                                icon: 'custom' 
                              })}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <img 
                                  src={customIcon.custom_icon_url} 
                                  alt={customIcon.name}
                                  className="w-8 h-8 object-contain"
                                />
                                <span className="text-xs text-center truncate w-full">{customIcon.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">No hay íconos personalizados disponibles</p>
                      )}
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="custom-icon">O Subir Nuevo Icono Personalizado</Label>
                      <div className="space-y-3">
                        <Input
                          id="custom-icon"
                          type="file"
                          accept=".png,.jpg,.jpeg,.svg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadedFile(file);
                              const url = URL.createObjectURL(file);
                              setFormData({ ...formData, customIconUrl: url, icon: 'custom' });
                            }
                          }}
                          className="cursor-pointer"
                        />
                        {uploadedFile && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded border flex items-center justify-center">
                                {formData.customIconUrl ? (
                                  <img 
                                    src={formData.customIconUrl} 
                                    alt="Vista previa" 
                                    className="w-8 h-8 object-contain"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{uploadedFile.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(uploadedFile.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          Formatos soportados: PNG, JPG, JPEG, SVG. Tamaño recomendado: 24x24 píxeles
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAmenity.isPending || isUploading}>
                    {isUploading ? "Subiendo icono..." : createAmenity.isPending ? "Creando..." : "Crear Amenidad"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ]}
      />

      {/* Controles de filtrado y ordenamiento */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar amenidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          {/* Filtro por categoría */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ordenamiento */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(value: "name" | "parksCount" | "category") => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="parksCount">Parques</SelectItem>
              <SelectItem value="category">Categoría</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mb-4 text-sm text-muted-foreground">
        Página {currentPage} de {totalPages} - Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} amenidades
      </div>

      {/* Amenities Table with Parks Column */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icono</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Parques</TableHead>
              <TableHead>Total Módulos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAmenities?.map((amenity: Amenity) => (
              <TableRow key={amenity.id}>
                <TableCell>
                  <AmenityIcon 
                    name={amenity.icon || 'park'} 
                    size={24} 
                    iconType={amenity.icon === 'custom' ? 'custom' : 'system'}
                    customIconUrl={amenity.customIconUrl}
                  />
                </TableCell>
                <TableCell className="font-medium">{amenity.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getCategoryLabel(amenity.category || 'servicios')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleParksClick(amenity.id)}
                    className="p-2 h-auto hover:bg-blue-50"
                    disabled={!amenity.parksCount || amenity.parksCount === 0}
                  >
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                      {amenity.parksCount || 0} parques
                    </Badge>
                  </Button>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    {amenity.totalModules || 0} módulos
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(amenity)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(amenity)}
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} amenidades
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <div className="flex items-center space-x-1">
              {/* Páginas */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 p-0 ${
                      currentPage === pageNumber 
                        ? "bg-[#00a587] hover:bg-[#067f5f] text-white" 
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Amenidad</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la amenidad
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre de la amenidad</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Categoría</Label>
              {!isCreatingNewCategory ? (
                <div className="space-y-2">
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recreacion">Recreación</SelectItem>
                      <SelectItem value="deportes">Deportes</SelectItem>
                      <SelectItem value="servicios">Servicios</SelectItem>
                      <SelectItem value="naturaleza">Naturaleza</SelectItem>
                      <SelectItem value="cultura">Cultura</SelectItem>
                      <SelectItem value="accesibilidad">Accesibilidad</SelectItem>
                      <SelectItem value="infraestructura">Infraestructura</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsCreatingNewCategory(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear nueva categoría
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Nombre de la nueva categoría"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newCategoryName.trim()) {
                          setFormData({ ...formData, category: newCategoryName.toLowerCase().replace(/\s+/g, '_') });
                          setIsCreatingNewCategory(false);
                          setNewCategoryName("");
                        }
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (newCategoryName.trim()) {
                          setFormData({ ...formData, category: newCategoryName.toLowerCase().replace(/\s+/g, '_') });
                          setIsCreatingNewCategory(false);
                          setNewCategoryName("");
                        }
                      }}
                      disabled={!newCategoryName.trim()}
                    >
                      Agregar
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsCreatingNewCategory(false);
                        setNewCategoryName("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
              {formData.category && (
                <div className="text-sm text-muted-foreground">
                  Categoría seleccionada: {getCategoryLabel(formData.category)}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-icon">Icono</Label>
              <Select 
                value={formData.icon} 
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un icono" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((icon) => (
                    <SelectItem key={icon.name} value={icon.name}>
                      <div className="flex items-center">
                        <div className="mr-2">
                          <AmenityIcon name={icon.name} size={16} />
                        </div>
                        {icon.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateAmenity.isPending}>
                {updateAmenity.isPending ? "Actualizando..." : "Actualizar Amenidad"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la amenidad
              "{currentAmenity?.name}" del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteAmenity.isPending}
            >
              {deleteAmenity.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminAmenitiesPage;