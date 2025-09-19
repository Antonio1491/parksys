import React, { useState, useEffect, startTransition, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
// NOTA CRÍTICA: NO IMPORTAR Select, SelectContent, SelectItem, SelectTrigger, SelectValue
// El usuario específicamente NO quiere filtros en esta página

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, FileUp, Trash2, Eye, Edit, X, MapPin, Package, AlertTriangle, TreePine, Activity, FileText, UserCheck, Wrench, Grid, List, ChevronLeft, ChevronRight, Award, Map, Upload, Trash, CheckSquare, Square, Trees, CopyCheck, ChevronDown, CheckCircle, Calendar } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { apiRequest } from "@/lib/queryClient";
import { ExportButton } from "@/components/ui/export-button";

// Consolidated hook for parks summary - solves N+1 performance issue
const useParksMetricsSummary = (parkIds: number[]) => {
  return useQuery<Record<number, {
    metrics: ParkMetrics | null;
    incidents: PendingIncidents;
    assets: AssetsInMaintenance;
    reports: PendingReports;
    schedule: UpcomingSchedule;
  }>>({
    queryKey: ['/api/parks/summary', parkIds.sort().join(',')],
    queryFn: () => {
      if (parkIds.length === 0) return Promise.resolve({});
      const idsParam = parkIds.join(',');
      return apiRequest(`/api/parks/summary?ids=${idsParam}`);
    },
    enabled: parkIds.length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Individual hooks for backward compatibility (will be deprecated)
const useParkMetrics = (parkId: number) => {
  return useQuery<ParkMetrics>({
    queryKey: ['/api/parks', parkId, 'metrics'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!parkId,
  });
};

const usePendingIncidents = (parkId: number) => {
  return useQuery<PendingIncidents>({
    queryKey: ['/api/parks', parkId, 'pending-incidents'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!parkId,
  });
};

const useAssetsInMaintenance = (parkId: number) => {
  return useQuery<AssetsInMaintenance>({
    queryKey: ['/api/parks', parkId, 'assets-in-maintenance'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!parkId,
  });
};

const usePendingReports = (parkId: number) => {
  return useQuery<PendingReports>({
    queryKey: ['/api/parks', parkId, 'reports'],
    staleTime: 3 * 60 * 1000, // 3 minutes
    enabled: !!parkId,
  });
};

const useUpcomingSchedule = (parkId: number) => {
  return useQuery<UpcomingSchedule>({
    queryKey: ['/api/parks', parkId, 'upcoming-schedule'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!parkId,
  });
};

// Helper function moved to top level
const isParkCertified = (park: Park) => {
  return park.certificaciones && park.certificaciones.trim() !== '' && park.certificaciones !== 'Ninguna';
};

interface Park {
  id: number;
  name: string;
  description?: string;
  address: string;
  area: number;
  parkType: string;
  municipalityId: number;
  municipality?: { name: string };
  municipalityText?: string; // ✅ Campo para municipio como texto libre
  certificaciones?: string;
  createdAt: string;
  updatedAt: string;
  primaryImageUrl?: string; // ✅ Compatibilidad con formato antiguo
  primaryImage?: string; // ✅ Imagen principal del parque (desde el backend)
  mainImageUrl?: string; // ✅ Imagen principal alternativa
  // Nuevo campo
  typology?: {
    id: number;
    name: string;
    code?: string;
    normativeReference?: string;
    country: string;
    minArea?: string;
    maxArea?: string;
  };
}

interface ParkDependencies {
  trees: number;
  treeMaintenances: number;
  activities: number;
  incidents: number;
  amenities: number;
  images: number;
  assets: number;
  volunteers: number;
  instructors: number;
  evaluations: number;
  documents: number;
  total: number;
}

interface ParkMetrics {
  averageRating: number | null;
  totalEvaluations: number;
  ratingBreakdown: {
    cleanliness: number;
    safety: number;
    maintenance: number;
    accessibility: number;
    amenities: number;
    activities: number;
    staff: number;
    naturalBeauty: number;
  } | null;
}

interface PendingIncidents {
  total: number;
  incidents: Array<{
    id: number;
    title: string;
    incidentType: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
}

interface AssetsInMaintenance {
  total: number;
  assets: Array<{
    assetId: number;
    assetName: string;
    maintenanceType: string;
    status: string;
    date: string;
  }>;
  typeBreakdown: {
    preventive: number;
    corrective: number;
    emergency: number;
  };
}

interface PendingReports {
  total: number;
  reports: Array<{
    id: number;
    visitorName: string;
    feedbackType: string;
    message: string;
    status: string;
    createdAt: string;
  }>;
  typeBreakdown: {
    complaint: number;
    suggestion: number;
    compliment: number;
  };
}

interface UpcomingSchedule {
  total: number;
  schedule: Array<{
    id: number;
    title: string;
    startDate: string;
    endDate?: string;
    type: 'activity' | 'event';
    category?: string;
    eventType?: string;
  }>;
  breakdown: {
    activities: number;
    events: number;
  };
}

// Loading component for Suspense fallback
const AdminParksLoading = () => (
  <AdminLayout>
    <div>
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
        <MapPin className="w-8 h-8" />
        Parques
      </h1>
      <p className="text-gray-600 mt-2 mb-8">Gestión General del Sistema</p>
    </div>
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  </AdminLayout>
);

const AdminParksContent = () => {
  // IMPORTANTE: ESTA PÁGINA NO DEBE TENER FILTROS - SOLO BARRA DE BÚSQUEDA
  // Usuario específicamente pidió que NO aparezcan filtros de amenidades u otros
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [parkToDelete, setParkToDelete] = useState<Park | null>(null);
  const [parkDependencies, setParkDependencies] = useState<ParkDependencies | null>(null);
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  
  // Bulk delete states
  const [selectedParks, setSelectedParks] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteDependencies, setBulkDeleteDependencies] = useState<{[key: number]: ParkDependencies} | null>(null);
  
  // Pagination and view states
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectionMode, setSelectionMode] = useState(false);
  const itemsPerPage = 9;

  // Component to display park metrics - optimized to use summary data
  const ParkMetricsCard = ({ park, summaryData, isLoadingSummary }: { park: Park; summaryData?: any; isLoadingSummary?: boolean }) => {
    // Use summary data if available, otherwise fall back to individual queries
    const metrics = summaryData?.metrics;
    const incidents = summaryData?.incidents;
    const assets = summaryData?.assets;
    const reports = summaryData?.reports;
    const schedule = summaryData?.schedule;

    // Show loading state if summary data is loading
    const isLoading = isLoadingSummary || !summaryData;
    const hasErrors = false; // Summary endpoint handles errors centrally

    const getRatingColor = (rating: number | null) => {
      if (!rating) return "bg-gray-100 text-gray-800";
      if (rating >= 4.5) return "bg-green-100 text-green-800";
      if (rating >= 3.5) return "bg-yellow-100 text-yellow-800";
      return "bg-red-100 text-red-800";
    };

    const getAlertComponent = (count: number, label: string) => {
      const hasAlerts = count > 0;
      return (
        <div className="flex items-center gap-1 text-xs">
          {hasAlerts ? (
            <AlertTriangle className="h-3 w-3 text-orange-500" />
          ) : (
            <CheckCircle className="h-3 w-3 text-green-500" />
          )}
          <span className={hasAlerts ? "text-orange-700" : "text-green-700"}>
            {count} {label}
          </span>
        </div>
      );
    };

    // Show loading state while summary data is loading
    if (isLoading) {
      return (
        <div className="space-y-3">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-18 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      );
    }

    // Show error state if any queries failed
    if (hasErrors) {
      return (
        <div className="space-y-3">
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <h4 className="text-xs font-medium text-red-700">Error cargando métricas</h4>
            </div>
            <p className="text-xs text-red-600">Algunos datos no pudieron ser cargados</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Badge de evaluación promedio */}
        {metrics && metrics.averageRating !== null && (
          <Badge 
            variant="secondary" 
            className={`${getRatingColor(metrics.averageRating)} text-xs font-medium`}
          >
            ⭐ {metrics.averageRating.toFixed(1)} ({metrics.totalEvaluations} eval.)
          </Badge>
        )}

        {/* Sección de alertas */} 
        <div className="rounded-lg p-3 space-y-2"> 
          <div className="grid grid-cols-1 gap-1 font-poppins">
            {getAlertComponent(incidents?.total || 0, "incidencias")} 
            {getAlertComponent(assets?.total || 0, "activos")}
            {getAlertComponent(reports?.total || 0, "reportes")} 
          </div> 
        </div>


        {/* Programación próxima */}
        {schedule && schedule.total > 0 && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2">
              <Calendar className="h-3 w-3 text-blue-500" />
              <h4 className="text-xs font-medium text-blue-700">Próximos eventos</h4>
            </div>
            <div className="text-xs text-blue-600">
              {schedule.breakdown.activities > 0 && (
                <span>{schedule.breakdown.activities} actividades </span>
              )}
              {schedule.breakdown.events > 0 && (
                <span>{schedule.breakdown.events} eventos</span>
              )}
            </div>
            <div className="text-xs text-blue-500 mt-1">
              Total: {schedule.total} programados
            </div>
          </div>
        )}
      </div>
    );
  };

  // Fetch all parks with auto-refresh configuration
  const { 
    data: parksResponse, 
    isLoading: isLoadingParks,
    isError: isErrorParks,
    refetch: refetchParks
  } = useQuery<{data: Park[]}>({
    queryKey: ['/api/parks'],
    queryFn: () => apiRequest('/api/parks'),
    refetchOnWindowFocus: true,    // ✅ Actualizar al volver a la ventana
    refetchInterval: 30000,        // ✅ Actualizar cada 30 segundos automáticamente
    staleTime: 10000,              // ✅ Datos frescos por 10 segundos
    retry: 1,
  });

  // Fetch parks with images for better visual display
  const { data: parksWithImagesResponse } = useQuery<{data: any[]}>({
    queryKey: ['/api/parks-with-images'], 
    queryFn: () => apiRequest('/api/parks-with-images'),
    staleTime: 30000, // Cache for 30 seconds
  });
  
  const parks = parksResponse?.data || [];
  // Mapear los datos para que coincidan con la interfaz esperada
  const parksWithImages = React.useMemo(() => {
    if (parksWithImagesResponse?.data) {
      return parksWithImagesResponse.data.map((park: any) => ({
        ...park,
        primaryImageUrl: park.primaryImage || park.mainImageUrl || park.primaryImageUrl
      }));
    }
    return parks;
  }, [parksWithImagesResponse, parks]);



  // Function to fetch park dependencies
  const fetchParkDependencies = async (parkId: number) => {
    setLoadingDependencies(true);
    try {
      const response = await fetch(`/api/parks/${parkId}/dependencies`);
      if (!response.ok) throw new Error('Error al obtener dependencias');
      const dependencies = await response.json();
      setParkDependencies(dependencies);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      setParkDependencies(null);
    } finally {
      setLoadingDependencies(false);
    }
  };

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (parkIds: number[]) => {
      await apiRequest('/api/parks/bulk-delete', {
        method: 'POST',
        data: { parkIds },
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parks'] });
      toast({
        title: "Parques eliminados",
        description: `Se eliminaron ${selectedParks.size} parques exitosamente.`,
      });
      setShowBulkDeleteDialog(false);
      setSelectedParks(new Set());
      setBulkDeleteDependencies(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudieron eliminar los parques seleccionados.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (parkId: number) => {
      await apiRequest(`/api/parks/${parkId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parks'] });
      toast({
        title: "Parque eliminado",
        description: "El parque y todas sus dependencias han sido eliminados exitosamente.",
      });
      setShowDeleteDialog(false);
      setParkToDelete(null);
      setParkDependencies(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el parque.",
        variant: "destructive",
      });
    },
  });

  // Search through parks
  const filteredParks = React.useMemo(() => {
    return (parksWithImages as Park[]).filter(park => {
      // Apply search criteria only
      const matchesSearch = searchQuery === '' || 
        park.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        park.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [parksWithImages, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredParks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParks = filteredParks.slice(startIndex, endIndex);

  // Get metrics summary for current page parks only (performance optimization)
  const currentParkIds = currentParks.map(park => park.id);
  const { data: parksSummaryData, isLoading: isSummaryLoading } = useParksMetricsSummary(currentParkIds);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Get park typology display label and color
  const getTypologyLabel = (name?: string) => {
    if (!name) return "Sin tipología";
    return name;
  };
  const getTypologyColor = (code?: string) => {
    const colorMap: Record<string, string> = {
      'A-1': 'bg-green-100 text-green-800 border-green-200',
      'B-2': 'bg-blue-100 text-blue-800 border-blue-200',
      'C-3': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'D-4': 'bg-red-100 text-red-800 border-red-200',
      'E-5': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return code ? colorMap[code] ?? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Pagination navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Render pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">
          Mostrando {startIndex + 1}-{Math.min(endIndex, filteredParks.length)} de {filteredParks.length} parques
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          {pages.map(page => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageClick(page)}
              className={currentPage === page ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    return (
      <div className="space-y-4">
        {currentParks.map((park: Park) => (
          <Card 
            key={park.id} 
            className="hover:shadow-lg hover:bg-gray-50/50 transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            onClick={() => setLocation(`/admin/parks/${park.id}/view`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLocation(`/admin/parks/${park.id}/view`);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Ver detalles del parque ${park.name}`}
            data-testid={`card-park-list-${park.id}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {selectionMode && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedParks.has(park.id)}
                        onCheckedChange={(checked) => handleSelectPark(park.id, checked as boolean)}
                        data-testid={`checkbox-park-list-${park.id}`}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 flex-1">{park.name}</h3>
                          {isParkCertified(park) && (
                            <Badge 
                              variant="secondary" 
                              className="ml-2 bg-[#a8bd7d] text-white"
                            >
                              <Award className="h-3 w-3 mr-1" />
                              Certificado
                            </Badge>
                          )}
                        </div>
                        {/* Componente de métricas del parque para vista lista */}
                        <div className="mt-2 max-w-2xl">
                          <ParkMetricsCard 
                            park={park} 
                            summaryData={parksSummaryData?.[park.id]} 
                            isLoadingSummary={isSummaryLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mt-2">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="max-w-xs truncate">{park.address}</span>
                    </div>
                    {park.municipalityText && (
                      <div className="flex items-center">
                        <Map className="h-4 w-4 mr-1" />
                        <span className="font-medium text-emerald-700">{park.municipalityText}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-1" />
                      <span>
                        {park.area
                          ? `${(park.area / 10000).toLocaleString(undefined, {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })} ha`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {park.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{park.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/admin/parks/${park.id}/edit`);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    data-testid={`button-edit-park-list-${park.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/admin/parks/${park.id}/manage`);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    title="Gestión completa del parque"
                    className="text-blue-600 hover:text-blue-700"
                    data-testid={`button-manage-park-list-${park.id}`}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(park);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render grid view
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {currentParks.map((park: Park) => (
          <Card 
            key={park.id} 
            className="hover:shadow-lg hover:border-[#00444f] hover:bg-gray-50/30 transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none overflow-hidden"
            onClick={() => setLocation(`/admin/parks/${park.id}/view`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLocation(`/admin/parks/${park.id}/view`);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Ver detalles del parque ${park.name}`}
            data-testid={`card-park-grid-${park.id}`}
          >
            {/* Imagen del parque */}
            <div className="relative aspect-video overflow-hidden bg-gray-100">
              {park.primaryImageUrl ? (
                <img
                  src={park.primaryImageUrl}
                  alt={`Imagen de ${park.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
                  <div className="text-center text-gray-400">
                    <TreePine className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Sin imagen</p>
                  </div>
                </div>
              )}
              {selectionMode && (
                <div 
                  className="absolute top-2 left-2" 
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedParks.has(park.id)}
                    onCheckedChange={(checked) => handleSelectPark(park.id, checked as boolean)}
                    className="bg-white/90 border-white data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    data-testid={`checkbox-park-grid-${park.id}`}
                  />
                </div>
              )}
            </div>

            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="font-poppins font-bold text-gray-900 text-lg flex-1">{park.name}</CardTitle>
                    {isParkCertified(park) && (
                      <Badge 
                        variant="secondary" 
                        className="ml-2 bg-[#a8bd7d] text-white"
                      >
                        <Award className="h-3 w-3 mr-1" />
                        Certificado
                      </Badge>
                    )}
                  </div>
                  {/* Componente de métricas del parque */}
                  <ParkMetricsCard 
                    park={park} 
                    summaryData={parksSummaryData?.[park.id]} 
                    isLoadingSummary={isSummaryLoading}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center font-poppins text-sm text-gray-600">
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/admin/parks/${park.id}/edit`);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    data-testid={`button-edit-park-grid-${park.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/admin/parks/${park.id}/manage`);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    title="Gestión completa del parque"
                    className="text-blue-600 hover:text-blue-700"
                    data-testid={`button-manage-park-grid-${park.id}`}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(park);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Handle opening delete dialog
  const handleDeleteClick = async (park: Park) => {
    setParkToDelete(park);
    setShowDeleteDialog(true);
    await fetchParkDependencies(park.id);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!parkToDelete) return;
    deleteMutation.mutate(parkToDelete.id);
  };

  // Bulk selection handlers
  const handleSelectPark = (parkId: number, checked: boolean) => {
    const newSelected = new Set(selectedParks);
    if (checked) {
      newSelected.add(parkId);
    } else {
      newSelected.delete(parkId);
    }
    setSelectedParks(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allParkIds = new Set(currentParks.map(park => park.id));
      setSelectedParks(allParkIds);
    } else {
      setSelectedParks(new Set());
    }
  };

  const handleSelectAllParks = () => {
    const allParkIds = new Set(currentParks.map(park => park.id));
    setSelectedParks(allParkIds);
  };

  const handleDeselectAllParks = () => {
    setSelectedParks(new Set());
  };

  const handleBulkDeleteClick = async () => {
    if (selectedParks.size === 0) return;
    setShowBulkDeleteDialog(true);
    
    // Fetch dependencies for all selected parks
    setLoadingDependencies(true);
    const dependencies: {[key: number]: ParkDependencies} = {};
    
    for (const parkId of Array.from(selectedParks)) {
      try {
        const response = await fetch(`/api/parks/${parkId}/dependencies`);
        if (response.ok) {
          dependencies[parkId] = await response.json();
        }
      } catch (error) {
        console.error(`Error fetching dependencies for park ${parkId}:`, error);
      }
    }
    
    setBulkDeleteDependencies(dependencies);
    setLoadingDependencies(false);
  };

  const handleBulkDeleteConfirm = () => {
    const parkIds = Array.from(selectedParks);
    bulkDeleteMutation.mutate(parkIds);
  };

  // Check if all current page parks are selected
  const isAllSelected = currentParks.length > 0 && currentParks.every(park => selectedParks.has(park.id));
  const isIndeterminate = currentParks.some(park => selectedParks.has(park.id)) && !isAllSelected;

  // Handle manual refresh
  const handleRefresh = async () => {
    await refetchParks();
    toast({
      title: "Lista actualizada",
      description: "La lista de parques se ha actualizado correctamente.",
    });
  };

  const { t } = useTranslation('common');
  const { t: tParks } = useTranslation('parks');

  if (isLoadingParks) {
    return (
      <AdminLayout>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          </h1>
          <p className="text-gray-600 mt-2 mb-8"> </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">{t('messages.loading')}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isErrorParks) {
    return (
      <AdminLayout>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-8 h-8" />
            Parques
          </h1>
          <p className="text-gray-600 mt-2 mb-8">Gestión General del Sistema</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">{t('messages.error')}</p>
            <Button onClick={handleRefresh} className="mt-4">
              {t('actions.retry')}
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con título */}
        <PageHeader
          title="Parques"
          subtitle="Gestión General del Sistema"
          icon={<Trees className="h-6 w-6 text-white" />}
          actions={[
            <Button 
              variant="primary" 
              onClick={() => setLocation("/admin/parks/new")}
              data-testid="button-new-park"
            >
              <Plus className="w-4 h-4 mr-2 mr-2 stroke-[4]" />
              Nuevo
            </Button>,
            <Button 
              variant="outline" 
              onClick={() => setLocation("/admin/parks-import")}
              data-testid="button-import-parks"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>,
            <ExportButton
              className="bg-[#00444f] text-[#ffffff] hover:bg-[#00a587] hover:text-white"
              entity="parks"
            />,
          ]}
        />
                  
        {/* BARRA DE BÚSQUEDA Y CONTROLES */}
        <div 
          className="bg-white p-2 rounded-xl border"
          data-no-filters="true"
          id="search-section-no-filters"
        >
          <div className="space-y-0">
            <div className="flex items-center justify-between w-full px-2 py-2">
              <div className="relative flex-1 max-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-5 text-gray-600" />
                <input
                  type="text"
                  placeholder="Buscar parques..."
                  className="w-full font-poppins font-regular text-sm pl-10 pr-10 py-2 border border-gray-300 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={handleClearSearch} 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {/* 1. Botón para cambiar los modos de visualización del grid */}
                <div className="flex w-auto justify-end flex items-center space-x-1 bg-[#ededed] px-1 py-1 rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    data-testid="button-view-grid"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    data-testid="button-view-list"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* 2. Botón de selección con menú desplegable */}
                <div className="relative group">
                  <Button
                    variant={selectionMode ? 'default' : 'outline'}
                    size="sm"
                    className={`flex items-center h-11 w-11 ${selectionMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#ededed]'}`}
                    data-testid="button-selection-toggle"
                  >
                    <CopyCheck className="h-4 w-4 mr-1" />
                  </Button>

                  {/* Dropdown menu con CSS hover */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => setSelectionMode(true)}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                        data-testid="menu-enable-selection"
                      >
                        <CopyCheck className="h-4 w-4 mr-2" />
                        Selección múltiple
                      </button>
                      <button
                        onClick={() => {
                          if (!selectionMode) {
                            setSelectionMode(true);
                          }
                          handleSelectAllParks();
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                        data-testid="menu-select-all"
                      >
                        <CheckSquare className="h-5 w-5 mr-2" />
                        Seleccionar todo
                      </button>
                      <button
                        onClick={() => {
                          handleDeselectAllParks();
                          setSelectionMode(false);
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                        data-testid="menu-deselect-all"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Deseleccionar
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Botón para eliminar elementos independiente */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  className="flex items-center bg-[#ededed] text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={selectedParks.size === 0}
                  data-testid="button-delete-selected"
                >
                  <Trash2 className="h-4 w-4" />
                  {selectedParks.size > 0 ? ` (${selectedParks.size})` : ''}
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* ===== FIN SECCIÓN BÚSQUEDA SIN FILTROS ===== */}
        
        {/* Parks content */}
        {currentParks.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay parques</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery
                ? "No se encontraron parques que coincidan con la búsqueda."
                : "Comienza agregando un nuevo parque."}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
            {renderPagination()}
          </>
        )}
      </div>

      {/* Bulk Delete confirmation dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedParks.size} parque{selectedParks.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente los parques seleccionados y todos sus datos asociados.
              {loadingDependencies && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm">Analizando dependencias...</p>
                </div>
              )}
              {bulkDeleteDependencies && Object.keys(bulkDeleteDependencies).length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-md max-h-60 overflow-y-auto">
                  <h4 className="font-medium text-yellow-800 mb-2">Dependencias que serán eliminadas:</h4>
                  <div className="space-y-2 text-sm text-yellow-700">
                    {Object.entries(bulkDeleteDependencies).map(([parkId, deps]) => {
                      const park = parks.find(p => p.id.toString() === parkId);
                      const totalDeps = deps.total || 0;
                      return totalDeps > 0 ? (
                        <div key={parkId} className="border-l-2 border-yellow-300 pl-2">
                          <div className="font-medium">{park?.name || `Parque ${parkId}`} ({totalDeps} registros):</div>
                          <div className="ml-2 text-xs">
                            {deps.trees > 0 && <span className="mr-2">🌳 {deps.trees} árboles</span>}
                            {deps.activities > 0 && <span className="mr-2">🏃 {deps.activities} actividades</span>}
                            {deps.amenities > 0 && <span className="mr-2">🛠️ {deps.amenities} amenidades</span>}
                            {deps.assets > 0 && <span className="mr-2">📦 {deps.assets} activos</span>}
                            {deps.images > 0 && <span className="mr-2">📸 {deps.images} imágenes</span>}
                            {deps.documents > 0 && <span className="mr-2">📄 {deps.documents} documentos</span>}
                            {deps.evaluations > 0 && <span className="mr-2">⭐ {deps.evaluations} evaluaciones</span>}
                            {deps.incidents > 0 && <span className="mr-2">⚠️ {deps.incidents} incidencias</span>}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={bulkDeleteMutation.isPending || loadingDependencies}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar parque?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el parque "{parkToDelete?.name}" y todos sus datos asociados.
              {loadingDependencies && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Verificando dependencias...</p>
                </div>
              )}
              {parkDependencies && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                  <h4 className="font-medium text-yellow-800 mb-2">Datos que serán eliminados:</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    {parkDependencies.trees > 0 && <div>• {parkDependencies.trees} árboles</div>}
                    {parkDependencies.treeMaintenances > 0 && <div>• {parkDependencies.treeMaintenances} mantenimientos de árboles</div>}
                    {parkDependencies.activities > 0 && <div>• {parkDependencies.activities} actividades</div>}
                    {parkDependencies.incidents > 0 && <div>• {parkDependencies.incidents} incidentes</div>}
                    {parkDependencies.amenities > 0 && <div>• {parkDependencies.amenities} amenidades</div>}
                    {parkDependencies.images > 0 && <div>• {parkDependencies.images} imágenes</div>}
                    {parkDependencies.assets > 0 && <div>• {parkDependencies.assets} activos</div>}
                    {parkDependencies.volunteers > 0 && <div>• {parkDependencies.volunteers} asignaciones de voluntarios</div>}
                    {parkDependencies.instructors > 0 && <div>• {parkDependencies.instructors} asignaciones de instructores</div>}
                    {parkDependencies.evaluations > 0 && <div>• {parkDependencies.evaluations} evaluaciones</div>}
                    {parkDependencies.documents > 0 && <div>• {parkDependencies.documents} documentos</div>}
                    <div className="font-medium mt-2">Total: {parkDependencies.total} registros asociados</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending || loadingDependencies}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

// Main component with Suspense wrapper
const AdminParks = () => {
  return (
    <Suspense fallback={<AdminParksLoading />}>
      <AdminParksContent />
    </Suspense>
  );
};

export default AdminParks;