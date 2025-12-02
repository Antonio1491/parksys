/**
 * GESTOR COMPLETO DE MULTIMEDIA PARA PARQUES
 * ========================================
 * 
 * Componente integral para gestión de imágenes, documentos y videos
 * con soporte para subida de archivos y URLs externas
 * 
 * ACTUALIZADO: Usa autenticación Firebase real en lugar de tokens hardcodeados
 */

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { auth } from '@/lib/firebase';
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
  Link,
  MoreVertical,
  Loader2
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

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

// ============================================================================
// HELPER: Obtener headers de autenticación Firebase
// ============================================================================

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const idToken = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    }
  } catch (error) {
    console.warn('Error getting Firebase ID token:', error);
  }

  // Obtener información de usuario almacenada
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      headers['X-User-Id'] = userObj.id?.toString() || '1';
      headers['X-User-Role'] = userObj.role || 'admin';

      // Firebase UID para bypass durante migración
      if (userObj.firebaseUid) {
        headers['x-firebase-uid'] = userObj.firebaseUid;
      }
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }
  }

  return headers;
}

/**
 * Fetch autenticado con Firebase
 */
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();

  const mergedHeaders: Record<string, string> = {
    ...authHeaders,
  };

  // No agregar Content-Type si es FormData (el browser lo agrega automáticamente con boundary)
  if (options.body && !(options.body instanceof FormData)) {
    mergedHeaders['Content-Type'] = 'application/json';
  }

  // Merge con headers existentes si los hay
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(mergedHeaders, existingHeaders);
  }

  return fetch(url, {
    ...options,
    headers: mergedHeaders,
    credentials: 'include',
  });
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

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

  // ============================================================================
  // FUNCIONES DE RESET
  // ============================================================================

  const resetImageForm = useCallback(() => {
    setNewImageFile(null);
    setNewImageUrl('');
    setNewImageCaption('');
    setIsPrimaryImage(false);
  }, []);

  const resetDocumentForm = useCallback(() => {
    setNewDocumentFile(null);
    setNewDocumentTitle('');
    setNewDocumentDescription('');
    setNewDocumentCategory('general');
  }, []);

  const resetVideoForm = useCallback(() => {
    setNewVideoFile(null);
    setNewVideoUrl('');
    setNewVideoTitle('');
    setNewVideoDescription('');
    setIsVideoFeatured(false);
    setVideoUploadType('file');
  }, []);

  // ============================================================================
  // QUERIES
  // ============================================================================

  const { data: images = [], isLoading: imagesLoading } = useQuery<ParkImage[]>({
    queryKey: [`/api/parks/${parkId}/images`],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/parks/${parkId}/images`);
      if (!response.ok) throw new Error('Error cargando imágenes');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<ParkDocument[]>({
    queryKey: [`/api/parks/${parkId}/documents`],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/parks/${parkId}/documents`);
      if (!response.ok) throw new Error('Error cargando documentos');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery<ParkVideo[]>({
    queryKey: [`/api/parks/${parkId}/videos`],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/parks/${parkId}/videos`);
      if (!response.ok) throw new Error('Error cargando videos');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0
  });

  // ============================================================================
  // MUTACIONES - IMÁGENES
  // ============================================================================

  const uploadImageMutation = useMutation({
    mutationFn: async (data: FormData | { imageUrl: string; caption: string; isPrimary: boolean }) => {
      if (data instanceof FormData) {
        const response = await authenticatedFetch(`/api/parks/${parkId}/images`, {
          method: 'POST',
          body: data
        });
        if (!response.ok) throw new Error('Error subiendo imagen');
        return response.json();
      } else {
        const response = await authenticatedFetch(`/api/parks/${parkId}/images`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error subiendo imagen');
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "✅ Imagen guardada",
        description: "La imagen se ha agregado correctamente.",
        className: "bg-green-50 border-green-200 text-green-800"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      resetImageForm();
      setIsImageDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen.",
        variant: "destructive",
      });
    },
  });

  const setPrimaryImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await authenticatedFetch(`/api/parks/${parkId}/images/${imageId}/set-primary`, {
        method: 'PUT',
        body: JSON.stringify({})
      });
      if (!response.ok) throw new Error('Error estableciendo imagen principal');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Imagen principal actualizada",
        description: "Se ha establecido la nueva imagen principal.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la imagen principal.",
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await authenticatedFetch(`/api/parks/${parkId}/images/${imageId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Error eliminando imagen');
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/images`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen.",
        variant: "destructive",
      });
    },
  });

  // ============================================================================
  // MUTACIONES - DOCUMENTOS
  // ============================================================================

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await authenticatedFetch(`/api/parks/${parkId}/documents`, {
        method: 'POST',
        body: data
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error subiendo documento');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Documento subido",
        description: "El documento se ha agregado correctamente.",
        className: "bg-green-50 border-green-200 text-green-800"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/documents`] });
      resetDocumentForm();
      setIsDocumentDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el documento.",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await authenticatedFetch(`/api/parks/${parkId}/documents/${documentId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Error eliminando documento');
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/documents`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento.",
        variant: "destructive",
      });
    },
  });

  // ============================================================================
  // MUTACIONES - VIDEOS
  // ============================================================================

  const uploadVideoMutation = useMutation({
    mutationFn: async (data: FormData | { videoUrl: string; title: string; description: string; isFeatured: boolean; videoType: string }) => {
      if (data instanceof FormData) {
        const response = await authenticatedFetch(`/api/parks/${parkId}/videos`, {
          method: 'POST',
          body: data
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error subiendo video');
        }
        return response.json();
      } else {
        const response = await authenticatedFetch(`/api/parks/${parkId}/videos`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error subiendo video');
        }
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "✅ Video agregado",
        description: "El video se ha agregado correctamente.",
        className: "bg-green-50 border-green-200 text-green-800"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/videos`] });
      resetVideoForm();
      setIsVideoDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el video.",
        variant: "destructive",
      });
    },
  });

  const setFeaturedVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await authenticatedFetch(`/api/parks/${parkId}/videos/${videoId}/set-featured`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      if (!response.ok) throw new Error('Error estableciendo video destacado');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Video destacado actualizado",
        description: "Se ha establecido el nuevo video destacado.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/videos`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el video destacado.",
        variant: "destructive",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await authenticatedFetch(`/api/parks/${parkId}/videos/${videoId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Error eliminando video');
      return response;
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

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleImageSubmit = async () => {
    if (newImageFile) {
      const formData = new FormData();
      formData.append('image', newImageFile);
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

  const handleDocumentSubmit = async () => {
    if (!newDocumentFile || !newDocumentTitle.trim()) return;

    const formData = new FormData();
    formData.append('document', newDocumentFile);
    formData.append('title', newDocumentTitle);
    formData.append('description', newDocumentDescription);
    formData.append('category', newDocumentCategory);

    uploadDocumentMutation.mutate(formData);
  };

  const handleVideoSubmit = async () => {
    if (videoUploadType === 'file' && newVideoFile) {
      const formData = new FormData();
      formData.append('video', newVideoFile);
      formData.append('title', newVideoTitle);
      formData.append('description', newVideoDescription);
      formData.append('isFeatured', isVideoFeatured.toString());
      uploadVideoMutation.mutate(formData);
    } else if (videoUploadType === 'url' && newVideoUrl) {
      // Detectar tipo de video
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

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word') || fileType?.includes('doc')) return '📝';
    if (fileType?.includes('excel') || fileType?.includes('sheet')) return '📊';
    if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) return '📽️';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getVideoThumbnail = (video: ParkVideo) => {
    if (video.thumbnailUrl) return video.thumbnailUrl;

    // Extraer thumbnail de YouTube
    if (video.videoUrl?.includes('youtube.com') || video.videoUrl?.includes('youtu.be')) {
      let videoId = null;

      // Formato: youtube.com/watch?v=VIDEO_ID
      if (video.videoUrl.includes('watch?v=')) {
        videoId = video.videoUrl.split('watch?v=')[1]?.split('&')[0];
      }
      // Formato: youtu.be/VIDEO_ID
      else if (video.videoUrl.includes('youtu.be/')) {
        videoId = video.videoUrl.split('youtu.be/')[1]?.split('?')[0];
      }

      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }

    return null;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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

        {/* TAB DE IMÁGENES */}
        <TabsContent value="images" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Galería de Imágenes</h3>
            <Button onClick={() => setIsImageDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Imagen
            </Button>
          </div>

          {imagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : images.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay imágenes agregadas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden group relative">
                  <div className="aspect-square relative">
                    <img
                      src={image.imageUrl}
                      alt={image.caption || 'Imagen del parque'}
                      className="w-full h-full object-cover"
                    />
                    {image.isPrimary && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Principal
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(image.imageUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!image.isPrimary && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setPrimaryImageMutation.mutate(image.id)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteImageMutation.mutate(image.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {image.caption && (
                    <CardContent className="p-2">
                      <p className="text-sm text-gray-600 truncate">{image.caption}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB DE DOCUMENTOS */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Documentos del Parque</h3>
            <Button onClick={() => setIsDocumentDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Documento
            </Button>
          </div>

          {documentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay documentos agregados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-gray-500">
                          {doc.category} • {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteDocumentMutation.mutate(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB DE VIDEOS */}
        <TabsContent value="videos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Videos del Parque</h3>
            <Button onClick={() => setIsVideoDialogOpen(true)} size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Video
            </Button>
          </div>

          {videosLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : videos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay videos agregados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video relative bg-gray-100">
                    {getVideoThumbnail(video) ? (
                      <img
                        src={getVideoThumbnail(video)!}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {video.isFeatured && (
                      <Badge className="absolute top-2 left-2 bg-purple-600">
                        <Star className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{video.title || 'Sin título'}</p>
                        {video.description && (
                          <p className="text-sm text-gray-500 truncate">{video.description}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(video.videoUrl, '_blank')}>
                            <Play className="h-4 w-4 mr-2" />
                            Reproducir
                          </DropdownMenuItem>
                          {!video.isFeatured && (
                            <DropdownMenuItem onClick={() => setFeaturedVideoMutation.mutate(video.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              Destacar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteVideoMutation.mutate(video.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ================================================================== */}
      {/* DIÁLOGOS */}
      {/* ================================================================== */}

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
                className="h-4 w-4"
              />
              <label htmlFor="isPrimary" className="text-sm">Establecer como imagen principal</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImageSubmit}
              disabled={(!newImageFile && !newImageUrl) || uploadImageMutation.isPending}
            >
              {uploadImageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : 'Agregar Imagen'}
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
              <label className="text-sm font-medium mb-2 block">Título *</label>
              <Input
                value={newDocumentTitle}
                onChange={(e) => setNewDocumentTitle(e.target.value)}
                placeholder="Título del documento"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Archivo *</label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                onChange={(e) => setNewDocumentFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX (máx. 10MB)
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
            <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDocumentSubmit}
              disabled={!newDocumentFile || !newDocumentTitle.trim() || uploadDocumentMutation.isPending}
            >
              {uploadDocumentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : 'Agregar Documento'}
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
                  placeholder="https://youtube.com/watch?v=..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Soporta YouTube, Vimeo y otras URLs
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
              disabled={
                (videoUploadType === 'file' && !newVideoFile) ||
                (videoUploadType === 'url' && !newVideoUrl) ||
                !newVideoTitle.trim() ||
                uploadVideoMutation.isPending
              }
              className="bg-purple-600 hover:bg-purple-700"
            >
              {uploadVideoMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : 'Agregar Video'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}