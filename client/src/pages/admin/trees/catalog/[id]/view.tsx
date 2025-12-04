import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Pencil, 
  Leaf, 
  TreePine, 
  Sprout, 
  AlertCircle,
  MapPin,
  Calendar,
  Ruler,
  Droplets,
  Sun,
  Mountain,
  Clock,
  Download,
  FileText
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TreeSpeciesIcon from '@/components/ui/tree-species-icon';
import { ReturnHeader } from '@/components/ui/return-header';
import ROUTES from '@/routes';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

// Helper para obtener estilos de badge según origen
const getOriginBadgeStyles = (origin: string) => {
  switch (origin) {
    case 'Nativo':
      return 'bg-[#cff9c5] text-gray-800';
    case 'Introducido':
      return 'bg-[#c5efff] text-gray-800';
    case 'Naturalizado':
      return 'bg-[#f1e3ff] text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper para obtener color de fondo según tasa de crecimiento
const getGrowthRateBackground = (growthRate: string) => {
  switch (growthRate) {
    case 'Lento':
      return '#a6b2ed';
    case 'Medio':
      return '#efcda5';
    case 'Rapido':
    case 'Rápido':
      return '#99dd9c';
    default:
      return '#e5e7eb';
  }
};

interface TreeSpecies {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  origin: string;
  growthRate: string;
  description?: string;
  imageUrl?: string;
  isEndangered: boolean;
  iconType?: 'system' | 'custom';
  customIconUrl?: string | null;
  climateZone?: string;
  heightMature?: string;
  canopyDiameter?: string;
  lifespan?: string;
  maintenanceRequirements?: string;
  waterRequirements?: string;
  sunRequirements?: string;
  soilRequirements?: string;
  ecologicalBenefits?: string;
  ornamentalValue?: string;
  commonUses?: string;
}

export default function TreeSpeciesDetailView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { data: species, isLoading, error } = useQuery<TreeSpecies>({
    queryKey: [`/api/tree-species/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/tree-species/${id}`);
      if (!response.ok) {
        throw new Error('Error al cargar la especie');
      }
      return response.json();
    },
    enabled: !!id,
  });

  const handleEdit = () => {
    if (id) {
      setLocation(ROUTES.admin.trees.species.edit.build(id));
    }
  };

  // Función para exportar a CSV
  const exportToCSV = () => {
    if (!species) return;

    const csvData = [
      ['Campo', 'Valor'],
      ['=== INFORMACIÓN BÁSICA ===', ''],
      ['Nombre Común', species.commonName || ''],
      ['Nombre Científico', species.scientificName || ''],
      ['Familia', species.family || ''],
      ['Origen', species.origin || ''],
      ['Tasa de Crecimiento', species.growthRate || ''],
      ['Estado de Conservación', species.isEndangered ? 'Amenazada' : 'Normal'],
      ['', ''],
      ['=== CARACTERÍSTICAS ===', ''],
      ['Zona Climática', species.climateZone || ''],
      ['Esperanza de Vida', species.lifespan || ''],
      ['Altura al Madurar', species.heightMature || ''],
      ['Diámetro de Copa', species.canopyDiameter || ''],
      ['Valor Ornamental', species.ornamentalValue || ''],
      ['Usos Comunes', species.commonUses || ''],
      ['', ''],
      ['=== REQUERIMIENTOS ===', ''],
      ['Suelo', species.soilRequirements || ''],
      ['Agua', species.waterRequirements || ''],
      ['Sol', species.sunRequirements || ''],
      ['Mantenimiento', species.maintenanceRequirements || ''],
      ['', ''],
      ['=== DESCRIPCIÓN ===', ''],
      ['Descripción', species.description || ''],
      ['Beneficios Ecológicos', species.ecologicalBenefits || ''],
    ];

    const csvContent = csvData
      .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `especie_${species.commonName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    setIsExportModalOpen(false);
    toast({
      title: '✅ Exportación exitosa',
      description: `Los datos de "${species.commonName}" se han exportado en formato CSV.`,
    });
  };

  // Función para exportar a PDF
  const exportToPDF = () => {
    if (!species) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Error',
        description: 'No se pudo abrir la ventana de impresión.',
        variant: 'destructive',
      });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ficha de Especie - ${species.commonName}</title>
        <style>
          @media print { @page { margin: 2cm; } }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #00a587;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 { color: #00444f; margin: 0; font-size: 32px; }
          .header p { color: #666; margin: 5px 0; font-style: italic; }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section-title {
            background: #ceefea;
            color: #00444f;
            padding: 10px 15px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            border-left: 5px solid #00a587;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item {
            padding: 10px;
            background: #f9f9f9;
            border-radius: 5px;
          }
          .info-label { font-weight: bold; color: #00444f; font-size: 14px; }
          .info-value { color: #555; font-size: 14px; margin-top: 3px; }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
          }
          .badge-native { background: #cff9c5; color: #333; }
          .badge-introduced { background: #c5efff; color: #333; }
          .badge-endangered { background: #fee2e2; color: #991b1b; }
          .badge-normal { background: #dcfce7; color: #166534; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${species.commonName}</h1>
          <p>${species.scientificName}</p>
          <p style="color: #999; font-size: 12px; font-style: normal;">
            Ficha generada el ${new Date().toLocaleDateString('es-MX', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        <div class="section">
          <div class="section-title">🌳 Información Taxonómica</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nombre Común</div>
              <div class="info-value">${species.commonName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Nombre Científico</div>
              <div class="info-value" style="font-style: italic;">${species.scientificName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Familia</div>
              <div class="info-value">${species.family}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Origen</div>
              <div class="info-value">
                <span class="badge ${species.origin === 'Nativo' ? 'badge-native' : 'badge-introduced'}">
                  ${species.origin}
                </span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Tasa de Crecimiento</div>
              <div class="info-value">${species.growthRate}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Estado de Conservación</div>
              <div class="info-value">
                <span class="badge ${species.isEndangered ? 'badge-endangered' : 'badge-normal'}">
                  ${species.isEndangered ? '⚠️ Amenazada' : '✓ Normal'}
                </span>
              </div>
            </div>
          </div>
        </div>

        ${species.description ? `
        <div class="section">
          <div class="section-title">📝 Descripción</div>
          <p style="text-align: justify;">${species.description}</p>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">📏 Características Físicas</div>
          <div class="info-grid">
            ${species.heightMature ? `
            <div class="info-item">
              <div class="info-label">Altura al Madurar</div>
              <div class="info-value">${species.heightMature}</div>
            </div>` : ''}
            ${species.canopyDiameter ? `
            <div class="info-item">
              <div class="info-label">Diámetro de Copa</div>
              <div class="info-value">${species.canopyDiameter}</div>
            </div>` : ''}
            ${species.lifespan ? `
            <div class="info-item">
              <div class="info-label">Esperanza de Vida</div>
              <div class="info-value">${species.lifespan}</div>
            </div>` : ''}
            ${species.climateZone ? `
            <div class="info-item">
              <div class="info-label">Zona Climática</div>
              <div class="info-value">${species.climateZone}</div>
            </div>` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">🌱 Requerimientos de Cultivo</div>
          <div class="info-grid">
            ${species.soilRequirements ? `
            <div class="info-item">
              <div class="info-label">Suelo</div>
              <div class="info-value">${species.soilRequirements}</div>
            </div>` : ''}
            ${species.waterRequirements ? `
            <div class="info-item">
              <div class="info-label">Agua</div>
              <div class="info-value">${species.waterRequirements}</div>
            </div>` : ''}
            ${species.sunRequirements ? `
            <div class="info-item">
              <div class="info-label">Sol</div>
              <div class="info-value">${species.sunRequirements}</div>
            </div>` : ''}
            ${species.maintenanceRequirements ? `
            <div class="info-item">
              <div class="info-label">Mantenimiento</div>
              <div class="info-value">${species.maintenanceRequirements}</div>
            </div>` : ''}
          </div>
        </div>

        ${species.ecologicalBenefits ? `
        <div class="section">
          <div class="section-title">🌍 Beneficios Ecológicos</div>
          <p style="text-align: justify;">${species.ecologicalBenefits}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p><strong>ParkSys</strong> - Sistema Integral de Gestión de Parques Urbanos</p>
          <p>Catálogo de Especies Arbóreas</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 100);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setIsExportModalOpen(false);
    toast({
      title: '✅ Generando PDF',
      description: 'Se ha abierto la ventana de impresión.',
    });
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Error al cargar la especie</h3>
            <p className="text-gray-500 mt-2">No se pudo cargar la información de la especie.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!species) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Especie no encontrada</h3>
            <p className="text-gray-500 mt-2">No se encontró la especie solicitada.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header con botón volver */}
      <ReturnHeader />

      <div className="space-y-4">
        {/* Header principal */}
        <div className="bg-white p-8 -mx-6 relative">
          {/* Botones de acción */}
          <div className="absolute top-12 right-12 z-10">
            <div className="flex gap-2">
              <Button 
                onClick={handleEdit}
                className="bg-[#a0cc4d] hover:bg-[#00a884] text-white"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                onClick={() => setIsExportModalOpen(true)}
                className="bg-[#00444f] hover:bg-[#00a587] text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-10">
            {/* Icono de la especie */}
            <div className="w-48 h-48 rounded-lg bg-green-50 flex-shrink-0 flex items-center justify-center border-2 border-green-100">
              <TreeSpeciesIcon
                iconType={species.iconType || 'system'}
                customIconUrl={species.customIconUrl || undefined}
                size={120}
                className="text-green-600"
              />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#00444f] mt-2">
                {species.commonName}
              </h1>
              <p className="text-xl italic text-gray-600 mt-1">
                {species.scientificName}
              </p>

              {/* Información clave en fila */}
              <div className="flex items-start gap-10 mt-8">
                {/* Familia */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <TreePine className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Familia</p>
                    <p className="text-sm text-gray-900 font-medium mt-1">{species.family}</p>
                  </div>
                </div>

                {/* Origen */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <MapPin className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Origen</p>
                    <Badge 
                      variant="outline"
                      className={`mt-1 text-xs px-3 py-1 ${getOriginBadgeStyles(species.origin)}`}
                    >
                      {species.origin}
                    </Badge>
                  </div>
                </div>

                {/* Crecimiento */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <Sprout className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Crecimiento</p>
                    <Badge 
                      variant="outline"
                      className="mt-1 text-xs px-3 py-1 text-gray-800"
                      style={{ backgroundColor: getGrowthRateBackground(species.growthRate) }}
                    >
                      {species.growthRate}
                    </Badge>
                  </div>
                </div>

                {/* Estado de conservación */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <AlertCircle className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Conservación</p>
                    {species.isEndangered ? (
                      <Badge variant="outline" className="mt-1 bg-red-100 text-red-800 border-red-300 text-xs px-3 py-1">
                        Amenazada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-1 bg-green-100 text-green-800 border-green-300 text-xs px-3 py-1">
                        Normal
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {species.description && (
                <div className="mt-6">
                  <p className="text-gray-700 leading-relaxed">
                    {species.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Altura */}
          <Card className="bg-[#ceefea] border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <Ruler className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Altura Madura</p>
                  <p className="text-xl font-bold text-[#00444f]">
                    {species.heightMature || 'No especificada'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copa */}
          <Card className="bg-[#ceefea] border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <TreePine className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Diámetro de Copa</p>
                  <p className="text-xl font-bold text-[#00444f]">
                    {species.canopyDiameter || 'No especificado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Esperanza de vida */}
          <Card className="bg-[#ceefea] border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Esperanza de Vida</p>
                  <p className="text-xl font-bold text-[#00444f]">
                    {species.lifespan || 'No especificada'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zona Climática */}
          <Card className="bg-[#ceefea] border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <Mountain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Zona Climática</p>
                  <p className="text-xl font-bold text-[#00444f]">
                    {species.climateZone || 'No especificada'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs con información detallada */}
        <Tabs defaultValue="cultivation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cultivation">Cultivo y Cuidados</TabsTrigger>
            <TabsTrigger value="benefits">Beneficios y Usos</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
          </TabsList>

          {/* Tab: Cultivo y Cuidados */}
          <TabsContent value="cultivation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  Requerimientos de Cultivo
                </CardTitle>
                <CardDescription>
                  Condiciones óptimas para el desarrollo de esta especie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Suelo */}
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Mountain className="h-5 w-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-900">Suelo</h4>
                    </div>
                    <p className="text-sm text-amber-800">
                      {species.soilRequirements || 'No especificado'}
                    </p>
                  </div>

                  {/* Agua */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Agua</h4>
                    </div>
                    <p className="text-sm text-blue-800">
                      {species.waterRequirements || 'No especificado'}
                    </p>
                  </div>

                  {/* Sol */}
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold text-yellow-900">Sol</h4>
                    </div>
                    <p className="text-sm text-yellow-800">
                      {species.sunRequirements || 'No especificado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Beneficios y Usos */}
          <TabsContent value="benefits" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Beneficios Ecológicos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    Beneficios Ecológicos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {species.ecologicalBenefits || 'No se han registrado beneficios ecológicos para esta especie.'}
                  </p>
                </CardContent>
              </Card>

              {/* Valor Ornamental y Usos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TreePine className="h-5 w-5 text-green-600" />
                    Valor Ornamental y Usos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {species.ornamentalValue && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Valor Ornamental</h4>
                      <p className="text-gray-700">{species.ornamentalValue}</p>
                    </div>
                  )}
                  {species.commonUses && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Usos Comunes</h4>
                      <p className="text-gray-700">{species.commonUses}</p>
                    </div>
                  )}
                  {!species.ornamentalValue && !species.commonUses && (
                    <p className="text-gray-500 italic">
                      No se han registrado usos para esta especie.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Mantenimiento */}
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  Requisitos de Mantenimiento
                </CardTitle>
                <CardDescription>
                  Cuidados y mantenimiento recomendados para esta especie
                </CardDescription>
              </CardHeader>
              <CardContent>
                {species.maintenanceRequirements ? (
                  <p className="text-gray-700 leading-relaxed">
                    {species.maintenanceRequirements}
                  </p>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Sprout className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>No se han registrado requisitos de mantenimiento específicos para esta especie.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Exportación */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Ficha de Especie</DialogTitle>
            <DialogDescription>
              Selecciona el formato en el que deseas exportar la información de {species?.commonName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* PDF */}
            <button
              onClick={exportToPDF}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#00a587] hover:bg-[#ceefea] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Exportar PDF Completo</h3>
                  <p className="text-sm text-gray-600">
                    Ficha completa con información taxonómica, características y requerimientos.
                  </p>
                </div>
              </div>
            </button>

            {/* CSV */}
            <button
              onClick={exportToCSV}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#00a587] hover:bg-[#ceefea] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Exportar CSV</h3>
                  <p className="text-sm text-gray-600">
                    Datos en formato CSV. Ideal para análisis en Excel.
                  </p>
                </div>
              </div>
            </button>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}