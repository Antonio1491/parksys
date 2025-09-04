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
import { Search, Plus, FileUp, Trash2, Eye, Edit, X, MapPin, Package, AlertTriangle, TreePine, Activity, FileText, UserCheck, Wrench, Grid, List, ChevronLeft, ChevronRight, Award, Map, Upload, Trash, CheckSquare, Square } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { apiRequest } from "@/lib/queryClient";
import { ExportButton } from "@/components/ui/export-button";

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
  const [location] = useLocation();
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
  const itemsPerPage = 9;

  // Helper function to check if park is certified
  const isParkCertified = (park: Park) => {
    return park.certificaciones && park.certificaciones.trim() !== '' && park.certificaciones !== 'Ninguna';
  };

  // Fetch all parks with auto-refresh configuration
  const { 
    data: parks = [], 
    isLoading: isLoadingParks,
    isError: isErrorParks,
    refetch: refetchParks
  } = useQuery<Park[]>({
    queryKey: ['/api/parks'],
    refetchOnWindowFocus: true,    // ✅ Actualizar al volver a la ventana
    refetchInterval: 30000,        // ✅ Actualizar cada 30 segundos automáticamente
    staleTime: 10000,              // ✅ Datos frescos por 10 segundos
    retry: 1,

  });



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
    return (parks as Park[]).filter(park => {
      // Apply search criteria only
      const matchesSearch = searchQuery === '' || 
        park.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        park.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [parks, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredParks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParks = filteredParks.slice(startIndex, endIndex);

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
          <Card key={park.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <Checkbox
                    checked={selectedParks.has(park.id)}
                    onCheckedChange={(checked) => handleSelectPark(park.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{park.name}</h3>
                      {isParkCertified(park) && (
                        <Badge 
                          variant="secondary" 
                          className="mt-1 bg-green-100 text-green-800 border-green-200"
                        >
                          <Award className="h-3 w-3 mr-1" />
                          Certificado
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
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
                  </div>
                  {park.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{park.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/admin/parks/${park.id}/view`}
                    title="Ver detalles del parque"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/admin/parks/${park.id}/edit`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/admin/parks/${park.id}/manage`}
                    title="Gestión completa del parque"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(park)}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentParks.map((park: Park) => (
          <Card key={park.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-2 flex-1">
                  <Checkbox
                    checked={selectedParks.has(park.id)}
                    onCheckedChange={(checked) => handleSelectPark(park.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{park.name}</CardTitle>
                    {isParkCertified(park) && (
                      <Badge 
                        variant="secondary" 
                        className="mt-2 bg-green-100 text-green-800 border-green-200"
                      >
                        <Award className="h-3 w-3 mr-1" />
                        Certificado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="truncate">{park.address}</span>
                </div>
                
                {park.municipalityText && (
                  <div className="flex items-center text-sm text-emerald-700 font-medium">
                    <Map className="h-4 w-4 mr-2" />
                    <span>{park.municipalityText}</span>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-2" />
                  <span>
                    {park.area
                      ? `${(park.area / 10000).toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })} ha`
                      : 'N/A'}
                  </span>
                </div>
                
                {park.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {park.description}
                  </p>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/admin/parks/${park.id}/view`}
                    title="Ver detalles del parque"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/admin/parks/${park.id}/edit`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/admin/parks/${park.id}/manage`}
                    title="Gestión completa del parque"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(park)}
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
            <MapPin className="w-8 h-8" />
            Parques
          </h1>
          <p className="text-gray-600 mt-2 mb-8">Gestión General del Sistema</p>
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
          icon={<Map className="h-6 w-6 text-white" />}
          actions={[
            <ExportButton
              entity="parks"
            />,
            <Button variant="outline" onClick={() => window.location.href = "/admin/parks-import"}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>,
            <Button variant="primary" onClick={() => window.location.href = "/admin/parks/new"}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Parque
            </Button>,
          ]}
        />
                  
        {/* BARRA DE BÚSQUEDA Y CONTROLES */}
        <div 
          className="bg-white p-2 rounded-xl border shadow-sm"
          data-no-filters="true"
          id="search-section-no-filters"
        >
          <div className="space-y-0">
            <div className="flex items-center justify-between w-full px-2 py-2">
              <div className="relative flex-1 max-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar parques..."
                  className="w-full font-poppins font-medium text-sm pl-10 pr-10 py-2 border border-gray-300 rounded-lg"
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
              
              {/* Bulk Actions */}
              {selectedParks.size > 0 && (
                <div className="flex items-center space-x-2 mr-4">
                  <span className="text-sm text-gray-600">
                    {selectedParks.size} seleccionado{selectedParks.size > 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDeleteClick}
                    disabled={bulkDeleteMutation.isPending}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              )}
              
              <div className="flex w-auto justify-end flex items-center space-x-1 bg-[#e3eaee] px-1 py-1 rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
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
            
            {/* Select All Checkbox */}
            {currentParks.length > 0 && (
              <div className="flex items-center px-2 py-2 border-t">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">
                  Seleccionar todos en esta página ({currentParks.length})
                </span>
              </div>
            )}
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