import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ClipboardList, Search, X, AlertTriangle, BarChart, Bookmark, Calendar, MapPin, User, Clock, Filter, ExternalLink, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function IncidentsNueva() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPark, setFilterPark] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Consulta para obtener todas las incidencias
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['/api/incidents'],
  });

  // Consulta para obtener todos los parques
  const { data: parks = [] } = useQuery({
    queryKey: ['/api/parks'],
  });

  // Consulta para obtener categorías
  const { data: categoriesRaw } = useQuery({
    queryKey: ['/api/incident-categories'],
  });

  const categories = categoriesRaw && Array.isArray(categoriesRaw) && categoriesRaw.length > 0 
    ? categoriesRaw 
    : [
        { id: 1, name: 'Daños', color: '#ef4444' },
        { id: 2, name: 'Seguridad', color: '#f97316' },
        { id: 3, name: 'Mantenimiento', color: '#3b82f6' },
        { id: 4, name: 'Limpieza', color: '#10b981' },
        { id: 5, name: 'Servicios', color: '#8b5cf6' }
      ];

  const handleNewIncident = () => {
    setLocation('/admin/incidents/new');
  };

  const handleManageCategories = () => {
    setLocation('/admin/incidents/categories');
  };

  const handleViewDashboard = () => {
    setLocation('/admin/incidents/dashboard');
  };

  // Filtrar incidencias
  const filteredIncidents = useMemo(() => {
    return (incidents as any[]).filter((incident: any) => {
      const matchesSearch = searchQuery === '' || 
        incident.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.reporterName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPark = filterPark === 'all' || incident.parkId?.toString() === filterPark;
      const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || incident.category === filterCategory;
      const matchesPriority = filterPriority === 'all' || incident.severity === filterPriority;
      
      return matchesSearch && matchesPark && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [incidents, searchQuery, filterPark, filterStatus, filterCategory, filterPriority]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterPark('all');
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterPriority('all');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para descargar plantilla CSV
  const downloadTemplate = () => {
    const headers = [
      // CAMPOS REQUERIDOS
      'titulo',
      'descripcion', 
      'parque_id',
      'categoria',
      'estado',
      
      // CAMPOS OPCIONALES
      'prioridad',
      'ubicacion',
      'reportero_nombre',
      'reportero_email',
      'reportero_telefono'
    ];
    
    // Agregar una fila de ejemplo
    const exampleRow = [
      'Ejemplo: Bancas dañadas',
      'Descripción detallada del problema encontrado',
      '1',
      'Daños',
      'pending',
      'normal',
      'Área de juegos infantiles',
      'Juan Pérez',
      'juan@email.com',
      '555-0123'
    ];
    
    const csvContent = headers.join(',') + '\n' + exampleRow.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_incidencias.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Plantilla descargada",
      description: "La plantilla CSV se ha descargado correctamente.",
    });
  };

  // Función para manejar importación CSV
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/incidents/import', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast({
          title: "Error de importación",
          description: result.error || "Error al procesar el archivo",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Importación exitosa",
        description: `Se importaron ${result.importedCount} incidencias correctamente.`,
      });
      
      // Recargar datos
      window.location.reload();
      
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Error de importación",
        description: "Hubo un error al procesar el archivo CSV.",
        variant: "destructive",
      });
    }
    
    event.target.value = ''; // Reset input
  };

  const renderIncidentRow = (incident: any) => (
    <tr key={incident.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        #{incident.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{incident.title}</div>
        <div className="text-sm text-gray-500 truncate max-w-xs">{incident.description}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{incident.parkName || 'Sin parque'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge className={`${getSeverityColor(incident.severity)} border-0`}>
          {incident.severity || 'No definida'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge className={`${getStatusColor(incident.status)} border-0`}>
          {incident.status === 'pending' ? 'Pendiente' :
           incident.status === 'in_progress' ? 'En Proceso' :
           incident.status === 'resolved' ? 'Resuelta' :
           incident.status === 'closed' ? 'Cerrada' : 'Estado desconocido'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {incident.reporterName || 'Anónimo'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {incident.createdAt ? format(new Date(incident.createdAt), 'dd/MM/yyyy', { locale: es }) : 'Fecha no disponible'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/admin/incidents/${incident.id}`)}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <Card className="p-4 bg-gray-50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-8 h-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Incidencias</h1>
              </div>
              <p className="text-gray-600 mt-2">
                Reportes y seguimiento de incidencias en parques y activos
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="default" 
                onClick={handleViewDashboard}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <BarChart className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleManageCategories}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Categorías
              </Button>
              
              <Button 
                onClick={handleNewIncident}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Incidencia
              </Button>
            </div>
          </div>
        </Card>

        {/* Sección Formulario */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Formulario</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Herramientas para crear y gestionar incidencias. Puedes crear incidencias individuales o importar múltiples mediante CSV.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleNewIncident}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Incidencia
              </button>
              
              <button 
                onClick={handleManageCategories}
                className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-md border border-gray-300 transition-colors"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Gestionar Categorías
              </button>
            </div>
            
            {/* Sección de importación CSV */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Importación CSV</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Plantilla CSV
                </button>
                
                <label className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                <FileSpreadsheet className="h-4 w-4 inline mr-1" />
                Descarga la plantilla, complétala con tus datos y súbela para importar múltiples incidencias.
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar incidencias..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
                
                {(filterPark !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || filterPriority !== 'all') && (
                  <Button variant="ghost" onClick={clearFilters}>
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <Select value={filterPark} onValueChange={setFilterPark}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los parques" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los parques</SelectItem>
                    {(parks as any[]).map((park: any) => (
                      <SelectItem key={park.id} value={park.id.toString()}>
                        {park.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En Proceso</SelectItem>
                    <SelectItem value="resolved">Resuelta</SelectItem>
                    <SelectItem value="closed">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Lista de incidencias */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Cargando incidencias...</p>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <ClipboardList className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No hay incidencias</h3>
                <p className="text-gray-500 mb-4">No se encontraron incidencias con los filtros aplicados.</p>
                <Button onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parque
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prioridad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reportero
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredIncidents.map(renderIncidentRow)}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}