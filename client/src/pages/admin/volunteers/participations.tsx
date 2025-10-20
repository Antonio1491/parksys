import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, Search, Filter, RefreshCw, Download, ArrowUpDown,
  Clock, PlusCircle, FileEdit, FileX
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Link } from 'wouter';
import ROUTES from '@/routes';

const ParticipationsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [parkFilter, setParkFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch all participations
  const { data: participations = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/participations/all'],
  });

  // Fetch parks for filter
  const { data: parks = [] } = useQuery({
    queryKey: ['/api/parks'],
  });

  // Filter participations based on search term and park
  const filteredParticipations = participations.filter((participation: Participation) => {
    const matchesSearch = 
      searchTerm === '' || 
      participation.activityName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPark = 
      parkFilter === 'all' || 
      participation.parkId.toString() === parkFilter;
    
    return matchesSearch && matchesPark;
  });

  // Paginate participations
  const paginatedParticipations = filteredParticipations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredParticipations.length / pageSize);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Export participations data as CSV
  const exportCSV = () => {
    const headers = ['ID', 'Voluntario', 'Parque', 'Actividad', 'Fecha', 'Horas', 'Supervisor', 'Notas'];
    const csvRows = [
      headers.join(','),
      ...filteredParticipations.map((participation: Participation) => [
        participation.id,
        participation.volunteerId,
        participation.parkId,
        participation.activityName,
        participation.activityDate,
        participation.hoursContributed,
        participation.supervisorId || 'N/A',
        participation.notes ? `"${participation.notes.replace(/"/g, '""')}"` : 'N/A'
      ].join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'participaciones.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Get park name by id
  const getParkName = (parkId: number) => {
    const park = parks.find((p: any) => p.id === parkId);
    return park ? park.name : `Parque ID: ${parkId}`;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Participaciones de Voluntarios</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Link href={ROUTES.admin.volunteers.participationCreate}>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Registrar Participación
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Registro de Participaciones</CardTitle>
            <CardDescription>Gestione las horas de participación de los voluntarios en actividades de los parques.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div className="flex items-center space-x-2 w-1/2">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar por actividad..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={parkFilter} onValueChange={setParkFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por parque" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(parks) && parks.map((park: any) => (
                      <SelectItem key={park.id} value={park.id.toString()}>
                        {park.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">Cargando participaciones...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8">
                <FileX className="h-8 w-8 mx-auto text-red-500" />
                <p className="mt-2 text-red-500">Error al cargar las participaciones</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                  Reintentar
                </Button>
              </div>
            ) : paginatedParticipations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No se encontraron participaciones que coincidan con los criterios de búsqueda.</div>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Voluntario</TableHead>
                      <TableHead>Parque</TableHead>
                      <TableHead>Actividad</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Fecha
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Horas
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedParticipations.map((participation: Participation) => (
                      <TableRow key={participation.id}>
                        <TableCell>
                          <Link href={`/admin/volunteers/${participation.volunteerId}`}>
                            <Button variant="link" className="p-0 h-auto text-primary">
                              #{participation.volunteerId}
                            </Button>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {getParkName(participation.parkId)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {participation.activityId ? (
                              <Link href={`/admin/activities/${participation.activityId}`}>
                                <Button variant="link" className="p-0 h-auto">
                                  {participation.activityName}
                                </Button>
                              </Link>
                            ) : (
                              participation.activityName
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{participation.activityDate}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge>
                            <Clock className="h-3 w-3 mr-1" />
                            {participation.hoursContributed} horas
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link href={`/admin/volunteers/participations/${participation.id}`}>
                              <Button variant="outline" size="sm">
                                <FileEdit className="h-3 w-3 mr-1" />
                                Ver / Editar
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ParticipationsList;