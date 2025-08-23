import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarClock, MapPin, Users, DollarSign, TrendingUp, Calendar, BarChart3, Eye } from 'lucide-react';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { formatDate } from '@/lib/utils';

interface ReservationStats {
  total_reservations: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  total_revenue: string;
  monthly_revenue: string;
  avg_booking_value: string;
  popular_spaces: Array<{
    space_name: string;
    park_name: string;
    booking_count: number;
  }>;
  recent_reservations: Array<{
    id: number;
    space_name: string;
    park_name: string;
    customer_name: string;
    reservation_date: string;
    total_cost: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  }>;
}

interface SpaceReservation {
  id: number;
  space_name: string;
  park_name: string;
  customer_name: string;
  reservation_date: string;
  total_cost: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800'
};

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada'
};

export default function DashboardReservas() {
  const [location, setLocation] = useLocation();
  const [timeFilter, setTimeFilter] = useState('month');

  const { data: stats, isLoading: statsLoading } = useQuery<ReservationStats>({
    queryKey: ['/api/space-reservations/dashboard-stats', timeFilter],
    queryFn: async () => {
      const response = await fetch(`/api/space-reservations/dashboard-stats?period=${timeFilter}`);
      if (!response.ok) {
        throw new Error('Error al cargar las estadísticas del dashboard');
      }
      return response.json();
    }
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<SpaceReservation[]>({
    queryKey: ['/api/space-reservations/recent', 10],
    queryFn: async () => {
      const response = await fetch('/api/space-reservations/recent?limit=10');
      if (!response.ok) {
        throw new Error('Error al cargar las reservas recientes');
      }
      return response.json();
    }
  });

  if (statsLoading || reservationsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const handleViewAllReservations = () => {
    setLocation('/admin/space-reservations');
  };

  const handleNewReservation = () => {
    setLocation('/admin/space-reservations/new');
  };

  const handleViewReservation = (id: number) => {
    setLocation(`/admin/space-reservations/edit/${id}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con fondo coloreado */}
        <div 
          className="p-4 -mx-4 flex justify-between items-start"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white font-poppins">
                Dashboard de Reservas
              </h1>
              <p className="text-white mt-1">
                Análisis y métricas de reservas de espacios en parques
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-40 bg-white text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="quarter">Este trimestre</SelectItem>
                <SelectItem value="year">Este año</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleNewReservation}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              <CalendarClock className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_reservations || 0}</div>
              <p className="text-xs text-muted-foreground">
                Todas las reservas registradas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.confirmed || 0}</div>
              <p className="text-xs text-muted-foreground">
                Reservas activas confirmadas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Total</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${parseFloat(stats?.total_revenue || '0').toLocaleString('es-MX')}
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresos totales generados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${parseFloat(stats?.avg_booking_value || '0').toLocaleString('es-MX')}
              </div>
              <p className="text-xs text-muted-foreground">
                Por reserva confirmada
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Reservations */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Reservas Recientes</CardTitle>
                  <CardDescription>
                    Últimas reservas realizadas en el sistema
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleViewAllReservations}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reservations.slice(0, 5).map((reservation) => (
                  <div 
                    key={reservation.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => handleViewReservation(reservation.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{reservation.customer_name}</p>
                        <Badge className={statusColors[reservation.status]}>
                          {statusLabels[reservation.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {reservation.space_name} - {reservation.park_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(reservation.reservation_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ${parseFloat(reservation.total_cost).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                ))}
                {reservations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarClock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No hay reservas recientes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Popular Spaces */}
          <Card>
            <CardHeader>
              <CardTitle>Espacios Más Solicitados</CardTitle>
              <CardDescription>
                Espacios con mayor número de reservas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.popular_spaces?.slice(0, 5).map((space, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{space.space_name}</p>
                        <p className="text-sm text-gray-600">{space.park_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{space.booking_count}</p>
                      <p className="text-xs text-gray-500">reservas</p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No hay datos de espacios populares</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Funciones principales para la gestión de reservas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={handleViewAllReservations}
                variant="outline" 
                className="justify-start h-auto p-4"
              >
                <div className="flex items-center gap-3">
                  <Eye className="h-6 w-6 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">Ver Todas las Reservas</p>
                    <p className="text-sm text-gray-600">Lista completa y filtros</p>
                  </div>
                </div>
              </Button>
              
              <Button 
                onClick={handleNewReservation}
                variant="outline" 
                className="justify-start h-auto p-4"
              >
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-6 w-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">Nueva Reserva</p>
                    <p className="text-sm text-gray-600">Crear reserva manual</p>
                  </div>
                </div>
              </Button>
              
              <Button 
                onClick={() => setLocation('/admin/space-reservations/calendar')}
                variant="outline" 
                className="justify-start h-auto p-4"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium">Vista Calendario</p>
                    <p className="text-sm text-gray-600">Cronograma visual</p>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}