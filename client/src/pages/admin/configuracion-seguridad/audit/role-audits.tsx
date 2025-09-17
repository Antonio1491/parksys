import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleBadge, RoleBadgeWithText } from '@/components/RoleBadge';
import { useAdaptivePermissions } from '@/hooks/useAdaptivePermissions';
import { Link } from 'wouter';
import { 
  Activity, Shield, Clock, User, Eye, Download, Filter, Search,
  CheckCircle, XCircle, AlertTriangle, Info, Edit, UserCog, Grid,
  Loader2, ChevronLeft, ChevronRight, Users
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Tipos para los logs de auditoría
interface RoleAuditLog {
  id: number;
  timestamp: string;
  action: string;
  userId?: number;
  username?: string;
  fromRoleId?: string;
  toRoleId?: string;
  permission?: string;
  module: string;
  performedBy: string;
  performedById?: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  ipAddress?: string;
  result?: string;
  affectedUsers?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface AuditFilters {
  search: string;
  action: string;
  severity: string;
  module: string;
  fromDate: string;
  toDate: string;
  limit: number;
  offset: number;
}

const RoleAuditsPage = () => {
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    action: 'all',
    severity: 'all',
    module: 'all',
    fromDate: '',
    toDate: '',
    limit: 50,
    offset: 0
  });

  // Query para obtener logs de auditoría
  const { data: auditData, isLoading, error } = useQuery({
    queryKey: ['/api/audit/role-changes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/audit/role-changes?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Error al cargar logs de auditoría');
      }
      return response.json();
    }
  });

  // Query para módulos disponibles
  const { data: modulesData } = useQuery({
    queryKey: ['/api/audit/modules'],
    queryFn: async () => {
      const response = await fetch('/api/audit/modules');
      if (!response.ok) return { data: [{ value: 'all', label: 'Todos los módulos' }] };
      return response.json();
    }
  });

  const logs = auditData?.data || [];
  const pagination = auditData?.pagination || { total: 0, hasMore: false };
  const modules = modulesData?.data || [{ value: 'all', label: 'Todos los módulos' }];

  const handleFilterChange = (key: keyof AuditFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: key !== 'offset' ? 0 : (typeof value === 'number' ? value : 0) // Reset offset when changing other filters
    }));
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value.toString());
        }
      });
      params.append('limit', '1000'); // Export more records
      
      const response = await fetch(`/api/audit/role-changes?${params.toString()}`);
      if (!response.ok) throw new Error('Error al exportar datos');
      
      const data = await response.json();
      const csvContent = convertToCSV(data.data);
      downloadCSV(csvContent, `auditoria-roles-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      toast({
        title: "Exportación exitosa",
        description: "Los datos de auditoría se han exportado correctamente"
      });
    } catch (error) {
      toast({
        title: "Error de exportación",
        description: "No se pudo exportar los datos de auditoría",
        variant: "destructive"
      });
    }
  };

  const convertToCSV = (data: RoleAuditLog[]) => {
    const headers = ['Fecha', 'Acción', 'Usuario', 'Módulo', 'Descripción', 'Severidad', 'Realizado por'];
    const rows = data.map(log => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      getActionLabel(log.action),
      log.username || 'Sistema',
      log.module,
      log.description,
      getSeverityLabel(log.severity),
      log.performedBy
    ]);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getActionLabel = (action: string) => {
    const actionLabels: Record<string, string> = {
      'role_change': 'Cambio de Rol',
      'permission_granted': 'Permiso Otorgado',
      'permission_revoked': 'Permiso Revocado',
      'login_attempt': 'Intento de Acceso',
      'bulk_assignment': 'Asignación Masiva',
      'matrix_update': 'Actualización Matriz'
    };
    return actionLabels[action] || action;
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityLabel = (severity: string) => {
    const labels = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta'
    };
    return labels[severity as keyof typeof labels] || severity;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'role_change': return <UserCog className="w-4 h-4" />;
      case 'permission_granted': return <CheckCircle className="w-4 h-4" />;
      case 'permission_revoked': return <XCircle className="w-4 h-4" />;
      case 'login_attempt': return <Shield className="w-4 h-4" />;
      case 'bulk_assignment': return <Users className="w-4 h-4" />;
      case 'matrix_update': return <Grid className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Auditoría de Roles</h1>
              <p className="text-muted-foreground">Error al cargar los datos de auditoría</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <p>No se pudieron cargar los logs de auditoría.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Verifique la conexión con el servidor.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Auditoría de Roles</h1>
            <p className="text-muted-foreground">
              Registro completo de cambios en roles y permisos del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isLoading}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Búsqueda General</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Buscar usuario, descripción..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Tipo de Acción</Label>
                <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las acciones</SelectItem>
                    <SelectItem value="role_change">Cambios de rol</SelectItem>
                    <SelectItem value="permission_granted">Permisos otorgados</SelectItem>
                    <SelectItem value="permission_revoked">Permisos revocados</SelectItem>
                    <SelectItem value="login_attempt">Intentos de acceso</SelectItem>
                    <SelectItem value="bulk_assignment">Asignaciones masivas</SelectItem>
                    <SelectItem value="matrix_update">Actualizaciones matriz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severidad</Label>
                <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las severidades</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="module">Módulo</Label>
                <Select value={filters.module} onValueChange={(value) => handleFilterChange('module', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module: any) => (
                      <SelectItem key={module.value} value={module.value}>
                        {module.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Registro de Auditoría
              {pagination.total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pagination.total} registros
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Historial completo de actividades relacionadas con roles y permisos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Cargando logs de auditoría...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No hay registros</h3>
                <p className="text-muted-foreground">
                  No se encontraron logs de auditoría con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Fecha/Hora</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Cambios</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Realizado por</TableHead>
                      <TableHead>Severidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: RoleAuditLog) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {format(new Date(log.timestamp), 'dd/MM/yyyy', { locale: es })}
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(log.timestamp), 'HH:mm:ss', { locale: es })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="font-medium">{getActionLabel(log.action)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.username ? (
                            <div>
                              <div className="font-medium">{log.username}</div>
                              <div className="text-sm text-muted-foreground">ID: {log.userId}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sistema</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="space-y-1">
                            {log.fromRoleId && log.toRoleId && (
                              <div className="flex items-center gap-2 text-sm">
                                <RoleBadge roleId={log.fromRoleId} />
                                <span>→</span>
                                <RoleBadge roleId={log.toRoleId} />
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                              {log.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.module}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.performedBy}</div>
                            {log.performedById && log.performedById > 0 && (
                              <div className="text-muted-foreground">ID: {log.performedById}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            <div className="flex items-center gap-1">
                              {getSeverityIcon(log.severity)}
                              {getSeverityLabel(log.severity)}
                            </div>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {filters.offset + 1}-{Math.min(filters.offset + filters.limit, pagination.total)} de {pagination.total} registros
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('offset', Math.max(0, filters.offset - filters.limit))}
                      disabled={filters.offset === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('offset', filters.offset + filters.limit)}
                      disabled={!pagination.hasMore}
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default RoleAuditsPage;