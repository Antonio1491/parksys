import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Eye, Plus, LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import AdminLayout from "@/components/AdminLayout";

// ============================================
// TIPOS E INTERFACES
// ============================================

interface AdSpace {
  id: number;
  pageType: string;
  position: string;
  name: string | null;
  description: string | null;
  dimensions: string | null;
  maxFileSize: number;
  allowedFormats: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ESQUEMAS DE VALIDACIÓN
// ============================================

const spaceSchema = z.object({
  pageType: z.string().min(1, "El tipo de página es requerido"),
  position: z.string().min(1, "La posición es requerida"),
  name: z.string().min(1, "El nombre es requerido").max(255),
  description: z.string().optional(),
  dimensions: z.string().optional(),
  maxFileSize: z.number().min(1).default(5242880), // 5MB por defecto
  allowedFormats: z.string().min(1, "Los formatos permitidos son requeridos"),
  isActive: z.boolean().default(true),
});

type SpaceFormData = z.infer<typeof spaceSchema>;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Spaces() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<AdSpace | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<number | null>(null);

  // React Query - Obtener espacios
  const { data: spacesResponse, isLoading } = useQuery({
    queryKey: ["/api/advertising/spaces"],
  });

  const spaces = spacesResponse?.data || [];

  // Formulario de creación
  const createForm = useForm<SpaceFormData>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      pageType: "home",
      position: "header",
      name: "",
      description: "",
      dimensions: "",
      maxFileSize: 5242880, // 5MB
      allowedFormats: "image/jpeg, image/png, image/gif",
      isActive: true,
    },
  });

  // Formulario de edición
  const editForm = useForm<SpaceFormData>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      pageType: "home",
      position: "header",
      name: "",
      description: "",
      dimensions: "",
      maxFileSize: 5242880,
      allowedFormats: "image/jpeg, image/png, image/gif",
      isActive: true,
    },
  });

  // Mutación - Crear espacio
  const createMutation = useMutation({
    mutationFn: async (data: SpaceFormData) => {
      const payload = {
        pageType: data.pageType,
        position: data.position,
        name: data.name || null,
        description: data.description || null,
        dimensions: data.dimensions || null,
        maxFileSize: data.maxFileSize || 5242880,
        allowedFormats: data.allowedFormats ? data.allowedFormats.split(",").map((f) => f.trim()) : ['image/jpeg', 'image/png', 'image/gif'],
        isActive: data.isActive !== null && data.isActive !== undefined ? data.isActive : true,
      };

      console.log('📦 Creando espacio con payload:', payload);

      const headers = await getAuthHeaders();
      const response = await fetch("/api/advertising/spaces", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(`${response.status}: ${JSON.stringify(errorData)}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/spaces"] });
      setIsCreateModalOpen(false);
      createForm.reset();
      toast({
        title: "Éxito",
        description: "Espacio publicitario creado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el espacio publicitario",
        variant: "destructive",
      });
    },
  });

  // Función para obtener token de Firebase
  const getAuthHeaders = async () => {
    try {
      // Intentar obtener el token de Firebase Auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken();
        return {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        };
      }
    } catch (error) {
      console.warn('No se pudo obtener token de Firebase:', error);
    }

    // Fallback: enviar sin token
    return {
      "Content-Type": "application/json",
    };
  };

  // Mutación - Actualizar espacio
  const updateMutation = useMutation({
    mutationFn: async (data: SpaceFormData & { id: number }) => {
      console.log('📝 Datos RAW del formulario:', data);

      const payload = {
        pageType: data.pageType,
        position: data.position,
        name: data.name || null,
        description: data.description || null,
        dimensions: data.dimensions || null,
        maxFileSize: data.maxFileSize || 5242880,
        allowedFormats: data.allowedFormats ? data.allowedFormats.split(",").map((f) => f.trim()) : ['image/jpeg', 'image/png', 'image/gif'],
        isActive: data.isActive !== null && data.isActive !== undefined ? data.isActive : true,
      };

      console.log('📦 Payload procesado:', payload);

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/advertising/spaces/${data.id}`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(`${response.status}: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log('✅ Respuesta del servidor:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/spaces"] });
      setIsEditModalOpen(false);
      setSelectedSpace(null);
      toast({
        title: "Éxito",
        description: "Espacio publicitario actualizado correctamente",
      });
    },
    onError: (error: any) => {
      console.error('❌ Error en updateMutation:', error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar el espacio publicitario",
        variant: "destructive",
      });
    },
  });

  // Mutación - Eliminar espacio
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/advertising/spaces/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('❌ Error al eliminar:', errorData);
        throw new Error(errorData.error || errorData.message || `Error ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/spaces"] });
      toast({
        title: "Éxito",
        description: "Espacio publicitario eliminado correctamente",
      });
    },
    onError: (error: any) => {
      console.error('❌ Error en deleteMutation:', error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar el espacio publicitario",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreate = (data: SpaceFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (space: AdSpace) => {
    setSelectedSpace(space);

    // Preparar allowedFormats como string
    const formatsString = Array.isArray(space.allowedFormats) && space.allowedFormats.length > 0
      ? space.allowedFormats.join(", ")
      : "image/jpeg, image/png, image/gif";

    // Preparar valores con fallbacks
    const formValues = {
      pageType: space.pageType || "home",
      position: space.position || "header",
      name: space.name || "",
      description: space.description || "",
      dimensions: space.dimensions || "",
      maxFileSize: space.maxFileSize || 5242880,
      allowedFormats: formatsString,
      isActive: space.isActive !== null && space.isActive !== undefined ? space.isActive : true,
    };

    console.log('📝 Cargando datos en formulario de edición:', formValues);

    editForm.reset(formValues);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (data: SpaceFormData) => {
    if (!selectedSpace) return;
    updateMutation.mutate({ ...data, id: selectedSpace.id });
  };

  const handleView = (space: AdSpace) => {
    setSelectedSpace(space);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setSpaceToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (spaceToDelete) {
      deleteMutation.mutate(spaceToDelete);
    }
    setIsDeleteDialogOpen(false);
    setSpaceToDelete(null);
  };

  // Función auxiliar para obtener el badge según el tipo de página
  const getPageTypeBadge = (pageType: string) => {
    const pageConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      home: { label: "Home", variant: "default" },
      parks: { label: "Parques", variant: "secondary" },
      species: { label: "Especies", variant: "outline" },
      activities: { label: "Actividades", variant: "default" },
      concessions: { label: "Concesiones", variant: "secondary" },
      instructors: { label: "Instructores", variant: "outline" },
      all: { label: "Todas", variant: "default" },
    };
    const config = pageConfig[pageType] || { label: pageType, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Función auxiliar para obtener el badge según la posición
  const getPositionBadge = (position: string) => {
    const positionConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      header: { label: "Header", variant: "default" },
      footer: { label: "Footer", variant: "secondary" },
      sidebar: { label: "Sidebar", variant: "outline" },
      content: { label: "Contenido", variant: "default" },
      modal: { label: "Modal", variant: "secondary" },
    };
    const config = positionConfig[position] || { label: position, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Espacios Publicitarios"
          subtitle="Gestiona los espacios disponibles para publicidad en el sistema"
          icon={<LayoutGrid />}
          actions={[
            <Button
              key="create"
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
            >
              <Plus className="md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">{t('actions.add')}</span>
            </Button>,
          ]}
        />

        {/* Tabla de espacios */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo de Página</TableHead>
                <TableHead>Posición</TableHead>
                <TableHead>Dimensiones</TableHead>
                <TableHead>Tamaño Máx.</TableHead>
                <TableHead>Formatos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Cargando espacios publicitarios...
                  </TableCell>
                </TableRow>
              ) : spaces?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No hay espacios publicitarios registrados</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                spaces?.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell className="font-medium">{space.name || "-"}</TableCell>
                    <TableCell>{getPageTypeBadge(space.pageType)}</TableCell>
                    <TableCell>{getPositionBadge(space.position)}</TableCell>
                    <TableCell>
                      {space.dimensions ? (
                        <Badge variant="outline">{space.dimensions}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {(space.maxFileSize / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(space.allowedFormats) && space.allowedFormats.length > 0 ? (
                          space.allowedFormats.slice(0, 2).map((format, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {format.split('/')[1] || format}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {Array.isArray(space.allowedFormats) && space.allowedFormats.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{space.allowedFormats.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={space.isActive ? "default" : "secondary"}>
                        {space.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(space)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(space)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(space.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal de Creación */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Espacio Publicitario</DialogTitle>
              <DialogDescription>
                Crea un nuevo espacio donde se mostrarán anuncios
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Banner Superior" {...field} />
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
                          placeholder="Descripción del espacio publicitario..."
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
                    control={createForm.control}
                    name="pageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Página *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar página" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="parks">Parques</SelectItem>
                            <SelectItem value="species">Especies</SelectItem>
                            <SelectItem value="activities">Actividades</SelectItem>
                            <SelectItem value="concessions">Concesiones</SelectItem>
                            <SelectItem value="instructors">Instructores</SelectItem>
                            <SelectItem value="all">Todas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posición *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar posición" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="header">Header</SelectItem>
                            <SelectItem value="footer">Footer</SelectItem>
                            <SelectItem value="sidebar">Sidebar</SelectItem>
                            <SelectItem value="content">Contenido</SelectItem>
                            <SelectItem value="modal">Modal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="dimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensiones</FormLabel>
                      <FormControl>
                        <Input placeholder="1200x90" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Formato: ancho x alto (ej: 1200x90)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="maxFileSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamaño Máximo de Archivo (bytes) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5242880"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 5242880)}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Por defecto: 5,242,880 bytes (5 MB)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="allowedFormats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formatos Permitidos *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="image/jpeg, image/png, image/gif"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Separar con comas (ej: image/jpeg, image/png, image/gif)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Activo</SelectItem>
                          <SelectItem value="false">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creando..." : "Crear Espacio"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Modal de Vista */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Espacio Publicitario</DialogTitle>
            </DialogHeader>
            {selectedSpace && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-base">{selectedSpace.name || "-"}</p>
                </div>
                {selectedSpace.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                    <p className="text-base">{selectedSpace.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo de Página</p>
                    <div className="mt-1">{getPageTypeBadge(selectedSpace.pageType)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Posición</p>
                    <div className="mt-1">{getPositionBadge(selectedSpace.position)}</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dimensiones</p>
                  <p className="text-base">{selectedSpace.dimensions || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tamaño Máximo de Archivo</p>
                  <p className="text-base">{(selectedSpace.maxFileSize / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Formatos Permitidos</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Array.isArray(selectedSpace.allowedFormats) && selectedSpace.allowedFormats.map((format, idx) => (
                      <Badge key={idx} variant="secondary">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    <Badge variant={selectedSpace.isActive ? "default" : "secondary"}>
                      {selectedSpace.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Edición */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Espacio Publicitario</DialogTitle>
              <DialogDescription>
                Modifica los datos del espacio publicitario
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Banner Superior" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del espacio publicitario..."
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
                    control={editForm.control}
                    name="pageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Página *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar página" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="parks">Parques</SelectItem>
                            <SelectItem value="species">Especies</SelectItem>
                            <SelectItem value="activities">Actividades</SelectItem>
                            <SelectItem value="concessions">Concesiones</SelectItem>
                            <SelectItem value="instructors">Instructores</SelectItem>
                            <SelectItem value="all">Todas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posición *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar posición" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="header">Header</SelectItem>
                            <SelectItem value="footer">Footer</SelectItem>
                            <SelectItem value="sidebar">Sidebar</SelectItem>
                            <SelectItem value="content">Contenido</SelectItem>
                            <SelectItem value="modal">Modal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="dimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensiones</FormLabel>
                      <FormControl>
                        <Input placeholder="1200x90" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Formato: ancho x alto (ej: 1200x90)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="maxFileSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamaño Máximo de Archivo (bytes) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5242880"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 5242880)}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Por defecto: 5,242,880 bytes (5 MB)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="allowedFormats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formatos Permitidos *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="image/jpeg, image/png, image/gif"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Separar con comas (ej: image/jpeg, image/png, image/gif)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Activo</SelectItem>
                          <SelectItem value="false">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* AlertDialog de confirmación de eliminación */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente este espacio publicitario.
                {spaceToDelete && (
                  <span className="block mt-2 text-sm font-medium">
                    Nota: Si el espacio tiene asignaciones activas, no podrá ser eliminado.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}