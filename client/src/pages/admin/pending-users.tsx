import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Clock, CheckCircle, XCircle, User, Mail, Calendar } from 'lucide-react';

interface PendingUser {
  id: number;
  firebaseUid: string;
  email: string;
  displayName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedRole: string;
}

interface ApprovalData {
  assignedRoleId: number;
  rejectionReason?: string;
}

export default function PendingUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [approvalData, setApprovalData] = useState<ApprovalData>({
    assignedRoleId: 2, // Role empleado por defecto
    rejectionReason: ''
  });
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  // Obtener usuarios pendientes
  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['/api/auth/pending-users'],
    queryFn: () => apiRequest('/api/auth/pending-users')
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
        body: JSON.stringify({
          approvedBy: 1, // ID del admin actual - en producción usar req.user.id
          assignedRoleId: data.assignedRoleId
        }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: '✅ Usuario aprobado',
        description: 'El usuario ha sido aprobado exitosamente y puede acceder al sistema.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/pending-users'] });
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
        body: JSON.stringify({
          rejectedBy: 1, // ID del admin actual - en producción usar req.user.id
          rejectionReason: data.rejectionReason
        }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: '🚫 Usuario rechazado',
        description: 'La solicitud ha sido rechazada exitosamente.'
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

  const handleApprove = () => {
    if (!selectedUser) return;
    
    approveMutation.mutate({
      requestId: selectedUser.id,
      assignedRoleId: approvalData.assignedRoleId
    });
  };

  const handleReject = () => {
    if (!selectedUser || !approvalData.rejectionReason.trim()) {
      toast({
        title: '⚠️ Motivo requerido',
        description: 'Debe especificar un motivo para rechazar la solicitud',
        variant: 'destructive'
      });
      return;
    }
    
    rejectMutation.mutate({
      requestId: selectedUser.id,
      rejectionReason: approvalData.rejectionReason
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando usuarios pendientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios Pendientes</h1>
          <p className="text-muted-foreground">
            Gestiona las solicitudes de acceso al sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Solicitudes de Acceso
          </CardTitle>
          <CardDescription>
            {pendingUsers?.length || 0} solicitudes pendientes de revisión
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingUsers || pendingUsers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium">No hay solicitudes pendientes</h3>
              <p className="text-muted-foreground">
                Todas las solicitudes han sido procesadas
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha de Solicitud</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user: PendingUser) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{user.displayName || 'Sin nombre'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {new Date(user.requestedAt).toLocaleDateString('es-ES')}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {user.status === 'pending' && (
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType('approve');
                                  setApprovalData({
                                    assignedRoleId: 2,
                                    rejectionReason: ''
                                  });
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprobar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Aprobar Usuario</DialogTitle>
                                <DialogDescription>
                                  Aprobar acceso para {user.displayName} ({user.email})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="roleSelect">Asignar rol</Label>
                                  <Select
                                    value={approvalData.assignedRoleId.toString()}
                                    onValueChange={(value) => 
                                      setApprovalData(prev => ({ ...prev, assignedRoleId: parseInt(value) }))
                                    }
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
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {approveMutation.isPending ? 'Aprobando...' : 'Aprobar Usuario'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType('reject');
                                  setApprovalData({
                                    assignedRoleId: 2,
                                    rejectionReason: ''
                                  });
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rechazar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rechazar Solicitud</DialogTitle>
                                <DialogDescription>
                                  Rechazar acceso para {user.displayName} ({user.email})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="rejectionReason">Motivo del rechazo</Label>
                                  <Textarea
                                    id="rejectionReason"
                                    placeholder="Especifique el motivo del rechazo..."
                                    value={approvalData.rejectionReason}
                                    onChange={(e) => 
                                      setApprovalData(prev => ({ ...prev, rejectionReason: e.target.value }))
                                    }
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleReject}
                                    disabled={rejectMutation.isPending}
                                    variant="destructive"
                                    className="flex-1"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    {rejectMutation.isPending ? 'Rechazando...' : 'Rechazar Solicitud'}
                                  </Button>
                                </div>
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
    </div>
  );
}