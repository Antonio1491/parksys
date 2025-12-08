import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2,
  Layers,
  Palette,
  Users,
  Calendar,
  PartyPopper,
  ChevronRight
} from 'lucide-react';

import AdminLayout from "@/components/AdminLayout";
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

// Categorías fijas (no editables)
const FIXED_CATEGORIES = [
  { 
    id: 'activity', 
    name: 'Actividad', 
    icon: Calendar,
    description: 'Programación regular y recurrente',
    color: '#00a587'
  },
  { 
    id: 'event', 
    name: 'Evento', 
    icon: PartyPopper,
    description: 'Programación especial y única',
    color: '#00444f'
  },
];

// Subcategorías fijas basadas en capacidad
const FIXED_SUBCATEGORIES = [
  { 
    id: 'actividad_pequena', 
    name: 'Actividad Pequeña', 
    category: 'activity',
    capacityRange: '1-20 personas',
    color: '#ceefea'
  },
  { 
    id: 'actividad_mediana', 
    name: 'Actividad Mediana', 
    category: 'activity',
    capacityRange: '21-50 personas',
    color: '#9dd5cd'
  },
  { 
    id: 'actividad_grande', 
    name: 'Actividad Grande', 
    category: 'activity',
    capacityRange: '51+ personas',
    color: '#00a587'
  },
  { 
    id: 'evento_mini', 
    name: 'Evento Mini', 
    category: 'event',
    capacityRange: '1-100 personas',
    color: '#e0f2f1'
  },
  { 
    id: 'evento_mediano', 
    name: 'Evento Mediano', 
    category: 'event',
    capacityRange: '101-500 personas',
    color: '#80cbc4'
  },
  { 
    id: 'evento_masivo', 
    name: 'Evento Masivo', 
    category: 'event',
    capacityRange: '501+ personas',
    color: '#00444f'
  },
];

// Página de Clasificación
export default function ProgrammingClassification() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('categories');

  // TODO: Conectar con API para ejes temáticos
  const [thematicAxes, setThematicAxes] = useState([
    { id: 1, name: 'Deportivo', description: 'Actividades físicas y deportivas', color: '#4CAF50' },
    { id: 2, name: 'Cultural', description: 'Arte, música y expresión cultural', color: '#9C27B0' },
    { id: 3, name: 'Educativo', description: 'Talleres y capacitaciones', color: '#2196F3' },
    { id: 4, name: 'Ambiental', description: 'Ecología y sustentabilidad', color: '#8BC34A' },
    { id: 5, name: 'Social', description: 'Integración comunitaria', color: '#FF9800' },
  ]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={<Tag className="h-6 w-6" />}
          title={t('programming.classification', 'Clasificación')}
          subtitle={t('programming.classificationDescription', 'Categorías, subcategorías y ejes temáticos')}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {t('programming.categories', 'Categorías')}
            </TabsTrigger>
            <TabsTrigger value="thematic" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t('programming.thematicAxes', 'Ejes Temáticos')}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Categorías y Subcategorías (Solo lectura) */}
          <TabsContent value="categories" className="mt-6 space-y-6">
            {/* Nota informativa */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Las categorías y subcategorías son fijas y se asignan automáticamente 
                según el tipo de programación y la capacidad registrada.
              </p>
            </div>

            {/* Categorías */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-[#00444f]">Categorías</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FIXED_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Card key={category.id} className="border-l-4" style={{ borderLeftColor: category.color }}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-2 rounded-full" 
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: category.color }} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#00444f]">{category.name}</h4>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Subcategorías */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-[#00444f]">Subcategorías por Capacidad</h3>

              {/* Actividades */}
              <div className="mb-6">
                <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#00a587]" />
                  Actividades
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {FIXED_SUBCATEGORIES.filter(s => s.category === 'activity').map((sub) => (
                    <Card key={sub.id} className="bg-[#ceefea]/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-[#00444f]">{sub.name}</h5>
                            <p className="text-sm text-gray-600">{sub.capacityRange}</p>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            Auto
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Eventos */}
              <div>
                <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                  <PartyPopper className="h-4 w-4 text-[#00444f]" />
                  Eventos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {FIXED_SUBCATEGORIES.filter(s => s.category === 'event').map((sub) => (
                    <Card key={sub.id} className="bg-[#00444f]/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-[#00444f]">{sub.name}</h5>
                            <p className="text-sm text-gray-600">{sub.capacityRange}</p>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            Auto
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Ejes Temáticos (CRUD) */}
          <TabsContent value="thematic" className="mt-6">
            {/* Header con botón de agregar */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#00444f]">Ejes Temáticos</h3>
              <Button
                size="sm"
                className="bg-[#007a5e] hover:bg-[#00664e] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Eje
              </Button>
            </div>

            {/* Tabla de ejes temáticos */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Color</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thematicAxes.map((axis) => (
                    <TableRow key={axis.id}>
                      <TableCell>
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: axis.color }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{axis.name}</TableCell>
                      <TableCell className="text-gray-600">{axis.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-600 hover:text-[#00444f] hover:bg-gray-100"
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

            {/* Nota informativa */}
            <div className="mt-4 bg-gray-50 border rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Los ejes temáticos permiten clasificar la programación por su enfoque o propósito principal. 
                Cada actividad o evento puede tener un eje temático asignado.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}