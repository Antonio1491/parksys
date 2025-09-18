import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";
import { DynamicRoleGuard } from "@/components/DynamicRoleGuard";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Save,
  Copy,
  BarChart3,
  Target,
  Zap,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Lightbulb,
  Clock,
  Eye,
  FileText,
  Download
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Interfaces unificadas
interface CalculatorData {
  // Detalles básicos
  title: string;
  concept: string;
  audience: string;
  location: string;
  durationPerClass: number;
  classesPerMonth: number;
  minCapacity: number;
  maxCapacity: number;
  feePerPerson: number;
  
  // Costos directos
  instructorCost: number;
  materialsCost: number;
  variableCostPerPerson: number;
  amenityCost: number;
  otherDirectCosts: number;
  
  // Costos indirectos
  indirect1: number;
  indirect2: number;
  indirect3: number;
  otherIndirectCosts: number;
  
  // Configuración
  desiredMarginPercentage: number;
}

interface ActivityTemplate {
  id: number;
  name: string;
  category: string;
  data: CalculatorData;
}

interface CalculationResults {
  // Por clase
  minNetIncomePerClass: number;
  maxNetIncomePerClass: number;
  minTotalCostsPerClass: number;
  maxTotalCostsPerClass: number;
  minGrossProfitPerClass: number;
  maxGrossProfitPerClass: number;
  
  // Por mes
  minMonthlyIncome: number;
  maxMonthlyIncome: number;
  monthlyTotalCosts: number;
  minMonthlyGrossProfit: number;
  maxMonthlyGrossProfit: number;
  
  // Indicadores
  minGrossMargin: number;
  maxGrossMargin: number;
  instructorCostPercentageMin: number;
  instructorCostPercentageMax: number;
  totalCostPercentageMin: number;
  totalCostPercentageMax: number;
  breakEvenPoint: number;
  
  // Cumplimiento
  minMeetsExpectations: boolean;
  maxMeetsExpectations: boolean;
}

const CalculadoraFinanciera = () => {
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Parse URL search params safely across wouter versions
  const getSearchParams = () => {
    // Use window.location.search for reliability across wouter versions
    const search = typeof window !== 'undefined' ? window.location.search : '';
    return new URLSearchParams(search);
  };
  const [activeTab, setActiveTab] = useState("calculator");
  const [templateName, setTemplateName] = useState("");
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Plantillas predefinidas mejoradas
  const [templates, setTemplates] = useState<ActivityTemplate[]>([
    {
      id: 1,
      name: "Clase de Yoga Matutina",
      category: "Deportivo",
      data: {
        title: "Yoga Matutino",
        concept: "Bienestar",
        audience: "Adultos",
        location: "Área verde",
        durationPerClass: 1,
        classesPerMonth: 20,
        minCapacity: 8,
        maxCapacity: 20,
        feePerPerson: 150,
        instructorCost: 800,
        materialsCost: 200,
        variableCostPerPerson: 50,
        amenityCost: 0,
        otherDirectCosts: 0,
        indirect1: 150,
        indirect2: 100,
        indirect3: 50,
        otherIndirectCosts: 0,
        desiredMarginPercentage: 30
      }
    },
    {
      id: 2,
      name: "Taller de Arte Infantil",
      category: "Cultural",
      data: {
        title: "Taller de Pintura",
        concept: "Entretenimiento",
        audience: "Niños",
        location: "Salón multiusos",
        durationPerClass: 1.5,
        classesPerMonth: 16,
        minCapacity: 6,
        maxCapacity: 15,
        feePerPerson: 200,
        instructorCost: 1000,
        materialsCost: 400,
        variableCostPerPerson: 75,
        amenityCost: 0,
        otherDirectCosts: 0,
        indirect1: 125,
        indirect2: 75,
        indirect3: 50,
        otherIndirectCosts: 0,
        desiredMarginPercentage: 40
      }
    },
    {
      id: 3,
      name: "Aqua Aeróbicos",
      category: "Deportivo",
      data: {
        title: "Aqua Aeróbicos",
        concept: "Deporte",
        audience: "Adultos mayores",
        location: "Alberca",
        durationPerClass: 0.75,
        classesPerMonth: 24,
        minCapacity: 10,
        maxCapacity: 25,
        feePerPerson: 180,
        instructorCost: 900,
        materialsCost: 150,
        variableCostPerPerson: 40,
        amenityCost: 200,
        otherDirectCosts: 0,
        indirect1: 200,
        indirect2: 150,
        indirect3: 50,
        otherIndirectCosts: 0,
        desiredMarginPercentage: 25
      }
    }
  ]);

  // Datos de la calculadora - inicializar con valores por defecto o de URL params
  const [data, setData] = useState<CalculatorData>(() => {
    const searchParams = getSearchParams();
    const activityTitle = searchParams.get('title') || '';
    const activityDuration = parseInt(searchParams.get('duration') || '60');
    const activityCapacity = parseInt(searchParams.get('capacity') || '20');
    const activityPrice = parseInt(searchParams.get('price') || '150');
    
    return {
      title: activityTitle,
      concept: "Entretenimiento",
      audience: "Todos",
      location: "PGB",
      durationPerClass: activityDuration / 60, // Convertir minutos a horas
      classesPerMonth: 20,
      minCapacity: Math.max(1, Math.floor(activityCapacity * 0.6)),
      maxCapacity: activityCapacity,
      feePerPerson: activityPrice,
      instructorCost: 150,
      materialsCost: 50,
      variableCostPerPerson: 10,
      amenityCost: 0,
      otherDirectCosts: 0,
      indirect1: 0,
      indirect2: 0,
      indirect3: 0,
      otherIndirectCosts: 0,
      desiredMarginPercentage: 30
    };
  });

  // Cálculos automáticos (usando la lógica mejorada del CostRecoveryCalculator)
  const calculations = useMemo((): CalculationResults => {
    // Costos por clase
    const totalDirectCosts = data.instructorCost + data.materialsCost + data.amenityCost + data.otherDirectCosts;
    const totalIndirectCosts = data.indirect1 + data.indirect2 + data.indirect3 + data.otherIndirectCosts;
    
    // Ingresos netos por clase
    const minNetIncomePerClass = data.minCapacity * data.feePerPerson;
    const maxNetIncomePerClass = data.maxCapacity * data.feePerPerson;
    
    // Costos totales por clase (fijos + variables por persona)
    const minTotalCostsPerClass = totalDirectCosts + totalIndirectCosts + (data.variableCostPerPerson * data.minCapacity);
    const maxTotalCostsPerClass = totalDirectCosts + totalIndirectCosts + (data.variableCostPerPerson * data.maxCapacity);
    
    // Utilidad bruta por clase
    const minGrossProfitPerClass = minNetIncomePerClass - minTotalCostsPerClass;
    const maxGrossProfitPerClass = maxNetIncomePerClass - maxTotalCostsPerClass;
    
    // Por mes
    const minMonthlyIncome = minNetIncomePerClass * data.classesPerMonth;
    const maxMonthlyIncome = maxNetIncomePerClass * data.classesPerMonth;
    const monthlyTotalCosts = minTotalCostsPerClass * data.classesPerMonth;
    const minMonthlyGrossProfit = minGrossProfitPerClass * data.classesPerMonth;
    const maxMonthlyGrossProfit = maxGrossProfitPerClass * data.classesPerMonth;
    
    // Márgenes
    const minGrossMargin = minNetIncomePerClass > 0 ? (minGrossProfitPerClass / minNetIncomePerClass) * 100 : 0;
    const maxGrossMargin = maxNetIncomePerClass > 0 ? (maxGrossProfitPerClass / maxNetIncomePerClass) * 100 : 0;
    
    // Porcentajes de costos
    const instructorCostPercentageMin = minNetIncomePerClass > 0 ? (data.instructorCost / minNetIncomePerClass) * 100 : 0;
    const instructorCostPercentageMax = maxNetIncomePerClass > 0 ? (data.instructorCost / maxNetIncomePerClass) * 100 : 0;
    const totalCostPercentageMin = minNetIncomePerClass > 0 ? (minTotalCostsPerClass / minNetIncomePerClass) * 100 : 0;
    const totalCostPercentageMax = maxNetIncomePerClass > 0 ? (maxTotalCostsPerClass / maxNetIncomePerClass) * 100 : 0;
    
    // Punto de equilibrio
    const fixedCosts = totalDirectCosts + totalIndirectCosts;
    const contributionMarginPerPerson = data.feePerPerson - data.variableCostPerPerson;
    const breakEvenPoint = contributionMarginPerPerson > 0 ? Math.ceil(fixedCosts / contributionMarginPerPerson) : 0;
    
    // Cumplimiento de expectativas
    const minMeetsExpectations = minGrossMargin >= data.desiredMarginPercentage;
    const maxMeetsExpectations = maxGrossMargin >= data.desiredMarginPercentage;

    return {
      minNetIncomePerClass,
      maxNetIncomePerClass,
      minTotalCostsPerClass,
      maxTotalCostsPerClass,
      minGrossProfitPerClass,
      maxGrossProfitPerClass,
      minMonthlyIncome,
      maxMonthlyIncome,
      monthlyTotalCosts,
      minMonthlyGrossProfit,
      maxMonthlyGrossProfit,
      minGrossMargin,
      maxGrossMargin,
      instructorCostPercentageMin,
      instructorCostPercentageMax,
      totalCostPercentageMin,
      totalCostPercentageMax,
      breakEvenPoint,
      minMeetsExpectations,
      maxMeetsExpectations
    };
  }, [data]);

  // Utilidades
  const updateField = (field: keyof CalculatorData, value: string | number) => {
    setData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? (isNaN(Number(value)) ? value : Number(value)) : value
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  // Datos para gráficos
  const chartData = useMemo(() => {
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      monthlyData.push({
        month: `Mes ${month}`,
        ingresos: calculations.maxMonthlyIncome,
        costos: calculations.monthlyTotalCosts,
        utilidad: calculations.maxMonthlyGrossProfit
      });
    }
    return monthlyData;
  }, [calculations]);

  // Análisis de precios
  const priceAnalysisData = useMemo(() => {
    const analysis = [];
    const basePrice = data.feePerPerson;
    for (let multiplier = 0.5; multiplier <= 2; multiplier += 0.25) {
      const price = basePrice * multiplier;
      const revenue = data.maxCapacity * price;
      const costs = calculations.maxTotalCostsPerClass;
      const profit = revenue - costs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      analysis.push({
        price: Math.round(price),
        revenue,
        profit,
        margin: Math.round(margin * 100) / 100
      });
    }
    return analysis;
  }, [data, calculations]);

  // Gestión de plantillas
  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setData(template.data);
      setSelectedTemplate("");
      toast({
        title: "Plantilla cargada",
        description: `Se ha cargado la plantilla "${template.name}"`
      });
    }
  };

  const saveAsTemplate = () => {
    if (templateName.trim()) {
      const newTemplate: ActivityTemplate = {
        id: templates.length + 1,
        name: templateName,
        category: "Personalizado",
        data: { ...data }
      };
      setTemplates([...templates, newTemplate]);
      setTemplateName("");
      setIsTemplateDialogOpen(false);
      toast({
        title: "Plantilla guardada",
        description: `La plantilla "${newTemplate.name}" se ha guardado exitosamente`
      });
    }
  };

  const copyResults = () => {
    const results = `
Calculadora Financiera - ${data.title}
===================================

RENTABILIDAD POR CLASE:
- Ingreso Mínimo: ${formatCurrency(calculations.minNetIncomePerClass)}
- Ingreso Máximo: ${formatCurrency(calculations.maxNetIncomePerClass)}
- Costos Totales: ${formatCurrency(calculations.maxTotalCostsPerClass)}
- Utilidad Mínima: ${formatCurrency(calculations.minGrossProfitPerClass)}
- Utilidad Máxima: ${formatCurrency(calculations.maxGrossProfitPerClass)}

PROYECCIÓN MENSUAL:
- Ingreso Mensual: ${formatCurrency(calculations.maxMonthlyIncome)}
- Costos Mensuales: ${formatCurrency(calculations.monthlyTotalCosts)}
- Utilidad Mensual: ${formatCurrency(calculations.maxMonthlyGrossProfit)}

INDICADORES:
- Margen de Utilidad: ${formatPercentage(calculations.maxGrossMargin)}
- Punto de Equilibrio: ${calculations.breakEvenPoint} participantes
- Cumple Expectativas: ${calculations.maxMeetsExpectations ? 'Sí' : 'No'}
    `;
    
    navigator.clipboard.writeText(results.trim());
    toast({
      title: "Resultados copiados",
      description: "Los resultados han sido copiados al portapapeles"
    });
  };

  return (
    <AdminLayout>
      <DynamicRoleGuard 
        requiredModule="Finanzas" 
        requiredPermission="read"
        fallback={
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Restringido
            </h2>
            <p className="text-gray-600">
              No tienes permisos para acceder a la calculadora financiera.
            </p>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Calculator className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Calculadora Financiera Unificada
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Análisis completo de rentabilidad y viabilidad financiera para actividades
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Select value={selectedTemplate} onValueChange={loadTemplate}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Cargar plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{template.category}</Badge>
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Guardar Plantilla
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Guardar como Plantilla</DialogTitle>
                        <DialogDescription>
                          Guarda la configuración actual como plantilla reutilizable
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="templateName">Nombre de la plantilla</Label>
                          <Input
                            id="templateName"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="Ej: Clase de Zumba Nocturna"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={saveAsTemplate}>
                            Guardar Plantilla
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button onClick={copyResults} variant="outline" className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Copiar Resultados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs principales */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="calculator">Calculadora</TabsTrigger>
              <TabsTrigger value="analysis">Análisis</TabsTrigger>
              <TabsTrigger value="comparison">Comparación</TabsTrigger>
              <TabsTrigger value="templates">Plantillas</TabsTrigger>
            </TabsList>

            {/* Pestaña Calculadora */}
            <TabsContent value="calculator">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Panel de entrada */}
                <div className="space-y-6">
                  {/* Información básica */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Información Básica
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="title">Título de la Actividad</Label>
                          <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="Ej: Summer Kids"
                          />
                        </div>
                        <div>
                          <Label htmlFor="concept">Concepto</Label>
                          <Select 
                            value={data.concept} 
                            onValueChange={(value) => updateField('concept', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Entretenimiento">Entretenimiento</SelectItem>
                              <SelectItem value="Deporte">Deporte</SelectItem>
                              <SelectItem value="Cultura">Cultura</SelectItem>
                              <SelectItem value="Bienestar">Bienestar</SelectItem>
                              <SelectItem value="Educativo">Educativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="audience">Público Objetivo</Label>
                          <Select 
                            value={data.audience} 
                            onValueChange={(value) => updateField('audience', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Niños">Niños</SelectItem>
                              <SelectItem value="Jóvenes">Jóvenes</SelectItem>
                              <SelectItem value="Adultos">Adultos</SelectItem>
                              <SelectItem value="Adultos mayores">Adultos mayores</SelectItem>
                              <SelectItem value="Familias">Familias</SelectItem>
                              <SelectItem value="Todos">Todos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="location">Ubicación</Label>
                          <Input
                            id="location"
                            value={data.location}
                            onChange={(e) => updateField('location', e.target.value)}
                            placeholder="Ej: Parque Central"
                          />
                        </div>
                        <div>
                          <Label htmlFor="durationPerClass">Duración por Clase (hrs)</Label>
                          <Input
                            id="durationPerClass"
                            type="number"
                            step="0.25"
                            value={data.durationPerClass}
                            onChange={(e) => updateField('durationPerClass', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="classesPerMonth">Clases al Mes</Label>
                          <Input
                            id="classesPerMonth"
                            type="number"
                            value={data.classesPerMonth}
                            onChange={(e) => updateField('classesPerMonth', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="minCapacity">Capacidad Mínima</Label>
                          <Input
                            id="minCapacity"
                            type="number"
                            value={data.minCapacity}
                            onChange={(e) => updateField('minCapacity', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxCapacity">Capacidad Máxima</Label>
                          <Input
                            id="maxCapacity"
                            type="number"
                            value={data.maxCapacity}
                            onChange={(e) => updateField('maxCapacity', Number(e.target.value))}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="feePerPerson">Cuota por Persona</Label>
                          <Input
                            id="feePerPerson"
                            type="number"
                            step="0.01"
                            value={data.feePerPerson}
                            onChange={(e) => updateField('feePerPerson', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Costos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" />
                        Estructura de Costos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Costos Directos</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <Label htmlFor="instructorCost">Instructor</Label>
                              <Input
                                id="instructorCost"
                                type="number"
                                step="0.01"
                                value={data.instructorCost}
                                onChange={(e) => updateField('instructorCost', Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="materialsCost">Materiales</Label>
                              <Input
                                id="materialsCost"
                                type="number"
                                step="0.01"
                                value={data.materialsCost}
                                onChange={(e) => updateField('materialsCost', Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="variableCostPerPerson">Costo Variable/Persona</Label>
                              <Input
                                id="variableCostPerPerson"
                                type="number"
                                step="0.01"
                                value={data.variableCostPerPerson}
                                onChange={(e) => updateField('variableCostPerPerson', Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="amenityCost">Amenidades</Label>
                              <Input
                                id="amenityCost"
                                type="number"
                                step="0.01"
                                value={data.amenityCost}
                                onChange={(e) => updateField('amenityCost', Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Costos Indirectos</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <Label htmlFor="indirect1">Administración</Label>
                              <Input
                                id="indirect1"
                                type="number"
                                step="0.01"
                                value={data.indirect1}
                                onChange={(e) => updateField('indirect1', Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="indirect2">Servicios</Label>
                              <Input
                                id="indirect2"
                                type="number"
                                step="0.01"
                                value={data.indirect2}
                                onChange={(e) => updateField('indirect2', Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="indirect3">Mantenimiento</Label>
                              <Input
                                id="indirect3"
                                type="number"
                                step="0.01"
                                value={data.indirect3}
                                onChange={(e) => updateField('indirect3', Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="desiredMarginPercentage">Margen Deseado (%)</Label>
                              <Input
                                id="desiredMarginPercentage"
                                type="number"
                                step="0.1"
                                value={data.desiredMarginPercentage}
                                onChange={(e) => updateField('desiredMarginPercentage', Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Panel de resultados */}
                <div className="space-y-6">
                  {/* Resumen de rentabilidad */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Resumen de Rentabilidad
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(calculations.maxGrossProfitPerClass)}
                          </div>
                          <div className="text-sm text-green-600">Utilidad por Clase</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatPercentage(calculations.maxGrossMargin)}
                          </div>
                          <div className="text-sm text-blue-600">Margen de Utilidad</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {calculations.breakEvenPoint}
                          </div>
                          <div className="text-sm text-purple-600">Punto de Equilibrio</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(calculations.maxMonthlyGrossProfit)}
                          </div>
                          <div className="text-sm text-orange-600">Utilidad Mensual</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Cumple Expectativas</span>
                          <Badge variant={calculations.maxMeetsExpectations ? "default" : "destructive"}>
                            {calculations.maxMeetsExpectations ? "Sí" : "No"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progreso hacia meta ({formatPercentage(data.desiredMarginPercentage)})</span>
                            <span>{formatPercentage(Math.min(calculations.maxGrossMargin, data.desiredMarginPercentage))}</span>
                          </div>
                          <Progress 
                            value={Math.min((calculations.maxGrossMargin / data.desiredMarginPercentage) * 100, 100)} 
                            className="w-full"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Desglose detallado */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Desglose Detallado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-700 mb-2">Por Clase</div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Ingreso (min-max):</span>
                              <span>{formatCurrency(calculations.minNetIncomePerClass)} - {formatCurrency(calculations.maxNetIncomePerClass)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Costos totales:</span>
                              <span>{formatCurrency(calculations.maxTotalCostsPerClass)}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Utilidad (min-max):</span>
                              <span>{formatCurrency(calculations.minGrossProfitPerClass)} - {formatCurrency(calculations.maxGrossProfitPerClass)}</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="font-medium text-gray-700 mb-2">Proyección Mensual</div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Ingresos esperados:</span>
                              <span>{formatCurrency(calculations.maxMonthlyIncome)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Costos mensuales:</span>
                              <span>{formatCurrency(calculations.monthlyTotalCosts)}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Utilidad mensual:</span>
                              <span>{formatCurrency(calculations.maxMonthlyGrossProfit)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Pestaña Análisis */}
            <TabsContent value="analysis">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Proyección Anual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="ingresos" stroke="#10b981" name="Ingresos" />
                        <Line type="monotone" dataKey="costos" stroke="#f59e0b" name="Costos" />
                        <Line type="monotone" dataKey="utilidad" stroke="#3b82f6" name="Utilidad" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de Precios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={priceAnalysisData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="price" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => Array.isArray(value) ? value.map(v => formatCurrency(v)) : formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#10b981" name="Ingresos" />
                        <Bar dataKey="profit" fill="#3b82f6" name="Utilidad" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Indicadores Clave</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold">{formatPercentage(calculations.instructorCostPercentageMax)}</div>
                        <div className="text-sm text-gray-600">% Costo Instructor</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold">{formatPercentage(calculations.totalCostPercentageMax)}</div>
                        <div className="text-sm text-gray-600">% Costos Totales</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold">{data.maxCapacity - calculations.breakEvenPoint}</div>
                        <div className="text-sm text-gray-600">Margen Seguridad</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold">{data.classesPerMonth}</div>
                        <div className="text-sm text-gray-600">Clases/Mes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Pestaña Comparación */}
            <TabsContent value="comparison">
              <Card>
                <CardHeader>
                  <CardTitle>Comparación de Plantillas</CardTitle>
                  <CardDescription>
                    Compara la rentabilidad de diferentes tipos de actividades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {templates.map(template => {
                      const templateCalcs = calculateMetrics(template.data);
                      return (
                        <div key={template.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{template.name}</h3>
                              <Badge variant="outline">{template.category}</Badge>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => loadTemplate(template.id.toString())}
                            >
                              Cargar
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="font-medium">Ingreso Máx</div>
                              <div>{formatCurrency(templateCalcs.maxRevenue)}</div>
                            </div>
                            <div>
                              <div className="font-medium">Utilidad</div>
                              <div>{formatCurrency(templateCalcs.maxProfit)}</div>
                            </div>
                            <div>
                              <div className="font-medium">Margen</div>
                              <div>{formatPercentage(templateCalcs.maxMargin)}</div>
                            </div>
                            <div>
                              <div className="font-medium">Equilibrio</div>
                              <div>{templateCalcs.breakeven} personas</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pestaña Plantillas */}
            <TabsContent value="templates">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Plantillas Disponibles</CardTitle>
                    <CardDescription>
                      Configuraciones predefinidas para diferentes tipos de actividades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {templates.map(template => (
                        <div key={template.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-gray-500">{template.category}</div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => loadTemplate(template.id.toString())}
                            >
                              Usar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Configuración Actual</CardTitle>
                    <CardDescription>
                      Resumen de los valores configurados actualmente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Actividad:</span>
                        <span className="font-medium">{data.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Concepto:</span>
                        <span>{data.concept}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Capacidad:</span>
                        <span>{data.minCapacity} - {data.maxCapacity} personas</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precio:</span>
                        <span>{formatCurrency(data.feePerPerson)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Clases/mes:</span>
                        <span>{data.classesPerMonth}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Utilidad esperada:</span>
                        <span>{formatCurrency(calculations.maxGrossProfitPerClass)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Margen:</span>
                        <span>{formatPercentage(calculations.maxGrossMargin)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DynamicRoleGuard>
    </AdminLayout>
  );
};

// Función auxiliar para cálculos (compatible con plantillas)
const calculateMetrics = (data: any) => {
  const minCapacity = parseInt(data.minCapacity) || 0;
  const maxCapacity = parseInt(data.maxCapacity) || 0;
  const feePerPerson = parseFloat(data.feePerPerson) || 0;
  const instructorCost = parseFloat(data.instructorCost) || 0;
  const materialsCost = parseFloat(data.materialsCost) || 0;
  const variableCostPerPerson = parseFloat(data.variableCostPerPerson) || 0;
  const indirectCosts = (parseFloat(data.indirect1) || 0) + (parseFloat(data.indirect2) || 0) + (parseFloat(data.indirect3) || 0);

  const minRevenue = minCapacity * feePerPerson;
  const maxRevenue = maxCapacity * feePerPerson;
  
  const fixedCosts = instructorCost + materialsCost + indirectCosts;
  const minTotalCosts = fixedCosts + (minCapacity * variableCostPerPerson);
  const maxTotalCosts = fixedCosts + (maxCapacity * variableCostPerPerson);
  
  const minProfit = minRevenue - minTotalCosts;
  const maxProfit = maxRevenue - maxTotalCosts;
  
  const breakeven = Math.ceil(fixedCosts / (feePerPerson - variableCostPerPerson));
  
  const minMargin = minRevenue > 0 ? (minProfit / minRevenue) * 100 : 0;
  const maxMargin = maxRevenue > 0 ? (maxProfit / maxRevenue) * 100 : 0;

  return {
    minRevenue,
    maxRevenue,
    minTotalCosts,
    maxTotalCosts,
    minProfit,
    maxProfit,
    breakeven,
    minMargin,
    maxMargin,
    fixedCosts
  };
};

export default CalculadoraFinanciera;