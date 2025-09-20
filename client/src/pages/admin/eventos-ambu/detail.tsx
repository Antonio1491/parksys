import React from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Edit,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/AdminLayout";

interface EventoDetalle {
  evento: {
    id: number;
    titulo: string;
    descripcion: string;
    categoria: string;
    fechaEvento: string;
    horaInicio: string;
    horaFin: string;
    numeroAsistentes: number;
    status: string;
    costoTotal: number;
    createdAt: string;
  };
  solicitud: {
    nombreSolicitante: string;
    telefonoSolicitante: string;
    emailSolicitante: string;
    nombreInstitucion?: string;
    domicilioCalle?: string;
    domicilioNumero?: string;
    domicilioColonia?: string;
    domicilioCP?: string;
    municipio?: string;
    rfc?: string;
    razonSocial?: string;
  };
  documentos: any[];
  costos: any[];
  seguimiento: any[];
  reuniones: any[];
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


export default function DetalleEventoAmbu() {
  const params = useParams();
  const eventoId = params.id;

  const { data: evento, isLoading, error } = useQuery({
    queryKey: [`/api/eventos-ambu/${eventoId}`],
    queryFn: async () => {
      const response = await fetch(`/api/eventos-ambu/${eventoId}`);
      if (!response.ok) throw new Error("Error al cargar evento");
      return response.json();
    },
    suspense: false,
    retry: 1
  });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprobado":
        return <CheckCircle className="h-4 w-4" />;
      case "rechazado":
        return <AlertTriangle className="h-4 w-4" />;
      case "en_revision":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando detalles del evento...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !evento || !evento.evento) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-red-600">Error al cargar el evento</p>
          <Link href="/admin/eventos-ambu">
            <Button className="mt-4">Volver al listado</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/eventos-ambu">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {evento.evento.titulo}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={statusColors[evento.evento.status as keyof typeof statusColors]}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(evento.evento.status)}
                  {evento.evento.status.replace("_", " ").toUpperCase()}
                </div>
              </Badge>
              <span className="text-sm text-gray-500">
                ID: {evento.evento.id}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/admin/eventos-ambu/${eventoId}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Información General</TabsTrigger>
          <TabsTrigger value="solicitante">Solicitante</TabsTrigger>
          <TabsTrigger value="costos">Costos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
        </TabsList>

        {/* Información General */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Detalles del Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Categoría</Label>
                  <p className="text-sm">{formatearCategoria(evento.evento.categoria)}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Descripción</Label>
                  <p className="text-sm">{evento.evento.descripcion}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Fecha</Label>
                    <p className="text-sm">{new Date(evento.evento.fechaEvento).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Horario</Label>
                    <p className="text-sm">{evento.evento.horaInicio} - {evento.evento.horaFin}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Número de Asistentes</Label>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{evento.evento.numeroAsistentes} personas</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Fecha de Solicitud</Label>
                  <p className="text-sm">{new Date(evento.evento.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {evento.evento.costoTotal > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Información Financiera
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Costo Total</Label>
                    <p className="text-2xl font-bold text-green-600">
                      ${evento.evento.costoTotal.toFixed(2)} MXN
                    </p>
                  </div>

                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Información del Solicitante */}
        <TabsContent value="solicitante">
          <Card>
            <CardHeader>
              <CardTitle>Información del Solicitante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Datos Personales</h3>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nombre Completo</Label>
                    <p className="text-sm">{evento.solicitud.nombreSolicitante}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Teléfono</Label>
                    <p className="text-sm">{evento.solicitud.telefonoSolicitante}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-sm">{evento.solicitud.emailSolicitante}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Datos Institucionales</h3>
                  
                  {evento.solicitud.nombreInstitucion && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Institución</Label>
                      <p className="text-sm">{evento.solicitud.nombreInstitucion}</p>
                    </div>
                  )}
                  
                  {evento.solicitud.domicilioCalle && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Dirección</Label>
                      <p className="text-sm">
                        {evento.solicitud.domicilioCalle} {evento.solicitud.domicilioNumero}<br />
                        {evento.solicitud.domicilioColonia}, {evento.solicitud.municipio}<br />
                        CP: {evento.solicitud.domicilioCP}
                      </p>
                    </div>
                  )}

                  {evento.solicitud.rfc && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Datos Fiscales</Label>
                      <p className="text-sm">
                        <strong>RFC:</strong> {evento.solicitud.rfc}<br />
                        <strong>Razón Social:</strong> {evento.solicitud.razonSocial}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costos */}
        <TabsContent value="costos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Desglose de Costos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evento.costos && evento.costos.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Concepto</th>
                          <th className="text-center py-2">Cantidad</th>
                          <th className="text-right py-2">Precio Unitario</th>
                          <th className="text-right py-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evento.costos.map((costo: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">
                              <div>
                                <p className="font-medium">{costo.concepto}</p>
                                {costo.descripcion && (
                                  <p className="text-sm text-gray-600">{costo.descripcion}</p>
                                )}
                              </div>
                            </td>
                            <td className="text-center py-2">{costo.cantidad}</td>
                            <td className="text-right py-2">${costo.precioUnitario.toFixed(2)}</td>
                            <td className="text-right py-2 font-semibold">${costo.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold">
                          <td colSpan={3} className="text-right py-2">Total:</td>
                          <td className="text-right py-2 text-lg">${evento.evento.costoTotal.toFixed(2)} MXN</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hay información de costos disponible
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evento.documentos && evento.documentos.length > 0 ? (
                <div className="space-y-3">
                  {evento.documentos.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.tipoDocumento}</p>
                          <p className="text-sm text-gray-600">{doc.nombreArchivo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          doc.status === "validado" ? "bg-green-50 text-green-700" :
                          doc.status === "rechazado" ? "bg-red-50 text-red-700" :
                          "bg-yellow-50 text-yellow-700"
                        }>
                          {doc.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No se han subido documentos
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seguimiento */}
        <TabsContent value="seguimiento">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Seguimiento</CardTitle>
            </CardHeader>
            <CardContent>
              {evento.seguimiento && evento.seguimiento.length > 0 ? (
                <div className="space-y-4">
                  {evento.seguimiento.map((seg: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-3">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium">{seg.accion.replace("_", " ").toUpperCase()}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(seg.fechaAccion).toLocaleString()}
                        </span>
                      </div>
                      {seg.observaciones && (
                        <p className="text-sm text-gray-600 mb-1">{seg.observaciones}</p>
                      )}
                      {seg.responsable && (
                        <p className="text-xs text-gray-500">Responsable: {seg.responsable}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hay historial de seguimiento
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
    </AdminLayout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}