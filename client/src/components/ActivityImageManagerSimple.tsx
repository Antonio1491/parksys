import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActivityImageManagerSimpleProps {
  activityId?: number;
  currentImageUrl?: string | null;
  onImageUpdated?: (imageUrl: string | null) => void;
  showUploadOnly?: boolean;
}

const ActivityImageManagerSimple: React.FC<ActivityImageManagerSimpleProps> = ({ 
  activityId, 
  currentImageUrl,
  onImageUpdated,
  showUploadOnly = false 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutación para subir imagen (SISTEMA SIMPLE)
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!activityId) {
        throw new Error('ID de actividad requerido');
      }
      
      const token = localStorage.getItem('token') || 'direct-token-1750522117022';
      
      const response = await fetch(`/api/activities/${activityId}/image`, {
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
        title: "Imagen actualizada",
        description: "La imagen de la actividad se ha actualizado exitosamente",
      });
      
      // Limpiar formulario
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}`] });
      
      // Callback para componente padre
      if (onImageUpdated) {
        onImageUpdated(data.imageUrl);
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

  // Mutación para eliminar imagen (SISTEMA SIMPLE)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!activityId) {
        throw new Error('ID de actividad requerido');
      }
      
      const token = localStorage.getItem('token') || 'direct-token-1750522117022';
      
      const response = await fetch(`/api/activities/${activityId}/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al eliminar imagen: ${response.status} ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado exitosamente",
      });
      
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}`] });
      
      // Callback para componente padre
      if (onImageUpdated) {
        onImageUpdated(null);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la imagen: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  const handleUpload = () => {
    if (!selectedFile || !activityId) return;
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    uploadMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (!activityId) return;
    deleteMutation.mutate();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Imagen de Actividad
        </CardTitle>
        <CardDescription>
          {showUploadOnly 
            ? "Sube una imagen para la actividad"
            : "Gestiona la imagen de esta actividad"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Imagen actual */}
        {!showUploadOnly && currentImageUrl && (
          <div className="space-y-2">
            <Label>Imagen actual:</Label>
            <div className="relative inline-block">
              <img 
                src={currentImageUrl} 
                alt="Imagen de la actividad"
                className="w-32 h-32 object-cover rounded-lg border"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Upload de nueva imagen */}
        <div className="space-y-2">
          <Label htmlFor="image-upload">
            {currentImageUrl ? "Cambiar imagen:" : "Subir imagen:"}
          </Label>
          <Input
            ref={fileInputRef}
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploadMutation.isPending}
          />
        </div>

        {/* Preview de imagen seleccionada */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>Vista previa:</Label>
            <div className="relative inline-block">
              <img 
                src={previewUrl} 
                alt="Vista previa"
                className="w-32 h-32 object-cover rounded-lg border"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                onClick={clearSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        {selectedFile && (
          <div className="flex gap-2">
            <Button 
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !activityId}
              className="flex items-center gap-2"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploadMutation.isPending ? 'Subiendo...' : 'Subir imagen'}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearSelection}
              disabled={uploadMutation.isPending}
            >
              Cancelar
            </Button>
          </div>
        )}
        
      </CardContent>
    </Card>
  );
};

export default ActivityImageManagerSimple;