import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Eye, Users, MapPin, Calendar, Award, Clock, Download, Upload, ChevronLeft, ChevronRight, FileText, Filter, Trash2 } from "lucide-react";

interface Volunteer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  joinDate: string;
  totalHours: number;
  preferredParkId: number | null;
  skills: string;
  isActive: boolean;
  parkName?: string;
  profileImageUrl?: string;
  full_name?: string;
  age?: number;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  previous_experience?: string;
  interest_areas?: string[];
  available_hours?: string;
  created_at?: string;
}

export default function VolunteersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [parkFilter, setParkFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Estados para importación CSV
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const itemsPerPage = 10;

  // Obtener voluntarios
  const { data: volunteersResponse, isLoading } = useQuery({
    queryKey: ['/api/volunteers'],
    suspense: false,
    retry: 1,
  });

  // Manejar formato de respuesta variable (array directo o {data: array})
  const volunteers = Array.isArray(volunteersResponse) 
    ? volunteersResponse 
    : (volunteersResponse?.data || []);

  // Obtener parques para referencia
  const { data: parksResponse } = useQuery({
    queryKey: ['/api/parks'],
    suspense: false,
    retry: 1,
  });
  
  const parks = parksResponse?.data || [];

  // Mutación para eliminar voluntario
  const deleteVolunteerMutation = useMutation({
    mutationFn: async (volunteerId: number) => {
      await apiRequest(`/api/volunteers/${volunteerId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/volunteers'] });
      toast({
        title: "Voluntario eliminado",
        description: "El voluntario ha sido desactivado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error al eliminar voluntario:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el voluntario",
        variant: "destructive"
      });
    }
  });

  // Filtrar voluntarios con filtros extendidos
  const filteredVolunteers = volunteers.filter((volunteer: any) => {
    const matchesSearch = 
      (volunteer.firstName?.toLowerCase() || volunteer.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (volunteer.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (volunteer.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || volunteer.status === statusFilter;
    
    const matchesPark = parkFilter === "all" || volunteer.preferred_park_id?.toString() === parkFilter;
    
    const matchesAge = ageFilter === "all" || (() => {
      const age = volunteer.age || 0;
      switch(ageFilter) {
        case "18-25": return age >= 18 && age <= 25;
        case "26-35": return age >= 26 && age <= 35;
        case "36-45": return age >= 36 && age <= 45;
        case "46+": return age >= 46;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesPark && matchesAge;
  });

  // Paginación
  const totalPages = Math.ceil(filteredVolunteers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVolunteers = filteredVolunteers.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  const resetPage = () => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  };

  // Funciones de exportar/importar CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Nombre Completo', 'Email', 'Teléfono', 'Edad', 'Estado', 'Habilidades', 'Experiencia', 'Parque Preferido', 'Fecha Ingreso'];
    
    const csvData = filteredVolunteers.map((volunteer: any) => [
      volunteer.id,
      volunteer.full_name || `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim(),
      volunteer.email,
      volunteer.phone || '',
      volunteer.age || '',
      volunteer.status || 'active',
      volunteer.skills || '',
      volunteer.previous_experience || '',
      volunteer.preferred_park_id || '',
      new Date(volunteer.created_at || volunteer.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `voluntarios_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Exportación exitosa",
      description: `Se exportaron ${filteredVolunteers.length} voluntarios a CSV`,
    });
  };

  // Descargar plantilla CSV para voluntarios
  const downloadTemplate = () => {
    try {
      // Crear plantilla con todos los campos del formulario de voluntarios
      const templateData = [
        {
          'fullName': 'Juan Pérez García',
          'email': 'juan.perez@email.com', 
          'phone': '5551234567',
          'age': '25',
          'gender': 'masculino',
          'address': 'Av. Principal 123, Col. Centro',
          'emergencyContactName': 'María García',
          'emergencyContactPhone': '5559876543',
          'emergencyContactRelation': 'madre',
          'preferredParkId': '1',
          'previousExperience': 'Experiencia en reforestación y actividades comunitarias',
          'availableDays': 'lunes,miércoles,viernes',
          'availableHours': 'mañana',
          'interestAreas': 'reforestación,educación ambiental',
          'skills': 'Comunicación, trabajo en equipo, jardinería',
          'legalConsent': 'true',
          'status': 'active'
        },
        {
          'fullName': 'Ana López Martínez',
          'email': 'ana.lopez@email.com',
          'phone': '5555678901',
          'age': '32',
          'gender': 'femenino', 
          'address': 'Calle Flores 456, Col. Jardines',
          'emergencyContactName': 'Carlos López',
          'emergencyContactPhone': '5554321098',
          'emergencyContactRelation': 'esposo',
          'preferredParkId': '2',
          'previousExperience': 'Voluntariado en refugio de animales',
          'availableDays': 'sábado,domingo',
          'availableHours': 'tarde',
          'interestAreas': 'cuidado animal,limpieza',
          'skills': 'Paciencia, organización, primeros auxilios',
          'legalConsent': 'true',
          'status': 'active'
        }
      ];

      // Convertir a CSV con BOM para UTF-8
      const headers = Object.keys(templateData[0]);
      const csvRows = [
        headers.join(','),
        ...templateData.map(row => 
          headers.map(header => `"${(row as any)[header] || ''}"`).join(',')
        )
      ];

      const csvContent = csvRows.join('\n');
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'plantilla_voluntarios.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Plantilla descargada",
        description: "La plantilla CSV se ha descargado correctamente.",
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al descargar la plantilla.",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsImportDialogOpen(true);
    }
    // Reset input
    event.target.value = '';
  };

  const handleImportCSV = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('El archivo debe contener al menos una fila de datos además del encabezado');
      }

      // Parser CSV que maneja comillas correctamente
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      console.log('Headers detectados:', headers);

      const volunteers = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        const volunteer: any = {};

        headers.forEach((header, i) => {
          const value = values[i] || '';
          
          // Mapear campos según el esquema
          switch (header.toLowerCase()) {
            case 'fullname':
            case 'full_name':
            case 'nombre_completo':
              volunteer.fullName = value;
              break;
            case 'email':
            case 'correo':
              volunteer.email = value;
              break;
            case 'phone':
            case 'telefono':
            case 'teléfono':
              volunteer.phone = value;
              break;
            case 'age':
            case 'edad':
              volunteer.age = value ? parseInt(value) : null;
              break;
            case 'gender':
            case 'genero':
            case 'género':
              volunteer.gender = value;
              break;
            case 'address':
            case 'direccion':
            case 'dirección':
              volunteer.address = value;
              break;
            case 'emergencycontactname':
            case 'emergency_contact_name':
            case 'contacto_emergencia':
              volunteer.emergencyContactName = value;
              break;
            case 'emergencycontactphone':
            case 'emergency_contact_phone':
            case 'telefono_emergencia':
              volunteer.emergencyContactPhone = value;
              break;
            case 'emergencycontactrelation':
            case 'emergency_contact_relation':
            case 'relacion_emergencia':
              volunteer.emergencyContactRelation = value;
              break;
            case 'preferredparkid':
            case 'preferred_park_id':
            case 'parque_preferido':
              volunteer.preferredParkId = value ? parseInt(value) : null;
              break;
            case 'previousexperience':
            case 'previous_experience':
            case 'experiencia_previa':
              volunteer.previousExperience = value;
              break;
            case 'availabledays':
            case 'available_days':
            case 'dias_disponibles':
              volunteer.availableDays = value ? value.split(',').map(d => d.trim()) : [];
              break;
            case 'availablehours':
            case 'available_hours':
            case 'horas_disponibles':
              volunteer.availableHours = value;
              break;
            case 'interestareas':
            case 'interest_areas':
            case 'areas_interes':
              volunteer.interestAreas = value ? value.split(',').map(a => a.trim()) : [];
              break;
            case 'skills':
            case 'habilidades':
              volunteer.skills = value;
              break;
            case 'legalconsent':
            case 'legal_consent':
            case 'consentimiento_legal':
              volunteer.legalConsent = value.toLowerCase() === 'true' || value.toLowerCase() === 'sí' || value === '1';
              break;
            case 'status':
            case 'estado':
              volunteer.status = value || 'active';
              break;
          }
        });

        return volunteer;
      });

      console.log('Voluntarios procesados:', volunteers);

      const response = await apiRequest('/api/volunteers/import', {
        method: 'POST',
        data: { volunteers },
      });

      if (response.success) {
        toast({
          title: "Importación exitosa",
          description: `Se importaron ${response.imported} voluntarios de ${response.processed} registros`,
        });
        
        // Invalidar cache para actualizar la lista
        queryClient.invalidateQueries({ queryKey: ['/api/volunteers'] });
        
        setIsImportDialogOpen(false);
        setSelectedFile(null);
      } else {
        throw new Error(response.error || 'Error en la importación');
      }

    } catch (error) {
      console.error('Error importing volunteers:', error);
      toast({
        title: "Error en la importación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleViewDetails = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setIsDetailOpen(true);
  };

  const handleNewVolunteer = () => {
    navigate('/admin/volunteers/register');
  };

  const handleEditVolunteer = (volunteerId: number) => {
    navigate(`/admin/volunteers/edit/${volunteerId}`);
  };

  const handleDeleteVolunteer = async (volunteer: Volunteer) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar al voluntario "${volunteer.full_name || `${volunteer.firstName} ${volunteer.lastName}`}"?\n\nEsta acción cambiará su estado a "inactivo".`
    );
    
    if (confirmDelete) {
      deleteVolunteerMutation.mutate(volunteer.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo':
      case 'active': 
        return 'bg-green-100 text-green-800';
      case 'inactivo':
      case 'inactive': 
        return 'bg-red-100 text-red-800';
      case 'suspendido':
      case 'suspended': 
        return 'bg-yellow-100 text-yellow-800';
      default: 
        return 'bg-green-100 text-green-800'; // Default to active
    }
  };

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        {/* Header con título */}
        <Card className="p-4 bg-gray-50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-8 h-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Voluntarios</h1>
              </div>
              <p className="text-gray-600 mt-2">Administra los voluntarios registrados en el sistema</p>
            </div>
            <div>
              <Button onClick={handleNewVolunteer}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Voluntario
              </Button>
            </div>
          </div>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Voluntarios</p>
                  <p className="text-2xl font-bold">{volunteers.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold">
                    {volunteers.filter((v: any) => v.status === 'activo').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Horas Totales</p>
                  <p className="text-2xl font-bold">
                    {volunteers.reduce((sum: number, v: any) => sum + (v.totalHours || v.total_hours || 0), 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Nuevos este mes</p>
                  <p className="text-2xl font-bold">
                    {volunteers.filter((v: any) => {
                      const joinDate = new Date(v.joinDate || v.join_date || v.createdAt);
                      const now = new Date();
                      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
                    }).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros extendidos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={parkFilter} onValueChange={setParkFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Parque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los parques</SelectItem>
                  {parks && parks.map((park: any) => (
                    <SelectItem key={park.id} value={park.id.toString()}>
                      {park.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Edad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las edades</SelectItem>
                  <SelectItem value="18-25">18-25 años</SelectItem>
                  <SelectItem value="26-35">26-35 años</SelectItem>
                  <SelectItem value="36-45">36-45 años</SelectItem>
                  <SelectItem value="46+">46+ años</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Botones de exportar/importar */}
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={exportToCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <Button 
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
              >
                <FileText className="h-4 w-4" />
                Descargar Plantilla CSV
              </Button>
              <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Importar CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de voluntarios */}
        <Card>
          <CardHeader>
            <CardTitle>Voluntarios Registrados</CardTitle>
            <CardDescription>
              Lista completa de voluntarios con información básica
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>Cargando voluntarios...</p>
              </div>
            ) : filteredVolunteers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron voluntarios</p>
              </div>
            ) : (
              <>
                {/* Información de paginación */}
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-500">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredVolunteers.length)} de {filteredVolunteers.length} voluntarios
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    
                    {/* Números de página */}
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={currentPage === page ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
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

                {/* Lista de voluntarios paginados */}
                <div className="space-y-4">
                  {paginatedVolunteers.map((volunteer: any) => (
                  <div key={volunteer.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    {/* Fotografía del voluntario */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                        {volunteer.profileImageUrl || volunteer.profile_image_url ? (
                          <img 
                            src={volunteer.profileImageUrl || volunteer.profile_image_url} 
                            alt={volunteer.full_name || `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim()}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-8 w-8 text-green-600" />
                        )}
                      </div>
                    </div>
                    
                    {/* Información principal */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {volunteer.full_name || `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim()}
                          </h3>
                          <p className="text-gray-600 mb-1">{volunteer.email}</p>
                          
                          {/* Información adicional en dos columnas */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Desde: {new Date(volunteer.joinDate || volunteer.join_date || volunteer.created_at || new Date()).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{volunteer.totalHours || volunteer.total_hours || 0} horas</span>
                            </div>
                            
                            {volunteer.phone && (
                              <div className="flex items-center gap-1">
                                <span>📞 {volunteer.phone}</span>
                              </div>
                            )}
                            
                            {volunteer.age && (
                              <div className="flex items-center gap-1">
                                <span>👤 {volunteer.age} años</span>
                              </div>
                            )}
                            
                            {volunteer.preferred_park_id && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>Parque preferido</span>
                              </div>
                            )}
                            
                            {volunteer.available_hours && (
                              <div className="flex items-center gap-1">
                                <span>⏰ {volunteer.available_hours}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Habilidades y experiencia */}
                          {(volunteer.skills || volunteer.previous_experience) && (
                            <div className="mt-3 space-y-1">
                              {volunteer.skills && (
                                <p className="text-sm text-gray-600">
                                  <strong>Habilidades:</strong> {volunteer.skills}
                                </p>
                              )}
                              {volunteer.previous_experience && (
                                <p className="text-sm text-gray-600">
                                  <strong>Experiencia:</strong> {volunteer.previous_experience}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Áreas de interés */}
                          {volunteer.interest_areas && volunteer.interest_areas.length > 0 && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {volunteer.interest_areas.map((area: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {area}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Estado y acciones */}
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge className={getStatusColor(volunteer.status || 'active')}>
                            {volunteer.status === 'active' ? 'activo' : volunteer.status || 'activo'}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(volunteer)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditVolunteer(volunteer.id)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVolunteer(volunteer)}
                              disabled={deleteVolunteerMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {deleteVolunteerMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialog de detalles */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Perfil del Voluntario
              </DialogTitle>
              <DialogDescription>
                Información completa y detallada del voluntario seleccionado
              </DialogDescription>
            </DialogHeader>
            {selectedVolunteer && (
              <div className="grid gap-6 py-4">
                {/* Sección de encabezado con foto y datos principales */}
                <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  {/* Fotografía del voluntario */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                      {(selectedVolunteer as any).profileImageUrl || (selectedVolunteer as any).profile_image_url ? (
                        <img 
                          src={(selectedVolunteer as any).profileImageUrl || (selectedVolunteer as any).profile_image_url} 
                          alt={(selectedVolunteer as any).full_name || `${selectedVolunteer.firstName || ''} ${selectedVolunteer.lastName || ''}`.trim()}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-12 w-12 text-green-600" />
                      )}
                    </div>
                  </div>
                  
                  {/* Información principal */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {(selectedVolunteer as any).full_name || `${selectedVolunteer.firstName || ''} ${selectedVolunteer.lastName || ''}`.trim()}
                    </h3>
                    <div className="flex items-center gap-4 mb-3">
                      <Badge className={getStatusColor((selectedVolunteer as any).status || 'active')} size="lg">
                        {(selectedVolunteer as any).status === 'active' ? 'ACTIVO' : ((selectedVolunteer as any).status || 'ACTIVO').toUpperCase()}
                      </Badge>
                      {(selectedVolunteer as any).age && (
                        <span className="text-lg text-gray-600">{(selectedVolunteer as any).age} años</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Miembro desde: {new Date((selectedVolunteer as any).joinDate || (selectedVolunteer as any).join_date || (selectedVolunteer as any).created_at || new Date()).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{(selectedVolunteer as any).totalHours || (selectedVolunteer as any).total_hours || 0} horas de servicio</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información de Contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-semibold text-gray-700">Email:</p>
                        <p className="text-blue-600">{selectedVolunteer.email}</p>
                      </div>
                      {(selectedVolunteer as any).phone && (
                        <div>
                          <p className="font-semibold text-gray-700">Teléfono:</p>
                          <p>{(selectedVolunteer as any).phone}</p>
                        </div>
                      )}
                      {(selectedVolunteer as any).address && (
                        <div>
                          <p className="font-semibold text-gray-700">Dirección:</p>
                          <p>{(selectedVolunteer as any).address}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contacto de Emergencia</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(selectedVolunteer as any).emergency_contact && (
                        <div>
                          <p className="font-semibold text-gray-700">Nombre:</p>
                          <p>{(selectedVolunteer as any).emergency_contact}</p>
                        </div>
                      )}
                      {(selectedVolunteer as any).emergency_phone && (
                        <div>
                          <p className="font-semibold text-gray-700">Teléfono:</p>
                          <p>{(selectedVolunteer as any).emergency_phone}</p>
                        </div>
                      )}
                      {!(selectedVolunteer as any).emergency_contact && !(selectedVolunteer as any).emergency_phone && (
                        <p className="text-gray-500 italic">No especificado</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Habilidades y experiencia */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {((selectedVolunteer as any).skills || (selectedVolunteer as any).previous_experience) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Habilidades y Experiencia</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(selectedVolunteer as any).skills && (
                          <div>
                            <p className="font-semibold text-gray-700">Habilidades:</p>
                            <p className="bg-gray-50 p-2 rounded">{(selectedVolunteer as any).skills}</p>
                          </div>
                        )}
                        {(selectedVolunteer as any).previous_experience && (
                          <div>
                            <p className="font-semibold text-gray-700">Experiencia previa:</p>
                            <p className="bg-gray-50 p-2 rounded">{(selectedVolunteer as any).previous_experience}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Disponibilidad y Preferencias</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(selectedVolunteer as any).available_hours && (
                        <div>
                          <p className="font-semibold text-gray-700">Horarios disponibles:</p>
                          <p className="capitalize">{(selectedVolunteer as any).available_hours}</p>
                        </div>
                      )}
                      {(selectedVolunteer as any).preferred_park_id && (
                        <div>
                          <p className="font-semibold text-gray-700">Parque preferido:</p>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span>ID: {(selectedVolunteer as any).preferred_park_id}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Áreas de interés */}
                {(selectedVolunteer as any).interest_areas && (selectedVolunteer as any).interest_areas.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Áreas de Interés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {(selectedVolunteer as any).interest_areas.map((area: string, index: number) => (
                          <Badge key={index} variant="outline" className="capitalize">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDetailOpen(false)}
                  >
                    Cerrar
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleEditVolunteer((selectedVolunteer as any).id);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Voluntario
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de importación CSV */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Importar Voluntarios desde CSV</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Seleccionaste: <strong>{selectedFile?.name}</strong>
                </p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Formato requerido:</strong> Usa la plantilla CSV descargable que incluye todos los campos del formulario "Nuevo Voluntario" con soporte completo para caracteres acentuados.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setSelectedFile(null);
                }}
                disabled={isImporting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImportCSV}
                disabled={isImporting || !selectedFile}
                className="bg-green-600 hover:bg-green-700"
              >
                {isImporting ? "Importando..." : "Importar Voluntarios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}