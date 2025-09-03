import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Search, 
  Users, 
  BarChart3, 
  MapPin, 
  TreeDeciduous,
  Activity,
  DollarSign,
  Shield,
  MessageSquare,
  BookOpen,
  FileText,
  Video,
  ExternalLink
} from 'lucide-react';

interface HelpItem {
  id: string;
  title: string;
  description: string;
  module: string;
  type: 'manual' | 'guide' | 'video' | 'faq';
  content?: string;
  url?: string;
  icon: React.ReactNode;
}

const helpItems: HelpItem[] = [
  {
    id: 'visitantes-manual',
    title: 'Manual Completo - Módulo de Visitantes',
    description: 'Guía completa para Dashboard, Conteo, Evaluaciones, Criterios y Retroalimentación',
    module: 'Visitantes',
    type: 'manual',
    url: '/help/visitantes-manual',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'parques-manual',
    title: 'Manual Completo - Gestión de Parques',
    description: 'Guía completa para Dashboard, Gestión, Evaluaciones y Amenidades de Parques',
    module: 'Parques',
    type: 'manual',
    url: '/help/parques-manual',
    icon: <MapPin className="h-4 w-4" />
  },
  {
    id: 'arbolado-manual',
    title: 'Manual de Arbolado Urbano',
    description: 'Inventario, especies y mantenimiento de árboles',
    module: 'Arbolado',
    type: 'manual',
    url: '/help/arbolado-manual',
    icon: <TreeDeciduous className="h-4 w-4" />
  },
  {
    id: 'actividades-manual',
    title: 'Manual Completo - Gestión de Actividades',
    description: 'Guía completa para gestionar actividades, categorías, instructores, inscripciones y horarios',
    module: 'Actividades',
    type: 'manual',
    url: '/help/actividades-manual',
    icon: <Activity className="h-4 w-4" />
  },
  {
    id: 'finanzas-manual',
    title: 'Sistema Financiero y Contable',
    description: 'Presupuestos, gastos, ingresos y reportes financieros',
    module: 'Finanzas',
    type: 'manual',
    url: '/help/finanzas-manual',
    icon: <DollarSign className="h-4 w-4" />
  },
  {
    id: 'seguridad-guide',
    title: 'Configuración de Seguridad',
    description: 'Usuarios, permisos y auditoría del sistema',
    module: 'Seguridad',
    type: 'guide',
    url: '/help/seguridad-guide',
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: 'comunicacion-faq',
    title: 'FAQ - Marketing y Comunicación',
    description: 'Preguntas frecuentes sobre campañas y publicidad',
    module: 'Comunicación',
    type: 'faq',
    url: '/help/comunicacion-faq',
    icon: <MessageSquare className="h-4 w-4" />
  },
  {
    id: 'getting-started',
    title: 'Primeros Pasos en ParkSys',
    description: 'Guía introductoria para nuevos usuarios',
    module: 'General',
    type: 'guide',
    url: '/help/getting-started',
    icon: <BookOpen className="h-4 w-4" />
  }
];

const moduleColors: Record<string, string> = {
  'Visitantes': 'bg-blue-100 text-blue-800',
  'Parques': 'bg-green-100 text-green-800',
  'Arbolado': 'bg-emerald-100 text-emerald-800',
  'Actividades': 'bg-purple-100 text-purple-800',
  'Finanzas': 'bg-yellow-100 text-yellow-800',
  'Seguridad': 'bg-red-100 text-red-800',
  'Comunicación': 'bg-indigo-100 text-indigo-800',
  'General': 'bg-gray-100 text-gray-800'
};

const typeIcons = {
  manual: <FileText className="h-4 w-4" />,
  guide: <BookOpen className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  faq: <HelpCircle className="h-4 w-4" />
};

interface HelpCenterProps {
  children: React.ReactNode;
}

export function HelpCenter({ children }: HelpCenterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  const filteredItems = helpItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.module.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'all' || item.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const modules = Array.from(new Set(helpItems.map(item => item.module)));

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Centro de Ayuda ParkSys
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="documentation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documentation">Documentación</TabsTrigger>
            <TabsTrigger value="quickstart">Inicio Rapido</TabsTrigger>
            <TabsTrigger value="contact">Soporte</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documentation" className="space-y-4">
            {/* Barra de búsqueda y filtros */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar en la documentación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los módulos</option>
                {modules.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>

            {/* Resultados de búsqueda */}
            <ScrollArea className="h-[400px]">
              <div className="grid gap-4">
                {filteredItems.map(item => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <div>
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {item.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={moduleColors[item.module]}>
                            {item.module}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {typeIcons[item.type]}
                            <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(item.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir Documentación
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron resultados para "{searchTerm}"</p>
                    <p className="text-sm mt-2">Intente con otros términos de búsqueda</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="quickstart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bienvenido a ParkSys</CardTitle>
                <CardDescription>
                  Guía rápida para comenzar a usar el sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">1. Explore el Dashboard</h4>
                      <p className="text-sm text-gray-600">
                        Comience revisando las métricas principales en el panel de control
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">2. Configure su Perfil</h4>
                      <p className="text-sm text-gray-600">
                        Actualice su información personal y preferencias del sistema
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">3. Familiarícese con los Módulos</h4>
                      <p className="text-sm text-gray-600">
                        Explore cada módulo usando el menú lateral para entender las funcionalidades
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" onClick={() => window.open('/help/getting-started', '_blank')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver Guía Completa
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contacto y Soporte Técnico</CardTitle>
                <CardDescription>
                  ¿Necesita ayuda adicional? Contáctenos a través de los siguientes canales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Email de Soporte</p>
                      <p className="text-sm text-gray-600">soporte@parquesdemexico.org</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <HelpCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <p className="text-sm text-gray-600">+52 (33) 1234-5678</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Horario de Atención</p>
                      <p className="text-sm text-gray-600">Lunes a Viernes, 8:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Consejos para Soporte Efectivo</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Incluya capturas de pantalla del problema</li>
                    <li>• Describa los pasos que realizó antes del error</li>
                    <li>• Proporcione su nombre de usuario y módulo afectado</li>
                    <li>• Mencione el navegador y dispositivo que utiliza</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}