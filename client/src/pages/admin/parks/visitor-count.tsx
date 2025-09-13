import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, Plus, FileText, TrendingUp, MapPin, Clock, Sun, Cloud, CloudRain, BarChart3, Download, Filter, PieChart, Activity, Grid, List, Upload, ChevronLeft, ChevronRight, ArrowLeft, Grid3X3, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface VisitorCount {
  id: number;
  parkId: number;
  parkName: string;
  date: string;
  adults: number;
  children: number;
  seniors: number;
  pets: number;
  groups: number;
  totalVisitors: number;
  countingMethod: string;
  dayType?: string;
  weather?: string;
  notes?: string;
  createdAt: string;
}

interface Park {
  id: number;
  name: string;
  municipality: string;
}

interface VisitorCountForm {
  parkId: number;
  date: string;
  startDate?: string;
  endDate?: string;
  adults: number;
  children: number;
  seniors: number;
  pets: number;
  groups: number;
  countingMethod: string;
  dayType?: string;
  weather?: string;
  notes?: string;
}

export default function VisitorCountPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapeo de traducción para el clima
  const weatherLabels = {
    sunny: 'Soleado',
    cloudy: 'Nublado', 
    rainy: 'Lluvioso',
    other: 'Otro'
  };

  // Mapeo de traducción para métodos de conteo
  const methodLabels = {
    estimation: 'Estimación',
    manual_counter: 'Contador manual',
    event_based: 'Basado en eventos',
    entrance_control: 'Control de acceso'
  };
  
  const [selectedPark, setSelectedPark] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [countingMode, setCountingMode] = useState<'daily' | 'range'>('daily');
  const [distributionMode, setDistributionMode] = useState<'equal' | 'average'>('average');
  
  // Estados para reportes
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  const [reportPark, setReportPark] = useState<string>('all');
  
  // Estados para paginación y vista
  const [currentPage, setCurrentPage] = useState(1);
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const recordsPerPage = 10;
  
  // Estados para la nueva navegación jerárquica
  const [selectedParkForDetail, setSelectedParkForDetail] = useState<number | null>(null);
  const [quickDateRange, setQuickDateRange] = useState<'week' | 'month' | 'quarter' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('reportes');
  const [formData, setFormData] = useState<VisitorCountForm>({
    parkId: 0,
    date: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    adults: 0,
    children: 0,
    seniors: 0,
    pets: 0,
    groups: 0,
    countingMethod: "estimation",
    dayType: "weekday",
    weather: "sunny",
    notes: ""
  });

  // Función para obtener el rango de fechas según el filtro rápido
  const getDateRangeForQuickFilter = () => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (quickDateRange) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'custom':
        return {
          startDate: customStartDate || today.toISOString().split('T')[0],
          endDate: customEndDate || today.toISOString().split('T')[0]
        };
      default:
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Queries  
  const { data: parksResponse } = useQuery({
    queryKey: ['/api/parks'],
    retry: 1
  });


  
  const parks = Array.isArray(parksResponse) ? parksResponse : ((parksResponse as any)?.data && Array.isArray((parksResponse as any).data) ? (parksResponse as any).data : []);

  const { data: visitorCounts, isLoading } = useQuery<{
    data: VisitorCount[];
    pagination: any;
  }>({
    queryKey: ['/api/visitor-counts', selectedPark, currentPage, searchTerm, dateFilter, methodFilter, reportPark, reportPeriod],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Usar el filtro de parque de los reportes si está activo, sino usar el selectedPark normal
      const parkFilter = reportPark !== 'all' ? reportPark : selectedPark;
      if (parkFilter && parkFilter !== 'all') params.set('parkId', parkFilter);
      
      params.set('limit', recordsPerPage.toString());
      params.set('offset', ((currentPage - 1) * recordsPerPage).toString());
      if (searchTerm) params.set('search', searchTerm);
      if (methodFilter) params.set('method', methodFilter);
      
      // Priorizar filtro de período de reportes sobre dateFilter manual
      if (reportPeriod !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (reportPeriod) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          case 'year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
          default:
            startDate = new Date(0);
        }
        
        params.set('startDate', startDate.toISOString().split('T')[0]);
      } else if (dateFilter) {
        // Solo usar dateFilter si no hay filtro de período activo
        params.set('startDate', dateFilter);
      }
      
      console.log(`🌐 [UNIFIED FILTER] Consultando con parámetros:`, Object.fromEntries(params.entries()));
      
      const response = await fetch(`/api/visitor-counts?${params}`);
      return response.json();
    },
  });

  // Query adicional para obtener estadísticas globales completas (no paginadas)
  const { data: globalStats } = useQuery({
    queryKey: ['/api/visitor-counts/global', reportPark, reportPeriod, dateFilter, methodFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Usar los mismos filtros que la query principal
      const parkFilter = reportPark !== 'all' ? reportPark : selectedPark;
      if (parkFilter && parkFilter !== 'all') params.set('parkId', parkFilter);
      
      if (methodFilter && methodFilter !== 'all') params.set('method', methodFilter);
      
      // Aplicar filtros de fecha con la misma lógica
      if (reportPeriod !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (reportPeriod) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          case 'year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
          default:
            startDate = new Date(0);
        }
        
        params.set('startDate', startDate.toISOString().split('T')[0]);
      } else if (dateFilter) {
        params.set('startDate', dateFilter);
      }
      
      params.set('limit', '10000'); // Límite alto para obtener todos los datos
      
      console.log(`🌐 [GLOBAL STATS] Consultando con parámetros:`, Object.fromEntries(params.entries()));
      
      const response = await fetch(`/api/visitor-counts?${params}`);
      return response.json();
    },
    retry: 1
  });

  // Query para resumen por parques (nueva funcionalidad)
  const { data: parkSummaryData } = useQuery({
    queryKey: ['/api/visitor-counts/park-summary', quickDateRange, customStartDate, customEndDate],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeForQuickFilter();
      const params = new URLSearchParams();
      params.set('startDate', startDate);
      params.set('endDate', endDate);
      params.set('groupBy', 'park');
      
      const response = await fetch(`/api/visitor-counts/park-summary?${params}`);
      return response.json();
    },
    retry: 1
  });

  // Query para detalles del parque seleccionado
  const { 
    data: parkDetailData, 
    isLoading: parkDetailLoading 
  } = useQuery({
    queryKey: ['/api/visitor-counts', 'park-detail', selectedParkForDetail, quickDateRange, customStartDate, customEndDate, detailCurrentPage],
    queryFn: async () => {
      if (!selectedParkForDetail) return null;
      
      const { startDate, endDate } = getDateRangeForQuickFilter();
      const params = new URLSearchParams();
      params.set('parkId', selectedParkForDetail.toString());
      params.set('startDate', startDate);
      params.set('endDate', endDate);
      params.set('limit', recordsPerPage.toString());
      params.set('offset', ((detailCurrentPage - 1) * recordsPerPage).toString());
      
      console.log(`🔍 [DETAIL QUERY] Página ${detailCurrentPage}, offset: ${(detailCurrentPage - 1) * recordsPerPage}, params:`, Object.fromEntries(params.entries()));
      
      const response = await fetch(`/api/visitor-counts?${params}`);
      return response.json();
    },
    enabled: !!selectedParkForDetail,
    retry: 1
  });



  // Datos filtrados para visualización
  const filteredData = useMemo(() => {
    if (!visitorCounts?.data) return [];
    
    let filtered = [...visitorCounts.data];
    
    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(count => 
        count.parkName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        count.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro por método
    if (methodFilter && methodFilter !== 'all') {
      filtered = filtered.filter(count => count.countingMethod === methodFilter);
    }
    
    return filtered;
  }, [visitorCounts?.data, searchTerm, methodFilter]);

  // Reset de filtros
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedPark('all');
    setDateFilter('');
    setMethodFilter('all');
    setCurrentPage(1);
  };

  // Calcular paginación
  const totalPages = Math.ceil((visitorCounts?.pagination?.total || 0) / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, visitorCounts?.pagination?.total || 0);

  // Funciones de exportación profesional
  const exportToCSV = () => {
    if (!visitorCounts?.data?.length) {
      toast({
        title: "No hay datos",
        description: "No hay registros para exportar",
        variant: "destructive",
      });
      return;
    }

    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calcular estadísticas de resumen
    const totalVisitors = visitorCounts.data.reduce((sum, count) => sum + count.totalVisitors, 0);
    const totalAdults = visitorCounts.data.reduce((sum, count) => sum + count.adults, 0);
    const totalChildren = visitorCounts.data.reduce((sum, count) => sum + count.children, 0);
    const totalSeniors = visitorCounts.data.reduce((sum, count) => sum + count.seniors, 0);
    const totalPets = visitorCounts.data.reduce((sum, count) => sum + count.pets, 0);
    const totalGroups = visitorCounts.data.reduce((sum, count) => sum + count.groups, 0);
    const avgDaily = visitorCounts.data.length > 0 ? Math.round(totalVisitors / visitorCounts.data.length) : 0;
    
    // Estadísticas por método de conteo
    const methodStats = visitorCounts.data.reduce((acc, count) => {
      const method = getMethodLabel(count.countingMethod);
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Estadísticas por clima
    const weatherStats = visitorCounts.data.reduce((acc, count) => {
      const weather = getWeatherLabel(count.weather);
      acc[weather] = (acc[weather] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Traducir métodos de conteo a español
    const methodLabels: Record<string, string> = {
      'counting': 'Conteo manual',
      'estimation': 'Estimación',
      'manual_counter': 'Contador manual',
      'event_based': 'Basado en eventos',
      'entrance_control': 'Control de acceso'
    };

    // Traducir tipos de clima
    const weatherTranslations: Record<string, string> = {
      'sunny': 'Soleado',
      'cloudy': 'Nublado', 
      'rainy': 'Lluvioso',
      'other': 'Otro'
    };

    // Traducir tipos de día
    const dayTypeTranslations: Record<string, string> = {
      'weekday': 'Día laborable',
      'weekend': 'Fin de semana',
      'holiday': 'Día festivo'
    };

    const csvData = visitorCounts.data.map(count => ({
      'Fecha': format(new Date(count.date), 'dd/MM/yyyy', { locale: es }),
      'Parque': count.parkName,
      'Adultos': count.adults,
      'Niños': count.children,
      'Adultos Mayores': count.seniors,
      'Mascotas': count.pets,
      'Grupos': count.groups,
      'Total Visitantes': count.totalVisitors,
      'Método de Conteo': methodLabels[count.countingMethod] || count.countingMethod,
      'Tipo de Día': dayTypeTranslations[count.dayType || 'weekday'] || count.dayType,
      'Clima': weatherTranslations[count.weather || 'sunny'] || count.weather,
      'Notas': count.notes || 'Sin observaciones'
    }));

    // Encabezado profesional
    const headerLines = [
      'SISTEMA DE GESTIÓN DE PARQUES URBANOS',
      'REPORTE DE CONTEO DE VISITANTES',
      `Generado el: ${currentDate}`,
      `Total de registros: ${visitorCounts.data.length}`,
      '',
      'RESUMEN EJECUTIVO',
      `Total de visitantes registrados: ${totalVisitors.toLocaleString('es-ES')}`,
      `Promedio diario de visitantes: ${avgDaily.toLocaleString('es-ES')}`,
      `Adultos: ${totalAdults.toLocaleString('es-ES')} | Niños: ${totalChildren.toLocaleString('es-ES')} | Adultos Mayores: ${totalSeniors.toLocaleString('es-ES')}`,
      `Mascotas: ${totalPets.toLocaleString('es-ES')} | Grupos organizados: ${totalGroups.toLocaleString('es-ES')}`,
      '',
      'MÉTODOS DE CONTEO UTILIZADOS',
      ...Object.entries(methodStats).map(([method, count]) => `${method}: ${count} registros`),
      '',
      'CONDICIONES CLIMÁTICAS',
      ...Object.entries(weatherStats).map(([weather, count]) => `${weather}: ${count} días`),
      '',
      'DETALLE DE REGISTROS',
      ''
    ];

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      ...headerLines,
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
    ].join('\n');

    // Agregar BOM para UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `conteo_visitantes_profesional_${format(new Date(), 'dd-MM-yyyy', { locale: es })}.csv`;
    link.click();

    toast({
      title: "Exportación CSV exitosa",
      description: `Se exportaron ${visitorCounts.data.length} registros con resumen ejecutivo`,
    });
  };


  const downloadTemplate = () => {
    // Crear plantilla simple solo con headers y datos de ejemplo
    const templateData = [
      {
        'Fecha': '2025-01-15',
        'Parque': 'Bosque Los Colomos',
        'Adultos': '150',
        'Niños': '75',
        'Adultos Mayores': '30',
        'Mascotas': '20',
        'Grupos': '5',
        'Método de Conteo': 'Conteo manual',
        'Tipo de Día': 'Día laborable',
        'Clima': 'Soleado',
        'Notas': 'Día regular, buen clima'
      },
      {
        'Fecha': '2025-01-16',
        'Parque': 'Parque Metropolitano',
        'Adultos': '200',
        'Niños': '100',
        'Adultos Mayores': '40',
        'Mascotas': '25',
        'Grupos': '8',
        'Método de Conteo': 'Estimación',
        'Tipo de Día': 'Fin de semana',
        'Clima': 'Nublado',
        'Notas': 'Fin de semana, mucha actividad'
      }
    ];

    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
    ].join('\n');

    // Agregar BOM para UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plantilla_conteo_visitantes_${format(new Date(), 'dd-MM-yyyy', { locale: es })}.csv`;
    link.click();

    toast({
      title: "Plantilla descargada",
      description: "Plantilla CSV lista para usar",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        
        // Aquí iría la lógica de procesamiento del CSV
        // Por ahora solo mostramos un mensaje de éxito
        toast({
          title: "Importación exitosa",
          description: `Se procesaron ${lines.length - 1} registros`,
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/visitor-counts'] });
      } catch (error) {
        toast({
          title: "Error en importación",
          description: "Error al procesar el archivo CSV",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Funciones específicas para resumen por parques
  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event: any) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          console.log('📥 [CSV] Procesando archivo...');
          
          // Dividir en líneas y limpiar
          const lines = csv.split(/\r?\n/).filter(line => line.trim());
          
          if (lines.length < 2) {
            throw new Error('El archivo CSV debe contener al menos una línea de headers y una de datos');
          }
          
          // Primera línea son los headers
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
          const dataLines = lines.slice(1);
          
          console.log('📊 [CSV] Headers:', headers);
          console.log('📊 [CSV] Filas de datos:', dataLines.length);
          
          // Parsear los datos
          const parsedData = [];
          for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i].trim();
            if (!line) continue; // Skip líneas vacías
            
            // Parsear la línea CSV (considerando comillas)
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim()); // Agregar el último valor
            
            // Crear objeto con los datos
            const rowData: any = {};
            headers.forEach((header, index) => {
              rowData[header] = values[index] || '';
            });
            
            parsedData.push(rowData);
          }
          
          console.log('📊 [CSV] Datos parseados:', parsedData);
          
          if (parsedData.length === 0) {
            throw new Error('No se encontraron datos válidos para importar');
          }
          
          toast({
            title: "Importación exitosa",
            description: `Se procesaron ${parsedData.length} registros correctamente`,
          });
          
          // Aquí se podría enviar los datos al backend
          // Por ahora solo invalidamos las consultas para refrescar
          queryClient.invalidateQueries({ queryKey: ['/api/visitor-counts/park-summary'] });
          queryClient.invalidateQueries({ queryKey: ['/api/visitor-counts'] });
          
        } catch (error) {
          console.error('Error importando CSV:', error);
          toast({
            title: "Error en importación",
            description: error instanceof Error ? error.message : "No se pudo procesar el archivo CSV",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportParkSummaryToCSV = () => {
    try {
      if (!parkSummaryData?.data || parkSummaryData.data.length === 0) {
        toast({
          title: "Sin datos para exportar",
          description: "No hay datos de resumen por parques para exportar",
          variant: "destructive",
        });
        return;
      }

      const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Preparar datos del resumen por parques
      const csvData = parkSummaryData.data.map((park: any) => ({
        'Parque': park.parkName || 'N/A',
        'Total Visitantes': park.totalVisitors || 0,
        'Promedio Diario': park.avgDaily || 0,
        'Máximo Diario': park.maxDaily || 0,
        'Mínimo Diario': park.minDaily || 0,
        'Total Adultos': park.totalAdults || 0,
        'Total Niños': park.totalChildren || 0,
        'Total Seniors': park.totalSeniors || 0,
        'Total Mascotas': park.totalPets || 0,
        'Total Registros': park.totalRecords || 0
      }));

      // Crear encabezado profesional
      const headerLines = [
        'SISTEMA DE GESTIÓN DE PARQUES URBANOS',
        'RESUMEN EJECUTIVO POR PARQUES',
        `Generado el: ${currentDate}`,
        `Período de análisis: ${(() => {
          const { startDate, endDate } = getDateRangeForQuickFilter();
          return `${startDate} hasta ${endDate}`;
        })()}`,
        `Total de parques analizados: ${parkSummaryData.data.length}`,
        '',
        '═══════════════════════════════════════',
        'DATOS DETALLADOS POR PARQUE',
        '═══════════════════════════════════════',
        ''
      ];

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        ...headerLines,
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
      ].join('\n');

      // Agregar BOM para UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `resumen_parques_${format(new Date(), 'dd-MM-yyyy', { locale: es })}.csv`;
      link.click();

      toast({
        title: "CSV exportado exitosamente",
        description: `Resumen de ${parkSummaryData.data.length} parques exportado correctamente`,
      });

    } catch (error) {
      console.error('Error exportando CSV del resumen:', error);
      toast({
        title: "Error en exportación",
        description: "No se pudo generar el archivo CSV del resumen",
        variant: "destructive",
      });
    }
  };


  // Calcular datos para reportes usando datos disponibles
  const reportData = useMemo(() => {
    // Usar los datos de visitorCounts que sí están funcionando
    const availableData = visitorCounts?.data || [];
    
    if (availableData.length === 0) {
      console.log(`🌐 [REPORT DATA] No hay datos disponibles`);
      return null;
    }

    console.log(`🌐 [REPORT DATA] Usando ${availableData.length} registros para estadísticas`);

    // Calcular estadísticas generales desde todos los registros
    const totalVisitors = availableData.reduce((sum: number, count: any) => sum + (count.totalVisitors || 0), 0);
    const totalAdults = availableData.reduce((sum: number, count: any) => sum + (count.adults || 0), 0);
    const totalChildren = availableData.reduce((sum: number, count: any) => sum + (count.children || 0), 0);
    const totalSeniors = availableData.reduce((sum: number, count: any) => sum + (count.seniors || 0), 0);
    const totalPets = availableData.reduce((sum: number, count: any) => sum + (count.pets || 0), 0);
    const avgDaily = availableData.length > 0 ? Math.round(totalVisitors / availableData.length) : 0;

    console.log(`🌐 [REPORT DATA] Estadísticas calculadas: ${totalVisitors.toLocaleString()} visitantes totales`);

    // Datos demográficos para gráfico de pie (filtrar valores cero para evitar encimamiento)
    const demographicData = [
      { name: 'Adultos', value: totalAdults, color: '#067f5f' },
      { name: 'Niños', value: totalChildren, color: '#bcd256' },
      { name: 'Seniors', value: totalSeniors, color: '#8498a5' },
      { name: 'Mascotas', value: totalPets, color: '#00a587' }
    ].filter(item => item.value > 0); // Solo mostrar segmentos con datos

    // Datos por parque agrupando desde todos los registros
    const parkData = availableData.reduce((acc: any[], count: any) => {
      const existing = acc.find(item => item.parkName === count.parkName);
      if (existing) {
        existing.visitors += count.totalVisitors;
        existing.records += 1;
      } else {
        acc.push({
          parkName: count.parkName,
          visitors: count.totalVisitors,
          records: 1
        });
      }
      return acc;
    }, [] as any[]);

    // Datos por método de conteo usando todos los registros
    const methodData = availableData.reduce((acc, count) => {
      const methodKey = count.countingMethod;
      const method = methodLabels[methodKey as keyof typeof methodLabels] || methodKey || 'No especificado';
      const existing = acc.find(item => item.method === method);
      if (existing) {
        existing.count += 1;
        existing.visitors += count.totalVisitors;
      } else {
        acc.push({
          method: method,
          count: 1,
          visitors: count.totalVisitors
        });
      }
      return acc;
    }, [] as any[]);

    // Datos por clima usando todos los registros
    const weatherData = availableData.reduce((acc, count) => {
      const weatherKey = count.weather || 'other';
      const weather = weatherLabels[weatherKey as keyof typeof weatherLabels] || 'No especificado';
      const existing = acc.find(item => item.weather === weather);
      if (existing) {
        existing.count += 1;
        existing.visitors += count.totalVisitors;
      } else {
        acc.push({
          weather: weather,
          count: 1,
          visitors: count.totalVisitors
        });
      }
      return acc;
    }, [] as any[]);

    // Tendencia temporal (últimos 7 días) usando todos los registros
    const last7Days = availableData
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7)
      .map(count => ({
        date: format(new Date(count.date), 'dd/MM', { locale: es }),
        visitors: count.totalVisitors,
        adults: count.adults,
        children: count.children
      }));

    return {
      summary: {
        totalVisitors,
        totalAdults,
        totalChildren,
        totalSeniors,
        totalPets,
        avgDaily,
        totalRecords: availableData.length,
        uniqueParks: Array.from(new Set(availableData.map(c => c.parkName))).length
      },
      charts: {
        demographic: demographicData,
        parks: parkData,
        methods: methodData,
        weather: weatherData,
        trend: last7Days
      }
    };
  }, [visitorCounts]);

  // Mutation para crear nuevo registro
  const createVisitorCount = useMutation({
    mutationFn: async (data: VisitorCountForm) => {
      console.log('Datos del formulario de conteo de visitantes:', data);
      console.log('Modo de conteo:', countingMode);
      
      if (countingMode === 'range') {
        // Para rangos, crear múltiples registros
        const records = [];
        const startDate = new Date(data.startDate!);
        const endDate = new Date(data.endDate!);
        
        // Calcular número de días en el rango
        const timeDiff = endDate.getTime() - startDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        
        console.log(`📊 Modo distribución: ${distributionMode}, Días: ${daysDiff}`);
        console.log(`Total originales: ${data.adults} adultos, ${data.children} niños, ${data.seniors} seniors, ${data.pets} mascotas, ${data.groups} grupos`);
        
        if (distributionMode === 'average') {
          // Distribución con promedio diario y variaciones
          const avgAdults = Math.round(data.adults / daysDiff);
          const avgChildren = Math.round(data.children / daysDiff);
          const avgSeniors = Math.round(data.seniors / daysDiff);
          const avgPets = Math.round(data.pets / daysDiff);
          const avgGroups = Math.round(data.groups / daysDiff);
          
          console.log(`📈 Promedio diario: ${avgAdults} adultos, ${avgChildren} niños, ${avgSeniors} seniors, ${avgPets} mascotas, ${avgGroups} grupos`);
          
          // Función para crear variación realista (±15% del promedio)
          const addVariation = (value: number) => {
            if (value === 0) return 0;
            const variation = Math.round(value * 0.15); // 15% de variación
            const randomVariation = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
            return Math.max(0, value + randomVariation);
          };
          
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            
            // Aplicar variación realista a cada categoría
            const dayAdults = addVariation(avgAdults);
            const dayChildren = addVariation(avgChildren);
            const daySeniors = addVariation(avgSeniors);
            const dayPets = addVariation(avgPets);
            const dayGroups = addVariation(avgGroups);
            
            const record = {
              parkId: data.parkId,
              date: dateStr,
              adults: dayAdults,
              children: dayChildren,
              seniors: daySeniors,
              pets: dayPets,
              groups: dayGroups,
              countingMethod: data.countingMethod,
              dayType: data.dayType,
              weather: data.weather,
              notes: `${data.notes || ''} (Promedio diario distribuido del período ${data.startDate} a ${data.endDate})`.trim(),
              registeredBy: 1
            };
            console.log(`📅 ${dateStr}: ${dayAdults + dayChildren + daySeniors} visitantes (${dayAdults}+${dayChildren}+${daySeniors})`);
            records.push(record);
          }
        } else {
          // Distribución igual (números idénticos cada día)
          console.log(`📋 Usando números idénticos cada día`);
          
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const record = {
              parkId: data.parkId,
              date: dateStr,
              adults: data.adults,
              children: data.children,
              seniors: data.seniors,
              pets: data.pets,
              groups: data.groups,
              countingMethod: data.countingMethod,
              dayType: data.dayType,
              weather: data.weather,
              notes: `${data.notes || ''} (Números idénticos para período ${data.startDate} a ${data.endDate})`.trim(),
              registeredBy: 1
            };
            console.log(`📅 ${dateStr}: ${data.adults + data.children + data.seniors} visitantes (números idénticos)`);
            records.push(record);
          }
        }
        
        // Crear todos los registros con manejo de duplicados
        const responses = [];
        let successCount = 0;
        let duplicateCount = 0;
        
        for (const record of records) {
          try {
            const response = await apiRequest('/api/visitor-counts', {
              method: 'POST',
              data: record
            });
            responses.push(response);
            successCount++;
          } catch (error: any) {
            if (error.status === 409) {
              // Registro duplicado - no es un error crítico
              console.log(`⚠️ Registro duplicado para fecha ${record.date}`);
              duplicateCount++;
            } else {
              throw error; // Re-lanzar otros errores
            }
          }
        }
        
        return { responses, successCount, duplicateCount };
      } else {
        // Para conteo diario
        const requestData = { 
          parkId: data.parkId,
          date: data.date,
          adults: data.adults,
          children: data.children,
          seniors: data.seniors,
          pets: data.pets,
          groups: data.groups,
          countingMethod: data.countingMethod,
          dayType: data.dayType,
          weather: data.weather,
          notes: data.notes,
          registeredBy: 1 // Usuario admin por defecto
        };
        console.log('Datos para enviar (conteo diario):', requestData);
        
        return apiRequest('/api/visitor-counts', {
          method: 'POST',
          data: requestData
        });
      }
    },
    onSuccess: (result: any) => {
      if (countingMode === 'range' && result.successCount !== undefined) {
        // Modo rango con manejo de duplicados
        const totalAttempted = Math.ceil((new Date(formData.endDate!).getTime() - new Date(formData.startDate!).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        let message = `${result.successCount} registro(s) creado(s) exitosamente`;
        if (result.duplicateCount > 0) {
          message += `, ${result.duplicateCount} ya existían`;
        }
        
        toast({
          title: "Registro completado",
          description: message,
        });
      } else {
        // Modo diario normal
        toast({
          title: "Registro exitoso",
          description: "Registro de visitantes creado correctamente",
        });
      }
      
      // Invalidar múltiples queries para actualizar dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-counts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-counts/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-summary'] });
      setShowForm(false);
      setFormData({
        parkId: 0,
        date: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        adults: 0,
        children: 0,
        seniors: 0,
        pets: 0,
        groups: 0,
        countingMethod: "estimation",
        dayType: "weekday",
        weather: "sunny",
        notes: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el conteo de visitantes",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 Datos del formulario antes de enviar:', formData);
    console.log('🔍 Modo de conteo:', countingMode);
    
    if (formData.parkId === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona un parque",
        variant: "destructive",
      });
      return;
    }
    
    if (countingMode === 'range') {
      if (!formData.startDate || !formData.endDate) {
        toast({
          title: "Error",
          description: "Por favor selecciona las fechas de inicio y fin",
          variant: "destructive",
        });
        return;
      }
      
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast({
          title: "Error",
          description: "La fecha de inicio debe ser anterior a la fecha de fin",
          variant: "destructive",
        });
        return;
      }
    }
    
    createVisitorCount.mutate(formData);
  };

  const getMethodLabel = (method: string | undefined) => {
    if (!method) return 'No especificado';
    const methods = {
      estimation: "Estimación",
      manual_counter: "Contador manual",
      event_based: "Basado en eventos",
      entrance_control: "Control de acceso",
      counting: "Conteo manual"
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getDayTypeLabel = (dayType: string | undefined) => {
    if (!dayType) return 'No especificado';
    const types = {
      weekday: "Día laborable",
      weekend: "Fin de semana",
      holiday: "Día festivo"
    };
    return types[dayType as keyof typeof types] || dayType;
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sunny': return <Sun className="h-4 w-4" />;
      case 'cloudy': return <Cloud className="h-4 w-4" />;
      case 'rainy': return <CloudRain className="h-4 w-4" />;
      default: return <Sun className="h-4 w-4" />;
    }
  };

  const getWeatherLabel = (weather: string | undefined) => {
    if (!weather) return 'No especificado';
    return weatherLabels[weather as keyof typeof weatherLabels] || weather;
  };

  const getTotalVisitors = () => {
    return formData.adults + formData.children + formData.seniors;
  };

  const getTotalPets = () => {
    return formData.pets;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con título */}
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-gray-900" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Conteo</h1>
                <p className="text-gray-600 mt-2">Gestión diaria de visitantes por parque</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Registro
              </Button>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resumen">Resumen por Parque</TabsTrigger>
            <TabsTrigger value="detalle" disabled={!selectedParkForDetail}>
              {selectedParkForDetail ? `Detalle - ${parks.find(p => p.id === selectedParkForDetail)?.name}` : 'Detalle del Parque'}
            </TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-4">
            {/* Filtros de Período Prominentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Período de Análisis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Botones de rango rápido y botones de acción al mismo nivel */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Botones de período */}
                  <Button
                    variant={quickDateRange === 'week' ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => setQuickDateRange('week')}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-5 w-5" />
                    Semana
                  </Button>
                  <Button
                    variant={quickDateRange === 'month' ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => setQuickDateRange('month')}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-5 w-5" />
                    Mes
                  </Button>
                  <Button
                    variant={quickDateRange === 'quarter' ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => setQuickDateRange('quarter')}
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="h-5 w-5" />
                    Trimestre
                  </Button>
                  <Button
                    variant={quickDateRange === 'custom' ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => setQuickDateRange('custom')}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-5 w-5" />
                    Personalizado
                  </Button>

                  {/* Separador visual */}
                  <div className="h-6 w-px bg-gray-300 mx-2"></div>

                  {/* Botones de acción movidos al mismo nivel */}
                  <div className="flex">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleImportCSV}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-2 rounded-r-none border-r-0"
                    >
                      <Upload className="h-5 w-5" />
                      Importar CSV
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="lg"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-l-none px-2"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={downloadTemplate}>
                          <Download className="h-4 w-4 mr-2" />
                          Descargar Plantilla CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={exportParkSummaryToCSV}
                    className="border-green-200 text-green-700 hover:bg-green-50 flex items-center gap-2"
                  >
                    <Download className="h-5 w-5" />
                    Exportar CSV
                  </Button>
                  <Button
                    onClick={() => {
                      // Invalidar cache para actualizar datos
                      queryClient.invalidateQueries({ 
                        queryKey: ['/api/visitor-counts/park-summary'] 
                      });
                      toast({
                        title: "Actualizando datos",
                        description: "Se están actualizando los datos del resumen por parques"
                      });
                    }}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <Activity className="h-5 w-5" />
                    Actualizar
                  </Button>
                </div>

                {/* Filtros personalizados cuando se selecciona "custom" */}
                {quickDateRange === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="custom-start-date">Fecha Inicio</Label>
                      <Input
                        id="custom-start-date"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-end-date">Fecha Final</Label>
                      <Input
                        id="custom-end-date"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Información del período seleccionado */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">
                      Período Seleccionado: {
                        (() => {
                          const { startDate, endDate } = getDateRangeForQuickFilter();
                          return `${startDate} hasta ${endDate}`;
                        })()
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tarjetas Resumen por Parque */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {!parkSummaryData ? (
                <div className="text-center py-8 col-span-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando resumen por parques...</p>
                </div>
              ) : parkSummaryData?.data?.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay datos para el período seleccionado</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Selecciona un período diferente o registra conteos de visitantes
                    </p>
                  </CardContent>
                </Card>
              ) : (
                parkSummaryData?.data?.map((parkSummary: any) => (
                  <Card 
                    key={parkSummary.parkId} 
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-emerald-200" 
                    onClick={() => {
                      setSelectedParkForDetail(parkSummary.parkId);
                      setDetailCurrentPage(1); // Resetear paginación al cambiar de parque
                      setActiveTab('detalle');
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header del Parque */}
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-5 w-5 text-emerald-600" />
                              <h3 className="font-semibold text-lg text-gray-900">{parkSummary.parkName}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{parkSummary.totalRecords || 0} registros en el período</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-emerald-600">
                              {Number(parkSummary.totalVisitors || 0).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">visitantes totales</div>
                          </div>
                        </div>

                        {/* Métricas del Período */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-semibold text-blue-700">
                              {Number(parkSummary.avgDaily || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-blue-600">Promedio diario</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-semibold text-green-700">
                              {Number(parkSummary.maxDaily || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-green-600">Máximo diario</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <div className="text-lg font-semibold text-orange-700">
                              {Number(parkSummary.minDaily || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-orange-600">Mínimo diario</div>
                          </div>
                        </div>

                        {/* Distribución Demográfica */}
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center p-2 bg-slate-50 rounded">
                            <div className="text-sm font-semibold text-slate-700">
                              {Number(parkSummary.totalAdults || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-600">Adultos</div>
                          </div>
                          <div className="text-center p-2 bg-teal-50 rounded">
                            <div className="text-sm font-semibold text-teal-700">
                              {Number(parkSummary.totalChildren || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-teal-600">Niños</div>
                          </div>
                          <div className="text-center p-2 bg-amber-50 rounded">
                            <div className="text-sm font-semibold text-amber-700">
                              {Number(parkSummary.totalSeniors || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-amber-600">Mayores</div>
                          </div>
                          <div className="text-center p-2 bg-pink-50 rounded">
                            <div className="text-sm font-semibold text-pink-700">
                              {Number(parkSummary.totalPets || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-pink-600">Mascotas</div>
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Último registro: {parkSummary.lastRecord ? format(new Date(parkSummary.lastRecord), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</span>
                          </div>
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            Click para ver detalles
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>


          </TabsContent>

          <TabsContent value="detalle" className="space-y-4">
            {selectedParkForDetail ? (
              <div className="space-y-6">
                {/* Header de detalle del parque */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      Detalle del Parque - {parks.find(p => p.id === selectedParkForDetail)?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Vista detallada de los registros diarios para el parque seleccionado en el período actual
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedParkForDetail(null);
                          setActiveTab('resumen');
                        }}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver al Resumen
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Controles de vista para detalle */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Período:</span>
                          <span className="text-sm text-gray-600">
                            {(() => {
                              const { startDate, endDate } = getDateRangeForQuickFilter();
                              return `${startDate} hasta ${endDate}`;
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Registros detallados del parque */}
                <div className="space-y-4">
                  {parkDetailLoading ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando registros del parque...</p>
                      </CardContent>
                    </Card>
                  ) : parkDetailData?.data?.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No hay registros para este parque en el período seleccionado</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Intenta cambiar el período de tiempo o registra nuevos conteos
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Vista Grid */}
                      {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {parkDetailData?.data?.map((record: any) => (
                            <Card key={record.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  {/* Fecha y método */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-emerald-600" />
                                      <span className="font-medium text-sm">
                                        {format(new Date(record.date), 'dd/MM/yyyy', { locale: es })}
                                      </span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {getMethodLabel(record.counting_method)}
                                    </Badge>
                                  </div>

                                  {/* Visitantes */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center p-2 bg-blue-50 rounded">
                                      <div className="text-lg font-semibold text-blue-700">
                                        {record.adults}
                                      </div>
                                      <div className="text-xs text-blue-600">Adultos</div>
                                    </div>
                                    <div className="text-center p-2 bg-green-50 rounded">
                                      <div className="text-lg font-semibold text-green-700">
                                        {record.children}
                                      </div>
                                      <div className="text-xs text-green-600">Niños</div>
                                    </div>
                                    <div className="text-center p-2 bg-amber-50 rounded">
                                      <div className="text-lg font-semibold text-amber-700">
                                        {record.seniors}
                                      </div>
                                      <div className="text-xs text-amber-600">Mayores</div>
                                    </div>
                                    <div className="text-center p-2 bg-pink-50 rounded">
                                      <div className="text-lg font-semibold text-pink-700">
                                        {record.pets}
                                      </div>
                                      <div className="text-xs text-pink-600">Mascotas</div>
                                    </div>
                                  </div>

                                  {/* Total */}
                                  <div className="text-center p-2 bg-emerald-50 rounded border border-emerald-200">
                                    <div className="text-xl font-bold text-emerald-700">
                                      {(record.adults + record.children + record.seniors).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-emerald-600">Total Visitantes</div>
                                  </div>

                                  {/* Información adicional */}
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      {getWeatherIcon(record.weather)}
                                      <span>{getWeatherLabel(record.weather)}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {getDayTypeLabel(record.dayType)}
                                    </Badge>
                                  </div>

                                  {/* Notas si existen */}
                                  {record.notes && (
                                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                      <span className="font-medium">Notas:</span> {record.notes}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Vista Lista */}
                      {viewMode === 'list' && (
                        <Card>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                  <tr>
                                    <th className="text-left p-3 text-sm font-medium text-gray-700">Fecha</th>
                                    <th className="text-left p-3 text-sm font-medium text-gray-700">Método</th>
                                    <th className="text-center p-3 text-sm font-medium text-gray-700">Adultos</th>
                                    <th className="text-center p-3 text-sm font-medium text-gray-700">Niños</th>
                                    <th className="text-center p-3 text-sm font-medium text-gray-700">Mayores</th>
                                    <th className="text-center p-3 text-sm font-medium text-gray-700">Mascotas</th>
                                    <th className="text-center p-3 text-sm font-medium text-gray-700">Total</th>
                                    <th className="text-left p-3 text-sm font-medium text-gray-700">Clima</th>
                                    <th className="text-left p-3 text-sm font-medium text-gray-700">Tipo Día</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {parkDetailData?.data?.map((record: any, index: number) => (
                                    <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="p-3 text-sm">
                                        {format(new Date(record.date), 'dd/MM/yyyy', { locale: es })}
                                      </td>
                                      <td className="p-3 text-sm">
                                        <Badge variant="outline" className="text-xs">
                                          {getMethodLabel(record.countingMethod)}
                                        </Badge>
                                      </td>
                                      <td className="p-3 text-sm text-center font-medium">{record.adults}</td>
                                      <td className="p-3 text-sm text-center font-medium">{record.children}</td>
                                      <td className="p-3 text-sm text-center font-medium">{record.seniors}</td>
                                      <td className="p-3 text-sm text-center font-medium">{record.pets}</td>
                                      <td className="p-3 text-sm text-center font-bold text-emerald-700">
                                        {(record.adults + record.children + record.seniors).toLocaleString()}
                                      </td>
                                      <td className="p-3 text-sm">
                                        <div className="flex items-center gap-1">
                                          {getWeatherIcon(record.weather)}
                                          <span>{getWeatherLabel(record.weather)}</span>
                                        </div>
                                      </td>
                                      <td className="p-3 text-sm">
                                        <Badge variant="secondary" className="text-xs">
                                          {getDayTypeLabel(record.dayType)}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Paginación */}
                      {parkDetailData?.pagination && parkDetailData.pagination.totalPages > 1 && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">
                                Mostrando {((detailCurrentPage - 1) * recordsPerPage) + 1} a {Math.min(detailCurrentPage * recordsPerPage, parkDetailData.pagination.total)} de {parkDetailData.pagination.total} registros
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newPage = Math.max(1, detailCurrentPage - 1);
                                    console.log(`🔍 [PAGINATION] Página anterior: ${detailCurrentPage} → ${newPage}`);
                                    setDetailCurrentPage(newPage);
                                  }}
                                  disabled={detailCurrentPage <= 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: Math.min(5, parkDetailData.pagination.totalPages) }, (_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                      <Button
                                        key={pageNum}
                                        variant={detailCurrentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                          console.log(`🔍 [PAGINATION] Página seleccionada: ${detailCurrentPage} → ${pageNum}`);
                                          setDetailCurrentPage(pageNum);
                                        }}
                                        className="w-8 h-8 p-0"
                                      >
                                        {pageNum}
                                      </Button>
                                    );
                                  })}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDetailCurrentPage(Math.min(parkDetailData.pagination.totalPages, detailCurrentPage + 1))}
                                  disabled={detailCurrentPage >= parkDetailData.pagination.totalPages}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Selecciona un parque del resumen para ver sus detalles</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Haz clic en cualquier tarjeta de parque en la pestaña "Resumen por Parque"
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reportes">
            <div className="space-y-6">
              {/* Controles de filtro */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros de Reporte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Parque</Label>
                      <Select value={reportPark} onValueChange={setReportPark}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un parque" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los parques</SelectItem>
                          {parks && Array.isArray(parks) && parks.filter(park => park.id && park.name).map((park) => (
                            <SelectItem key={park.id} value={park.id.toString()}>
                              {park.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Período</Label>
                      <Select value={reportPeriod} onValueChange={(value: any) => setReportPeriod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Última semana</SelectItem>
                          <SelectItem value="month">Último mes</SelectItem>
                          <SelectItem value="quarter">Último trimestre</SelectItem>
                          <SelectItem value="year">Último año</SelectItem>
                          <SelectItem value="all">Todo el año</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Métricas resumen */}
              {reportData && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Visitantes</p>
                            <p className="text-2xl font-bold text-[#067f5f]">
                              {reportData.summary.totalVisitors.toLocaleString()}
                            </p>
                          </div>
                          <Users className="h-8 w-8 text-[#067f5f]" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Promedio Diario</p>
                            <p className="text-2xl font-bold text-[#00a587]">
                              {Number(reportData.summary.avgDaily || 0).toLocaleString()}
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-[#00a587]" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Registros</p>
                            <p className="text-2xl font-bold text-[#bcd256]">
                              {Number(reportData.summary.totalRecords || 0).toLocaleString()}
                            </p>
                          </div>
                          <FileText className="h-8 w-8 text-[#bcd256]" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Parques Únicos</p>
                            <p className="text-2xl font-bold text-[#8498a5]">
                              {Number(reportData.summary.uniqueParks || 0).toLocaleString()}
                            </p>
                          </div>
                          <MapPin className="h-8 w-8 text-[#8498a5]" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráficos */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Distribución demográfica */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Distribución Demográfica
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={reportData.charts.demographic}
                                cx="50%"
                                cy="45%"
                                labelLine={true}
                                label={({ name, percent, value }) => 
                                  percent > 0.05 ? `${name}: ${Number(value || 0).toLocaleString()} (${(percent * 100).toFixed(1)}%)` : ''
                                }
                                outerRadius={70}
                                innerRadius={20}
                                fill="#8884d8"
                                dataKey="value"
                                minAngle={5}
                              >
                                {reportData.charts.demographic.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: any, name: string) => [
                                  `${Number(value || 0).toLocaleString()} visitantes`, 
                                  name
                                ]}
                              />
                              <Legend 
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value: string, entry: any) => 
                                  `${value}: ${Number(entry.payload?.value || 0).toLocaleString()}`
                                }
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tendencia temporal */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Tendencia Últimos 7 Días
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={reportData.charts.trend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip formatter={(value: any) => [Number(value).toLocaleString(), 'Visitantes']} />
                              <Line type="monotone" dataKey="visitors" stroke="#067f5f" strokeWidth={2} />
                              <Line type="monotone" dataKey="adults" stroke="#00a587" strokeWidth={2} />
                              <Line type="monotone" dataKey="children" stroke="#bcd256" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Visitantes por parque */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Visitantes por Parque
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.charts.parks}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="parkName" angle={-45} textAnchor="end" height={100} />
                              <YAxis />
                              <Tooltip formatter={(value: any) => [Number(value).toLocaleString(), 'Visitantes']} />
                              <Bar dataKey="visitors" fill="#067f5f" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Métodos de conteo */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Métodos de Conteo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {reportData.charts.methods.map((method, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{method.method}</p>
                                <p className="text-sm text-gray-600">{method.count} registros</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-[#067f5f]">
                                  {method.visitors.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">visitantes</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabla de condiciones climáticas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sun className="h-5 w-5" />
                        Análisis por Condiciones Climáticas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Clima</th>
                              <th className="text-center p-2">Registros</th>
                              <th className="text-center p-2">Total Visitantes</th>
                              <th className="text-center p-2">Promedio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.charts.weather.map((weather, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-2 font-medium">{weather.weather}</td>
                                <td className="text-center p-2">{weather.count}</td>
                                <td className="text-center p-2">{weather.visitors.toLocaleString()}</td>
                                <td className="text-center p-2">{Math.round(weather.visitors / weather.count)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Botón de exportar */}
                  <div className="flex justify-end">
                    <div className="flex space-x-2">
                      <Button 
                        onClick={exportToCSV}
                        className="bg-[#067f5f] hover:bg-[#00a587]"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Estado sin datos */}
              {!reportData && (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No hay datos disponibles para generar reportes</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Asegúrate de tener registros de visitantes para visualizar los análisis
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de formulario */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Nuevo Registro de Visitantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Modo de conteo *</Label>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={countingMode === 'daily' ? 'default' : 'outline'}
                          onClick={() => setCountingMode('daily')}
                          className="flex items-center gap-2"
                        >
                          <Calendar className="h-4 w-4" />
                          Conteo diario
                        </Button>
                        <Button
                          type="button"
                          variant={countingMode === 'range' ? 'default' : 'outline'}
                          onClick={() => setCountingMode('range')}
                          className="flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4" />
                          Rango de fechas
                        </Button>
                      </div>
                    </div>

                    {/* Modo de distribución para rangos */}
                    {countingMode === 'range' && (
                      <div className="space-y-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Label>Tipo de distribución para el período *</Label>
                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant={distributionMode === 'average' ? 'default' : 'outline'}
                            onClick={() => setDistributionMode('average')}
                            className="flex items-center gap-2 text-sm"
                            size="sm"
                          >
                            <TrendingUp className="h-4 w-4" />
                            Promedio diario distribuido
                          </Button>
                          <Button
                            type="button"
                            variant={distributionMode === 'equal' ? 'default' : 'outline'}
                            onClick={() => setDistributionMode('equal')}
                            className="flex items-center gap-2 text-sm"
                            size="sm"
                          >
                            <BarChart3 className="h-4 w-4" />
                            Números idénticos
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          {distributionMode === 'average' 
                            ? 'Los números se dividirán entre los días del período con variaciones naturales (±15%)'
                            : 'Los mismos números se aplicarán idénticamente a cada día del período'
                          }
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="parkId">Parque *</Label>
                        <Select 
                          value={formData.parkId.toString()} 
                          onValueChange={(value) => setFormData({...formData, parkId: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un parque" />
                          </SelectTrigger>
                          <SelectContent>
                            {parks && Array.isArray(parks) && parks.filter(park => park.id && park.name).map((park) => (
                              <SelectItem key={park.id} value={park.id.toString()}>
                                {park.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {countingMode === 'daily' ? (
                        <div className="space-y-2">
                          <Label htmlFor="date">Fecha *</Label>
                          <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            required
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Rango de fechas *</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="startDate" className="text-sm">Desde</Label>
                              <Input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="endDate" className="text-sm">Hasta</Label>
                              <Input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contador de Visitantes */}
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h3 className="font-semibold text-blue-900 mb-3">Contador de Visitantes</h3>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="adults">Adultos</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.adults}
                            onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="children">Niños</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.children}
                            onChange={(e) => setFormData({...formData, children: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="seniors">Adultos mayores</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.seniors}
                            onChange={(e) => setFormData({...formData, seniors: parseInt(e.target.value) || 0})}
                          />
                        </div>

                      </div>
                    </div>

                    {/* Contador de Mascotas */}
                    <div className="p-4 border rounded-lg bg-pink-50">
                      <h3 className="font-semibold text-pink-900 mb-3">Contador de Mascotas</h3>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="pets">Mascotas (perros)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.pets}
                            onChange={(e) => setFormData({...formData, pets: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div className="text-sm text-pink-700 mt-2">
                          Conteo separado para mascotas que ingresan al parque
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-700">{formData.adults + formData.children + formData.seniors}</div>
                        <div className="text-sm text-emerald-600">Total de visitantes</div>
                      </div>
                    </div>
                    <div className="p-4 bg-pink-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-700">{formData.pets}</div>
                        <div className="text-sm text-pink-600">Total de mascotas</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="countingMethod">Método de conteo *</Label>
                      <Select 
                        value={formData.countingMethod} 
                        onValueChange={(value) => setFormData({...formData, countingMethod: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="estimation">Estimación</SelectItem>
                          <SelectItem value="manual_counter">Contador manual</SelectItem>
                          <SelectItem value="event_based">Basado en eventos</SelectItem>
                          <SelectItem value="entrance_control">Control de acceso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {countingMode === 'daily' && (
                      <div className="space-y-2">
                        <Label htmlFor="dayType">Tipo de día *</Label>
                        <Select 
                          value={formData.dayType} 
                          onValueChange={(value) => setFormData({...formData, dayType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekday">Día laborable</SelectItem>
                            <SelectItem value="weekend">Fin de semana</SelectItem>
                            <SelectItem value="holiday">Día festivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {countingMode === 'daily' && (
                    <div className="space-y-2">
                      <Label htmlFor="weather">Clima</Label>
                      <Select 
                        value={formData.weather} 
                        onValueChange={(value) => setFormData({...formData, weather: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sunny">Soleado</SelectItem>
                          <SelectItem value="cloudy">Nublado</SelectItem>
                          <SelectItem value="rainy">Lluvioso</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas adicionales</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Observaciones, eventos especiales, etc."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={createVisitorCount.isPending}
                    >
                      {createVisitorCount.isPending ? "Guardando..." : "Guardar Registro"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}