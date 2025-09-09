import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  X, 
  Loader,
  ArrowUpDown,
  MapPin,
  User,
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
  ClipboardList
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Incident, Park } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Componente para importar CSV
const ImportCSVDialog = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Debes seleccionar un archivo CSV",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/incidents/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult(result);
        toast({
          title: "Importación exitosa",
          description: `${result.imported} incidencias importadas correctamente`,
        });
        onImportSuccess();
      } else {
        throw new Error(result.error || 'Error en la importación');
      }
    } catch (error) {
      console.error('Error en importación:', error);
      toast({
        title: "Error de importación",
        description: error.message || "Error al importar el archivo",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    // BOM (Byte Order Mark) para UTF-8 para asegurar compatibilidad con Excel
    const BOM = '\uFEFF';
    const csvContent = 'titulo,descripcion,parque_id,categoria,estado,prioridad,ubicacion,reportero_nombre,reportero_email,reportero_telefono\n"Ejemplo de incidencia","Descripción detallada del problema","5","Mantenimiento","pending","normal","Plaza Principal","Juan Perez","juan@example.com","555-1234"';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_incidencias.csv';
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Incidencias desde CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Archivo CSV</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Formato requerido:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• titulo: Título de la incidencia (requerido)</li>
              <li>• descripcion: Descripción detallada (requerido)</li>
              <li>• parque_id: ID del parque (requerido)</li>
              <li>• categoria: Categoría de la incidencia</li>
              <li>• estado: pending, assigned, in_progress, resolved, closed</li>
              <li>• prioridad: low, normal, high, urgent</li>
              <li>• ubicacion: Ubicación específica dentro del parque</li>
              <li>• reportero_nombre: Nombre del reportero</li>
              <li>• reportero_email: Email del reportero</li>
              <li>• reportero_telefono: Teléfono del reportero</li>
            </ul>
          </div>

          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar plantilla CSV
          </Button>

          {importResult && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Resultado de la importación:</h4>
              <p className="text-sm text-green-700">
                ✅ {importResult.imported} incidencias importadas exitosamente
              </p>
              {importResult.errors > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-700">
                    ❌ {importResult.errors} errores encontrados
                  </p>
                  {importResult.errorDetails && (
                    <ul className="text-xs text-red-600 mt-1 space-y-1">
                      {importResult.errorDetails.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cerrar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isImporting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Componente principal de incidencias
const IncidentsPage = () => {
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [parkFilter, setParkFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const itemsPerPage = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consultas de datos
  const { data: incidents = [], isLoading, error } = useQuery({
    queryKey: ['/api/incidents'],
    refetchOnWindowFocus: false,
    suspense: false,
    retry: 1
  });

  const { data: apiParks } = useQuery({
    queryKey: ['/api/parks'],
    refetchOnWindowFocus: false,
    suspense: false,
    retry: 1
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/incident-categories'],
    refetchOnWindowFocus: false,
    suspense: false,
    retry: 1
  });

  const parks = Array.isArray(apiParks?.data) ? apiParks.data : (Array.isArray(apiParks) ? apiParks : []);

  // Funciones auxiliares
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category, categories) => {
    console.log('🔍 getCategoryLabel llamada con:', category, 'categories:', categories);
    
    if (!category) return 'Sin categoría';
    
    // Si category es un string que comienza con "category_", convertir a número
    if (typeof category === 'string' && category.startsWith('category_')) {
      const categoryId = parseInt(category.replace('category_', ''));
      console.log('🔄 Convertido de', category, 'a', categoryId);
      
      const foundCategory = categories.find(cat => cat.id === categoryId);
      console.log('🎯 Categoría encontrada:', foundCategory);
      return foundCategory ? foundCategory.name : category;
    }
    
    // Si category es un número, buscar por id
    if (typeof category === 'number') {
      const foundCategory = categories.find(cat => cat.id === category);
      return foundCategory ? foundCategory.name : `Categoría ${category}`;
    }
    
    return category;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      assigned: 'Asignado',
      in_progress: 'En progreso',
      resolved: 'Resuelto',
      closed: 'Cerrado',
      rejected: 'Rechazado'
    };
    return labels[status] || status;
  };

  const getSeverityLabel = (severity) => {
    const labels = {
      low: 'Baja',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[severity] || severity;
  };

  // Filtrar incidencias
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          incident.parkName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          incident.reporterName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    const matchesPark = parkFilter === 'all' || incident.parkId?.toString() === parkFilter;
    const matchesCategory = categoryFilter === 'all' || incident.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesSeverity && matchesPark && matchesCategory;
  });

  // Calcular paginación
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIncidents = filteredIncidents.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, severityFilter, parkFilter, categoryFilter]);

  // Funciones para exportar e importar
  const exportToCSV = () => {
    const csvHeaders = ['ID', 'Título', 'Descripción', 'Parque', 'Categoría', 'Estado', 'Prioridad', 'Ubicación', 'Reportero', 'Email', 'Teléfono', 'Fecha Creación'];
    
    const csvData = filteredIncidents.map(incident => [
      incident.id,
      incident.title,
      incident.description,
      incident.parkName,
      getCategoryLabel(incident.category, categories),
      getStatusLabel(incident.status),
      getSeverityLabel(incident.severity),
      incident.location || '',
      incident.reporterName || '',
      incident.reporterEmail || '',
      incident.reporterPhone || '',
      format(new Date(incident.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `incidencias_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleImportSuccess = () => {
    queryClient.invalidateQueries(['/api/incidents']);
    setShowImportDialog(false);
  };

  const handleViewDetails = (incident) => {
    setSelectedIncident(incident);
    setShowDetailsDialog(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">Error al cargar las incidencias</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header con patrón Card estandarizado */}
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
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Buscar incidencias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="assigned">Asignado</SelectItem>
                    <SelectItem value="in_progress">En progreso</SelectItem>
                    <SelectItem value="resolved">Resuelto</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioridad</Label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Parque</Label>
                <Select value={parkFilter} onValueChange={setParkFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los parques" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los parques</SelectItem>
                    {parks.map(park => (
                      <SelectItem key={park.id} value={park.id.toString()}>
                        {park.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoría</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSeverityFilter('all');
                    setParkFilter('all');
                    setCategoryFilter('all');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de incidencias */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Parque</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Reportero</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium">{incident.id}</TableCell>
                      <TableCell>
                        <div className="max-w-48 truncate" title={incident.title}>
                          {incident.title}
                        </div>
                      </TableCell>
                      <TableCell>{incident.parkName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryLabel(incident.category, categories)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(incident.status)}>
                          {getStatusLabel(incident.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {getSeverityLabel(incident.severity)}
                        </Badge>
                      </TableCell>
                      <TableCell>{incident.reporterName || 'N/A'}</TableCell>
                      <TableCell>
                        {format(new Date(incident.createdAt), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleViewDetails(incident)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredIncidents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron incidencias con los filtros aplicados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginación */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredIncidents.length)} de {filteredIncidents.length} incidencias
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className={currentPage === page ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo de importación CSV */}
      <ImportCSVDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Diálogo de detalles */}
      {selectedIncident && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Incidencia #{selectedIncident.id}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Título</Label>
                  <p className="text-sm text-gray-600">{selectedIncident.title}</p>
                </div>
                <div>
                  <Label className="font-semibold">Parque</Label>
                  <p className="text-sm text-gray-600">{selectedIncident.parkName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Categoría</Label>
                  <Badge variant="outline">
                    {getCategoryLabel(selectedIncident.category, categories)}
                  </Badge>
                </div>
                <div>
                  <Label className="font-semibold">Estado</Label>
                  <Badge className={getStatusColor(selectedIncident.status)}>
                    {getStatusLabel(selectedIncident.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="font-semibold">Prioridad</Label>
                  <Badge className={getSeverityColor(selectedIncident.severity)}>
                    {getSeverityLabel(selectedIncident.severity)}
                  </Badge>
                </div>
                <div>
                  <Label className="font-semibold">Ubicación</Label>
                  <p className="text-sm text-gray-600">{selectedIncident.location || 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Descripción</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedIncident.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Reportero</Label>
                  <p className="text-sm text-gray-600">{selectedIncident.reporterName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Email</Label>
                  <p className="text-sm text-gray-600">{selectedIncident.reporterEmail || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Fecha de creación</Label>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedIncident.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Última actualización</Label>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedIncident.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowDetailsDialog(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
};

export default IncidentsPage;