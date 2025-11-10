import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/components/AdminLayout';
import { 
  Leaf, 
  Search, 
  Plus, 
  Pencil, 
  Filter, 
  CircleCheck, 
  CircleAlert, 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Save, 
  Brush, 
  CopyCheck, 
  CheckSquare, 
  Trash2, 
  Square, 
  TreePine, 
  Sprout, 
  ArrowRight, 
  ArrowLeft, 
  Image as ImageIcon 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import TreeSpeciesIcon from '@/components/ui/tree-species-icon';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper para obtener estilos de badge según origen
const getOriginBadgeStyles = (origin: string) => {
  switch (origin) {
    case 'Nativo':
      return 'bg-[#cff9c5] text-gray-800';
    case 'Introducido':
      return 'bg-[#c5efff] text-gray-800';
    case 'Naturalizado':
      return 'bg-[#f1e3ff] text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper para obtener estilos de badge según tasa de crecimiento
const getGrowthRateBadgeStyles = (growthRate: string) => {
  switch (growthRate) {
    case 'Lento':
      return 'text-gray-800 border-gray-300';
    case 'Medio':
      return 'text-gray-800 border-gray-300';
    case 'Rapido':
    case 'Rápido':
      return 'text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper para obtener color de fondo según tasa de crecimiento
const getGrowthRateBackground = (growthRate: string) => {
  switch (growthRate) {
    case 'Lento':
      return '#a6b2ed'; // Azul lavanda
    case 'Medio':
      return '#efcda5'; // Beige/crema
    case 'Rapido':
    case 'Rápido':
      return '#99dd9c'; // Verde claro
    default:
      return '#e5e7eb'; // Gris claro por defecto
  }
};

interface TreeSpecies {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  origin: string;
  growthRate: string;
  imageUrl: string;
  isEndangered: boolean;
  iconType?: 'system' | 'custom';
  customIconUrl?: string | null;
  customPhotoUrl?: string | null;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Schema de validación para editar especie
const editTreeSpeciesSchema = z.object({
  commonName: z.string().min(2, { message: 'El nombre común debe tener al menos 2 caracteres.' }),
  scientificName: z.string().min(2, { message: 'El nombre científico debe tener al menos 2 caracteres.' }),
  family: z.string().min(2, { message: 'La familia debe tener al menos 2 caracteres.' }),
  origin: z.string({ required_error: 'Selecciona el origen de la especie.' }),
  growthRate: z.string({ required_error: 'Selecciona la tasa de crecimiento.' }),
  description: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }).max(1000),
  isEndangered: z.boolean().default(false),
  imageUrl: z.string().optional(),
  climateZone: z.string().optional(),
  heightMature: z.string().optional(),
  canopyDiameter: z.string().optional(),
  lifespan: z.string().optional(),
  maintenanceRequirements: z.string().optional(),
  waterRequirements: z.string().optional(),
  sunRequirements: z.string().optional(),
  soilRequirements: z.string().optional(),
  ecologicalBenefits: z.string().optional(),
  ornamentalValue: z.string().optional(),
  commonUses: z.string().optional(),
});

type EditTreeSpeciesFormValues = z.infer<typeof editTreeSpeciesSchema>;

function TreeSpeciesCatalog() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('common_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isIconUploadDialogOpen, setIsIconUploadDialogOpen] = useState(false);
  const [selectedIconFiles, setSelectedIconFiles] = useState<FileList | null>(null);
  const [iconUploadFamily, setIconUploadFamily] = useState('general');
  const [isUploading, setIsUploading] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSpeciesForEdit, setSelectedSpeciesForEdit] = useState<TreeSpecies | null>(null);
  const [activeEditTab, setActiveEditTab] = useState('basic');
  // Formulario de edición
  const editForm = useForm<EditTreeSpeciesFormValues>({
    resolver: zodResolver(editTreeSpeciesSchema),
    defaultValues: {
      commonName: '',
      scientificName: '',
      family: '',
      origin: 'Nativo',
      growthRate: 'Medio',
      description: '',
      isEndangered: false,
      imageUrl: '',
      climateZone: '',
      heightMature: '',
      canopyDiameter: '',
      lifespan: '',
      maintenanceRequirements: '',
      waterRequirements: '',
      sunRequirements: '',
      soilRequirements: '',
      ecologicalBenefits: '',
      ornamentalValue: '',
      commonUses: '',
    },
  });
  // Cargar datos cuando se selecciona una especie para editar
  useEffect(() => {
    if (selectedSpeciesForEdit && isEditDialogOpen) {
      editForm.reset({
        commonName: selectedSpeciesForEdit.commonName || '',
        scientificName: selectedSpeciesForEdit.scientificName || '',
        family: selectedSpeciesForEdit.family || '',
        origin: selectedSpeciesForEdit.origin || 'Nativo',
        growthRate: selectedSpeciesForEdit.growthRate || 'Medio',
        description: '', // La descripción no está en la interface actual
        isEndangered: selectedSpeciesForEdit.isEndangered || false,
        imageUrl: selectedSpeciesForEdit.imageUrl || '',
        climateZone: '',
        heightMature: '',
        canopyDiameter: '',
        lifespan: '',
        maintenanceRequirements: '',
        waterRequirements: '',
        sunRequirements: '',
        soilRequirements: '',
        ecologicalBenefits: '',
        ornamentalValue: '',
        commonUses: '',
      });
    }
  }, [selectedSpeciesForEdit, isEditDialogOpen, editForm]);

  // Función para corregir encoding UTF-8
  const fixEncoding = (text: string): string => {
    return text
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã±/g, 'ñ')
      .replace(/Ã/g, 'Á')
      .replace(/Ã‰/g, 'É')
      .replace(/Ã/g, 'Í')
      .replace(/Ã"/g, 'Ó')
      .replace(/Ãš/g, 'Ú')
      .replace(/Ã'/g, 'Ñ')
      .replace(/Â¿/g, '¿')
      .replace(/Â¡/g, '¡')
      .replace(/Ã¼/g, 'ü')
      .replace(/Ã‡/g, 'Ç')
      .replace(/Ã§/g, 'ç');
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/tree-species', searchTerm, originFilter, currentPage, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (originFilter !== 'all') params.append('origin', originFilter);
      params.append('page', currentPage.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const response = await fetch(`/api/tree-species?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Error al cargar especies arbóreas');
      }
      return response.json();
    }
  });

  const species: TreeSpecies[] = data?.data || [];
  const pagination: PaginationInfo = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setOriginFilter('all');
    setSortBy('common_name');
    setSortOrder('asc');
  };

  const handleCreateNew = () => {
    setLocation(ROUTES.admin.trees.species.create);
  };

  const handleViewDetails = (id: number) => {
    // Validate that id is a valid number
    if (typeof id === 'number' && !isNaN(id) && id > 0) {
      setLocation(ROUTES.admin.trees.species.view.build(id));
    } else {
      console.warn('Invalid tree species ID:', id);
      toast({
        title: "Error",
        description: "ID de especie inválido. Por favor, contacta al administrador.",
        variant: "destructive",
      });
    }
  };

  // Mutación para importar CSV
  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      console.log("=== MUTATION FUNCTION ===");
      console.log("Received data in mutation:", data);
      console.log("Data length:", data?.length);
      
      const payload = { data };
      console.log("Sending payload:", payload);
      console.log("Payload JSON:", JSON.stringify(payload));
      
      const response = await apiRequest('/api/tree-species/import/csv', {
        method: 'POST',
        data: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("API Response:", response);
      return response;
    },
    onSuccess: (response) => {
      toast({
        title: "Importación completada",
        description: response.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tree-species'] });
      setIsImportDialogOpen(false);
      setCsvPreview([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error en la importación",
        description: error.message || "Error al importar especies",
        variant: "destructive",
      });
    },
  });

  // Manejar exportación CSV
  const handleExportCsv = async () => {
    try {
      const response = await fetch('/api/tree-species/export/csv');
      if (!response.ok) {
        throw new Error('Error al exportar CSV');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'especies-arboreas.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Exportación exitosa",
        description: "El archivo CSV se ha descargado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar el archivo CSV",
        variant: "destructive",
      });
    }
  };

  // Descargar plantilla CSV con ejemplos
  const handleDownloadTemplate = () => {
    const headers = [
      'nombre_comun',
      'nombre_cientifico', 
      'familia',
      'origen',
      'ritmo_crecimiento',
      'url_imagen',
      'amenazada',
      'descripcion',
      'beneficios_ecologicos',
      'requisitos_mantenimiento',
      'esperanza_vida',
      'zona_climatica',
      'requisitos_suelo',
      'requisitos_agua',
      'requisitos_sol',
      'valor_ornamental',
      'usos_comunes'
    ];

    const examples = [
      [
        'Ahuehuete',
        'Taxodium mucronatum',
        'Cupressaceae',
        'Nativo',
        'Medio',
        'https://ejemplo.com/ahuehuete.jpg',
        'no',
        'Árbol sagrado de México, de gran longevidad y porte majestuoso. Se caracteriza por su tronco grueso y su corteza fibrosa. Es el árbol nacional de México.',
        'Purifica el aire, proporciona sombra abundante, refugio para fauna, control de erosión, absorbe CO2',
        'Riego abundante los primeros años, poda de mantenimiento ocasional, fertilización anual',
        '500-1500 años',
        'Templado húmedo a subtropical',
        'Suelos húmedos, bien drenados, tolera encharcamiento temporal',
        'Abundante, tolera inundaciones estacionales',
        'Pleno sol a sombra parcial',
        'Alto - follaje denso, forma característica, corteza atractiva',
        'Ornamental, sombra, conservación de suelos, valor histórico y cultural'
      ],
      [
        'Jacaranda',
        'Jacaranda mimosifolia',
        'Bignoniaceae',
        'Introducido',
        'Rapido',
        'https://ejemplo.com/jacaranda.jpg',
        'no',
        'Árbol ornamental famoso por su espectacular floración violeta. Originario de Argentina, ampliamente cultivado en México por su belleza.',
        'Atrae polinizadores, proporciona sombra, mejora paisaje urbano',
        'Riego moderado, poda después de floración, fertilización en primavera',
        '50-100 años',
        'Subtropical a templado',
        'Bien drenados, tolera sequía una vez establecido',
        'Moderada, evitar encharcamiento',
        'Pleno sol',
        'Muy alto - floración espectacular, follaje delicado',
        'Ornamental, sombra en parques y avenidas, paisajismo'
      ]
    ];

    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...examples.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    // Crear y descargar archivo con BOM UTF-8 para acentos correctos
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'plantilla-especies-arboreas.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Plantilla descargada",
      description: "La plantilla CSV con ejemplos se ha descargado correctamente",
    });
  };

  // Manejar selección de archivo CSV
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona un archivo CSV",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      let csvText = event.target?.result as string;
      // Corregir encoding UTF-8
      csvText = fixEncoding(csvText);
      // console.log("CSV después de corrección de encoding (preview):", csvText.substring(0, 500)); // Disabled to prevent Vite issues
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Archivo vacío",
          description: "El archivo CSV no contiene datos",
          variant: "destructive",
        });
        return;
      }

      // Parse CSV data
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        
        // Map CSV headers to expected fields
        headers.forEach((header, i) => {
          const value = values[i] || '';
          const normalizedHeader = header.toLowerCase().replace(/[_\s]/g, '');
          
          switch (normalizedHeader) {
            case 'nombrecomun':
            case 'nombrecomún':
            case 'commonname':
              row.commonName = value;
              break;
            case 'nombrecientifico':
            case 'nombrecientífico':
            case 'scientificname':
              row.scientificName = value;
              break;
            case 'familia':
            case 'family':
              row.family = value;
              break;
            case 'origen':
            case 'origin':
              row.origin = value;
              break;
            case 'ritmodecrecimiento':
            case 'ritmocrecimiento':
            case 'growthrate':
              // Normalizar automáticamente caracteres especiales para evitar crashes de Vite
              row.growthRate = value === 'Rapido' || value.toLowerCase().includes('rapido') || value.includes('á') ? 'Rapido' : value;
              break;
            case 'amenazada':
            case 'isendangered':
            case 'endangered':
              row.isEndangered = value.toLowerCase() === 'sí' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
              break;
            case 'descripción':
            case 'descripcion':
            case 'description':
              row.description = value;
              break;
            case 'instruccionesdecuidado':
            case 'careinstructions':
              row.careInstructions = value;
              break;
            case 'beneficios':
            case 'beneficiosecologicos':
            case 'benefits':
              row.benefits = value;
              break;
            case 'urldeimagen':
            case 'imageurl':
            case 'urlimagen':
              row.imageUrl = value;
              break;
          }
        });
        
        return row;
      });

      setCsvPreview(data.slice(0, 5)); // Show first 5 rows for preview
      setIsImportDialogOpen(true);
    };

    reader.readAsText(file);
  };

  // Confirmar importación
  const handleConfirmImport = () => {
    if (csvPreview.length === 0) return;
    
    // Read the full file again for import
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      let csvText = event.target?.result as string;
      // Corregir encoding UTF-8
      csvText = fixEncoding(csvText);
      // console.log("CSV después de corrección de encoding (importación):", csvText.substring(0, 500)); // Disabled to prevent Vite issues
      const lines = csvText.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        
        // Mapeo directo desde CSV a objeto
        headers.forEach((header, i) => {
          const value = values[i] || '';
          const normalizedHeader = header.toLowerCase();
          
          // Normalizar automáticamente caracteres especiales para evitar crashes de Vite
          if (normalizedHeader.includes('crecimiento') || normalizedHeader.includes('growthrate')) {
            row[normalizedHeader] = value === 'Rapido' || value.toLowerCase().includes('rapido') || value.includes('á') ? 'Rapido' : value;
          } else {
            row[normalizedHeader] = value;
          }
        });
        
        // Convertir isEndangered a boolean si existe
        if (row.isendangered !== undefined) {
          row.isEndangered = row.isendangered === 'true' || row.isendangered === true;
          delete row.isendangered;
        }
        
        // console.log("Parsed row:", row); // Disabled to prevent Vite module processing issues
        return row;
      });

      // console.log("=== FRONTEND CSV DATA ==="); // Disabled to prevent Vite issues
      // console.log("Parsed data:", data); // Disabled to prevent Vite issues  
      // console.log("Data length:", data.length); // Disabled to prevent Vite issues
      // console.log("First row:", data[0]); // Disabled to prevent Vite issues
      importMutation.mutate(data);
    };

    reader.readAsText(file);
  };

  // Manejar selección de archivos de iconos
  const handleIconFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Verificar que sean archivos de imagen
    const validFiles = Array.from(files).filter(file => {
      const isValid = file.type.startsWith('image/') && 
                     (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/svg+xml');
      if (!isValid) {
        toast({
          title: "Archivo inválido",
          description: `${file.name} no es un archivo de imagen válido`,
          variant: "destructive",
        });
      }
      return isValid;
    });

    if (validFiles.length > 0) {
      const fileList = new DataTransfer();
      validFiles.forEach(file => fileList.items.add(file));
      setSelectedIconFiles(fileList.files);
      setIsIconUploadDialogOpen(true);
    }
  };

  // Mutación para subida masiva de iconos
  const bulkIconUploadMutation = useMutation({
    mutationFn: async ({ files, family }: { files: FileList, family: string }) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('icons', file);
      });
      formData.append('family', family);

      const response = await fetch('/api/tree-species/bulk-upload-icons', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la carga masiva');
      }

      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Carga masiva completada",
        description: `${result.successCount} especies creadas/actualizadas exitosamente`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tree-species'] });
      setIsIconUploadDialogOpen(false);
      setSelectedIconFiles(null);
      setIconUploadFamily('general');
    },
    onError: (error: any) => {
      toast({
        title: "Error en la carga masiva",
        description: error.message || "Error al procesar los iconos",
        variant: "destructive",
      });
    },
  });

  // Confirmar subida de iconos
  const handleConfirmIconUpload = () => {
    if (!selectedIconFiles || selectedIconFiles.length === 0) return;
    
    setIsUploading(true);
    bulkIconUploadMutation.mutate({ 
      files: selectedIconFiles, 
      family: iconUploadFamily 
    });
  };

  // Mutación para eliminar especie
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/tree-species/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Especie eliminada",
        description: response.message || "La especie ha sido eliminada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tree-species'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la especie",
        variant: "destructive",
      });
    },
  });

  // Manejar eliminación con confirmación
  const handleDelete = (species: TreeSpecies) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la especie "${species.commonName}"?\n\nEsta acción no se puede deshacer.`)) {
      deleteMutation.mutate(species.id);
    }
  };

  // Mutación para eliminar todas las especies
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/tree-species/delete-all', {
        method: 'DELETE',
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Catálogo limpiado",
        description: response.message || "Todas las especies han sido eliminadas del catálogo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tree-species'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al limpiar catálogo",
        description: error.message || "No se pudieron eliminar todas las especies",
        variant: "destructive",
      });
    },
  });

  // Manejar eliminación de todas las especies
  const handleDeleteAll = () => {
    deleteAllMutation.mutate();
  };

  // Bulk delete mutation para especies seleccionadas
  const bulkDeleteSpeciesMutation = useMutation({
    mutationFn: async (speciesIds: number[]) => {
      // Eliminar cada especie individualmente
      const promises = speciesIds.map(id => 
        apiRequest(`/api/tree-species/${id}`, { method: 'DELETE' })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Especies eliminadas",
        description: `Se eliminaron ${selectedSpecies.size} especie(s) exitosamente.`,
      });
      setShowBulkDeleteDialog(false);
      setSelectedSpecies(new Set());
      setSelectionMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/tree-species'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar las especies seleccionadas.",
        variant: "destructive",
      });
    },
  });

  // Selection handlers
  const handleSelectSpecies = (speciesId: number, checked: boolean) => {
    const newSelected = new Set(selectedSpecies);
    if (checked) {
      newSelected.add(speciesId);
    } else {
      newSelected.delete(speciesId);
    }
    setSelectedSpecies(newSelected);
  };

  const handleSelectAllSpecies = () => {
    if (species) {
      const allSpeciesIds = new Set(species.map((s: TreeSpecies) => s.id));
      setSelectedSpecies(allSpeciesIds);
    }
  };

  const handleDeselectAllSpecies = () => {
    setSelectedSpecies(new Set());
  };

  const handleBulkDeleteClick = () => {
    if (selectedSpecies.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = () => {
    const speciesIds = Array.from(selectedSpecies);
    bulkDeleteSpeciesMutation.mutate(speciesIds);
  };

  // Mutación para actualizar especie
  const updateSpeciesMutation = useMutation({
    mutationFn: async (data: EditTreeSpeciesFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      return apiRequest(`/api/tree-species/${id}`, {
        method: 'PUT',
        data: updateData,
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Especie actualizada",
        description: response.message || "La especie ha sido actualizada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tree-species'] });
      setIsEditDialogOpen(false);
      setSelectedSpeciesForEdit(null);
      setActiveEditTab('basic');
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar la especie",
        variant: "destructive",
      });
    },
  });

  // Manejar envío del formulario de edición
  const onEditSubmit = (data: EditTreeSpeciesFormValues) => {
    if (!selectedSpeciesForEdit) return;
    updateSpeciesMutation.mutate({ ...data, id: selectedSpeciesForEdit.id });
  };

  // Manejar apertura del diálogo de edición
  const handleEditClick = (species: TreeSpecies) => {
    setSelectedSpeciesForEdit(species);
    setIsEditDialogOpen(true);
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxPages = 5;
    const startPage = Math.max(1, pagination.page - Math.floor(maxPages / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxPages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={pagination.page === i}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              aria-disabled={pagination.page <= 1}
              className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          
          {pages}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              aria-disabled={pagination.page >= pagination.totalPages}
              className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (error) {
    toast({
      title: "Error",
      description: "No se pudieron cargar las especies arbóreas. Por favor, intenta nuevamente.",
      variant: "destructive",
    });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Catálogo de Especies Arbóreas"
          subtitle="Gestión de especies para el inventario de árboles"
          icon={<Leaf className="h-6 w-6 text-white" />}
          actions={[
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                
              <Button 
                key="new"
                variant="primary"
                onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4 stroke-[4]" /> Nuevo
              </Button>
                
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    key="import"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Importar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Importar Especies desde CSV</DialogTitle>
                    <DialogDescription>
                      {csvPreview.length > 0 
                        ? "Vista previa de los primeros 5 registros. Confirma para importar todos los datos."
                        : "Selecciona un archivo CSV para importar especies o descarga la plantilla para ver el formato requerido."
                      }
                    </DialogDescription>
                  </DialogHeader>

                  {csvPreview.length === 0 && (
                    <div className="flex flex-col space-y-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">
                          ¿Primera vez importando especies? Descarga la plantilla con ejemplos para ver el formato correcto.
                        </p>
                        <Button
                          onClick={handleDownloadTemplate}
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Download className="mr-2 h-4 w-4" /> Descargar Plantilla CSV
                        </Button>
                      </div>
                      <div className="text-center text-sm text-gray-500">
                        La plantilla incluye todas las columnas disponibles y dos ejemplos (Ahuehuete y Jacaranda)
                      </div>
                    </div>
                  )}

                  {csvPreview.length > 0 && (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nombre Común</TableHead>
                              <TableHead>Nombre Científico</TableHead>
                              <TableHead>Familia</TableHead>
                              <TableHead>Origen</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {csvPreview.map((row, index) => (
                              <TableRow key={index}>
                                <TableCell>{row.commonName || 'N/A'}</TableCell>
                                <TableCell className="italic">{row.scientificName || 'N/A'}</TableCell>
                                <TableCell>{row.family || 'N/A'}</TableCell>
                                <TableCell>{row.origin || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsImportDialogOpen(false);
                            setCsvPreview([]);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleConfirmImport}
                          disabled={importMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {importMutation.isPending ? 'Importando...' : 'Confirmar Importación'}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

                <Button
                  key="export"
                  variant="tertiary"
                  onClick={handleExportCsv}>
                  <Download className="mr-2 h-4 w-4" /> Exportar
                </Button>
              </div>
            </div>
          ]}
          backgroundColor="bg-header-background"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <input
          ref={iconFileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg"
          multiple
          style={{ display: 'none' }}
          onChange={handleIconFileSelect}
        />

        {/* Diálogo para subida masiva de iconos */}
        <Dialog open={isIconUploadDialogOpen} onOpenChange={setIsIconUploadDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Subir Iconos para Especies de Árboles</DialogTitle>
              <DialogDescription>
                Sube múltiples iconos para crear o actualizar especies de árboles automáticamente.
              </DialogDescription>
            </DialogHeader>
            
            {selectedIconFiles && (
              <div className="space-y-4">
                <div>
                  <Label>Archivos seleccionados: {selectedIconFiles.length}</Label>
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2">
                    {Array.from(selectedIconFiles).map((file, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="family">Familia de árboles</Label>
                  <Select value={iconUploadFamily} onValueChange={setIconUploadFamily}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una familia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="pinus">Pinus (Pinos)</SelectItem>
                      <SelectItem value="quercus">Quercus (Robles)</SelectItem>
                      <SelectItem value="ficus">Ficus</SelectItem>
                      <SelectItem value="jacaranda">Jacaranda</SelectItem>
                      <SelectItem value="fraxinus">Fraxinus (Fresnos)</SelectItem>
                      <SelectItem value="eucalyptus">Eucalyptus</SelectItem>
                      <SelectItem value="palmae">Palmae (Palmas)</SelectItem>
                      <SelectItem value="citrus">Citrus (Cítricos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsIconUploadDialogOpen(false);
                      setSelectedIconFiles(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmIconUpload}
                    disabled={bulkIconUploadMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {bulkIconUploadMutation.isPending ? 'Subiendo...' : 'Subir Iconos'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        <Card className="mb-6">
          <CardHeader className="pb-0"></CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre común, científico o familia..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Select
                  value={originFilter}
                  onValueChange={setOriginFilter}
                >
                  <SelectTrigger className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los orígenes</SelectItem>
                    <SelectItem value="Nativo">Nativo</SelectItem>
                    <SelectItem value="Introducido">Introducido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-48">
                <Select
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common_name">Nombre Común</SelectItem>
                    <SelectItem value="scientific_name">Nombre Científico</SelectItem>
                    <SelectItem value="origin">Origen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-48">
                <Select
                  value={sortOrder}
                  onValueChange={setSortOrder}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Dirección" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascendente</SelectItem>
                    <SelectItem value="desc">Descendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botón limpiar filtros */}
              <div className="w-full md:w-auto">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className='w-10 h-10 bg-gray-100' 
                  onClick={handleClearFilters}
                >
                  <Brush className="h-4 w-4 text-[#4b5b65]" />
                </Button>
              </div>

              {/* Espaciador para empujar botones a la derecha */}
              <div className="ml-auto flex items-center gap-2">
                {/* Botón de selección con menú desplegable */}
                <div className="relative group">
                  <Button
                    type="button"
                    variant={selectionMode ? 'default' : 'outline'}
                    size="sm"
                    className={`flex items-center h-11 w-11 ${selectionMode ? 'bg-primary text-white hover:bg-[#00a587]' : 'bg-gray-100 hover:bg-[#00a587]'}`}
                  >
                    <CopyCheck className="h-5 w-5 text-[#4b5b65]" />
                  </Button>

                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => setSelectionMode(true)}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                      >
                        <CopyCheck className="h-4 w-4 mr-2" />
                        Selección múltiple
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectionMode) {
                            setSelectionMode(true);
                          }
                          handleSelectAllSpecies();
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                      >
                        <CheckSquare className="h-5 w-5 mr-2" />
                        Seleccionar todo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDeselectAllSpecies();
                          setSelectionMode(false);
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Deseleccionar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botón para eliminar elementos seleccionados */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  className="flex items-center h-11 w-11 bg-[#ededed] text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={selectedSpecies.size === 0}
                >
                  <Trash2 className="h-5 w-5" />
                  {selectedSpecies.size > 0 && ` (${selectedSpecies.size})`}
                </Button>
              </div>
              
            </form>
          </CardContent>
        </Card>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : species.length === 0 ? (
            <div className="text-center py-8">
              <Leaf className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No se encontraron especies arbóreas</h3>
              <p className="mt-1 text-gray-500">
                Prueba con otros términos de búsqueda o agrega nuevas especies al catálogo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>                        
                      {selectionMode && (
                        <TableHead className="w-12"></TableHead>
                      )}
                      <TableHead className="w-[60px]">Icono</TableHead>
                      <TableHead>Nombre Común</TableHead>
                      <TableHead>Nombre Científico</TableHead>
                      <TableHead>Familia</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Crecimiento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                          {species.map((species) => (
                            <TableRow key={species.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewDetails(species.id)}>
                              {selectionMode && (
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedSpecies.has(species.id)}
                                    onCheckedChange={(checked) => handleSelectSpecies(species.id, checked as boolean)}
                                  />
                                </TableCell>
                              )}
                              <TableCell>
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-50">
                            <TreeSpeciesIcon
                              iconType={species.iconType || 'system'}
                              customIconUrl={species.customIconUrl || undefined}
                              size={32}
                              className="text-green-600"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{species.commonName}</TableCell>
                        <TableCell className="italic">{species.scientificName}</TableCell>
                        <TableCell>{species.family}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`text-xs px-2 py-0.5 ${getOriginBadgeStyles(species.origin)}`}
                          >
                            {species.origin}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`text-xs px-2 py-0.5 ${getGrowthRateBadgeStyles(species.growthRate)}`}
                            style={{ backgroundColor: getGrowthRateBackground(species.growthRate) }}
                          >
                            {species.growthRate}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {species.isEndangered ? (
                            <Badge variant="outline" className="inline-flex items-center gap-1 bg-[#af5252] text-white text-xs px-2 py-0.5">
                              <CircleAlert className="h-3 w-3" /> Amenazada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="inline-flex items-center gap-1 bg-[#75cc81] text-white text-xs px-2 py-0.5">
                              <CircleCheck className="h-3 w-3" /> Normal
                            </Badge>
                          )}
                        </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(species);
                                }}
                                title="Editar especie"
                                className="border bg-transparent text-gray-800"
                              >
                                <Pencil className="h-4 w-4" /> 
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(species);
                                }}
                                title="Eliminar especie"
                                className="border bg-transparent text-gray-800"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" /> 
                              </Button>
                            </div>
                          </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {renderPagination()}
        </CardContent>
      </div>
      {/* Bulk Delete Confirmation Dialog */}
          <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar especies seleccionadas?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará permanentemente {selectedSpecies.size} especie(s) seleccionada(s) del catálogo. 
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleBulkDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={bulkDeleteSpeciesMutation.isPending}
                >
                  {bulkDeleteSpeciesMutation.isPending ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      
          {/* Edit Dialog */}
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 border-2 border-gray-800 rounded-full">
                  <Leaf className="h-4 w-4 text-gray-800" />
                </div>
                <h2 className="text-2xl font-medium">Editar {selectedSpeciesForEdit?.commonName}</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  <X className="h-4 w-4 text-gray-800" />
                  Cancelar
                </Button>
                <Button 
                  type="outline"
                  form="edit-species-form"
                  disabled={updateSpeciesMutation.isPending}
                  className="bg-[#a0cc4d]"
                >
                  <Save className="h-4 w-4 text-white" />
                  {updateSpeciesMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Form {...editForm}>
            <form id="edit-species-form" onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <Tabs value={activeEditTab} onValueChange={setActiveEditTab}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="basic">Información Básica</TabsTrigger>
                  <TabsTrigger value="characteristics">Características y Cultivo</TabsTrigger>
                </TabsList>

                {/* Tab: Información Básica */}
                <TabsContent value="basic">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 border-2 border-gray-800 rounded-full">
                        <TreePine className="h-4 w-4 text-gray-800" />
                      </div>
                      <h3 className="text-lg font-medium">Datos de la Especie</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="commonName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Común *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Jacaranda" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="scientificName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Científico *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Jacaranda mimosifolia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={editForm.control}
                        name="family"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Familia *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Bignoniaceae" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="origin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Origen *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona el origen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Nativo">Nativo</SelectItem>
                                <SelectItem value="Introducido">Introducido</SelectItem>
                                <SelectItem value="Naturalizado">Naturalizado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="growthRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tasa de Crecimiento *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona la tasa" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Lento">Lento</SelectItem>
                                <SelectItem value="Medio">Medio</SelectItem>
                                <SelectItem value="Rapido">Rápido</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descripción general de la especie..."
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="isEndangered"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Especie en peligro de extinción</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de imagen</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://ejemplo.com/imagen.jpg" 
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="button" onClick={() => setActiveEditTab('characteristics')}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Características y Cultivo */}
                <TabsContent value="characteristics">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 border-2 border-gray-800 rounded-full">
                        <Sprout className="h-4 w-4 text-gray-800" />
                      </div>
                      <h3 className="text-lg font-medium">Características y Cultivo</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="climateZone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zona Climática</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ej. Tropical, Templada..." 
                                {...field} 
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="ornamentalValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Ornamental</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ej. Alto, Medio, Bajo..." 
                                {...field} 
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editForm.control}
                      name="ecologicalBenefits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beneficios Ecológicos</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Beneficios ecológicos que ofrece..."
                              className="min-h-[100px]"
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-2 rounded-lg">
                      <h4 className="text-md font-medium mb-4">Requerimientos de Cultivo</h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={editForm.control}
                          name="soilRequirements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Suelo</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Bien drenado..." 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editForm.control}
                          name="waterRequirements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Agua</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Moderado..." 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editForm.control}
                          name="sunRequirements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sol</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Pleno sol..." 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={editForm.control}
                          name="lifespan"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Esperanza de Vida</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="50-100 años..." 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editForm.control}
                          name="commonUses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Usos Comunes</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Sombra, ornamental..." 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={editForm.control}
                        name="maintenanceRequirements"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Requisitos de Mantenimiento</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Cuidados necesarios..."
                                className="min-h-[100px]"
                                {...field} 
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-start pt-4">
                      <Button type="button" variant="outline" onClick={() => setActiveEditTab('basic')}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

export default TreeSpeciesCatalog;