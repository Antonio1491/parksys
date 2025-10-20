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
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Star, 
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
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentDescription, setNewDocumentDescription] = useState('');
  const [newDocumentCategory, setNewDocumentCategory] = useState('general');

  // Estados para nuevos videos
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [isVideoFeatured, setIsVideoFeatured] = useState(false);
  const [videoUploadType, setVideoUploadType] = useState<'file' | 'url'>('file');

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
  const { data: images = [], isLoading: imagesLoading } = useQuery<ParkImage[]>({
    queryKey: [`/api/parks/${parkId}/images`],
    queryFn: async () => {
      const response = await fetch(`/api/parks/${parkId}/images`, {
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error cargando imágenes');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<ParkDocument[]>({
    queryKey: [`/api/parks/${parkId}/documents`],
    queryFn: async () => {
      const response = await fetch(`/api/parks/${parkId}/documents`, {
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error cargando documentos');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0
  });

  const { data: videos = [], isLoading: videosLoading, error: videosError } = useQuery<ParkVideo[]>({
    queryKey: [`/api/parks/${parkId}/videos`],
    queryFn: async () => {
      const response = await fetch(`/api/parks/${parkId}/videos`, {
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error cargando videos');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0
  });

  // Mutaciones para imágenes
  const uploadImageMutation = useMutation({
    mutationFn: async (data: FormData | { imageUrl: string; caption: string; isPrimary: boolean }) => {
      if (data instanceof FormData) {
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
        return response.json();
      } else {
        const response = await apiRequest(`/api/parks/${parkId}/images`, {
          method: 'POST',
          data: { ...data, _environment: 'production', _isUrl: true }
        });
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "✅ Imagen guardada exitosamente",
        description: "Su imagen ha sido almacenada con persistencia garantizada.",
        className: "bg-green-50 border-green-200 text-green-800"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      resetImageForm();
      setIsImageDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  const setPrimaryImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await apiRequest(`/api/park-images/${imageId}/set-primary`, {
        method: 'POST',
        data: {}
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "⭐ Imagen principal actualizada",
        description: "¡Nueva imagen principal establecida exitosamente!",
        className: "bg-yellow-50 border-yellow-200 text-yellow-800"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/parks/${parkId}/images`] });
    },
    onError: () => {
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
      if (!response.ok) throw new Error('Error subiendo documento');
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
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo subir el documento. Intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest(`/api/park-documents/${documentId}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/documents`] });
      queryClient.refetchQueries({ queryKey: [`/api/parks/${parkId}/documents`] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/documents`] });
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
    onError: () => {
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
      formData.append('imageFile', newImageFile);
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
    if (!newDocumentTitle.trim()) {
      toast({
        title: "Error",
        description: "El título del documento es requerido.",
        variant: "destructive",
      });
      return;
    }

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

  return (
    <div className="space-y-6">
      {/* Header con botón flotante */}
      <div className="flex justify-end -mt-16 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-[#a0cc4d] hover:bg-[#00a884] text-white hover:text-white">
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsImageDialogOpen(true)}>
              <ImageIcon className="h-4 w-4 mr-2 text-gray-800" />
              Agregar Imagen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsDocumentDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2 text-gray-800" />
              Agregar Documento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsVideoDialogOpen(true)}>
              <Video className="h-4 w-4 mr-2 text-gray-800" />
              Agregar Video
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
                          className="border-gray-400 text-gray-800 hover:bg-yellow-100"
                        >
                          <Star className="h-3 w-3 hover:fill-yellow-500" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(image.imageUrl, '_blank')}
                        className="border-gray-400 text-gray-800 hover:bg-gray-200"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteImageMutation.mutate(image.id)}
                        disabled={deleteImageMutation.isPending}
                        className="border-gray-400 text-gray-800 hover:bg-gray-200"
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

          {videosLoading ? (
            <div className="text-center py-8">Cargando videos...</div>
          ) : videosError ? (
            <div className="text-red-500 text-center py-8">
              Error al cargar videos
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay videos para este parque
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

      {/* DIÁLOGO DE IMAGEN */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
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

      {/* DIÁLOGO DE DOCUMENTO */}
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
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

      {/* DIÁLOGO DE VIDEO */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
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
  );
}