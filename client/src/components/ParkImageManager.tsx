import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ParkImage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Image as ImageIcon, 
  Upload, 
  Star, 
  Trash2, 
  X, 
  Check,
  AlertCircle
} from "lucide-react";

interface ParkImageManagerProps {
  parkId: number;
}

export function ParkImageManager({ parkId }: ParkImageManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ParkImage | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");

  // Fetch park images
  const { data: images = [], isLoading, error } = useQuery<ParkImage[]>({
    queryKey: [`/api/parks/${parkId}/images`],
  });

  // Object Storage upload workflow
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (formData: { file?: File; imageUrl?: string; caption?: string; isPrimary: boolean }) => {
      setIsUploading(true);
      
      if (formData.file) {
        console.log('📤 [OBJECT STORAGE] Iniciando upload de archivo para parque:', parkId);
        
        // Paso 1: Obtener upload URL
        const uploadResponse = await apiRequest(`/api/parks/${parkId}/images/upload-os`, {
          method: "POST"
        });
        const uploadData = await uploadResponse.json();
        console.log('📤 [OBJECT STORAGE] Upload URL obtenida:', uploadData);
        
        // Paso 2: Subir archivo a Object Storage
        const uploadToStorage = await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          body: formData.file,
          headers: {
            'Content-Type': formData.file.type,
          }
        });
        
        if (!uploadToStorage.ok) {
          throw new Error('Error subiendo archivo a Object Storage');
        }
        
        console.log('📤 [OBJECT STORAGE] Archivo subido exitosamente');
        
        // Paso 3: Confirmar upload en base de datos
        const confirmResponse = await apiRequest(`/api/parks/${parkId}/images/confirm-os`, {
          method: "POST",
          data: {
            imageId: uploadData.imageId,
            filename: uploadData.filename,
            caption: formData.caption || '',
            isPrimary: formData.isPrimary,
            uploadUrl: uploadData.uploadUrl
          }
        });
        
        console.log('✅ [OBJECT STORAGE] Upload confirmado');
        return confirmResponse.json();
        
      } else if (formData.imageUrl) {
        // Fallback para URLs directas (Object Storage migrado)
        const response = await apiRequest(`/api/parks/${parkId}/images`, {
          method: "POST",
          data: {
            imageUrl: formData.imageUrl,
            caption: formData.caption,
            isPrimary: formData.isPrimary
          }
        });
        return response.json();
      }
      
      throw new Error('Se requiere archivo o URL de imagen');
    },
    onSuccess: () => {
      toast({
        title: "Imagen subida",
        description: "La imagen se ha agregado correctamente al parque y persistirá en deployments.",
      });
      setIsUploadDialogOpen(false);
      setNewImageUrl("");
      setNewImageCaption("");
      setSelectedFile(null);
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
    },
    onError: (error) => {
      console.error("❌ [OBJECT STORAGE] Error uploading image:", error);
      setIsUploading(false);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Por favor intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Set primary image mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await apiRequest(`/api/park-images/${imageId}/set-primary`, {
        method: "POST",
        data: {}
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Imagen principal actualizada",
        description: "Se ha establecido la imagen principal del parque.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
    },
    onError: (error) => {
      console.error("Error setting primary image:", error);
      toast({
        title: "Error",
        description: "No se pudo establecer la imagen principal. Por favor intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await apiRequest(`/api/park-images/${imageId}`, {
        method: "DELETE"
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado correctamente del parque.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedImage(null);
      // Force cache refresh
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
    },
    onError: (error: any) => {
      console.error("Error deleting image:", error);
      
      // Even if there's a 404 error, refresh the cache to sync with database
      if (error?.response?.status === 404 || error?.status === 404) {
        console.log('🔄 Imagen ya eliminada, sincronizando cache...');
        setIsDeleteDialogOpen(false);
        setSelectedImage(null);
        queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
        queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
        toast({
          title: "Sincronizado",
          description: "La imagen ya había sido eliminada. Lista actualizada.",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar la imagen. Por favor intente nuevamente.",
          variant: "destructive",
        });
      }
    },
  });

  // Handler for upload form submission
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if this is the first image, set isPrimary to true if so
    const isPrimary = images.length === 0;

    if (selectedFile) {
      // Upload with file (Object Storage)
      uploadMutation.mutate({
        file: selectedFile,
        caption: newImageCaption.trim() || undefined,
        isPrimary,
      });
    } else if (newImageUrl.trim()) {
      // Upload with URL (legacy/Object Storage URL)
      uploadMutation.mutate({
        imageUrl: newImageUrl.trim(),
        caption: newImageCaption.trim() || undefined,
        isPrimary,
      });
    } else {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo o ingrese una URL de imagen.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📁 [OBJECT STORAGE] Archivo seleccionado:', file.name, file.size);
      setSelectedFile(file);
      setNewImageUrl(""); // Clear URL when file is selected
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (image: ParkImage) => {
    setSelectedImage(image);
    setIsDeleteDialogOpen(true);
  };

  // Handler for setting an image as primary
  const handleSetPrimary = (image: ParkImage) => {
    if (!image.isPrimary) {
      setPrimaryMutation.mutate(image.id);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-gray-500">Cargando imágenes...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
        <p className="text-gray-700">No se pudieron cargar las imágenes del parque.</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] })}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Imágenes del parque</h3>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Agregar imagen
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No hay imágenes disponibles para este parque.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            Agregar primera imagen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <Card key={image.id} className={image.isPrimary ? 'border-primary' : ''}>
              <CardHeader className="p-0 aspect-video relative overflow-hidden">
                <img 
                  src={image.imageUrl} 
                  alt={image.caption || 'Imagen del parque'}
                  className="w-full h-full object-cover"
                />
                {image.isPrimary && (
                  <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Principal
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-3">
                <p className="text-sm truncate">
                  {image.caption || 'Sin descripción'}
                </p>
              </CardContent>
              <CardFooter className="p-3 pt-0 flex justify-between gap-2">
                {!image.isPrimary && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleSetPrimary(image)}
                    disabled={setPrimaryMutation.isPending}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Principal
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`flex-1 ${image.isPrimary ? 'text-red-500 hover:text-red-600' : ''}`}
                  onClick={() => openDeleteDialog(image)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar nueva imagen</DialogTitle>
            <DialogDescription>
              Seleccione un archivo de imagen o proporcione una URL. Las imágenes se guardarán permanentemente y persistirán en deployments.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="image-file">📎 Subir archivo de imagen (Recomendado)</Label>
                <Input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-green-600 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Archivo seleccionado: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                  </p>
                )}
              </div>
              
              <div className="text-center text-gray-400 text-sm">
                - O -
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="image-url">🔗 URL de imagen</Label>
                <Input
                  id="image-url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={newImageUrl}
                  onChange={(e) => {
                    setNewImageUrl(e.target.value);
                    if (e.target.value) setSelectedFile(null);
                  }}
                  disabled={isUploading || !!selectedFile}
                />
                <p className="text-xs text-gray-500">
                  URL directa a imagen (jpg, png, webp, etc.)
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="image-caption">📝 Descripción (opcional)</Label>
                <Input
                  id="image-caption"
                  placeholder="Vista panorámica del parque"
                  value={newImageCaption}
                  onChange={(e) => setNewImageCaption(e.target.value)}
                  disabled={isUploading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setSelectedFile(null);
                  setNewImageUrl("");
                  setNewImageCaption("");
                }}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading || (!selectedFile && !newImageUrl.trim())}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Subiendo...
                  </>
                ) : (
                  "Subir imagen"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar esta imagen? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedImage && (
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={selectedImage.imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {selectedImage.caption || 'Sin descripción'}
                  </p>
                  {selectedImage.isPrimary && (
                    <p className="text-xs text-amber-600 flex items-center mt-1">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Esta es la imagen principal del parque
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedImage && deleteMutation.mutate(selectedImage.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>Eliminando...</>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}