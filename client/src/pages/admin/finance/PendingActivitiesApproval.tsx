import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import { DynamicRoleGuard } from "@/components/DynamicRoleGuard";
import { 
  CheckCircle, 
  XCircle, 
  Calculator, 
  Clock, 
  Users, 
  MapPin, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileText,
  Target,
  Filter,
  Eye
} from "lucide-react";
import CostRecoveryCalculator from "./CostRecoveryCalculator";
import AdvancedCalculator from "./AdvancedCalculator";

interface PendingActivity {
  id: number;
  title: string;
  description: string;
  parkName: string;
  parkId: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  price: string;
  isFree: boolean;
  materials: string;
  requirements: string;
  instructorName: string;
  categoryName: string;
  duration: number;
  costRecoveryPercentage: string;
  financialNotes: string;
  status: string;
  financialStatus: string;
  createdAt: string;
}

interface FinancialAnalysis {
  minRevenue: number;
  maxRevenue: number;
  estimatedCosts: number;
  profitMargin: number;
  breakEvenPoint: number;
  recommendation: 'approve' | 'review' | 'reject';
  riskLevel: 'low' | 'medium' | 'high';
}

const PendingActivitiesApproval = () => {
  const { toast } = useToast();
  const [selectedActivity, setSelectedActivity] = useState<PendingActivity | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterStatus, setFilterStatus] = useState("por_costear");
  const [analysisData, setAnalysisData] = useState<FinancialAnalysis | null>(null);
  
  // Form states for approval/rejection
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionComment, setRejectionComment] = useState("");
  const [newCostRecovery, setNewCostRecovery] = useState("");
  
  // Calculator integration states
  const [showCalculators, setShowCalculators] = useState(false);
  const [calculatorTab, setCalculatorTab] = useState("recovery");
  const [calculatorResults, setCalculatorResults] = useState<any>(null);

  // Fetch pending activities
  const { data: pendingActivities, isLoading } = useQuery<PendingActivity[]>({
    queryKey: ['/api/activities/pending-approval', filterStatus],
    queryFn: async () => {
      const response = await apiRequest(`/api/activities/pending-approval?status=${filterStatus}`, {
        method: 'GET'
      });
      return response.data || [];
    }
  });

  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ activityId, action, comment, costRecovery }: {
      activityId: number;
      action: 'approve' | 'reject';
      comment: string;
      costRecovery?: string;
    }) => {
      return await apiRequest(`/api/activities/${activityId}/financial-approval`, {
        method: 'POST',
        data: {
          action,
          comment,
          costRecoveryPercentage: costRecovery
        }
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.action === 'approve' ? "Actividad Aprobada" : "Actividad Rechazada",
        description: variables.action === 'approve' 
          ? "La actividad ha sido aprobada exitosamente."
          : "La actividad ha sido rechazada con comentarios.",
        variant: "default"
      });
      
      // Reset form states
      setApprovalComment("");
      setRejectionComment("");
      setNewCostRecovery("");
      setSelectedActivity(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/activities/pending-approval'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Hubo un problema al procesar la solicitud.",
        variant: "destructive"
      });
    }
  });

  // Calculate financial analysis for selected activity
  const calculateFinancialAnalysis = (activity: PendingActivity): FinancialAnalysis => {
    const price = parseFloat(activity.price) || 0;
    const capacity = activity.capacity || 0;
    const duration = activity.duration || 60;
    
    // Estimate costs based on duration and capacity
    const estimatedInstructorCost = (duration / 60) * 500; // $500/hour base rate
    const estimatedMaterialsCost = capacity * 25; // $25 per person materials
    const estimatedIndirectCosts = 200; // Base indirect costs
    const estimatedCosts = estimatedInstructorCost + estimatedMaterialsCost + estimatedIndirectCosts;
    
    const minRevenue = capacity * 0.6 * price; // 60% occupancy
    const maxRevenue = capacity * price; // Full occupancy
    const avgRevenue = (minRevenue + maxRevenue) / 2;
    
    const profitMargin = avgRevenue > 0 ? ((avgRevenue - estimatedCosts) / avgRevenue) * 100 : 0;
    const breakEvenPoint = price > 0 ? Math.ceil(estimatedCosts / price) : capacity;
    
    let recommendation: 'approve' | 'review' | 'reject' = 'approve';
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    if (profitMargin < 10) {
      recommendation = 'reject';
      riskLevel = 'high';
    } else if (profitMargin < 25) {
      recommendation = 'review';
      riskLevel = 'medium';
    }
    
    if (breakEvenPoint > capacity * 0.8) {
      riskLevel = 'high';
      if (recommendation === 'approve') recommendation = 'review';
    }

    return {
      minRevenue,
      maxRevenue,
      estimatedCosts,
      profitMargin,
      breakEvenPoint,
      recommendation,
      riskLevel
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando actividades pendientes...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <DynamicRoleGuard 
        requiredModule="Finanzas" 
        requiredPermission="write"
        fallback={
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Restringido
            </h2>
            <p className="text-gray-600">
              No tienes permisos para aprobar actividades financieramente.
            </p>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Header */}
          <div 
            className="py-8 px-4 -mx-4 -mt-6 flex items-center justify-between"
            style={{ backgroundColor: "#f59e0b" }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Aprobación Financiera de Actividades
                </h1>
                <p className="text-white">
                  Revisión y aprobación de actividades pendientes de costeo
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                <div className="text-white text-sm">Pendientes</div>
                <div className="text-white text-2xl font-bold">
                  {pendingActivities?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="status-filter">Filtrar por estado:</Label>
                </div>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="por_costear">Por Costear</option>
                  <option value="rechazada">Rechazadas</option>
                  <option value="activa">Aprobadas</option>
                  <option value="all">Todas</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Activities Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingActivities?.map((activity) => {
              const analysis = calculateFinancialAnalysis(activity);
              
              return (
                <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {activity.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {activity.parkName}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          activity.status === 'por_costear' ? 'secondary' :
                          activity.status === 'activa' ? 'default' : 'destructive'
                        }
                      >
                        {activity.status === 'por_costear' ? 'Por Costear' :
                         activity.status === 'activa' ? 'Aprobada' : 'Rechazada'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{activity.duration} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{activity.capacity} personas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>
                          {activity.isFree ? 'Gratuita' : formatCurrency(parseFloat(activity.price))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-500" />
                        <span>{analysis.profitMargin.toFixed(1)}% margen</span>
                      </div>
                    </div>

                    {/* Risk Level Indicator */}
                    <div className="flex items-center gap-2">
                      <AlertTriangle 
                        className={`h-4 w-4 ${
                          analysis.riskLevel === 'low' ? 'text-green-500' :
                          analysis.riskLevel === 'medium' ? 'text-yellow-500' : 'text-red-500'
                        }`} 
                      />
                      <span className="text-sm font-medium">
                        Riesgo {analysis.riskLevel === 'low' ? 'Bajo' : 
                                analysis.riskLevel === 'medium' ? 'Medio' : 'Alto'}
                      </span>
                    </div>

                    {/* Recommendation */}
                    <div className={`p-3 rounded-lg text-sm ${
                      analysis.recommendation === 'approve' ? 'bg-green-50 border border-green-200' :
                      analysis.recommendation === 'review' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-red-50 border border-red-200'
                    }`}>
                      <div className="font-medium">
                        {analysis.recommendation === 'approve' ? '✅ Recomendado para aprobación' :
                         analysis.recommendation === 'review' ? '⚠️ Requiere revisión' :
                         '❌ No recomendado'}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setAnalysisData(analysis);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Revisar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Revisión Financiera: {selectedActivity?.title}</DialogTitle>
                            <DialogDescription>
                              Análisis detallado y acciones de aprobación
                            </DialogDescription>
                          </DialogHeader>

                          {selectedActivity && analysisData && (
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="overview">Resumen</TabsTrigger>
                                <TabsTrigger value="calculator">Calculadora</TabsTrigger>
                                <TabsTrigger value="actions">Acciones</TabsTrigger>
                              </TabsList>

                              <TabsContent value="overview" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Activity Details */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Detalles de la Actividad</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium">Parque:</span>
                                          <p>{selectedActivity.parkName}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Instructor:</span>
                                          <p>{selectedActivity.instructorName}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Fechas:</span>
                                          <p>{formatDate(selectedActivity.startDate)} - {formatDate(selectedActivity.endDate)}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Horario:</span>
                                          <p>{selectedActivity.startTime} - {selectedActivity.endTime}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Capacidad:</span>
                                          <p>{selectedActivity.capacity} personas</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Precio:</span>
                                          <p>
                                            {selectedActivity.isFree ? 'Gratuita' : formatCurrency(parseFloat(selectedActivity.price))}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <span className="font-medium">Descripción:</span>
                                        <p className="text-sm text-gray-600 mt-1">{selectedActivity.description}</p>
                                      </div>
                                      
                                      <div>
                                        <span className="font-medium">Materiales:</span>
                                        <p className="text-sm text-gray-600 mt-1">{selectedActivity.materials}</p>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Financial Analysis */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Análisis Financiero</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-green-50 rounded-lg">
                                          <div className="font-medium text-green-800">Ingresos (Min)</div>
                                          <div className="text-lg font-bold text-green-900">
                                            {formatCurrency(analysisData.minRevenue)}
                                          </div>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg">
                                          <div className="font-medium text-green-800">Ingresos (Max)</div>
                                          <div className="text-lg font-bold text-green-900">
                                            {formatCurrency(analysisData.maxRevenue)}
                                          </div>
                                        </div>
                                        <div className="p-3 bg-red-50 rounded-lg">
                                          <div className="font-medium text-red-800">Costos Estimados</div>
                                          <div className="text-lg font-bold text-red-900">
                                            {formatCurrency(analysisData.estimatedCosts)}
                                          </div>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                          <div className="font-medium text-blue-800">Margen</div>
                                          <div className="text-lg font-bold text-blue-900">
                                            {analysisData.profitMargin.toFixed(1)}%
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="p-3 bg-purple-50 rounded-lg">
                                        <div className="font-medium text-purple-800">Punto de Equilibrio</div>
                                        <div className="text-lg font-bold text-purple-900">
                                          {analysisData.breakEvenPoint} personas
                                        </div>
                                        <div className="text-sm text-purple-600">
                                          {((analysisData.breakEvenPoint / selectedActivity.capacity) * 100).toFixed(1)}% de ocupación
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>

                              <TabsContent value="calculator" className="space-y-4">
                                <div className="space-y-4">
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Calculator className="h-5 w-5 text-blue-600" />
                                      <h3 className="font-semibold text-blue-900">Calculadoras Financieras</h3>
                                    </div>
                                    <p className="text-sm text-blue-700">
                                      Use las calculadoras especializadas para analizar la viabilidad financiera de esta actividad.
                                      Los resultados se pueden usar para ajustar el porcentaje de recuperación de costos.
                                    </p>
                                  </div>

                                  <Tabs value={calculatorTab} onValueChange={setCalculatorTab} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                      <TabsTrigger value="recovery">Recuperación de Costos</TabsTrigger>
                                      <TabsTrigger value="advanced">Calculadora Avanzada</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="recovery" className="space-y-4">
                                      <CostRecoveryCalculator
                                        initialData={{
                                          activityTitle: selectedActivity?.title || '',
                                          duration: selectedActivity?.duration || 60,
                                          capacity: selectedActivity?.capacity || 0,
                                          price: parseFloat(selectedActivity?.price || '0'),
                                          isFree: selectedActivity?.isFree || false,
                                          materials: selectedActivity?.materials || '',
                                          requirements: selectedActivity?.requirements || ''
                                        }}
                                        onCalculationComplete={(results) => {
                                          setCalculatorResults(results);
                                          setNewCostRecovery(results.costRecoveryPercentage?.toString() || '30');
                                        }}
                                      />
                                    </TabsContent>

                                    <TabsContent value="advanced" className="space-y-4">
                                      <AdvancedCalculator
                                        initialData={{
                                          activityTitle: selectedActivity?.title || '',
                                          duration: selectedActivity?.duration || 60,
                                          capacity: selectedActivity?.capacity || 0,
                                          price: parseFloat(selectedActivity?.price || '0'),
                                          isFree: selectedActivity?.isFree || false,
                                          materials: selectedActivity?.materials || '',
                                          requirements: selectedActivity?.requirements || ''
                                        }}
                                        onCalculationComplete={(results) => {
                                          setCalculatorResults(results);
                                          if (results.recommendedPrice) {
                                            setNewCostRecovery(results.costRecoveryPercentage?.toString() || '30');
                                          }
                                        }}
                                      />
                                    </TabsContent>
                                  </Tabs>

                                  {calculatorResults && (
                                    <Card className="bg-green-50 border-green-200">
                                      <CardHeader>
                                        <CardTitle className="text-green-900 flex items-center gap-2">
                                          <TrendingUp className="h-5 w-5" />
                                          Resultados del Cálculo
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-sm text-green-800">
                                          <p>✅ Cálculo completado. Los resultados se han aplicado automáticamente.</p>
                                          <p className="mt-2">
                                            <strong>Porcentaje de recuperación sugerido:</strong> {newCostRecovery}%
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </div>
                              </TabsContent>

                              <TabsContent value="actions" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Approve */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2 text-green-700">
                                        <CheckCircle className="h-5 w-5" />
                                        Aprobar Actividad
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div>
                                        <Label htmlFor="cost-recovery">% Recuperación de Costos</Label>
                                        <Input
                                          id="cost-recovery"
                                          type="number"
                                          value={newCostRecovery}
                                          onChange={(e) => setNewCostRecovery(e.target.value)}
                                          placeholder={selectedActivity.costRecoveryPercentage}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="approval-comment">Comentarios</Label>
                                        <Textarea
                                          id="approval-comment"
                                          value={approvalComment}
                                          onChange={(e) => setApprovalComment(e.target.value)}
                                          placeholder="Comentarios sobre la aprobación..."
                                          rows={3}
                                        />
                                      </div>
                                      <Button
                                        onClick={() => {
                                          approvalMutation.mutate({
                                            activityId: selectedActivity.id,
                                            action: 'approve',
                                            comment: approvalComment,
                                            costRecovery: newCostRecovery || selectedActivity.costRecoveryPercentage
                                          });
                                        }}
                                        disabled={approvalMutation.isPending}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                      >
                                        {approvalMutation.isPending ? 'Aprobando...' : 'Aprobar Actividad'}
                                      </Button>
                                    </CardContent>
                                  </Card>

                                  {/* Reject */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2 text-red-700">
                                        <XCircle className="h-5 w-5" />
                                        Rechazar Actividad
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div>
                                        <Label htmlFor="rejection-comment">Motivo del Rechazo *</Label>
                                        <Textarea
                                          id="rejection-comment"
                                          value={rejectionComment}
                                          onChange={(e) => setRejectionComment(e.target.value)}
                                          placeholder="Explique los motivos del rechazo y sugerencias..."
                                          rows={5}
                                          required
                                        />
                                      </div>
                                      <Button
                                        onClick={() => {
                                          if (!rejectionComment.trim()) {
                                            toast({
                                              title: "Error",
                                              description: "El motivo del rechazo es obligatorio.",
                                              variant: "destructive"
                                            });
                                            return;
                                          }
                                          approvalMutation.mutate({
                                            activityId: selectedActivity.id,
                                            action: 'reject',
                                            comment: rejectionComment
                                          });
                                        }}
                                        disabled={approvalMutation.isPending}
                                        variant="destructive"
                                        className="w-full"
                                      >
                                        {approvalMutation.isPending ? 'Rechazando...' : 'Rechazar Actividad'}
                                      </Button>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>

                      {activity.status === 'por_costear' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              approvalMutation.mutate({
                                activityId: activity.id,
                                action: 'approve',
                                comment: 'Aprobación rápida',
                                costRecovery: activity.costRecoveryPercentage
                              });
                            }}
                            disabled={approvalMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const comment = prompt('Motivo del rechazo:');
                              if (comment) {
                                approvalMutation.mutate({
                                  activityId: activity.id,
                                  action: 'reject',
                                  comment
                                });
                              }
                            }}
                            disabled={approvalMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {pendingActivities?.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay actividades pendientes
                </h3>
                <p className="text-gray-600">
                  Todas las actividades han sido procesadas.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DynamicRoleGuard>
    </AdminLayout>
  );
};

export default PendingActivitiesApproval;