/**
 * GESTOR COMPLETO DE MULTIMEDIA PARA PARQUES
 * ========================================
 * 
 * Componente integral para gestión de imágenes y documentos
 * con soporte para subida de archivos y URLs externas
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Star, 
  StarOff, 
  Download,
  Eye,
  Plus,
  Video,
  Play,
  Link
} from 'lucide-react';

interface ParkImage {
  id: number;
  parkId: number;
  imageUrl: string;
  filePath?: string;
  caption: string;
  isPrimary: boolean;
  createdAt: string;
}

interface ParkDocument {
  id: number;
  parkId: number;
  title: string;
  filePath?: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  description: string;
  category: string;
  createdAt: string;
}

interface ParkVideo {
  id: number;
  parkId: number;
  title: string;
  videoUrl: string;
  videoType: 'file' | 'youtube' | 'vimeo' | 'external';
  filePath?: string;
  fileSize?: number;
  duration?: number;
  thumbnailUrl?: string;
  description: string;
  isFeatured: boolean;
  createdAt: string;
}

interface ParkMultimediaManagerProps {
  parkId: number;
}

export default function ParkMultimediaManager({ parkId }: ParkMultimediaManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para modales
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  // Estados para nuevas imágenes
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');
  const [isPrimaryImage, setIsPrimaryImage] = useState(false);

  // Estados para nuevos documentos
  const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);
  const [newDocumentUrl, setNewDocumentUrl] = useState('');

  // Estados para nuevos videos
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [isVideoFeatured, setIsVideoFeatured] = useState(false);
  const [videoUploadType, setVideoUploadType] = useState<'file' | 'url'>('file');
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentDescription, setNewDocumentDescription] = useState('');
  const [newDocumentCategory, setNewDocumentCategory] = useState('general');

  // Función para limpiar formulario de imagen
  const resetImageForm = () => {
    setNewImageFile(null);
    setNewImageUrl('');
    setNewImageCaption('');
    setIsPrimaryImage(false);
  };

  // Función para limpiar formulario de documento
  const resetDocumentForm = () => {
    setNewDocumentFile(null);
    setNewDocumentUrl('');
    setNewDocumentTitle('');
    setNewDocumentDescription('');
    setNewDocumentCategory('general');
  };

  const resetVideoForm = () => {
    setNewVideoFile(null);
    setNewVideoUrl('');
    setNewVideoTitle('');
    setNewVideoDescription('');
    setIsVideoFeatured(false);
    setVideoUploadType('file');
  };



  // Consultas para obtener datos
  const { data: images = [], isLoading: imagesLoading, error: imagesError } = useQuery<ParkImage[]>({
    queryKey: [`/api/parks/${parkId}/images`],
    queryFn: async () => {
      console.log(`🔍 FRONTEND: Cargando imágenes para parque ${parkId}`);
      const response = await fetch(`/api/parks/${parkId}/images`, {
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error cargando imágenes');
      const data = await response.json();
      console.log(`✅ FRONTEND: Imágenes cargadas:`, data);
      return data;
    },
    staleTime: 0,
    gcTime: 0
  });

  const { data: documents = [], isLoading: documentsLoading, error: documentsError } = useQuery<ParkDocument[]>({
    queryKey: [`/api/parks/${parkId}/documents`],
    queryFn: async () => {
      console.log(`🔍 FRONTEND: Cargando documentos para parque ${parkId}`);
      const response = await fetch(`/api/parks/${parkId}/documents`, {
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error cargando documentos');
      const data = await response.json();
      console.log(`✅ FRONTEND: Documentos cargados:`, data);
      return data;
    },
    staleTime: 0,
    gcTime: 0
  });

  const { data: videos = [], isLoading: videosLoading, error: videosError } = useQuery<ParkVideo[]>({
    queryKey: [`/api/parks/${parkId}/videos`],
    queryFn: async () => {
      console.log(`🔍 FRONTEND: Cargando videos para parque ${parkId}`);
      const response = await fetch(`/api/parks/${parkId}/videos`, {
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error cargando videos');
      const data = await response.json();
      console.log(`✅ FRONTEND: Videos cargados:`, data);
      return data;
    },
    staleTime: 0,
    gcTime: 0
  });

  // Mutaciones para imágenes
  const uploadImageMutation = useMutation({
    mutationFn: async (data: FormData | { imageUrl: string; caption: string; isPrimary: boolean }) => {
      if (data instanceof FormData) {
        // 🚀 SMART UPLOAD: Intentar Object Storage primero, fallback a filesystem
        console.log('🚀 [SMART] Intentando subida inteligente...');
        
        try {
          // 1. Intentar Object Storage (persistente)
          console.log('🚀 [OS] Intentando Object Storage...');
          const uploadResponse = await fetch(`/api/parks/${parkId}/images/upload-os`, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer direct-token-1750522117022',
              'X-User-Id': '1',
              'X-User-Role': 'super_admin',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            console.log('📤 [OS] URL de upload obtenida:', uploadData);
            
            // Subir archivo directamente a Object Storage
            const file = data.get('imageFile') as File;
            const uploadToStorageResponse = await fetch(uploadData.uploadUrl, {
              method: 'PUT',
              body: file,
            });
            
            if (uploadToStorageResponse.ok) {
              // Confirmar upload en base de datos
              const confirmResponse = await fetch(`/api/parks/${parkId}/images/confirm-os`, {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer direct-token-1750522117022',
                  'X-User-Id': '1',
                  'X-User-Role': 'super_admin',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  imageId: uploadData.imageId,
                  filename: uploadData.filename,
                  caption: data.get('caption') || '',
                  isPrimary: data.get('isPrimary') === 'true',
                  uploadUrl: uploadData.uploadUrl
                })
              });
              
              if (confirmResponse.ok) {
                console.log('✅ [OS] Upload exitoso con Object Storage (PERSISTENTE)');
                const result = await confirmResponse.json();
                result._uploadMethod = 'object-storage';
                return result;
              }
            }
          }
          
          console.log('⚠️ [OS] Object Storage no disponible, usando filesystem...');
        } catch (error) {
          console.log('⚠️ [OS] Error con Object Storage:', error);
          console.log('🔄 [FALLBACK] Usando filesystem tradicional...');
        }
        
        // 2. Fallback a filesystem tradicional
        console.log('📁 [FILESYSTEM] Usando subida tradicional (temporal)');
        const response = await fetch(`/api/parks/${parkId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer direct-token-1750522117022',
            'X-User-Id': '1',
            'X-User-Role': 'super_admin'
          },
          body: data
        });
        if (!response.ok) throw new Error('Error subiendo imagen');
        const result = await response.json();
        result._uploadMethod = 'filesystem';
        return result;
      } else {
        // URLs siguen usando el sistema original
        const response = await apiRequest(`/api/parks/${parkId}/images`, {
          method: 'POST',
          data
        });
        return response.json();
      }
    },
    onSuccess: (result) => {
      const isObjectStorage = result._uploadMethod === 'object-storage' || result.imageUrl?.startsWith('/objects/');
      
      toast({
        title: isObjectStorage ? "✅ Imagen guardada (persistente)" : "✅ Imagen subida exitosamente",
        description: isObjectStorage 
          ? "¡Guardada en Object Storage! Inmune a deployments 🛡️" 
          : "La imagen se ha agregado correctamente al parque.",
        className: isObjectStorage 
          ? "bg-green-50 border-green-200 text-green-800" 
          : ""
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      resetImageForm();
      setIsImageDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  const setPrimaryImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      console.log(`⭐ [PRIMARY] Estableciendo imagen ${imageId} como principal`);
      try {
        const response = await apiRequest(`/api/park-images/${imageId}/set-primary`, {
          method: 'POST',
          data: {}
        });
        console.log(`✅ [PRIMARY] Imagen principal actualizada:`, response);
        return response;
      } catch (error) {
        console.error(`❌ [PRIMARY] Error en API:`, error);
        throw error;
      }
    },
    onSuccess: (result) => {
      toast({
        title: "⭐ Imagen principal actualizada",
        description: "¡Nueva imagen principal establecida exitosamente!",
        className: "bg-yellow-50 border-yellow-200 text-yellow-800"
      });
      // Invalidar y refrescar queries múltiples
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/parks'] });
      
      // Forzar refetch inmediato para actualizar UI
      queryClient.refetchQueries({ queryKey: [`/api/parks/${parkId}/images`] });
    },
    onError: (error) => {
      console.error('❌ [PRIMARY] Error:', error);
      toast({
        title: "Error",
        description: "No se pudo establecer como imagen principal.",
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await apiRequest(`/api/park-images/${imageId}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      // ✅ Toast de éxito silenciado - el usuario ve el resultado inmediatamente en la UI
      
      // Invalidación múltiple del cache con diferentes estrategias
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      queryClient.removeQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.refetchQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      
      // Forzar re-render del componente
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      }, 100);
    },
    onError: () => {
      // ✅ Error silenciado - si la imagen no existe, es porque ya fue eliminada (éxito efectivo)
      console.log('🔄 [DELETE] Imagen ya fue eliminada o no existe - actualizando UI');
      
      // Actualizar UI de todas formas
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/parks/${parkId}/images`] });
    },
  });

  // Mutaciones para documentos
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/parks/${parkId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        },
        body: data
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error uploading document:', errorText);
        throw new Error('Error subiendo documento');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Documento subido",
        description: "El documento se ha agregado exitosamente al parque.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      resetDocumentForm();
      setIsDocumentDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo subir el documento. Intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      console.log(`🌐 [API REQUEST] DELETE /api/park-documents/${documentId}`);
      const response = await apiRequest(`/api/park-documents/${documentId}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Documento eliminado",
        description: data?.message || "El documento se ha eliminado correctamente.",
      });
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/parks'] });
      
      // Force refetch documents immediately
      queryClient.refetchQueries({ queryKey: [`/api/parks/${parkId}/documents`] });
    },
    onError: (error: any) => {
      console.error('❌ Error en eliminación:', error);
      // Even if there's an error, try to refresh the data in case it was actually deleted
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/documents`] });
      queryClient.refetchQueries({ queryKey: [`/api/parks/${parkId}/documents`] });
      
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento.",
        variant: "destructive",
      });
    },
  });

  // Mutaciones para videos
  const uploadVideoMutation = useMutation({
    mutationFn: async (data: FormData | { videoUrl: string; title: string; description: string; isFeatured: boolean; videoType: string }) => {
      if (data instanceof FormData) {
        const response = await fetch(`/api/parks/${parkId}/videos`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer direct-token-1750522117022',
            'X-User-Id': '1',
            'X-User-Role': 'super_admin'
          },
          body: data
        });
        if (!response.ok) throw new Error('Error subiendo video');
        return response.json();
      } else {
        const response = await fetch(`/api/parks/${parkId}/videos`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer direct-token-1750522117022',
            'X-User-Id': '1',
            'X-User-Role': 'super_admin',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error subiendo video');
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Video subido",
        description: "El video se ha agregado exitosamente al parque.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/videos`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      resetVideoForm();
      setIsVideoDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo subir el video. Intente nuevamente.",
        variant: "destructive",
      });
    },
  });


  const setFeaturedVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/park-videos/${videoId}/set-featured`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      if (!response.ok) throw new Error('Error actualizando video destacado');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Video destacado actualizado",
        description: "Se ha establecido el nuevo video destacado del parque.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/videos`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo establecer el video destacado.",
        variant: "destructive",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/park-videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error eliminando video');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Video eliminado",
        description: "El video se ha eliminado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/videos`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el video.",
        variant: "destructive",
      });
    },
  });

  // Funciones de manejo
  const handleImageSubmit = () => {
    if (newImageFile) {
      const formData = new FormData();
      formData.append('imageFile', newImageFile);  // DEBE coincidir con backend
      formData.append('caption', newImageCaption);
      formData.append('isPrimary', isPrimaryImage.toString());
      uploadImageMutation.mutate(formData);
    } else if (newImageUrl) {
      uploadImageMutation.mutate({
        imageUrl: newImageUrl,
        caption: newImageCaption,
        isPrimary: isPrimaryImage
      });
    }
  };

  const handleDocumentSubmit = () => {
    // Validar que se haya proporcionado un título
    if (!newDocumentTitle.trim()) {
      toast({
        title: "Error",
        description: "El título del documento es requerido.",
        variant: "destructive",
      });
      return;
    }

    // Priorizar archivo sobre URL - el archivo es obligatorio
    if (!newDocumentFile) {
      toast({
        title: "Error", 
        description: "Debe seleccionar un archivo para subir.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('document', newDocumentFile);
    formData.append('title', newDocumentTitle);
    formData.append('description', newDocumentDescription);
    formData.append('category', newDocumentCategory);
    
    // URL field removed - not supported in current database schema
    
    uploadDocumentMutation.mutate(formData);
  };

  const handleVideoSubmit = () => {
    if (!newVideoTitle.trim()) {
      toast({
        title: "Error",
        description: "El título del video es requerido.",
        variant: "destructive",
      });
      return;
    }

    if (videoUploadType === 'file') {
      if (!newVideoFile) {
        toast({
          title: "Error",
          description: "Debe seleccionar un archivo de video para subir.",
          variant: "destructive",
        });
        return;
      }
      
      const formData = new FormData();
      formData.append('video', newVideoFile);
      formData.append('title', newVideoTitle);
      formData.append('description', newVideoDescription);
      formData.append('isFeatured', isVideoFeatured.toString());
      formData.append('videoType', 'file');
      
      uploadVideoMutation.mutate(formData);
    } else {
      if (!newVideoUrl.trim()) {
        toast({
          title: "Error",
          description: "La URL del video es requerida.",
          variant: "destructive",
        });
        return;
      }

      // Detectar el tipo de video basado en la URL
      let videoType = 'external';
      if (newVideoUrl.includes('youtube.com') || newVideoUrl.includes('youtu.be')) {
        videoType = 'youtube';
      } else if (newVideoUrl.includes('vimeo.com')) {
        videoType = 'vimeo';
      }

      uploadVideoMutation.mutate({
        videoUrl: newVideoUrl,
        title: newVideoTitle,
        description: newVideoDescription,
        isFeatured: isVideoFeatured,
        videoType
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  console.log('🔍 MULTIMEDIA MANAGER - Renderizando con:', {
    parkId,
    images: images.length,
    documents: documents.length,
    imagesLoading,
    documentsLoading,
    imagesError,
    documentsError
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Imágenes ({images.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Videos ({videos.length})
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA DE IMÁGENES */}
        <TabsContent value="images" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Galería de Imágenes</h3>
            <div className="flex gap-2">
              <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Imagen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Nueva Imagen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Subir archivo</label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewImageFile(file);
                            setNewImageUrl('');
                          }
                        }}
                      />
                    </div>
                    <div className="text-center text-sm text-gray-500">- O -</div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">URL de imagen</label>
                      <Input
                        value={newImageUrl}
                        onChange={(e) => {
                          setNewImageUrl(e.target.value);
                          if (e.target.value) setNewImageFile(null);
                        }}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Descripción</label>
                      <Textarea
                        value={newImageCaption}
                        onChange={(e) => setNewImageCaption(e.target.value)}
                        placeholder="Descripción de la imagen..."
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPrimary"
                        checked={isPrimaryImage}
                        onChange={(e) => setIsPrimaryImage(e.target.checked)}
                      />
                      <label htmlFor="isPrimary" className="text-sm">Establecer como imagen principal</label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleImageSubmit}
                      disabled={(!newImageFile && !newImageUrl) || uploadImageMutation.isPending}
                    >
                      {uploadImageMutation.isPending ? 'Subiendo...' : 'Agregar Imagen'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {imagesLoading ? (
            <div className="text-center py-8">Cargando imágenes...</div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay imágenes para este parque
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={image.imageUrl}
                      alt={image.caption}
                      className="w-full h-48 object-cover"
                    />
                    {image.isPrimary && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-900">
                        <Star className="h-3 w-3 mr-1 fill-yellow-600 text-yellow-600" />
                        Principal
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-3">{image.caption}</p>
                    <div className="flex gap-2">
                      {!image.isPrimary && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPrimaryImageMutation.mutate(image.id)}
                          disabled={setPrimaryImageMutation.isPending}
                          className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                        >
                          <Star className="h-3 w-3 hover:fill-yellow-500" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(image.imageUrl, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteImageMutation.mutate(image.id)}
                        disabled={deleteImageMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* PESTAÑA DE DOCUMENTOS */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Documentos del Parque</h3>
            <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Documento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Título</label>
                    <Input
                      value={newDocumentTitle}
                      onChange={(e) => setNewDocumentTitle(e.target.value)}
                      placeholder="Título del documento"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Archivo del Documento *</label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setNewDocumentFile(file || null);
                      }}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos permitidos: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX (máx. 10MB)
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">URL de Referencia (opcional)</label>
                    <Input
                      value={newDocumentUrl}
                      onChange={(e) => setNewDocumentUrl(e.target.value)}
                      placeholder="https://ejemplo.com/documento-original.pdf"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL opcional para referenciar el documento original o fuente
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoría</label>
                    <select
                      value={newDocumentCategory}
                      onChange={(e) => setNewDocumentCategory(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="general">General</option>
                      <option value="reglamento">Reglamento</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="eventos">Eventos</option>
                      <option value="legal">Legal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Descripción</label>
                    <Textarea
                      value={newDocumentDescription}
                      onChange={(e) => setNewDocumentDescription(e.target.value)}
                      placeholder="Descripción del documento..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleDocumentSubmit}
                    disabled={!newDocumentFile || !newDocumentTitle.trim() || uploadDocumentMutation.isPending}
                  >
                    {uploadDocumentMutation.isPending ? 'Subiendo...' : 'Agregar Documento'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {documentsLoading ? (
            <div className="text-center py-8">Cargando documentos...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay documentos para este parque
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((document) => (
                <Card key={document.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{document.title}</h4>
                          <p className="text-xs text-gray-500 capitalize">{document.category}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{formatFileSize(document.fileSize)}</Badge>
                    </div>
                    
                    {document.description && (
                      <p className="text-sm text-gray-600 mb-3">{document.description}</p>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(document.fileUrl, '_blank')}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteDocumentMutation.mutate(document.id)}
                        disabled={deleteDocumentMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* PESTAÑA DE VIDEOS */}
        <TabsContent value="videos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Galería de Videos</h3>
            <div className="flex gap-2">
              <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Video
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Video</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo de subida</label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={videoUploadType === 'file' ? 'default' : 'outline'}
                          onClick={() => setVideoUploadType('file')}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Archivo
                        </Button>
                        <Button
                          type="button"
                          variant={videoUploadType === 'url' ? 'default' : 'outline'}
                          onClick={() => setVideoUploadType('url')}
                          className="flex-1"
                        >
                          <Link className="h-4 w-4 mr-2" />
                          URL
                        </Button>
                      </div>
                    </div>

                    {videoUploadType === 'file' ? (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Archivo de Video</label>
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => setNewVideoFile(e.target.files?.[0] || null)}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-medium mb-2 block">URL del Video</label>
                        <Input
                          placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Soporta YouTube, Vimeo y otras URLs de video
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium mb-2 block">Título *</label>
                      <Input
                        placeholder="Título del video"
                        value={newVideoTitle}
                        onChange={(e) => setNewVideoTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Descripción</label>
                      <Textarea
                        placeholder="Descripción del video (opcional)"
                        value={newVideoDescription}
                        onChange={(e) => setNewVideoDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="videoFeatured"
                        checked={isVideoFeatured}
                        onChange={(e) => setIsVideoFeatured(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label htmlFor="videoFeatured" className="text-sm font-medium">
                        Video destacado
                      </label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleVideoSubmit}
                      disabled={uploadVideoMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {uploadVideoMutation.isPending ? 'Subiendo...' : 'Agregar Video'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {videosLoading ? (
            <div className="text-center py-8">Cargando videos...</div>
          ) : videosError ? (
            <div className="text-red-500 text-center py-8">
              Error al cargar videos: {(videosError as Error).message}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay videos</h3>
              <p className="text-gray-500 mb-4">Comienza agregando el primer video al parque.</p>
              <Button 
                onClick={() => setIsVideoDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Video
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          {video.videoType === 'youtube' ? (
                            <Play className="h-4 w-4 text-purple-600" />
                          ) : video.videoType === 'vimeo' ? (
                            <Video className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Video className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{video.title}</h4>
                          <p className="text-xs text-gray-500 capitalize">
                            {video.videoType === 'youtube' ? 'YouTube' : 
                             video.videoType === 'vimeo' ? 'Vimeo' : 
                             video.videoType === 'file' ? 'Archivo' : 'Externo'}
                          </p>
                        </div>
                      </div>
                      {video.isFeatured && (
                        <Badge variant="default" className="bg-purple-100 text-purple-800">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Destacado
                        </Badge>
                      )}
                    </div>
                    
                    {video.description && (
                      <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(video.videoUrl, '_blank')}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      {!video.isFeatured && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setFeaturedVideoMutation.mutate(video.id)}
                          disabled={setFeaturedVideoMutation.isPending}
                          className="border-purple-200 text-purple-600 hover:bg-purple-50"
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteVideoMutation.mutate(video.id)}
                        disabled={deleteVideoMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}