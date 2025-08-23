import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  CalendarPlus, 
  FolderOpen, 
  List, 
  TrendingUp,
  Users,
  MapPin,
  Clock
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from '@/components/AdminLayout';

interface EventStats {
  total: number;
  published: number;
  draft: number;
  upcoming: number;
  categories: number;
}

interface RecentEvent {
  id: number;
  title: string;
  description: string;
  eventType: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number | null;
  featuredImageUrl: string | null;
  createdAt: string;
}

export default function EventsIndex() {
  // Consulta para obtener estadísticas de eventos
  const { data: stats, isLoading: statsLoading } = useQuery<EventStats>({
    queryKey: ['/api/events/stats'],
    retry: false,
  });

  // Consulta para obtener eventos recientes
  const { data: recentEvents, isLoading: eventsLoading } = useQuery<RecentEvent[]>({
    queryKey: ['/api/events/recent'],
    retry: false,
  });

  const quickActions = [
    {
      title: "Crear Nuevo Evento",
      description: "Agregar un nuevo evento al sistema",
      icon: CalendarPlus,
      href: "/admin/events/new",
      color: "bg-blue-500",
    },
    {
      title: "Gestionar Categorías",
      description: "Administrar categorías de eventos",
      icon: FolderOpen,
      href: "/admin/events/categories",
      color: "bg-green-500",
    },
    {
      title: "Lista de Eventos",
      description: "Ver todos los eventos registrados",
      icon: List,
      href: "/admin/events/list",
      color: "bg-purple-500",
    },
    {
      title: "Calendario de Eventos",
      description: "Vista de calendario de eventos",
      icon: Calendar,
      href: "/admin/events/calendar",
      color: "bg-orange-500",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'postponed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Eventos</h1>
          <p className="text-gray-600 mt-2">
            Administra eventos, categorías y programación de actividades
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <CalendarPlus className="w-4 h-4 mr-2" />
            Nuevo Evento
          </Button>
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="w-6 h-6 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.total || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Publicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 text-green-500 mr-2" />
              <span className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.published || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Borradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-yellow-500 mr-2" />
              <span className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.draft || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Próximos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-6 h-6 text-purple-500 mr-2" />
              <span className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.upcoming || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FolderOpen className="w-6 h-6 text-orange-500 mr-2" />
              <span className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.categories || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link key={index} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Eventos recientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Eventos Recientes</CardTitle>
          <Link href="/admin/events/list">
            <Button variant="outline" size="sm">
              Ver Todos
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentEvents && recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.slice(0, 5).map((event: any) => (
                <div key={event.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-3 h-3 mr-1" />
                        {event.location || 'Sin ubicación'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(event.startDate)}
                      </div>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status === 'published' ? 'Publicado' : 
                         event.status === 'draft' ? 'Borrador' :
                         event.status === 'cancelled' ? 'Cancelado' : event.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay eventos registrados aún</p>
              <Link href="/admin/events/new">
                <Button className="mt-4">
                  Crear Primer Evento
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}