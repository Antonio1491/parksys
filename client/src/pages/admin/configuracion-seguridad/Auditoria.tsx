import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";
import { 
  FileSearch, 
  Shield, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Settings,
  Eye,
  Archive,
  FileText,
  Trash2,
  RefreshCw,
  Database,
  Lock,
  Unlock,
  UserCheck,
  AlertTriangle
} from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AuditSettings {
  enableLogging: boolean;
  logRetentionDays: number;
  logFailedAttempts: boolean;
  logDataChanges: boolean;
  logUserActions: boolean;
  logSystemEvents: boolean;
  alertThreshold: number;
  autoArchive: boolean;
}

// Datos de auditoría de roles integrados
const ROLE_AUDIT_LOGS = [
  {
    id: 1,
    timestamp: '2025-01-04 21:10:15',
    action: 'role_change',
    user: 'Ana García Ruiz',
    userId: 1,
    fromRole: 'coordinador-parques',
    toRole: 'director-general',
    performedBy: 'Sistema Admin',
    performedById: 0,
    description: 'Promoción por reestructuración organizacional',
    severity: 'high',
    module: 'Seguridad'
  },
  {
    id: 2,
    timestamp: '2025-01-04 20:45:22',
    action: 'permission_granted',
    user: 'Carlos Mendoza Torres',
    userId: 2,
    permission: 'admin',
    module: 'Finanzas',
    performedBy: 'Ana García Ruiz',
    performedById: 1,
    description: 'Acceso temporal para auditoría de presupuesto Q1',
    severity: 'medium'
  },
  {
    id: 3,
    timestamp: '2025-01-04 20:30:45',
    action: 'login_attempt',
    user: 'Roberto Silva Jiménez',
    userId: 4,
    result: 'success',
    ipAddress: '192.168.1.45',
    performedBy: 'Sistema',
    performedById: 0,
    description: 'Acceso exitoso desde oficina central',
    severity: 'low',
    module: 'Seguridad'
  },
  {
    id: 4,
    timestamp: '2025-01-04 19:15:33',
    action: 'role_change',
    user: 'Laura Fernández Morales',
    userId: 5,
    fromRole: 'operador-parque',
    toRole: 'coordinador-actividades',
    performedBy: 'Ana García Ruiz',
    performedById: 1,
    description: 'Promoción interna por desempeño destacado',
    severity: 'high',
    module: 'Recursos Humanos'
  }
];

const ACTION_TYPES = [
  { value: 'all', label: 'Todas las acciones' },
  { value: 'role_change', label: 'Cambios de rol' },
  { value: 'permission_granted', label: 'Permisos otorgados' },
  { value: 'permission_revoked', label: 'Permisos revocados' },
  { value: 'login_attempt', label: 'Intentos de acceso' },
  { value: 'bulk_assignment', label: 'Asignaciones masivas' },
  { value: 'matrix_update', label: 'Actualizaciones de matriz' }
];

export default function Auditoria() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("logs");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Estados para auditoría de roles
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  // Configuración de auditoría
  const [auditSettings, setAuditSettings] = useState<AuditSettings>({
    enableLogging: true,
    logRetentionDays: 90,
    logFailedAttempts: true,
    logDataChanges: true,
    logUserActions: true,
    logSystemEvents: true,
    alertThreshold: 5,
    autoArchive: true
  });

  // Logs de auditoría simulados
  const [auditLogs] = useState<AuditLog[]>([
    {
      id: '1',
      timestamp: '2025-01-07 14:35:22',
      userId: 'user-001',
      userName: 'Ana García',
      action: 'LOGIN_ATTEMPT_FAILED',
      resource: '/admin/login',
      details: 'Contraseña incorrecta (intento 3/3)',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'failure',
      severity: 'high'
    },
    {
      id: '2',
      timestamp: '2025-01-07 14:30:15',
      userId: 'user-002',
      userName: 'Carlos Mendez',
      action: 'USER_ROLE_CHANGED',
      resource: '/admin/users/123',
      details: 'Rol cambiado de "Operador" a "Coordinador"',
      ipAddress: '10.0.0.50',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      status: 'success',
      severity: 'medium'
    },
    {
      id: '3',
      timestamp: '2025-01-07 14:25:08',
      userId: 'user-003',
      userName: 'Luis Rodriguez',
      action: 'DATA_EXPORT',
      resource: '/api/parks/export',
      details: 'Exportación de datos de parques (150 registros)',
      ipAddress: '172.16.0.25',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success',
      severity: 'low'
    },
    {
      id: '4',
      timestamp: '2025-01-07 14:20:45',
      userId: 'system',
      userName: 'Sistema',
      action: 'BACKUP_COMPLETED',
      resource: '/system/backup',
      details: 'Respaldo automático completado exitosamente',
      ipAddress: 'localhost',
      userAgent: 'ParkSys-Scheduler/1.0',
      status: 'success',
      severity: 'low'
    },
    {
      id: '5',
      timestamp: '2025-01-07 14:15:33',
      userId: 'user-004',
      userName: 'Maria López',
      action: 'SECURITY_POLICY_CHANGED',
      resource: '/admin/security/policies',
      details: 'Política de contraseñas actualizada - longitud mínima: 8 → 10',
      ipAddress: '192.168.1.200',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success',
      severity: 'critical'
    }
  ]);

  const updateAuditSetting = (field: keyof AuditSettings, value: any) => {
    setAuditSettings(prev => ({ ...prev, [field]: value }));
    toast({
      title: "Configuración actualizada",
      description: "Los cambios en la configuración de auditoría se han guardado",
    });
  };

  const exportLogs = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los logs de auditoría se están exportando a CSV",
    });
  };

  const archiveLogs = () => {
    toast({
      title: "Archivado iniciado",
      description: "Los logs antiguos se están archivando",
    });
  };

  const clearOldLogs = () => {
    toast({
      title: "Limpieza completada",
      description: "Los logs antiguos han sido eliminados",
      variant: "destructive"
    });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <Lock className="h-4 w-4" />;
    if (action.includes('USER') || action.includes('ROLE')) return <UserCheck className="h-4 w-4" />;
    if (action.includes('DATA') || action.includes('EXPORT')) return <Database className="h-4 w-4" />;
    if (action.includes('SECURITY') || action.includes('POLICY')) return <Shield className="h-4 w-4" />;
    if (action.includes('BACKUP') || action.includes('SYSTEM')) return <Settings className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failure': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityName = (severity: string) => {
    const names: Record<string, string> = {
      'critical': 'Crítica',
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja'
    };
    return names[severity] || severity;
  };

  // Funciones para auditoría de roles
  const getRoleActionIcon = (action: string) => {
    switch (action) {
      case 'role_change': return <UserCheck className="h-4 w-4" />;
      case 'permission_granted': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'permission_revoked': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'login_attempt': return <Lock className="h-4 w-4" />;
      case 'bulk_assignment': return <User className="h-4 w-4" />;
      case 'matrix_update': return <Database className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getRoleActionLabel = (action: string) => {
    const actionType = ACTION_TYPES.find(t => t.value === action);
    return actionType?.label || action;
  };

  // Filtrar logs de roles
  const filteredRoleLogs = ROLE_AUDIT_LOGS.filter(log => {
    const matchesSearch = log.user?.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
                         log.performedBy.toLowerCase().includes(roleSearchTerm.toLowerCase());
    
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;

    return matchesSearch && matchesAction && matchesSeverity;
  });

  const roleAuditStats = {
    high: filteredRoleLogs.filter(log => log.severity === 'high').length,
    medium: filteredRoleLogs.filter(log => log.severity === 'medium').length,
    low: filteredRoleLogs.filter(log => log.severity === 'low').length,
    total: filteredRoleLogs.length
  };

  const getActionName = (action: string) => {
    const names: Record<string, string> = {
      'LOGIN_ATTEMPT_FAILED': 'Intento de login fallido',
      'USER_ROLE_CHANGED': 'Cambio de rol de usuario',
      'DATA_EXPORT': 'Exportación de datos',
      'BACKUP_COMPLETED': 'Respaldo completado',
      'SECURITY_POLICY_CHANGED': 'Política de seguridad modificada'
    };
    return names[action] || action.replace(/_/g, ' ').toLowerCase();
  };

  // Filtrar logs
  const filteredLogs = auditLogs.filter(log => 
    searchTerm === '' || 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <FileSearch className="h-6 w-6" />
            Sistema de Auditoría y Logs de Seguridad
          </CardTitle>
          <CardDescription className="text-purple-700">
            Monitoree, analice y configure el registro de actividades del sistema para garantizar la seguridad y cumplimiento.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs de Actividad
          </TabsTrigger>
          <TabsTrigger value="role-audits" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Auditoría de Roles
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Mantenimiento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filtros y búsqueda */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por usuario, acción o detalles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={exportLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Registro de Actividades ({filteredLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getActionIcon(log.action)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{getActionName(log.action)}</h3>
                          <Badge className={getSeverityColor(log.severity)}>
                            {getSeverityName(log.severity)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1">
                          {log.details}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.userName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {log.timestamp}
                          </span>
                          <span>{log.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role-audits" className="space-y-6">
          {/* Estadísticas de auditoría de roles */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">
                  Eventos Críticos
                </CardTitle>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">{roleAuditStats.high}</div>
                <p className="text-xs text-red-700 mt-1">Severidad alta</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800">
                  Eventos Medios
                </CardTitle>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-900">{roleAuditStats.medium}</div>
                <p className="text-xs text-yellow-700 mt-1">Severidad media</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">
                  Eventos Normales
                </CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{roleAuditStats.low}</div>
                <p className="text-xs text-green-700 mt-1">Severidad baja</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">
                  Total Eventos
                </CardTitle>
                <Activity className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{roleAuditStats.total}</div>
                <p className="text-xs text-blue-700 mt-1">Cambios de roles</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros para auditoría de roles */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por usuario, acción o detalles..."
                    value={roleSearchTerm}
                    onChange={(e) => setRoleSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Todas las acciones" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Todos los niveles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los niveles</SelectItem>
                      <SelectItem value="low">Bajo</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={exportLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de logs de roles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600" />
                Registro de Cambios de Roles ({filteredRoleLogs.length})
              </CardTitle>
              <CardDescription>
                Historial completo de modificaciones en roles y permisos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredRoleLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.severity === 'high' ? 'failure' : 'success')}
                        {getRoleActionIcon(log.action)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{getRoleActionLabel(log.action)}</h3>
                          <Badge className={getSeverityColor(log.severity)}>
                            {getSeverityName(log.severity)}
                          </Badge>
                          {log.module && (
                            <Badge variant="outline" className="text-xs">
                              {log.module}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1">
                          {log.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {log.user && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.user}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {log.timestamp}
                          </span>
                          <span>Por: {log.performedBy}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Configuración de auditoría */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                Configuración de Auditoría
              </CardTitle>
              <CardDescription>
                Configure qué eventos registrar y cómo gestionar los logs de auditoría
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Registro de Eventos</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Habilitar registro de auditoría</Label>
                      <p className="text-sm text-muted-foreground">Activar el sistema de logs</p>
                    </div>
                    <Switch
                      checked={auditSettings.enableLogging}
                      onCheckedChange={(checked) => updateAuditSetting('enableLogging', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Registrar intentos fallidos</Label>
                      <p className="text-sm text-muted-foreground">Logins y accesos denegados</p>
                    </div>
                    <Switch
                      checked={auditSettings.logFailedAttempts}
                      onCheckedChange={(checked) => updateAuditSetting('logFailedAttempts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Registrar cambios de datos</Label>
                      <p className="text-sm text-muted-foreground">Modificaciones en la base de datos</p>
                    </div>
                    <Switch
                      checked={auditSettings.logDataChanges}
                      onCheckedChange={(checked) => updateAuditSetting('logDataChanges', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Registrar acciones de usuario</Label>
                      <p className="text-sm text-muted-foreground">Navegación y operaciones</p>
                    </div>
                    <Switch
                      checked={auditSettings.logUserActions}
                      onCheckedChange={(checked) => updateAuditSetting('logUserActions', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Registrar eventos del sistema</Label>
                      <p className="text-sm text-muted-foreground">Backups, mantenimiento, etc.</p>
                    </div>
                    <Switch
                      checked={auditSettings.logSystemEvents}
                      onCheckedChange={(checked) => updateAuditSetting('logSystemEvents', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Configuración de Retención</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="retention-days">Días de retención</Label>
                    <Input
                      id="retention-days"
                      type="number"
                      min="1"
                      max="365"
                      value={auditSettings.logRetentionDays}
                      onChange={(e) => updateAuditSetting('logRetentionDays', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Los logs se conservarán durante este período
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-threshold">Umbral de alerta</Label>
                    <Input
                      id="alert-threshold"
                      type="number"
                      min="1"
                      max="100"
                      value={auditSettings.alertThreshold}
                      onChange={(e) => updateAuditSetting('alertThreshold', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Eventos críticos por hora antes de alertar
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Archivado automático</Label>
                      <p className="text-sm text-muted-foreground">Archivar logs antiguos automáticamente</p>
                    </div>
                    <Switch
                      checked={auditSettings.autoArchive}
                      onCheckedChange={(checked) => updateAuditSetting('autoArchive', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Configuración avanzada */}
              <div className="pt-6 border-t space-y-4">
                <h3 className="font-medium">Configuración Avanzada</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Formato de exportación</Label>
                    <Select defaultValue="csv">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Compresión de archivos</Label>
                    <Select defaultValue="gzip">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin compresión</SelectItem>
                        <SelectItem value="gzip">GZIP</SelectItem>
                        <SelectItem value="zip">ZIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nivel de detalle</Label>
                    <Select defaultValue="standard">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Mínimo</SelectItem>
                        <SelectItem value="standard">Estándar</SelectItem>
                        <SelectItem value="detailed">Detallado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Análisis de logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Análisis de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { title: 'Total de Eventos', value: '1,234', change: '+12%', color: 'text-blue-600' },
                  { title: 'Eventos Críticos', value: '23', change: '-5%', color: 'text-red-600' },
                  { title: 'Usuarios Activos', value: '45', change: '+3%', color: 'text-green-600' },
                  { title: 'Fallos de Login', value: '8', change: '+15%', color: 'text-yellow-600' }
                ].map((stat, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <Badge variant={stat.change.startsWith('+') ? 'default' : 'destructive'}>
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-700 mb-2">Gráficos de Análisis</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Los gráficos detallados de actividad se mostrarán aquí
                </p>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generar Reportes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          {/* Mantenimiento de logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-purple-600" />
                Mantenimiento de Logs
              </CardTitle>
              <CardDescription>
                Herramientas para gestionar el espacio y rendimiento del sistema de auditoría
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Estadísticas de Almacenamiento</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Logs totales</span>
                      <Badge variant="outline">1,234 registros</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tamaño actual</span>
                      <Badge variant="outline">45.2 MB</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Logs archivados</span>
                      <Badge variant="outline">856 registros</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Espacio archivado</span>
                      <Badge variant="outline">128.7 MB</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Acciones de Mantenimiento</h3>
                  
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={archiveLogs}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archivar logs antiguos
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={exportLogs}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar todos los logs
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={clearOldLogs}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar logs antiguos
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Recomendaciones de Mantenimiento</h4>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• Configure archivado automático para logs mayores a 30 días</li>
                      <li>• Exporte logs críticos antes de eliminarlos permanentemente</li>
                      <li>• Revise el espacio disponible mensualmente</li>
                      <li>• Mantenga al menos 90 días de logs para cumplimiento normativo</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}