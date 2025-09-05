import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { 
  Users, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Calendar,
  AlertTriangle,
  UserCheck,
  Filter,
  Search,
  Edit,
  Trash2,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';

interface PendingUser {
  id: number;
  firebaseUid: string;
  email: string;
  displayName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedRole: string;
  additionalInfo?: any;
}

interface ApprovalData {
  assignedRoleId: number;
  rejectionReason?: string;
}

interface ActiveUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function AccessUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [approvalData, setApprovalData] = useState<ApprovalData>({
    assignedRoleId: 6, // Role 'operador' por defecto
    rejectionReason: ''
  });
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [searchTerm, setSearchTerm] = useState('');

  // Verificar si el usuario puede gestionar solicitudes (solo super-admin y admin)
  const canManageRequests = user?.role === 'super-admin' || user?.role === 'admin';

  // Obtener usuarios pendientes
  const { data: pendingUsers, isLoading: loadingPending } = useQuery({
    queryKey: ['/api/auth/pending-users'],
    queryFn: () => apiRequest('/api/auth/pending-users'),
    enabled: canManageRequests
  });

  // Obtener usuarios activos
  const { data: activeUsers, isLoading: loadingActive } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users')
  });

  // Obtener roles disponibles para asignación
  const { data: roles } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: () => apiRequest('/api/roles')
  });

  // Mutación para aprobar usuario
  const approveMutation = useMutation({
    mutationFn: (data: { requestId: number; assignedRoleId: number }) =>
      apiRequest(`/api/auth/approve-user/${data.requestId}`, {
        method: 'POST',
        data: {
          approvedBy: user?.id || 1,
          assignedRoleId: data.assignedRoleId
        }
      }),
    onSuccess: () => {
      toast({
        title: '✅ Usuario aprobado',
        description: 'El usuario ha sido aprobado exitosamente y puede acceder al sistema.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: '❌ Error al aprobar usuario',
        description: error.message || 'No se pudo aprobar el usuario',
        variant: 'destructive'
      });
    }
  });

  // Mutación para rechazar usuario
  const rejectMutation = useMutation({
    mutationFn: (data: { requestId: number; rejectionReason: string }) =>
      apiRequest(`/api/auth/reject-user/${data.requestId}`, {
        method: 'POST',
        data: {
          rejectedBy: user?.id || 1,
          rejectionReason: data.rejectionReason
        }
      }),
    onSuccess: () => {
      toast({
        title: '✅ Usuario rechazado',
        description: 'La solicitud ha sido rechazada y se ha notificado al usuario.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/pending-users'] });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: '❌ Error al rechazar usuario',
        description: error.message || 'No se pudo rechazar la solicitud',
        variant: 'destructive'
      });
    }
  });

  const handleApproveUser = () => {
    if (!selectedUser) return;
    
    approveMutation.mutate({
      requestId: selectedUser.id,
      assignedRoleId: approvalData.assignedRoleId
    });
  };

  const handleRejectUser = () => {
    if (!selectedUser || !approvalData.rejectionReason?.trim()) {
      toast({
        title: 'Error',
        description: 'Debe proporcionar una razón para el rechazo',
        variant: 'destructive'
      });
      return;
    }
    
    rejectMutation.mutate({
      requestId: selectedUser.id,
      rejectionReason: approvalData.rejectionReason
    });
  };

  const openApprovalDialog = (user: PendingUser, action: 'approve' | 'reject') => {
    setSelectedUser(user);
    setActionType(action);
    setApprovalData({
      assignedRoleId: 6, // Operador por defecto
      rejectionReason: ''
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprobado
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rechazado
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleName = (roleId: number | string) => {
    const role = roles?.find((r: any) => r.id === Number(roleId));
    return role ? role.name : 'Rol desconocido';
  };

  const filteredActiveUsers = activeUsers?.filter((user: ActiveUser) =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredPendingUsers = pendingUsers?.filter((user: PendingUser) =>
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios y Accesos</h1>
            <p className="text-gray-600">Administra usuarios activos y solicitudes de acceso pendientes</p>
          </div>
        </div>

        {/* Buscador global */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, email o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs para usuarios activos y pendientes */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios Activos ({filteredActiveUsers.length})
            </TabsTrigger>
            {canManageRequests && (
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Solicitudes Pendientes 
                {filteredPendingUsers.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 text-xs">
                    {filteredPendingUsers.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Usuarios Activos */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuarios Activos del Sistema
                </CardTitle>
                <CardDescription>
                  Lista de todos los usuarios con acceso al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActive ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Último Acceso</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActiveUsers.map((user: ActiveUser) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{user.fullName}</p>
                                <p className="text-sm text-gray-500">@{user.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Inactivo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.lastLogin ? (
                              format(new Date(user.lastLogin), 'dd MMM yyyy', { locale: es })
                            ) : (
                              <span className="text-gray-500">Nunca</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {user.role !== 'super-admin' && (
                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Solicitudes Pendientes */}
          {canManageRequests && (
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Solicitudes de Acceso Pendientes
                  </CardTitle>
                  <CardDescription>
                    Nuevos usuarios esperando autorización para acceder al sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPending ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredPendingUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay solicitudes pendientes
                      </h3>
                      <p className="text-gray-500">
                        Todas las solicitudes de acceso han sido procesadas
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Solicitante</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rol Solicitado</TableHead>
                          <TableHead>Fecha Solicitud</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPendingUsers.map((user: PendingUser) => (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-yellow-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{user.displayName || 'Sin nombre'}</p>
                                  <p className="text-sm text-gray-500">UID: {user.firebaseUid.substring(0, 8)}...</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                {user.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {user.requestedRole || 'operador'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {format(new Date(user.requestedAt), 'dd MMM yyyy', { locale: es })}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(user.status)}
                            </TableCell>
                            <TableCell>
                              {user.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => openApprovalDialog(user, 'approve')}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Aprobar
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Aprobar Solicitud de Acceso</DialogTitle>
                                        <DialogDescription>
                                          ¿Estás seguro de que quieres aprobar el acceso para {selectedUser?.email}?
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div>
                                          <Label htmlFor="role">Asignar Rol</Label>
                                          <Select
                                            value={approvalData.assignedRoleId.toString()}
                                            onValueChange={(value) => setApprovalData({
                                              ...approvalData,
                                              assignedRoleId: parseInt(value)
                                            })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Seleccionar rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {roles?.map((role: any) => (
                                                <SelectItem key={role.id} value={role.id.toString()}>
                                                  {role.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <DialogTrigger asChild>
                                          <Button variant="outline">Cancelar</Button>
                                        </DialogTrigger>
                                        <Button
                                          onClick={handleApproveUser}
                                          disabled={approveMutation.isPending}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          {approveMutation.isPending ? 'Aprobando...' : 'Aprobar Usuario'}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                        onClick={() => openApprovalDialog(user, 'reject')}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Rechazar
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Rechazar Solicitud de Acceso</DialogTitle>
                                        <DialogDescription>
                                          ¿Estás seguro de que quieres rechazar el acceso para {selectedUser?.email}?
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div>
                                          <Label htmlFor="reason">Razón del rechazo *</Label>
                                          <Textarea
                                            id="reason"
                                            placeholder="Explicar por qué se rechaza la solicitud..."
                                            value={approvalData.rejectionReason}
                                            onChange={(e) => setApprovalData({
                                              ...approvalData,
                                              rejectionReason: e.target.value
                                            })}
                                            className="min-h-[100px]"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <DialogTrigger asChild>
                                          <Button variant="outline">Cancelar</Button>
                                        </DialogTrigger>
                                        <Button
                                          onClick={handleRejectUser}
                                          disabled={rejectMutation.isPending || !approvalData.rejectionReason?.trim()}
                                          variant="destructive"
                                        >
                                          {rejectMutation.isPending ? 'Rechazando...' : 'Rechazar Solicitud'}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Información para usuarios no autorizados */}
        {!canManageRequests && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-orange-700">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Acceso Restringido</p>
                  <p className="text-sm">
                    Solo los Super Administradores y Administradores Generales pueden gestionar solicitudes de acceso.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}