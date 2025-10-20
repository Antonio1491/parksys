import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronLeft, ChevronRight, Clock, Users, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/AdminLayout";

interface EventoAmbu {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  fechaEvento?: string; // Formato camelCase
  fechaevento?: string; // Formato lowercase del API
  horaInicio?: string;
  horainicio?: string; // Formato lowercase del API
  horaFin?: string;
  horafin?: string; // Formato lowercase del API
  numeroAsistentes?: number;
  numeroasistentes?: number; // Formato lowercase del API
  status: string;
  costoTotal?: string | number;
}

const statusColors = {
  borrador: "bg-gray-100 text-gray-800",
  solicitado: "bg-blue-100 text-blue-800",
  en_revision: "bg-yellow-100 text-yellow-800",
  aprobado: "bg-green-100 text-green-800",
  rechazado: "bg-red-100 text-red-800",
  cancelado: "bg-gray-100 text-gray-800",
  realizado: "bg-purple-100 text-purple-800"
};


export default function CalendarioEventosAmbu() {
  const [fechaActual, setFechaActual] = useState(new Date());
  
  const mesActual = fechaActual.getMonth();
  const añoActual = fechaActual.getFullYear();
  
  // Obtener eventos del mes actual con manejo robusto de errores
  const { data: eventos = [], isLoading, error } = useQuery({
    queryKey: ["/api/eventos-ambu/calendar", mesActual, añoActual],
    queryFn: async () => {
      try {
        const primerDia = new Date(añoActual, mesActual, 1).toISOString().split('T')[0];
        const ultimoDia = new Date(añoActual, mesActual + 1, 0).toISOString().split('T')[0];
        
        const params = new URLSearchParams({
          fecha_desde: primerDia,
          fecha_hasta: ultimoDia,
          limit: "100"
        });

        const response = await fetch(`/api/eventos-ambu?${params}`);
        if (!response.ok) throw new Error("Error al cargar eventos");
        
        const data = await response.json();
        console.log("Datos recibidos:", data);
        console.log("Eventos encontrados:", data.length);
        
        // Manejo flexible de la estructura de respuesta
        let eventosArray = [];
        if (Array.isArray(data)) {
          eventosArray = data;
        } else if (data.eventos && Array.isArray(data.eventos)) {
          eventosArray = data.eventos;
        } else {
          console.warn("Estructura de datos inesperada:", data);
          eventosArray = [];
        }
        
        return eventosArray;
      } catch (error) {
        console.error("Error en queryFn:", error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 0 // Siempre refrescar datos
  });

  const navegarMes = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaActual);
    if (direccion === 'anterior') {
      nuevaFecha.setMonth(mesActual - 1);
    } else {
      nuevaFecha.setMonth(mesActual + 1);
    }
    setFechaActual(nuevaFecha);
  };

  const obtenerEventosDelDia = (dia: number) => {
    const fechaDia = new Date(añoActual, mesActual, dia).toISOString().split('T')[0];
    const eventosDelDia = eventos.filter((evento: EventoAmbu) => {
      // Manejar ambos formatos de fecha: fechaEvento y fechaevento
      const fechaEvento = (evento.fechaEvento || evento.fechaevento || '').split('T')[0];
      const coincide = fechaEvento === fechaDia;
      if (dia === 16 && mesActual === 7) { // Debug para agosto 16
        console.log(`Comparando evento ${evento.id} (${evento.titulo}): ${fechaEvento} === ${fechaDia}? ${coincide}`);
      }
      return coincide;
    });
    return eventosDelDia;
  };

  const obtenerDiasDelMes = () => {
    const primerDia = new Date(añoActual, mesActual, 1);
    const ultimoDia = new Date(añoActual, mesActual + 1, 0);
    const primerDiaSemana = primerDia.getDay();
    const diasEnMes = ultimoDia.getDate();
    
    const dias = [];
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(null);
    }
    
    // Agregar días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push(dia);
    }
    
    return dias;
  };

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const formatearCategoria = (categoria: string) => {
    const categorias: Record<string, string> = {
      evento_familiar: "Evento Familiar",
      sesion_fotografia: "Sesión Fotográfica",
      convivencia_escolar: "Convivencia Escolar",
      sendero_interpretativo: "Sendero Interpretativo", 
      recorrido_educativo: "Recorrido Educativo",
      evento_masivo: "Evento Masivo",
      evento_comercial: "Evento Comercial",
      evento_cooperativo: "Evento Cooperativo",
      carrera_deportiva: "Carrera Deportiva",
      actividad_fisica_grupal: "Actividad Física Grupal",
      evento_corporativo: "Evento Corporativo"
    };
    return categorias[categoria] || categoria;
  };

  // Función segura para formatear costo
  const formatearCosto = (costo: string | number | undefined): string => {
    if (!costo) return "0.00";
    const numero = typeof costo === 'string' ? parseFloat(costo) : costo;
    return isNaN(numero) ? "0.00" : numero.toFixed(2);
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">Error al cargar el calendario</p>
            <p className="text-gray-600 mt-2">{error.message}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando calendario...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con patrón Card estandarizado */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <Calendar className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">
              Calendario de Eventos
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Vista mensual de eventos AMBU ({eventos.length} eventos cargados)
          </p>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendario Principal */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {nombresMeses[mesActual]} {añoActual}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navegarMes('anterior')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navegarMes('siguiente')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Encabezados de días */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {nombresDias.map((dia) => (
                    <div key={dia} className="p-2 text-center text-sm font-medium text-gray-600">
                      {dia}
                    </div>
                  ))}
                </div>
                
                {/* Días del calendario */}
                <div className="grid grid-cols-7 gap-1">
                  {obtenerDiasDelMes().map((dia, index) => {
                    const eventosDelDia = dia ? obtenerEventosDelDia(dia) : [];
                    
                    return (
                      <div key={`${index}-${dia || 'empty'}`} className="min-h-24 p-1 border border-gray-200 rounded">
                        {dia && (
                          <>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {dia}
                            </div>
                            <div className="space-y-1">
                              {eventosDelDia.slice(0, 2).map((evento: EventoAmbu) => (
                                <div
                                  key={`evento-${evento.id}`}
                                  className="text-xs p-1 rounded text-white bg-blue-500"
                                  title={evento.titulo}
                                >
                                  {evento.titulo.length > 15 
                                    ? evento.titulo.substring(0, 15) + '...' 
                                    : evento.titulo
                                  }
                                </div>
                              ))}
                              {eventosDelDia.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{eventosDelDia.length - 2} más
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Próximos Eventos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximos Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventos
                    .filter((evento: EventoAmbu) => new Date(evento.fechaEvento || evento.fechaevento || '') >= new Date())
                    .sort((a: EventoAmbu, b: EventoAmbu) => new Date(a.fechaEvento || a.fechaevento || '').getTime() - new Date(b.fechaEvento || b.fechaevento || '').getTime())
                    .slice(0, 5)
                    .map((evento: EventoAmbu) => (
                      <div key={`proximo-${evento.id}`} className="border-l-4 border-blue-500 pl-3 py-2">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm line-clamp-2">{evento.titulo}</h4>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {new Date(evento.fechaEvento || evento.fechaevento || '').toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="h-3 w-3" />
                            {evento.horaInicio || evento.horainicio} - {evento.horaFin || evento.horafin}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Users className="h-3 w-3" />
                            {evento.numeroAsistentes || evento.numeroasistentes} asistentes
                          </div>
                          {evento.costoTotal && parseFloat(formatearCosto(evento.costoTotal)) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <DollarSign className="h-3 w-3" />
                              ${formatearCosto(evento.costoTotal)}
                            </div>
                          )}
                        </div>
                        <Badge className={statusColors[evento.status as keyof typeof statusColors]} variant="outline">
                          {evento.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  
                  {eventos.filter((evento: EventoAmbu) => new Date(evento.fechaEvento || evento.fechaevento || '') >= new Date()).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay eventos próximos
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leyenda */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leyenda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Estados</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Solicitado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>En Revisión</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Aprobado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Realizado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}