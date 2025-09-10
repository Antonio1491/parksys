import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet';
import { 
  Download, 
  Upload, 
  Printer, 
  BarChart, 
  Filter, 
  Tag,
  Edit,
  Trash2,
  AlertCircle,
  Plus,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Activity,
  X,
  Package
} from 'lucide-react';

import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { ASSET_CONDITIONS, ASSET_STATUSES } from '@/lib/constants';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';

// Función para formatear fechas
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Funciones para traducir estados y condiciones
const translateStatus = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'active': 'Activo',
    'maintenance': 'Mantenimiento',
    'retired': 'Retirado',
    'damaged': 'Dañado'
  };
  return statusMap[status] || status;
};

const translateCondition = (condition: string) => {
  const conditionMap: { [key: string]: string } = {
    'excellent': 'Excelente',
    'good': 'Bueno',
    'fair': 'Regular',
    'poor': 'Malo'
  };
  return conditionMap[condition] || condition;
};

// Función para obtener el color del badge de estado
const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'activo':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'mantenimiento':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'dañado':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'retirado':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

// Función para obtener el color del badge de condición
const getConditionBadgeColor = (condition: string) => {
  switch (condition.toLowerCase()) {
    case 'excelente':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'bueno':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'regular':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'malo':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const InventoryPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedPark, setSelectedPark] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para importación CSV
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  
  // Estado para Analytics
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Estados para selección múltiple y eliminación masiva
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);

  // Obtener datos de inventario con parámetros de paginación
  const { 
    data: assetsData, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['/api/assets/inventory', currentPage, searchTerm, selectedStatus, selectedCondition, selectedPark, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: selectedStatus,
        condition: selectedCondition,
        park: selectedPark,
        category: selectedCategory
      });
      
      const response = await fetch(`/api/assets/inventory?${params}`);
      if (!response.ok) {
        throw new Error('Error al cargar inventario');
      }
      return response.json();
    },
    enabled: true
  });

  // Obtener parques para filtros
  const { data: parks } = useQuery({
    queryKey: ['/api/parks'],
    enabled: true
  });

  // Obtener categorías para filtros
  const { data: categories } = useQuery({
    queryKey: ['/api/asset-categories'],
    enabled: true
  });

  // Safely filter data to prevent SelectItem errors
  const safeCategories = React.useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.filter(category => 
      category && 
      typeof category === 'object' && 
      category.id && 
      category.name && 
      category.id.toString().trim() !== '' &&
      category.name.trim() !== ''
    );
  }, [categories]);

  const safeParks = React.useMemo(() => {
    if (!Array.isArray(parks)) return [];
    return parks.filter(park => 
      park && 
      typeof park === 'object' && 
      park.id && 
      park.name && 
      park.id.toString().trim() !== '' &&
      park.name.trim() !== ''
    );
  }, [parks]);

  const assets = assetsData?.assets || [];
  const totalAssets = parseInt(assetsData?.totalAssets || '0', 10);
  
  // Los datos ya vienen filtrados y paginados del backend
  const totalPages = Math.ceil(totalAssets / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalAssets);

  // Datos para Analytics - Calculados desde los activos reales
  const analyticsData = React.useMemo(() => {
    if (!assets || assets.length === 0) return null;
    
    // Distribución por estado
    const statusDistribution = assets.reduce((acc: any, asset: any) => {
      const status = translateStatus(asset.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Distribución por condición
    const conditionDistribution = assets.reduce((acc: any, asset: any) => {
      const condition = translateCondition(asset.condition);
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {});

    // Distribución por categoría
    const categoryDistribution = assets.reduce((acc: any, asset: any) => {
      const category = asset.categoryName || 'Sin categoría';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Valor total por categoría
    const valueByCategory = assets.reduce((acc: any, asset: any) => {
      const category = asset.categoryName || 'Sin categoría';
      const cost = parseFloat(asset.acquisitionCost) || 0;
      acc[category] = (acc[category] || 0) + cost;
      return acc;
    }, {});

    // Valor total por parque
    const valueByPark = assets.reduce((acc: any, asset: any) => {
      const park = asset.parkName || 'Sin parque';
      const cost = parseFloat(asset.acquisitionCost) || 0;
      acc[park] = (acc[park] || 0) + cost;
      return acc;
    }, {});

    return {
      statusData: Object.entries(statusDistribution).map(([name, value]) => ({ name, value })),
      conditionData: Object.entries(conditionDistribution).map(([name, value]) => ({ name, value })),
      categoryData: Object.entries(categoryDistribution).map(([name, value]) => ({ name, value })),
      categoryValueData: Object.entries(valueByCategory).map(([name, value]) => ({ 
        name, 
        value: value as number,
        formattedValue: new Intl.NumberFormat('es-MX', { 
          style: 'currency', 
          currency: 'MXN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0 
        }).format(value as number)
      })),
      parkValueData: Object.entries(valueByPark).map(([name, value]) => ({ 
        name, 
        value: value as number,
        formattedValue: new Intl.NumberFormat('es-MX', { 
          style: 'currency', 
          currency: 'MXN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0 
        }).format(value as number)
      }))
    };
  }, [assets]);
  const paginatedAssets = assets; // Ya están paginados del backend

  // Reset página cuando cambian filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedCondition, selectedPark, selectedCategory]);

  // Limpiar selección cuando cambian los datos o filtros
  React.useEffect(() => {
    clearSelection();
  }, [currentPage, searchTerm, selectedStatus, selectedCondition, selectedPark, selectedCategory]);

  // Actualizar estado de "seleccionar todos" basado en la selección actual
  React.useEffect(() => {
    if (assets && assets.length > 0) {
      const allCurrentPageIds = assets.map((asset: any) => asset.id);
      const allSelected = allCurrentPageIds.every(id => selectedAssets.includes(id));
      setIsSelectAllChecked(allSelected && selectedAssets.length > 0);
    }
  }, [selectedAssets, assets]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedCondition('all');
    setSelectedPark('all');
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  // Handlers para acciones
  const handleEdit = (id: number) => {
    setLocation(`/admin/assets/${id}/edit-enhanced`);
  };

  const handleReportIncident = (id: number) => {
    setLocation(`/admin/incidents/new?assetId=${id}`);
  };

  const handleScheduleMaintenance = (id: number) => {
    setLocation(`/admin/assets/${id}`);
  };

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/assets/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets/inventory'] });
      toast({
        title: "Activo eliminado",
        description: "El activo ha sido eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el activo.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este activo?')) {
      deleteAssetMutation.mutate(id);
    }
  };

  // Funciones para manejo de selección múltiple
  const handleSelectAsset = (assetId: number, checked: boolean) => {
    if (checked) {
      setSelectedAssets(prev => [...prev, assetId]);
    } else {
      setSelectedAssets(prev => prev.filter(id => id !== assetId));
      setIsSelectAllChecked(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allAssetIds = assets.map((asset: any) => asset.id);
      setSelectedAssets(allAssetIds);
      setIsSelectAllChecked(true);
    } else {
      setSelectedAssets([]);
      setIsSelectAllChecked(false);
    }
  };

  const clearSelection = () => {
    setSelectedAssets([]);
    setIsSelectAllChecked(false);
  };

  // Mutation para eliminación masiva
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return apiRequest('/api/assets/bulk-delete', {
        method: 'DELETE',
        data: { ids },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets/inventory'] });
      clearSelection();
      toast({
        title: "Eliminación masiva exitosa",
        description: data.message || `Se eliminaron ${data.deletedCount} activos correctamente.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error en eliminación masiva",
        description: error.message || "No se pudieron eliminar los activos seleccionados.",
        variant: "destructive",
      });
    },
  });

  const handleBulkDelete = () => {
    if (selectedAssets.length === 0) {
      toast({
        title: "Sin selección",
        description: "Por favor selecciona al menos un activo para eliminar.",
        variant: "destructive",
      });
      return;
    }

    const confirmMessage = `¿Estás seguro de que deseas eliminar ${selectedAssets.length} activo(s) seleccionado(s)? Esta acción no se puede deshacer.`;
    
    if (confirm(confirmMessage)) {
      bulkDeleteMutation.mutate(selectedAssets);
    }
  };

  // Función para exportar el inventario completo a CSV
  const exportToCSV = async () => {
    try {
      // Obtener todos los activos sin paginación
      const response = await fetch('/api/assets/export');
      if (!response.ok) {
        throw new Error('Error al obtener datos para exportar');
      }
      
      const allAssets = await response.json();
      
      if (!allAssets || allAssets.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay activos para exportar.",
          variant: "destructive",
        });
        return;
      }
    
      // Headers completos con todos los campos de clasificación de activos
      const headers = [
        'ID',
        'Nombre',
        'Descripción',
        'Número de Serie',
        'Categoría',
        'Parque',
        'Amenidad',
        'Ubicación Descripción',
        'Latitud',
        'Longitud',
        'Estado',
        'Condición',
        'Fabricante',
        'Modelo',
        'Fecha de Adquisición',
        'Costo de Adquisición (MXN)',
        'Valor Actual (MXN)',
        'Frecuencia de Mantenimiento',
        'Último Mantenimiento',
        'Próximo Mantenimiento',
        'Vida Útil Esperada (meses)',
        'Código QR',
        'Persona Responsable',
        'Notas',
        'Fecha de Creación',
        'Última Actualización'
      ];
      
      const csvRows = [];
      
      // Agregar encabezados
      csvRows.push(headers.join(','));
      
      // Agregar datos con todos los campos disponibles
      for (const asset of allAssets) {
        const values = [
          asset.id || '',
          `"${(asset.name || '').replace(/"/g, '""')}"`,
          `"${(asset.description || '').replace(/"/g, '""')}"`,
          `"${(asset.serialNumber || '').replace(/"/g, '""')}"`,
          `"${(asset.categoryName || '').replace(/"/g, '""')}"`,
          `"${(asset.parkName || '').replace(/"/g, '""')}"`,
          `"${(asset.amenityName || '').replace(/"/g, '""')}"`,
          `"${(asset.locationDescription || '').replace(/"/g, '""')}"`,
          `"${asset.latitude || ''}"`,
          `"${asset.longitude || ''}"`,
          `"${translateStatus(asset.status)}"`,
          `"${translateCondition(asset.condition)}"`,
          `"${(asset.manufacturer || '').replace(/"/g, '""')}"`,
          `"${(asset.model || '').replace(/"/g, '""')}"`,
          asset.acquisitionDate ? formatDate(asset.acquisitionDate) : '',
          asset.acquisitionCost !== null && asset.acquisitionCost !== undefined ? 
            `"$${Number(asset.acquisitionCost).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}"` : '',
          asset.currentValue !== null && asset.currentValue !== undefined ? 
            `"$${Number(asset.currentValue).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}"` : '',
          `"${(asset.maintenanceFrequency || '').replace(/"/g, '""')}"`,
          asset.lastMaintenanceDate ? formatDate(asset.lastMaintenanceDate) : '',
          asset.nextMaintenanceDate ? formatDate(asset.nextMaintenanceDate) : '',
          asset.expectedLifespan || '',
          `"${(asset.qrCode || '').replace(/"/g, '""')}"`,
          `"${(asset.responsiblePersonName || '').replace(/"/g, '""')}"`,
          `"${(asset.notes || '').replace(/"/g, '""')}"`,
          asset.createdAt ? formatDate(asset.createdAt) : '',
          asset.updatedAt ? formatDate(asset.updatedAt) : ''
        ];
        
        csvRows.push(values.join(','));
      }
      
      // Crear contenido CSV con BOM para UTF-8
      const csvContent = csvRows.join('\r\n');
      const BOM = '\uFEFF'; // UTF-8 BOM para corregir acentos en Excel
      const finalContent = BOM + csvContent;
      
      // Crear y descargar el archivo CSV con codificación UTF-8
      const blob = new Blob([finalContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `inventario_completo_activos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exportación exitosa",
        description: `Se ha exportado el inventario completo con ${allAssets.length} activos y ${headers.length} campos.`,
      });
      
    } catch (error) {
      console.error('Error al exportar inventario:', error);
      toast({
        title: "Error de exportación",
        description: "Hubo un problema al generar el archivo de exportación.",
        variant: "destructive",
      });
    }
  };

  // Función para procesar importación de CSV
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setImportResults(null);
    } else {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona un archivo CSV válido.",
        variant: "destructive",
      });
    }
  };

  // Función para importar datos desde CSV
  const importFromCSV = async () => {
    if (!csvFile) {
      toast({
        title: "No hay archivo",
        description: "Por favor selecciona un archivo CSV primero.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      // Simular progreso mientras se procesa
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/assets/import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (!response.ok) {
        throw new Error('Error al procesar el archivo');
      }

      const result = await response.json();
      
      setImportResults({
        success: result.success || 0,
        errors: result.errors || []
      });

      // Invalidar cache para actualizar la lista
      queryClient.invalidateQueries({ queryKey: ['/api/assets/inventory'] });

      toast({
        title: "Importación completada",
        description: `Se procesaron ${result.success} registros exitosamente.`,
      });

    } catch (error) {
      console.error('Error al importar CSV:', error);
      toast({
        title: "Error de importación",
        description: "Hubo un problema al procesar el archivo CSV.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Función para generar reporte ejecutivo
  const generateExecutiveReport = async () => {
    try {
      toast({
        title: "Generando reporte",
        description: "Preparando reporte ejecutivo de inventario...",
      });

      // Obtener datos para el reporte
      const response = await fetch('/api/assets/report-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            search: searchTerm,
            status: selectedStatus,
            condition: selectedCondition,
            park: selectedPark,
            category: selectedCategory
          }
        })
      });

      if (!response.ok) {
        throw new Error('Error al obtener datos del reporte');
      }

      const reportData = await response.json();

      // Importar jsPDF dinámicamente
      const { jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Configuración de estilos
      const primaryColor = '#00a587';
      const margin = 20;
      let currentY = margin;

      // Header del reporte
      pdf.setFontSize(22);
      pdf.setTextColor(0, 165, 135); // Color primario
      pdf.text('Reporte Ejecutivo de Inventario', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 10;
      pdf.setFontSize(14);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Bosques Urbanos de Guadalajara', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 8;
      const reportDate = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(`Generado el ${reportDate}`, pageWidth / 2, currentY, { align: 'center' });
      
      // Línea separadora
      currentY += 15;
      pdf.setDrawColor(0, 165, 135);
      pdf.setLineWidth(1);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      // Métricas principales
      pdf.setFontSize(16);
      pdf.setTextColor(0, 165, 135);
      pdf.text('Resumen Ejecutivo', margin, currentY);
      currentY += 15;

      const stats = reportData.statistics;
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };

      // Grid de métricas 2x2
      const metrics = [
        { label: 'Total de Activos', value: stats.total_assets },
        { label: 'Activos Activos', value: stats.active_assets },
        { label: 'En Mantenimiento', value: stats.maintenance_assets },
        { label: 'Valor Total', value: formatCurrency(stats.total_current_value) }
      ];

      pdf.setFontSize(12);
      const cardWidth = (pageWidth - margin * 2 - 10) / 2;
      const cardHeight = 25;

      metrics.forEach((metric, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = margin + col * (cardWidth + 10);
        const y = currentY + row * (cardHeight + 10);

        // Fondo de la tarjeta
        pdf.setFillColor(248, 249, 250);
        pdf.rect(x, y, cardWidth, cardHeight, 'F');
        
        // Borde izquierdo
        pdf.setFillColor(0, 165, 135);
        pdf.rect(x, y, 3, cardHeight, 'F');

        // Texto de la métrica
        pdf.setTextColor(0, 165, 135);
        pdf.setFontSize(10);
        pdf.text(metric.label, x + 8, y + 8);
        
        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(14);
        pdf.text(metric.value.toString(), x + 8, y + 18);
      });

      currentY += 70;

      // Distribución por categorías
      pdf.setFontSize(16);
      pdf.setTextColor(0, 165, 135);
      pdf.text('Distribución por Categorías', margin, currentY);
      currentY += 15;

      pdf.setFontSize(12);
      pdf.setTextColor(50, 50, 50);
      
      // Encabezados de tabla
      const colWidths = [80, 40, 60];
      const startX = margin;
      
      pdf.setFillColor(0, 165, 135);
      pdf.rect(startX, currentY, colWidths[0] + colWidths[1] + colWidths[2], 8, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text('Categoría', startX + 2, currentY + 6);
      pdf.text('Cantidad', startX + colWidths[0] + 2, currentY + 6);
      pdf.text('Valor Total', startX + colWidths[0] + colWidths[1] + 2, currentY + 6);
      
      currentY += 10;

      // Datos de categorías
      reportData.categoriesStats.forEach((category: any, index: number) => {
        if (currentY > pageHeight - 30) {
          pdf.addPage();
          currentY = margin;
        }

        const rowY = currentY + index * 8;
        
        // Fila alternada
        if (index % 2 === 0) {
          pdf.setFillColor(249, 249, 249);
          pdf.rect(startX, rowY, colWidths[0] + colWidths[1] + colWidths[2], 8, 'F');
        }

        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(9);
        pdf.text(category.category || 'Sin categoría', startX + 2, rowY + 6);
        pdf.text(category.count.toString(), startX + colWidths[0] + 2, rowY + 6);
        pdf.text(formatCurrency(category.total_value), startX + colWidths[0] + colWidths[1] + 2, rowY + 6);
      });

      currentY += reportData.categoriesStats.length * 8 + 20;

      // Estado y condición
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.setFontSize(16);
      pdf.setTextColor(0, 165, 135);
      pdf.text('Estado y Condición de Activos', margin, currentY);
      currentY += 15;

      // Estado operativo
      pdf.setFontSize(12);
      pdf.setTextColor(50, 50, 50);
      pdf.text('Estado Operativo:', margin, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      const activePercentage = stats.total_assets > 0 ? (stats.active_assets / stats.total_assets * 100).toFixed(1) : '0';
      const maintenancePercentage = stats.total_assets > 0 ? (stats.maintenance_assets / stats.total_assets * 100).toFixed(1) : '0';

      pdf.text(`• Activos: ${stats.active_assets} (${activePercentage}%)`, margin + 10, currentY);
      currentY += 6;
      pdf.text(`• En Mantenimiento: ${stats.maintenance_assets} (${maintenancePercentage}%)`, margin + 10, currentY);
      currentY += 15;

      // Condición física
      pdf.setFontSize(12);
      pdf.text('Condición Física:', margin, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      const conditions = [
        { name: 'Excelente', count: stats.excellent_condition },
        { name: 'Bueno', count: stats.good_condition },
        { name: 'Regular', count: stats.fair_condition },
        { name: 'Malo', count: stats.poor_condition }
      ];

      conditions.forEach(condition => {
        const percentage = stats.total_assets > 0 ? (condition.count / stats.total_assets * 100).toFixed(1) : '0';
        pdf.text(`• ${condition.name}: ${condition.count} (${percentage}%)`, margin + 10, currentY);
        currentY += 6;
      });

      // Footer
      currentY = pageHeight - 20;
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Sistema de Gestión de Activos - Bosques Urbanos de Guadalajara', pageWidth / 2, currentY, { align: 'center' });
      pdf.text('Av. Alcalde 1351, Guadalajara, Jalisco | Tel: 33 3837-4400 | bosques@guadalajara.gob.mx', pageWidth / 2, currentY + 4, { align: 'center' });

      // Guardar PDF
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`reporte_ejecutivo_inventario_${timestamp}.pdf`);

      toast({
        title: "Reporte generado",
        description: "El reporte ejecutivo se ha descargado exitosamente.",
      });

    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast({
        title: "Error en reporte",
        description: "Hubo un problema al generar el reporte ejecutivo.",
        variant: "destructive",
      });
    }
  };

  // Función para descargar plantilla CSV
  const downloadTemplate = () => {
    const headers = [
      // IDENTIFICACIÓN
      'ID',
      'Nombre',
      'Descripción',
      'Número de Serie',
      'ID Personalizado de Activo',
      'Categoría Principal',
      'Subcategoría',
      'Uso Específico',
      
      // UBICACIÓN
      'Parque',
      'Amenidad',
      'Descripción de Ubicación',
      'Latitud',
      'Longitud',
      
      // ESPECIFICACIONES TÉCNICAS
      'Fabricante',
      'Modelo',
      'Número de Serie Técnico',
      'Material',
      'Dimensiones/Capacidad',
      
      // CICLO DE VIDA
      'Fecha de Instalación',
      'Fecha de Última Inspección',
      'Vida Útil Estimada (años)',
      'Estado',
      'Condición',
      'Historial de Mantenimiento',
      
      // COSTOS
      'Fecha de Adquisición',
      'Costo de Adquisición (MXN)',
      'Valor Actual (MXN)',
      'Fuente de Financiamiento',
      
      // CONTROL Y GESTIÓN
      'Persona Responsable',
      'Área Asignada',
      'URL Manual de Mantenimiento',
      'Políticas de Uso',
      
      // MANTENIMIENTO (campos heredados)
      'Frecuencia de Mantenimiento',
      'Fecha de Último Mantenimiento',
      'Fecha de Próximo Mantenimiento',
      'Vida Útil Esperada (meses)',
      'Código QR',
      
      // NOTAS
      'Notas Adicionales',
      
      // CAMPOS DEL SISTEMA
      'Fecha de Creación',
      'Última Actualización'
    ];

    const csvContent = '\uFEFF' + headers.join(',') + '\r\n'; // UTF-8 BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_importacion_activos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Plantilla descargada",
      description: "Usa esta plantilla para preparar tus datos de importación.",
    });
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Inventario de Activos - ParkSys</title>
      </Helmet>
      
      {/* Header con patrón Card estandarizado */}
      <Card className="p-4 bg-gray-50 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Inventario de Activos</h1>
            </div>
            <p className="text-gray-600 mt-2">
              Gestión completa del inventario de activos de los parques
            </p>
          </div>
        </div>
      </Card>

      {/* Métricas debajo del header */}
      <div className="mb-6">
        
        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAssets}</p>
                </div>
                <Tag className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activos Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {assets.filter((a: any) => a.status === 'active').length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Mantenimiento</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {assets.filter((a: any) => a.status === 'maintenance').length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(assetsData?.totalValue || 0).toLocaleString('es-MX', { 
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0 
                    })}
                  </p>
                </div>
                <BarChart className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button 
          onClick={() => setLocation('/admin/assets/new')}
          className="bg-[#00a587] hover:bg-[#067f5f]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Activo
        </Button>
        {selectedAssets.length > 0 && (
          <Button 
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {bulkDeleteMutation.isPending 
              ? `Eliminando ${selectedAssets.length}...` 
              : `Eliminar ${selectedAssets.length} seleccionado(s)`
            }
          </Button>
        )}
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Inventario
        </Button>
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar Datos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Importar Inventario de Activos</DialogTitle>
              <DialogDescription>
                Importa datos masivamente desde un archivo CSV usando el mismo formato de la exportación.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Descarga de plantilla */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">1. Descarga la Plantilla</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Usa la plantilla oficial con los 26 campos requeridos y formato correcto.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={downloadTemplate}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Descargar Plantilla CSV
                </Button>
              </div>

              {/* Selección de archivo */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">2. Selecciona tu Archivo</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Sube el archivo CSV preparado con los datos de inventario.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#00a587] file:text-white hover:file:bg-[#067f5f] file:cursor-pointer cursor-pointer"
                />
                {csvFile && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Archivo seleccionado: {csvFile.name}
                  </div>
                )}
              </div>

              {/* Progreso de importación */}
              {isImporting && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-900 mb-2">Procesando Importación...</h4>
                  <Progress value={importProgress} className="w-full" />
                  <p className="text-sm text-yellow-700 mt-2">
                    {importProgress}% completado
                  </p>
                </div>
              )}

              {/* Resultados de importación */}
              {importResults && (
                <div className={`p-4 rounded-lg border ${
                  importResults.errors.length === 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    importResults.errors.length === 0 
                      ? 'text-green-900' 
                      : 'text-orange-900'
                  }`}>
                    Resultados de la Importación
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                      <span className="text-green-700">
                        {importResults.success} registros procesados exitosamente
                      </span>
                    </div>
                    {importResults.errors.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <XCircle className="h-4 w-4 mr-1 text-red-600" />
                          <span className="text-red-700">
                            {importResults.errors.length} errores encontrados:
                          </span>
                        </div>
                        <div className="max-h-32 overflow-y-auto bg-white p-2 rounded border">
                          {importResults.errors.slice(0, 5).map((error, index) => (
                            <div key={index} className="text-xs text-red-600">
                              Fila {error.row}: {error.message}
                            </div>
                          ))}
                          {importResults.errors.length > 5 && (
                            <div className="text-xs text-gray-500 mt-1">
                              ... y {importResults.errors.length - 5} errores más
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsImportDialogOpen(false);
                    setCsvFile(null);
                    setImportResults(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={importFromCSV}
                  disabled={!csvFile || isImporting}
                  className="bg-[#00a587] hover:bg-[#067f5f]"
                >
                  {isImporting ? 'Procesando...' : 'Importar Datos'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={generateExecutiveReport}>
          <Printer className="h-4 w-4 mr-2" />
          Exportar Reporte
        </Button>
        <Button variant="outline" onClick={() => setIsAnalyticsOpen(true)}>
          <BarChart className="h-4 w-4 mr-2" />
          Analytics
        </Button>
      </div>

      {/* Filtros avanzados */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Buscar por nombre, número de serie, categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {safeCategories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="retired">Retirado</SelectItem>
                  <SelectItem value="damaged">Dañado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Condición" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las condiciones</SelectItem>
                  <SelectItem value="excellent">Excelente</SelectItem>
                  <SelectItem value="good">Bueno</SelectItem>
                  <SelectItem value="fair">Regular</SelectItem>
                  <SelectItem value="poor">Malo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={selectedPark} onValueChange={setSelectedPark}>
                <SelectTrigger>
                  <SelectValue placeholder="Parque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los parques</SelectItem>
                  {safeParks.map((park: any) => (
                    <SelectItem key={park.id} value={park.id.toString()}>{park.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Button variant="outline" onClick={clearFilters}>
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Inventario Detallado</CardTitle>
          <CardDescription>
            Página {currentPage} de {totalPages} - Mostrando {startIndex}-{endIndex} de {totalAssets} activos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-4 text-red-500">
              <p>Error al cargar los datos de inventario.</p>
            </div>
          ) : totalAssets === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No se encontraron activos con los criterios seleccionados.</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Limpiar Filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isSelectAllChecked}
                          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                          aria-label="Seleccionar todos"
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Parque</TableHead>
                      <TableHead>Núm. Serie</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Condición</TableHead>
                      <TableHead>Fecha Adquisición</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedAssets.includes(asset.id)}
                            onCheckedChange={(checked) => handleSelectAsset(asset.id, checked as boolean)}
                            aria-label={`Seleccionar ${asset.name}`}
                          />
                        </TableCell>
                        <TableCell>{asset.id}</TableCell>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{asset.categoryName}</TableCell>
                        <TableCell>{asset.parkName}</TableCell>
                        <TableCell>{asset.serialNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(asset.status)}>
                            {translateStatus(asset.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getConditionBadgeColor(asset.condition)}>
                            {translateCondition(asset.condition)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(asset.acquisitionDate)}</TableCell>
                        <TableCell className="text-right">
                          {asset.acquisitionCost ? `$${Number(asset.acquisitionCost).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              title="Gestionar activo (editar, ver detalles)"
                              onClick={() => handleEdit(asset.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                              title="Programar mantenimiento"
                              onClick={() => handleScheduleMaintenance(asset.id)}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                              title="Reportar incidencia"
                              onClick={() => handleReportIncident(asset.id)}
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Eliminar"
                              onClick={() => handleDelete(asset.id)}
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
              
              {/* Controles de paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex}-{endIndex} de {totalAssets} activos
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else {
                          const start = Math.max(1, currentPage - 2);
                          const end = Math.min(totalPages, start + 4);
                          pageNumber = start + i;
                          if (pageNumber > end) return null;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className={currentPage === pageNumber ? "bg-[#00a587] hover:bg-[#067f5f]" : ""}
                          >
                            {pageNumber}
                          </Button>
                        );
                      }).filter(Boolean)}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Analytics */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#00a587] flex items-center gap-2">
              <BarChart className="h-6 w-6" />
              Analytics de Inventario de Activos
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAnalyticsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {analyticsData ? (
            <div className="space-y-8 mt-6">
              {/* KPIs Principales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Activos</p>
                        <p className="text-2xl font-bold text-[#00a587]">{totalAssets}</p>
                      </div>
                      <Activity className="h-8 w-8 text-[#00a587]" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Valor Total</p>
                        <p className="text-lg font-bold text-[#00a587]">
                          {new Intl.NumberFormat('es-MX', { 
                            style: 'currency', 
                            currency: 'MXN',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0 
                          }).format(
                            assets.reduce((sum, asset) => sum + (parseFloat(asset.acquisitionCost) || 0), 0)
                          )}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-[#00a587]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Categorías</p>
                        <p className="text-2xl font-bold text-[#00a587]">{analyticsData.categoryData.length}</p>
                      </div>
                      <Tag className="h-8 w-8 text-[#00a587]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Parques</p>
                        <p className="text-2xl font-bold text-[#00a587]">{analyticsData.parkValueData.length}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-[#00a587]" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficas en Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución por Estado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#00a587]">Distribución por Estado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.statusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {analyticsData.statusData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={['#00a587', '#bcd256', '#f39c12', '#e74c3c'][index % 4]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Distribución por Condición */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#00a587]">Distribución por Condición</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.conditionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {analyticsData.conditionData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={['#2ecc71', '#3498db', '#f39c12', '#e74c3c'][index % 4]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cantidad por Categoría */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#00a587]">Cantidad de Activos por Categoría</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={analyticsData.categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#00a587" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Valor por Categoría */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#00a587]">Valor Monetario por Categoría</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={analyticsData.categoryValueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis 
                          tickFormatter={(value) => 
                            new Intl.NumberFormat('es-MX', { 
                              style: 'currency', 
                              currency: 'MXN',
                              notation: 'compact',
                              maximumFractionDigits: 1 
                            }).format(value)
                          }
                        />
                        <Tooltip 
                          formatter={(value: any) => [
                            new Intl.NumberFormat('es-MX', { 
                              style: 'currency', 
                              currency: 'MXN',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0 
                            }).format(value), 
                            'Valor'
                          ]}
                        />
                        <Bar dataKey="value" fill="#067f5f" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Valor por Parque - Gráfica Horizontal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#00a587]">Distribución de Valor por Parque</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart 
                      data={analyticsData.parkValueData.slice(0, 10)} 
                      layout="horizontal"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number"
                        tickFormatter={(value) => 
                          new Intl.NumberFormat('es-MX', { 
                            style: 'currency', 
                            currency: 'MXN',
                            notation: 'compact',
                            maximumFractionDigits: 1 
                          }).format(value)
                        }
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={150}
                      />
                      <Tooltip 
                        formatter={(value: any) => [
                          new Intl.NumberFormat('es-MX', { 
                            style: 'currency', 
                            currency: 'MXN',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0 
                          }).format(value), 
                          'Valor Total'
                        ]}
                      />
                      <Bar dataKey="value" fill="#bcd256" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay datos disponibles para mostrar analytics</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default InventoryPage;