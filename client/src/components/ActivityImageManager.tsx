import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Star, StarOff, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ActivityImageManagerProps {
  activityId?: number;
  onImageUploaded?: (imageData: any) => void;
  showUploadOnly?: boolean;
}

interface ActivityImage {
  id: number;
  imageUrl: string;
  fileName: string;
  caption?: string;
  isPrimary: boolean;
  createdAt: string;
}

const ActivityImageManager: React.FC<ActivityImageManagerProps> = ({ 
  activityId, 
  onImageUploaded,
  showUploadOnly = false 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consulta para obtener imágenes existentes (solo si tenemos activityId)
  const { data: images = [], isLoading } = useQuery<ActivityImage[]>({
    queryKey: [`/api/activities/${activityId}/images`],
    enabled: !!activityId && !showUploadOnly,
  });

  // Mutación para subir imagen
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!activityId) {
        throw new Error('ID de actividad requerido');
      }
      
      const token = localStorage.getItem('token') || 'direct-token-1750522117022';
      
      const response = await fetch(`/api/activities/${activityId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al subir imagen: ${response.status} ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido exitosamente",
      });
      
      // Limpiar formulario
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/images`] });
      
      // Callback para componente padre
      if (onImageUploaded) {
        onImageUploaded(data);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo subir la imagen: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar imagen
  const deleteMutation = useMutation({
    mutationFn: async (imageId: number) => {
      return await apiRequest(`/api/activities/${activityId}/images/${imageId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/images`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive",
      });
    },
  });

  // Mutación para establecer imagen principal
  const setPrimaryMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const token = localStorage.getItem('token') || 'direct-token-1750522117022';
      
      const response = await fetch(`/api/activities/${activityId}/images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPrimary: true })
      });

      if (!response.ok) {
        throw new Error('Error al establecer imagen principal');
      }
    },
    onSuccess: () => {
      toast({
        title: "Imagen principal actualizada",
        description: "La imagen principal se ha actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}/images`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la imagen principal",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    if (caption) {
      formData.append('caption', caption);
    }

    uploadMutation.mutate(formData);
  };

  if (showUploadOnly || !activityId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Subir Imagen
          </CardTitle>
          <CardDescription>
            {!activityId ? 
              "Primero guarda la actividad para poder subir imágenes" :
              "Selecciona una imagen para la actividad"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Seleccionar Imagen</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={!activityId}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={!activityId}
              className="w-full mt-2"
            >
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar Imagen
            </Button>
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <Label>Vista previa:</Label>
              <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="caption">Descripción (opcional)</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe la imagen..."
              disabled={!activityId}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !activityId || uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir Imagen
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a587]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subir nueva imagen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Nueva Imagen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Seleccionar Imagen</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-2"
            >
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar Imagen
            </Button>
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <Label>Vista previa:</Label>
              <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="caption">Descripción (opcional)</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe la imagen..."
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="w-full bg-[#00a587] hover:bg-[#067f5f]"
          >
            {uploadMutation.isPending ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir Imagen
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Imágenes existentes */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imágenes de la Actividad</CardTitle>
            <CardDescription>
              {images.length} imagen{images.length !== 1 ? 'es' : ''} subida{images.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="relative aspect-video border rounded-lg overflow-hidden">
                    <img
                      src={
                        // En Replit development, usar URL completa del backend
                        window.location.hostname.includes('replit.') || import.meta.env.DEV
                          ? `${window.location.protocol}//${window.location.host}${image.imageUrl}` 
                          : image.imageUrl
                      }
                      alt={image.caption || 'Imagen de actividad'}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badge de imagen principal */}
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Principal
                      </div>
                    )}

                    {/* Controles de imagen */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {!image.isPrimary && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setPrimaryMutation.mutate(image.id)}
                          disabled={setPrimaryMutation.isPending}
                          className="h-8 w-8 p-0"
                        >
                          <StarOff className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(image.id)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Información de la imagen */}
                  <div className="mt-2 space-y-1">
                    {image.caption && (
                      <p className="text-sm text-gray-600 truncate">{image.caption}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Subida el {new Date(image.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActivityImageManager;