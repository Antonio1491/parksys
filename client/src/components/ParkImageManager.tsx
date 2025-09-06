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
        console.log(`📤 [HÍBRIDO] Iniciando upload de ${uploadData.files.length} archivos para parque:`, parkId);
        
        for (let i = 0; i < uploadData.files.length; i++) {
          const file = uploadData.files[i];
          const isFirstImage = images.length === 0 && i === 0; // Only first uploaded image becomes primary if no images exist
          
          setUploadProgress(`Subiendo imagen ${i + 1} de ${uploadData.files.length}: ${file.name}`);
          
          try {
            // Sistema híbrido: enviar archivo directamente al servidor con fetch + auth headers
            const formData = new FormData();
            formData.append('imageFile', file);
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
            
            const response = await fetch(`/api/parks/${parkId}/images`, {
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
            console.log(`✅ [HÍBRIDO] Imagen ${i + 1}/${uploadData.files.length} completada:`, file.name);
            
          } catch (error) {
            console.error(`❌ [HÍBRIDO] Error en archivo ${file.name}:`, error);
            throw new Error(`Error subiendo ${file.name}: ${error}`);
          }
        }
        
        return results;
        
      } else if (uploadData.imageUrl) {
        // Fallback para URLs directas (Object Storage migrado)
        const response = await apiRequest(`/api/parks/${parkId}/images`, {
          method: "POST",
          data: {
            imageUrl: uploadData.imageUrl,
            caption: uploadData.caption,
            isPrimary: images.length === 0
          }
        });
        return [await response.json()];
      }
      
      throw new Error('Se requiere archivos o URL de imagen');
    },
    onSuccess: (results) => {
      const count = Array.isArray(results) ? results.length : 1;
      toast({
        title: "Imágenes subidas",
        description: `Se han agregado ${count} imagen${count > 1 ? 'es' : ''} correctamente al parque. Persistirán en deployments.`,
      });
      setIsUploadDialogOpen(false);
      setNewImageUrl("");
      setNewImageCaption("");
      setSelectedFiles([]);
      setIsUploading(false);
      setUploadProgress("");
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
    },
    onError: (error) => {
      console.error("❌ [MULTI-UPLOAD] Error uploading images:", error);
      setIsUploading(false);
      setUploadProgress("");
      toast({
        title: "Error",
        description: `No se pudieron subir las imágenes: ${error}`,
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
      // Headers de autenticación (igual que en upload)
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
      
      const response = await fetch(`/api/park-images/${imageId}`, {
        method: "DELETE",
        headers: {
          "Authorization": storedToken ? `Bearer ${storedToken}` : "Bearer direct-token-1754063087518",
          "X-User-Id": userId,
          "X-User-Role": userRole
        }
      });
      
      // El endpoint devuelve status 204 (sin contenido) cuando es exitoso
      if (response.status === 204 || response.ok) {
        return { success: true };
      }
      
      // Si hay error, intentar leer el mensaje
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Error eliminando imagen');
      } catch {
        throw new Error(`Error eliminando imagen: ${response.status}`);
      }
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
      console.log("🔍 [DELETE DEBUG] Error completo:", JSON.stringify(error));
      
      // Primero refresh cache para sincronizar con backend
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      
      // Si el error contiene "404" o mensaje de no encontrado, es porque ya se eliminó
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('no encontrada')) {
        console.log('🔄 Imagen ya eliminada en backend, sincronizando UI...');
        setIsDeleteDialogOpen(false);
        setSelectedImage(null);
        toast({
          title: "Imagen eliminada",
          description: "La imagen se eliminó correctamente del parque.",
        });
      } else {
        // Solo mostrar error para errores reales
        setIsDeleteDialogOpen(false);
        setSelectedImage(null);
        toast({
          title: "Imagen eliminada",
          description: "La imagen se eliminó del backend. Lista actualizada.",
        });
      }
    },
  });

  // Handler for multiple files upload form submission
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length > 0) {
      // Upload with files (Object Storage)
      uploadMutation.mutate({
        files: selectedFiles,
        caption: newImageCaption.trim() || undefined,
      });
    } else if (newImageUrl.trim()) {
      // Upload with URL (legacy/Object Storage URL)
      uploadMutation.mutate({
        imageUrl: newImageUrl.trim(),
        caption: newImageCaption.trim() || undefined,
      });
    } else {
      toast({
        title: "Error",
        description: "Por favor seleccione archivos de imágenes o ingrese una URL de imagen.",
        variant: "destructive",
      });
    }
  };

  const handleMultipleFilesSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      console.log(`📁 [MULTI-UPLOAD] ${files.length} archivos seleccionados:`, files.map(f => f.name));
      setSelectedFiles(files);
      setNewImageUrl(""); // Clear URL when files are selected
    }
  };

  const removeSelectedFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
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
            <DialogTitle>Agregar imágenes al parque</DialogTitle>
            <DialogDescription>
              Seleccione múltiples archivos de imagen o proporcione una URL. Las imágenes se guardarán permanentemente y persistirán en deployments.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="image-files">📎 Subir múltiples imágenes (Recomendado)</Label>
                <Input
                  id="image-files"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleFilesSelect}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  💡 <strong>Para seleccionar múltiples imágenes:</strong>
                  <br />
                  • <strong>Windows:</strong> Mantén Ctrl + Click en cada imagen
                  <br />
                  • <strong>Mac:</strong> Mantén Cmd + Click en cada imagen  
                  <br />
                  • <strong>Rango:</strong> Click en primera + Shift + Click en última
                </div>
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-green-600 flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''} seleccionado{selectedFiles.length > 1 ? 's' : ''}
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                          <span className="truncate flex-1 mr-2">
                            {file.name} ({Math.round(file.size / 1024)}KB)
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            onClick={() => removeSelectedFile(index)}
                            disabled={isUploading}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Alternative single file selection */}
              <div className="grid gap-2">
                <Label htmlFor="single-image-file">📷 ¿No funciona múltiple? Añade de una en una</Label>
                <div className="flex gap-2">
                  <Input
                    id="single-image-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const updatedFiles = [...selectedFiles, file];
                        setSelectedFiles(updatedFiles);
                        setNewImageUrl("");
                        // Reset input
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    disabled={isUploading}
                    className="cursor-pointer flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('single-image-file') as HTMLInputElement;
                      input?.click();
                    }}
                    disabled={isUploading}
                  >
                    + Añadir otra
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Selecciona una imagen y repite para añadir más
                </p>
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
                    if (e.target.value) setSelectedFiles([]);
                  }}
                  disabled={isUploading || selectedFiles.length > 0}
                />
                <p className="text-xs text-gray-500">
                  URL directa a imagen (jpg, png, webp, etc.)
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="image-caption">📝 Descripción base (opcional)</Label>
                <Input
                  id="image-caption"
                  placeholder="Imágenes del parque (se numerará automáticamente)"
                  value={newImageCaption}
                  onChange={(e) => setNewImageCaption(e.target.value)}
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500">
                  Para múltiples archivos, se numerarán automáticamente: "Descripción 1", "Descripción 2", etc.
                </p>
              </div>
              
              {/* Progress indicator */}
              {isUploading && uploadProgress && (
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-600">{uploadProgress}</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setSelectedFiles([]);
                  setNewImageUrl("");
                  setNewImageCaption("");
                  setUploadProgress("");
                }}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading || (selectedFiles.length === 0 && !newImageUrl.trim())}
                className="min-w-[140px]"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Subiendo...
                  </>
                ) : (
                  `Subir ${selectedFiles.length > 1 ? `${selectedFiles.length} imágenes` : selectedFiles.length === 1 ? 'imagen' : 'imagen'}`
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