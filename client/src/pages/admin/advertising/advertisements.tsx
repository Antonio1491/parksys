import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFormState } from "react-hook-form";
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
import { Pencil, Trash2, Eye, Plus, Image as ImageIcon, Upload, X, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "@uppy/dashboard";

// ============================================
// TIPOS E INTERFACES
// ============================================

interface Campaign {
  id: number;
  name: string;
  client: string;
  status: string;
}

interface Advertisement {
  id: number;
  campaignId: number | null;
  title: string;
  content: string | null;
  storageType: "url" | "file";
  mediaFileId: number | null;
  imageUrl: string | null;
  videoUrl: string | null;
  linkUrl: string | null;
  altText: string | null;
  mediaType: "image" | "video" | "gif";
  duration: number | null;
  type: string;
  priority: number;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    name: string;
    client: string;
  };
}

// ============================================
// ESQUEMAS DE VALIDACIÓN
// ============================================

const advertisementSchema = z.object({
  campaignId: z.number().optional().nullable(),
  title: z.string().min(1, "El título es requerido").max(255),
  content: z.string().optional(),
  storageType: z.enum(["url", "file"]),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  altText: z.string().optional(),
  mediaType: z.enum(["image", "video", "gif"]),
  duration: z.number().optional().nullable(),
  type: z.string().min(1, "El tipo es requerido"),
  priority: z.number().min(0).max(10).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
  isActive: z.boolean().default(true),
});

type AdvertisementFormData = z.infer<typeof advertisementSchema>;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Advertisements() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdvertisement, setSelectedAdvertisement] = useState<Advertisement | null>(null);

  // Estados para upload
  const [uploadedFile, setUploadedFile] = useState<{ url: string; filename: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  // React Query - Obtener anuncios
  const { data: advertisementsResponse, isLoading } = useQuery({
    queryKey: ["/api/advertising/advertisements"],
  });

  const advertisements = advertisementsResponse?.data || [];

  // React Query - Obtener campañas
  const { data: campaignsResponse } = useQuery({
    queryKey: ["/api/advertising/campaigns"],
  });

  const campaigns = campaignsResponse?.data || [];

  // Formulario de creación
  const createForm = useForm<AdvertisementFormData>({
    resolver: zodResolver(advertisementSchema),
    defaultValues: {
      campaignId: null,
      title: "",
      content: "",
      storageType: "url",
      imageUrl: "",
      videoUrl: "",
      linkUrl: "",
      altText: "",
      mediaType: "image",
      duration: null,
      type: "banner",
      priority: 0,
      status: "active",
      isActive: true,
    },
  });

  // Formulario de edición
  const editForm = useForm<AdvertisementFormData>({
    resolver: zodResolver(advertisementSchema),
  });

  // Handler para upload de archivo
  const handleFileUpload = async (file: File, formInstance: any) => {
    try {
      setIsUploading(true);

      // Crear preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir archivo
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/advertising/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Error al subir el archivo");

      const data = await response.json();

      setUploadedFile({
        url: data.url,
        filename: data.file.filename,
      });

      // Actualizar el formulario
      formInstance.setValue("storageType", "file");
      formInstance.setValue("imageUrl", data.url);

      // Detectar tipo de media
      if (file.type.startsWith("video/")) {
        formInstance.setValue("mediaType", "video");
      } else if (file.type === "image/gif") {
        formInstance.setValue("mediaType", "gif");
      } else {
        formInstance.setValue("mediaType", "image");
      }

      toast({
        title: "Éxito",
        description: "Archivo subido correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Limpiar upload
  const clearUpload = (formInstance: any) => {
    setUploadedFile(null);
    setUploadPreview(null);
    formInstance.setValue("imageUrl", "");
    formInstance.setValue("storageType", "url");
  };

  // Mutación - Crear anuncio
  const createMutation = useMutation({
    mutationFn: async (data: AdvertisementFormData) => {
      const response = await fetch("/api/advertising/advertisements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear el anuncio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/advertisements"] });
      setIsCreateModalOpen(false);
      createForm.reset();
      setUploadedFile(null);
      setUploadPreview(null);
      toast({
        title: "Éxito",
        description: "Anuncio creado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el anuncio",
        variant: "destructive",
      });
    },
  });

  // Mutación - Actualizar anuncio
  const updateMutation = useMutation({
    mutationFn: async (data: AdvertisementFormData & { id: number }) => {
      const response = await fetch(`/api/advertising/advertisements/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al actualizar el anuncio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/advertisements"] });
      setIsEditModalOpen(false);
      setSelectedAdvertisement(null);
      setUploadedFile(null);
      setUploadPreview(null);
      toast({
        title: "Éxito",
        description: "Anuncio actualizado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el anuncio",
        variant: "destructive",
      });
    },
  });

  // Mutación - Eliminar anuncio
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/advertising/advertisements/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar el anuncio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/advertisements"] });
      toast({
        title: "Éxito",
        description: "Anuncio eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el anuncio",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreate = (data: AdvertisementFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (advertisement: Advertisement) => {
    setSelectedAdvertisement(advertisement);
    editForm.reset({
      campaignId: advertisement.campaignId,
      title: advertisement.title,
      content: advertisement.content || "",
      storageType: advertisement.storageType,
      imageUrl: advertisement.imageUrl || "",
      videoUrl: advertisement.videoUrl || "",
      linkUrl: advertisement.linkUrl || "",
      altText: advertisement.altText || "",
      mediaType: advertisement.mediaType,
      duration: advertisement.duration,
      type: advertisement.type,
      priority: advertisement.priority,
      status: advertisement.status as "active" | "inactive",
      isActive: advertisement.isActive,
    });

    // Si tiene imagen, mostrar preview
    if (advertisement.imageUrl) {
      setUploadPreview(advertisement.imageUrl);
    }

    setIsEditModalOpen(true);
  };

  const handleUpdate = (data: AdvertisementFormData) => {
    if (!selectedAdvertisement) return;
    updateMutation.mutate({ ...data, id: selectedAdvertisement.id });
  };

  const handleView = (advertisement: Advertisement) => {
    setSelectedAdvertisement(advertisement);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este anuncio?")) {
      deleteMutation.mutate(id);
    }
  };

  // Función auxiliar para obtener el badge del tipo de media
  const getMediaTypeBadge = (mediaType: string) => {
    const mediaConfig: Record<string, { label: string; variant: any }> = {
      image: { label: "Imagen", variant: "default" },
      video: { label: "Video", variant: "secondary" },
      gif: { label: "GIF", variant: "outline" },
    };
    const config = mediaConfig[mediaType] || { label: mediaType, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Anuncios Publicitarios"
          subtitle="Gestiona los anuncios que se mostrarán en los espacios publicitarios"
          icon={<Target className="h-6 w-6" />}
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

        {/* Tabla de anuncios */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anuncio</TableHead>
                <TableHead>Campaña</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Cargando anuncios...
                  </TableCell>
                </TableRow>
              ) : advertisements?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No hay anuncios registrados</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                advertisements?.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {ad.imageUrl && (
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="w-16 h-10 object-cover rounded border"
                          />
                        )}
                        <div>
                          <p className="font-medium">{ad.title}</p>
                          {ad.content && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {ad.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ad.campaign ? (
                        <div className="text-sm">
                          <p className="font-medium">{ad.campaign.name}</p>
                          <p className="text-muted-foreground">{ad.campaign.client}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ad.type}</Badge>
                    </TableCell>
                    <TableCell>{getMediaTypeBadge(ad.mediaType)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ad.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.isActive ? "default" : "secondary"}>
                        {ad.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(ad)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(ad)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ad.id)}
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
        <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            setUploadedFile(null);
            setUploadPreview(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Anuncio Publicitario</DialogTitle>
              <DialogDescription>
                Crea un nuevo anuncio para mostrar en los espacios publicitarios
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Anuncio *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Descubre la Naturaleza Urbana" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenido</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del anuncio..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="campaignId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaña (Opcional)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar campaña" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin campaña</SelectItem>
                          {campaigns?.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id.toString()}>
                              {campaign.name} - {campaign.client}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sección de Upload */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Media del Anuncio</h4>
                    <FormField
                      control={createForm.control}
                      name="storageType"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="url">URL Externa</SelectItem>
                            <SelectItem value="file">Subir Archivo</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {createForm.watch("storageType") === "file" ? (
                    <div className="space-y-3">
                      {uploadPreview ? (
                        <div className="relative">
                          <img
                            src={uploadPreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => clearUpload(createForm)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Sube una imagen o video para el anuncio
                          </p>
                          <Input
                            type="file"
                            accept="image/*,video/*"
                            className="mt-4"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, createForm);
                            }}
                            disabled={isUploading}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <FormField
                      control={createForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de la Imagen/Video</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://ejemplo.com/imagen.jpg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="linkUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de Destino</FormLabel>
                        <FormControl>
                          <Input placeholder="/parks" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="altText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto Alternativo</FormLabel>
                        <FormControl>
                          <Input placeholder="Descripción accesible" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={createForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo de anuncio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="banner">Banner</SelectItem>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="interactive">Interactivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad (0-10)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
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
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || isUploading}>
                    {createMutation.isPending ? "Creando..." : "Crear Anuncio"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Modal de Vista */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Anuncio</DialogTitle>
            </DialogHeader>
            {selectedAdvertisement && (
              <div className="space-y-4">
                {selectedAdvertisement.imageUrl && (
                  <div className="w-full">
                    <img
                      src={selectedAdvertisement.imageUrl}
                      alt={selectedAdvertisement.title}
                      className="w-full h-64 object-cover rounded border"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Título</p>
                  <p className="text-base">{selectedAdvertisement.title}</p>
                </div>
                {selectedAdvertisement.content && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contenido</p>
                    <p className="text-base">{selectedAdvertisement.content}</p>
                  </div>
                )}
                {selectedAdvertisement.campaign && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Campaña</p>
                    <p className="text-base">
                      {selectedAdvertisement.campaign.name} - {selectedAdvertisement.campaign.client}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo de Media</p>
                    <div className="mt-1">{getMediaTypeBadge(selectedAdvertisement.mediaType)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo de Anuncio</p>
                    <p className="text-base">{selectedAdvertisement.type}</p>
                  </div>
                </div>
                {selectedAdvertisement.linkUrl && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">URL de Destino</p>
                    <a
                      href={selectedAdvertisement.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-primary hover:underline"
                    >
                      {selectedAdvertisement.linkUrl}
                    </a>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prioridad</p>
                    <p className="text-base">{selectedAdvertisement.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <div className="mt-1">
                      <Badge variant={selectedAdvertisement.isActive ? "default" : "secondary"}>
                        {selectedAdvertisement.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Edición - Similar al de creación con valores precargados */}
        <Dialog open={isEditModalOpen} onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setUploadedFile(null);
            setUploadPreview(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Anuncio</DialogTitle>
              <DialogDescription>
                Modifica los datos del anuncio publicitario
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                {/* Mismo contenido que el modal de creación pero con editForm */}
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Anuncio *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Descubre la Naturaleza Urbana" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenido</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del anuncio..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="campaignId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaña (Opcional)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar campaña" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin campaña</SelectItem>
                          {campaigns?.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id.toString()}>
                              {campaign.name} - {campaign.client}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Media del Anuncio</h4>
                    <FormField
                      control={editForm.control}
                      name="storageType"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="url">URL Externa</SelectItem>
                            <SelectItem value="file">Subir Archivo</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {editForm.watch("storageType") === "file" ? (
                    <div className="space-y-3">
                      {uploadPreview ? (
                        <div className="relative">
                          <img
                            src={uploadPreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => clearUpload(editForm)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Sube una imagen o video para el anuncio
                          </p>
                          <Input
                            type="file"
                            accept="image/*,video/*"
                            className="mt-4"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, editForm);
                            }}
                            disabled={isUploading}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <FormField
                      control={editForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de la Imagen/Video</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://ejemplo.com/imagen.jpg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="linkUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de Destino</FormLabel>
                        <FormControl>
                          <Input placeholder="/parks" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="altText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto Alternativo</FormLabel>
                        <FormControl>
                          <Input placeholder="Descripción accesible" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo de anuncio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="banner">Banner</SelectItem>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="interactive">Interactivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad (0-10)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
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
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending || isUploading}>
                    {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}