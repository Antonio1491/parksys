import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityImage } from "@shared/schema";
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

interface ActivityImageManagerProps {
  activityId: number;
}

export function ActivityImageManager({ activityId }: ActivityImageManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ActivityImage | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");

  // Fetch activity images
  const { data: images = [], isLoading, error } = useQuery<ActivityImage[]>({
    queryKey: [`/api/activities/${activityId}/images`],
  });

  // Object Storage multiple upload workflow
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Multiple files upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (uploadData: { files?: File[]; imageUrl?: string; caption?: string }) => {
      setIsUploading(true);
      setUploadProgress("Iniciando...");
      
      const results = [];
      
      if (uploadData.files && uploadData.files.length > 0) {
        console.log(`📤 [ACTIVITY-HÍBRIDO] Iniciando upload de ${uploadData.files.length} archivos para actividad:`, activityId);
        
        for (let i = 0; i < uploadData.files.length; i++) {
          const file = uploadData.files[i];
          const isFirstImage = images.length === 0 && i === 0; // Only first uploaded image becomes primary if no images exist
          
          setUploadProgress(`Subiendo imagen ${i + 1} de ${uploadData.files.length}: ${file.name}`);
          
          try {
            // Sistema híbrido: enviar archivo directamente al servidor con fetch + auth headers
            const formData = new FormData();
            formData.append('imageFile', file);  // DEBE coincidir con backend
            formData.append('caption', uploadData.caption || `Imagen ${i + 1}`);
            formData.append('isPrimary', String(isFirstImage));
            
            // Headers de autenticación (copiados de apiRequest)
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            let userId = "1";
            let userRole = "super_admin";
            
            if (storedUser) {
              try {
                const userObj = JSON.parse(storedUser);
                userId = userObj.id.toString();
                userRole = userObj.role || "admin";
              } catch (e) {
                console.error("Error parsing stored user:", e);
              }
            }
            
            const response = await fetch(`/api/activities/${activityId}/images`, {
              method: 'POST',
              body: formData, // FormData NO debe ser JSON.stringify
              headers: {
                "Authorization": storedToken ? `Bearer ${storedToken}` : "Bearer direct-token-1754063087518",
                "X-User-Id": userId,
                "X-User-Role": userRole
                // No incluir Content-Type - el browser lo manejará automáticamente con multipart
              }
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Error subiendo ${file.name}`);
            }
            
            const result = await response.json();
            results.push(result);
            console.log(`✅ [ACTIVITY-HÍBRIDO] Imagen ${i + 1}/${uploadData.files.length} completada:`, file.name);
            
          } catch (error) {
            console.error(`❌ [ACTIVITY-HÍBRIDO] Error en archivo ${file.name}:`, error);
            throw new Error(`Error subiendo ${file.name}: ${error}`);
          }
        }
        
        return results;
        
      } else if (uploadData.imageUrl) {
        // Add image by URL
        return await apiRequest(`/api/activities/${activityId}/images`, {
          method: "POST",
          data: {
            imageUrl: uploadData.imageUrl,
            caption: uploadData.caption || "",
            isPrimary: images.length === 0
          }
        });
      }
      
      throw new Error("No files or URL provided");
    },
    onSuccess: () => {
      toast({
        title: "Imágenes subidas",
        description: "Las imágenes se han subido exitosamente",
      });
      
      // Reset form
      setSelectedFiles([]);
      setNewImageUrl("");
      setNewImageCaption("");
      setIsUploadDialogOpen(false);
      setUploadProgress("");
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/images`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error subiendo imágenes: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
      setUploadProgress("");
    }
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: number) => {
      return await apiRequest(`/api/activities/${activityId}/images/${imageId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado exitosamente",
      });
      setIsDeleteDialogOpen(false);
      setSelectedImage(null);
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/images`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error eliminando imagen: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Set primary image mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (imageId: number) => {
      return await apiRequest(`/api/activities/${activityId}/images/${imageId}`, {
        method: "PUT",
        data: { isPrimary: true }
      });
    },
    onSuccess: () => {
      toast({
        title: "Imagen principal actualizada",
        description: "La imagen principal se ha establecido exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/images`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error estableciendo imagen principal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadMutation.mutate({ files: selectedFiles, caption: newImageCaption });
    } else if (newImageUrl.trim()) {
      uploadMutation.mutate({ imageUrl: newImageUrl.trim(), caption: newImageCaption });
    }
  };

  const handleDelete = () => {
    if (selectedImage) {
      deleteMutation.mutate(selectedImage.id);
    }
  };

  const handleSetPrimary = (imageId: number) => {
    setPrimaryMutation.mutate(imageId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Imágenes de la Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-gray-500">Cargando imágenes...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error cargando las imágenes de la actividad</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="h-6 w-6" />
          Imágenes de la Actividad
        </h2>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Subir Imágenes
        </Button>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="relative">
              <img
                src={image.imageUrl}
                alt={image.caption || "Imagen de actividad"}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Principal
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {!image.isPrimary && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() => handleSetPrimary(image.id)}
                    disabled={setPrimaryMutation.isPending}
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setSelectedImage(image);
                    setIsDeleteDialogOpen(true);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardContent className="p-3">
              <p className="text-sm text-gray-600 truncate">
                {image.caption || "Sin descripción"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {image.fileName}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {images.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 text-gray-500">
            <ImageIcon className="h-8 w-8 mb-2" />
            <p>No hay imágenes para esta actividad</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              Subir primera imagen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Imágenes</DialogTitle>
            <DialogDescription>
              Selecciona archivos de imagen o proporciona una URL
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Progress Indicator */}
            {isUploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-800 mb-1">
                  Subiendo imágenes...
                </div>
                <div className="text-xs text-blue-600">
                  {uploadProgress}
                </div>
              </div>
            )}

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Subir archivos</Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              {selectedFiles.length > 0 && (
                <p className="text-sm text-gray-600">
                  {selectedFiles.length} archivo(s) seleccionado(s)
                </p>
              )}
            </div>

            {/* URL Upload */}
            <div className="space-y-2">
              <Label htmlFor="image-url">O pegar URL de imagen</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                disabled={isUploading}
              />
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Descripción (opcional)</Label>
              <Input
                id="caption"
                placeholder="Descripción de la imagen"
                value={newImageCaption}
                onChange={(e) => setNewImageCaption(e.target.value)}
                disabled={isUploading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || (selectedFiles.length === 0 && !newImageUrl.trim())}
            >
              {isUploading ? "Subiendo..." : "Subir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar esta imagen? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          {selectedImage && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.caption || ""}
                className="w-16 h-16 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
              <div>
                <p className="font-medium">{selectedImage.caption || "Sin descripción"}</p>
                <p className="text-sm text-gray-500">{selectedImage.fileName}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

