import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  GraduationCap, 
  Plus, 
  Upload, 
  Download,
  Search,
  Filter,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Star,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

import AdminLayout from "@/components/AdminLayout";
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import ROUTES from '@/routes';
import { apiRequest } from '@/lib/queryClient';

// Página de Instructores
export default function ProgrammingInstructors() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  // Query para obtener instructores
  const { data: instructorsData, isLoading } = useQuery({
    queryKey: ['/api/instructors'],
    queryFn: () => apiRequest('/api/instructors'),
  });

  const instructors = instructorsData || [];

  // Helper para obtener especialidades como array
  const getSpecialties = (specialties: any): string[] => {
    if (!specialties) return [];
    if (Array.isArray(specialties)) return specialties;
    if (typeof specialties === 'string') return specialties.split(',').map(s => s.trim());
    return [];
  };

  // Filtrar instructores por búsqueda
  const filteredInstructors = instructors.filter((instructor: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      instructor.fullName?.toLowerCase().includes(search) ||
      instructor.email?.toLowerCase().includes(search) ||
      instructor.specialties?.toLowerCase().includes(search)
    );
  });

  // Obtener iniciales para avatar
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Botones de acción para el PageHeader
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="text-[#00444f] border-[#00444f] hover:bg-[#ceefea]"
      >
        <Upload className="h-4 w-4 mr-2" />
        {t('common.import', 'Importar')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-[#00444f] border-[#00444f] hover:bg-[#ceefea]"
      >
        <Download className="h-4 w-4 mr-2" />
        {t('common.export', 'Exportar')}
      </Button>
      <Button
        size="sm"
        className="bg-[#007a5e] hover:bg-[#00664e] text-white"
        onClick={() => setLocation(ROUTES.admin.programming.instructors.create)}
      >
        <Plus className="h-4 w-4 mr-2" />
        {t('instructors.new', 'Nuevo Instructor')}
      </Button>
    </div>
  );

  // Renderizar vista de Grid
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredInstructors.map((instructor: any) => (
        <Card 
          key={instructor.id} 
          className="hover:shadow-lg hover:border-[#00444f] transition-all cursor-pointer"
          onClick={() => setLocation(ROUTES.admin.programming.instructors.view.build(instructor.id))}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={instructor.profileImageUrl} alt={instructor.fullName} />
                <AvatarFallback className="bg-[#ceefea] text-[#00444f] text-lg">
                  {getInitials(instructor.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#00444f] truncate">{instructor.fullName}</h3>
                <p className="text-sm text-gray-600 truncate">{instructor.email}</p>
                  {getSpecialties(instructor.specialties).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {getSpecialties(instructor.specialties).slice(0, 2).map((specialty: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-[#ceefea] text-[#00444f]">
                        {specialty.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span>{instructor.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <Badge 
                variant={instructor.status === 'active' ? 'default' : 'secondary'}
                className={instructor.status === 'active' ? 'bg-green-100 text-green-800' : ''}
              >
                {instructor.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-gray-600 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation(ROUTES.admin.programming.instructors.edit.build(instructor.id));
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Eliminar instructor
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Renderizar vista de Lista/Tabla
  const renderListView = () => (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instructor</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Especialidades</TableHead>
            <TableHead>Calificación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInstructors.map((instructor: any) => (
            <TableRow 
              key={instructor.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => setLocation(ROUTES.admin.programming.instructors.view.build(instructor.id))}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={instructor.profileImageUrl} />
                    <AvatarFallback className="bg-[#ceefea] text-[#00444f]">
                      {getInitials(instructor.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{instructor.fullName}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Mail className="h-3 w-3" />
                    {instructor.email}
                  </div>
                  {instructor.phone && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="h-3 w-3" />
                      {instructor.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {getSpecialties(instructor.specialties).slice(0, 3).map((s: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {s.trim()}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span>{instructor.rating?.toFixed(1) || 'N/A'}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={instructor.status === 'active' ? 'default' : 'secondary'}
                  className={instructor.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                >
                  {instructor.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
                    onClick={() => setLocation(ROUTES.admin.programming.instructors.edit.build(instructor.id))}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
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
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={<GraduationCap className="h-6 w-6" />}
          title={t('programming.instructors', 'Instructores')}
          subtitle={t('programming.instructorsDescription', 'Gestiona los instructores de la programación')}
          actions={headerActions}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#00444f]">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#00444f]">{instructors.length}</p>
                  <p className="text-sm text-[#00444f]">Total Instructores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#00444f]">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#00444f]">
                    {instructors.filter((i: any) => i.status === 'active').length}
                  </p>
                  <p className="text-sm text-[#00444f]">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('common.search', 'Buscar instructores...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {t('common.filters', 'Filtros')}
            </Button>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00444f] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando instructores...</p>
          </div>
        ) : filteredInstructors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay instructores registrados</p>
            <p className="text-sm">Comienza agregando un nuevo instructor</p>
            <Button
              className="mt-4 bg-[#007a5e] hover:bg-[#00664e] text-white"
              onClick={() => setLocation(ROUTES.admin.programming.instructors.create)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Instructor
            </Button>
          </div>
        ) : (
          viewMode === 'grid' ? renderGridView() : renderListView()
        )}
      </div>
    </AdminLayout>
  );
}