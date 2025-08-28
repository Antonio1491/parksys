import React, { useState, useEffect, startTransition, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// NOTA CRÍTICA: NO IMPORTAR Select, SelectContent, SelectItem, SelectTrigger, SelectValue
// El usuario específicamente NO quiere filtros en esta página

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, FileUp, Trash2, Eye, Edit, X, MapPin, Package, AlertTriangle, TreePine, Activity, FileText, UserCheck, Wrench, Grid, List, ChevronLeft, ChevronRight, Award } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { apiRequest } from "@/lib/queryClient";

interface Park {
  id: number;
  name: string;
  description?: string;
  address: string;
  area: number;
  parkType: string;
  municipalityId: number;
  municipality?: { name: string };
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
  
  // Pagination and view states
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 9;

  // Helper function to check if park is certified
  const isParkCertified = (park: Park) => {
    return park.certificaciones && park.certificaciones.trim() !== '';
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
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="max-w-xs truncate">{park.address}</span>
                      </div>
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
                      <Badge
                        variant="outline"
                        className={`border ${getTypologyColor(park.typology?.code)}`}
                      >
                        {getTypologyLabel(park.typology?.name)}
                      </Badge>
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
                <Badge
                  variant="outline"
                  className={`border ${getTypologyColor(park.typology?.code)}`}
                >
                  {getTypologyLabel(park.typology?.name)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="truncate">{park.address}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-2" />
                  <span>{park.area ? park.area.toLocaleString() : 'N/A'} m²</span>
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
        <Card className="p-4 text-[#0c0a09] bg-[#14b8a6] text-card-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Parques</h1>
          </div>
          <p className="text-gray-600 mt-2">Gestión General del Sistema</p>
        </Card>
        
        {/* View mode toggle and actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filteredParks.length} parques encontrados
          </div>
          <div className="flex items-center space-x-2">
            {/* View toggle buttons first */}
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              <Grid className="h-4 w-4 mr-2" />
              Fichas
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
            
            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            
            {/* Action buttons */}

            <Button variant="outline" size="sm" onClick={() => window.location.href = "/admin/parks-import"}>
              <FileUp className="h-4 w-4 mr-2" />
              Importar Parques
            </Button>
            <Button size="sm" onClick={() => window.location.href = "/admin/parks/new"}>
              <Plus className="h-4 w-4 mr-2" />
              {tParks('newPark')}
            </Button>
          </div>
        </div>
        
        {/* ===== ATENCIÓN: USUARIO ESPECÍFICAMENTE PIDIÓ SIN FILTROS ===== */}
        {/* ===== SOLO BARRA DE BÚSQUEDA - NO AGREGAR SELECT O FILTROS ===== */}
        <div 
          className="bg-white p-6 rounded-lg border shadow-sm"
          data-no-filters="true"
          id="search-section-no-filters"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Buscar Parques</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar parques por nombre o dirección..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              <div className="text-sm text-gray-500 font-medium">
                {filteredParks.length} parque{filteredParks.length !== 1 ? 's' : ''} encontrado{filteredParks.length !== 1 ? 's' : ''}
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