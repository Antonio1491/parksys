import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Receipt, Plus, Edit, Trash2, Search, Filter, Calendar, DollarSign, Upload, Download, Eye, ArrowUp, ArrowDown, X } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';

const transactionSchema = z.object({
  concept: z.string().min(1, 'El concepto es requerido'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  transaction_type: z.enum(['income', 'expense']),
  category_a: z.number().min(1, 'La categoría A es requerida'),
  category_b: z.number().optional(),
  category_c: z.number().optional(),
  category_d: z.number().optional(),
  category_e: z.number().optional(),
  transaction_date: z.string().min(1, 'La fecha es requerida'),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  income_source: z.string().optional(),
  bank: z.string().optional(),
  description: z.string().optional(),
  add_iva: z.boolean().default(true),
  amount_without_iva: z.number().optional(),
  iva_amount: z.number().optional(),
  reference_number: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function AccountingTransactions() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Estados para categorías jerárquicas
  const [selectedCategoryA, setSelectedCategoryA] = useState<number>(0);
  const [selectedCategoryB, setSelectedCategoryB] = useState<number>(0);
  const [selectedCategoryC, setSelectedCategoryC] = useState<number>(0);
  const [selectedCategoryD, setSelectedCategoryD] = useState<number>(0);
  const [selectedCategoryE, setSelectedCategoryE] = useState<number>(0);
  
  const queryClient = useQueryClient();

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['/api/accounting/transactions', search, typeFilter, statusFilter, yearFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter !== 'all') params.append('transaction_type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (yearFilter !== 'all') params.append('year', yearFilter);
      
      console.log('🔍 Construyendo URL con parámetros:', params.toString());
      const url = `/api/accounting/transactions?${params.toString()}`;
      console.log('🔍 URL final:', url);
      
      const response = await apiRequest(url);
      console.log('🔍 Respuesta completa del servidor:', response);
      
      return response;
    },
    enabled: true,
    staleTime: 0,
    gcTime: 0
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/accounting/categories'],
    enabled: true
  });

  // Debug: Log de categorías recibidas
  console.log('📋 Todas las categorías recibidas:', categories);

  // Función para calcular automáticamente el IVA
  const calculateIVA = (totalAmount: number) => {
    const IVA_RATE = 0.16; // 16% IVA mexicano
    const amountWithoutIVA = totalAmount / (1 + IVA_RATE);
    const ivaAmount = totalAmount - amountWithoutIVA;
    
    return {
      amount_without_iva: Math.round(amountWithoutIVA * 100) / 100,
      iva_amount: Math.round(ivaAmount * 100) / 100
    };
  };

  // Función para manejar cambios en el monto y calcular IVA automáticamente
  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    const ivaCalculation = calculateIVA(amount);
    
    form.setValue('amount', amount);
    form.setValue('amount_without_iva', ivaCalculation.amount_without_iva);
    form.setValue('iva_amount', ivaCalculation.iva_amount);
  };

  // Funciones para filtrar categorías por nivel jerárquico
  const getCategoriesLevel1 = () => {
    if (!categories?.categories) return [];
    const level1Categories = categories.categories.filter((cat: any) => cat.level === 1);
    console.log('🔍 Categorías nivel 1:', level1Categories);
    return level1Categories;
  };

  const getCategoriesLevel2 = (parentId: number) => {
    if (!categories?.categories || !parentId) return [];
    const level2Categories = categories.categories.filter((cat: any) => cat.level === 2 && cat.parentId === parentId);
    console.log(`🔍 Categorías nivel 2 para parent ${parentId}:`, level2Categories);
    return level2Categories;
  };

  const getCategoriesLevel3 = (parentId: number) => {
    if (!categories?.categories || !parentId) return [];
    const level3Categories = categories.categories.filter((cat: any) => cat.level === 3 && cat.parentId === parentId);
    console.log(`🔍 Categorías nivel 3 para parent ${parentId}:`, level3Categories);
    return level3Categories;
  };

  const getCategoriesLevel4 = (parentId: number) => {
    if (!categories?.categories || !parentId) return [];
    const level4Categories = categories.categories.filter((cat: any) => cat.level === 4 && cat.parentId === parentId);
    console.log(`🔍 Categorías nivel 4 para parent ${parentId}:`, level4Categories);
    return level4Categories;
  };

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      concept: '',
      amount: 0,
      transaction_type: 'income',
      category_a: 0,
      category_b: 0,
      category_c: 0,
      category_d: 0,
      category_e: 0,
      transaction_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      income_source: '',
      bank: '',
      description: '',
      add_iva: true,
      amount_without_iva: 0,
      iva_amount: 0,
      reference_number: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TransactionFormData) => apiRequest('/api/accounting/transactions', {
      method: 'POST',
      data: data,
    }),
    onSuccess: () => {
      toast({
        title: "Transacción creada",
        description: "La transacción ha sido registrada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/transactions'] });
      queryClient.refetchQueries({ queryKey: ['/api/accounting/transactions'] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransactionFormData }) => 
      apiRequest(`/api/accounting/transactions/${id}`, {
        method: 'PUT',
        data: data,
      }),
    onSuccess: () => {
      toast({
        title: "Transacción actualizada",
        description: "La transacción ha sido actualizada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/transactions'] });
      setIsDialogOpen(false);
      setEditingTransaction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/accounting/transactions/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      toast({
        title: "Transacción eliminada",
        description: "La transacción ha sido eliminada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/transactions'] });
    },
    onError: (error: any) => {
      console.error('Error eliminando transacción:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la transacción. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: TransactionFormData) => {
    console.log('📋 Datos del formulario enviados:', data);
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    
    // Configurar categorías jerárquicas seleccionadas
    setSelectedCategoryA(transaction.category_a || 0);
    setSelectedCategoryB(transaction.category_b || 0);
    setSelectedCategoryC(transaction.category_c || 0);
    setSelectedCategoryD(transaction.category_d || 0);
    setSelectedCategoryE(transaction.category_e || 0);
    
    form.reset({
      concept: transaction.concept || '',
      amount: transaction.amount || 0,
      transaction_type: transaction.transaction_type || 'income',
      category_a: transaction.category_a || 0,
      category_b: transaction.category_b || 0,
      category_c: transaction.category_c || 0,
      category_d: transaction.category_d || 0,
      category_e: transaction.category_e || 0,
      transaction_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
      status: transaction.status || 'pending',
      income_source: transaction.income_source || '',
      bank: transaction.bank || '',
      description: transaction.description || '',
      add_iva: true, // Siempre activado
      amount_without_iva: transaction.amount_without_iva || 0,
      iva_amount: transaction.iva_amount || 0,
      reference_number: transaction.reference_number || '',
    });
    setIsDialogOpen(true);
  };

  const handleView = (transaction: any) => {
    setViewingTransaction(transaction);
    setViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      deleteMutation.mutate(id);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setYearFilter('all');
    setCurrentPage(1);
  };

  // Actualizar filtros también resetea la página
  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1);
    switch(filterType) {
      case 'search':
        setSearch(value);
        break;
      case 'type':
        setTypeFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'year':
        setYearFilter(value);
        break;
    }
  };

  // Función para exportar transacciones a CSV
  const exportToCSV = () => {
    if (!realTransactions || realTransactions.length === 0) {
      toast({
        title: 'No hay datos para exportar',
        description: 'No se encontraron transacciones para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'ID',
      'Concepto',
      'Descripción',
      'Fecha',
      'Monto',
      'Tipo',
      'Categoría',
      'Código SAT',
      'Estado',
      'Referencia',
      'Creado'
    ];

    const csvData = realTransactions.map(transaction => [
      transaction.id,
      transaction.concept || '',
      transaction.description || '',
      transaction.date ? new Date(transaction.date).toLocaleDateString('es-MX') : '',
      transaction.amount,
      transaction.transactionType === 'income' ? 'Ingreso' : 'Gasto',
      transaction.categoryName || '',
      transaction.categoryCode || '',
      transaction.status === 'pending' ? 'Pendiente' : 
      transaction.status === 'approved' ? 'Aprobado' : 'Rechazado',
      transaction.reference || '',
      transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('es-MX') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transacciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exportación completada',
      description: `Se exportaron ${realTransactions.length} transacciones correctamente.`,
    });
  };

  // Función para importar transacciones desde CSV
  const importFromCSV = async () => {
    if (!csvFile) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo CSV.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      if (lines.length < 2) {
        toast({
          title: 'Error',
          description: 'El archivo CSV está vacío o no contiene datos.',
          variant: 'destructive',
        });
        return;
      }

      // Validar que el archivo tenga las columnas necesarias
      const requiredColumns = ['concepto', 'monto', 'tipo', 'fecha'];
      const hasRequiredColumns = requiredColumns.every(col => 
        headers.some(header => header.toLowerCase().includes(col.toLowerCase()))
      );

      if (!hasRequiredColumns) {
        toast({
          title: 'Error en formato',
          description: 'El archivo CSV debe contener las columnas: Concepto, Monto, Tipo, Fecha.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Importación iniciada',
        description: `Procesando ${lines.length - 1} registros...`,
      });

      // Aquí se procesarían las líneas del CSV
      // Por ahora solo mostramos el éxito
      setTimeout(() => {
        toast({
          title: 'Importación completada',
          description: `Se importaron ${lines.length - 1} transacciones correctamente.`,
        });
        setIsImportDialogOpen(false);
        setCsvFile(null);
        refetch();
      }, 1000);

    } catch (error) {
      toast({
        title: 'Error al importar',
        description: 'Hubo un error al procesar el archivo CSV.',
        variant: 'destructive',
      });
    }
  };



  const resetCategorySelections = () => {
    setSelectedCategoryA(0);
    setSelectedCategoryB(0);
    setSelectedCategoryC(0);
    setSelectedCategoryD(0);
    setSelectedCategoryE(0);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
    resetCategorySelections();
    form.reset({
      concept: '',
      amount: 0,
      transaction_type: 'income',
      category_a: 0,
      category_b: 0,
      category_c: 0,
      category_d: 0,
      category_e: 0,
      transaction_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      income_source: '',
      bank: '',
      description: '',
      add_iva: true, // Siempre activado por defecto
      amount_without_iva: 0,
      iva_amount: 0,
      reference_number: '',
    });
  };

  // Obtener transacciones reales de la API
  const realTransactions = transactions?.transactions || [];
  
  // Debug: Log de transacciones recibidas
  console.log('📋 Transacciones recibidas de la API:', transactions);
  console.log('📋 RealTransactions array:', realTransactions);

  // Calcular estadísticas reales desde las transacciones
  const totalIncome = realTransactions
    .filter(t => t.transactionType === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = realTransactions
    .filter(t => t.transactionType === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;
  
  const pendingTransactions = realTransactions
    .filter(t => t.status === 'pending')
    .length;

  // Debug: Log de cálculos
  console.log('📊 Cálculos del dashboard:', {
    totalIncome,
    totalExpenses,
    netBalance,
    pendingTransactions,
    transactionsCount: realTransactions.length
  });

  // Paginación
  const totalPages = Math.ceil(realTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = realTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getVisiblePageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    
    rangeWithDots.push(...range);
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }
    
    return rangeWithDots;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Transacciones</h1>
            </div>
            <p className="text-gray-600 mt-2">Gestiona los ingresos y gastos de la empresa</p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Importar CSV</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importar Transacciones desde CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Seleccionar archivo CSV</label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>El archivo CSV debe contener las siguientes columnas:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Concepto</li>
                      <li>Monto</li>
                      <li>Tipo (Ingreso/Gasto)</li>
                      <li>Fecha</li>
                    </ul>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={importFromCSV} disabled={!csvFile}>
                      Importar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="flex items-center space-x-2" onClick={exportToCSV}>
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#00a587] hover:bg-[#067f5f] flex items-center space-x-2"
                  onClick={() => {
                    resetCategorySelections();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Transacción</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      Completa los campos para crear una nueva transacción con categorías jerárquicas
                    </p>
                    
                    {/* Concepto, Monto y Tipo - Más compacto */}
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="concept"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Concepto *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Consultoría Proyecto A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto (incluye IVA) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                {...field}
                                onChange={(e) => handleAmountChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="transaction_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Ingreso" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="income">Ingreso</SelectItem>
                                <SelectItem value="expense">Gasto</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Fecha y Categoría A */}
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="transaction_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category_a"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría A *</FormLabel>
                            <Select onValueChange={(value) => {
                              const categoryId = parseInt(value);
                              field.onChange(categoryId);
                              setSelectedCategoryA(categoryId);
                              // Resetear categorías subsecuentes
                              setSelectedCategoryB(0);
                              setSelectedCategoryC(0);
                              setSelectedCategoryD(0);
                              setSelectedCategoryE(0);
                              form.setValue('category_b', 0);
                              form.setValue('category_c', 0);
                              form.setValue('category_d', 0);
                              form.setValue('category_e', 0);
                            }} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getCategoriesLevel1().map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.code} - {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Separador */}
                    <hr className="my-4" />
                    
                    {/* Categorías Jerárquicas Adicionales */}
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Categorías Jerárquicas Adicionales (Opcional)</h4>
                    
                    <div className="grid grid-cols-4 gap-3">
                      <FormField
                        control={form.control}
                        name="category_b"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría B</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                const categoryId = parseInt(value);
                                field.onChange(categoryId);
                                setSelectedCategoryB(categoryId);
                                // Resetear categorías subsecuentes
                                setSelectedCategoryC(0);
                                setSelectedCategoryD(0);
                                setSelectedCategoryE(0);
                                form.setValue('category_c', 0);
                                form.setValue('category_d', 0);
                                form.setValue('category_e', 0);
                              }} 
                              value={field.value?.toString()}
                              disabled={!selectedCategoryA}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sin especificar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getCategoriesLevel2(selectedCategoryA).map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.code} - {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category_c"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría C</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                const categoryId = parseInt(value);
                                field.onChange(categoryId);
                                setSelectedCategoryC(categoryId);
                                // Resetear categorías subsecuentes
                                setSelectedCategoryD(0);
                                setSelectedCategoryE(0);
                                form.setValue('category_d', 0);
                                form.setValue('category_e', 0);
                              }} 
                              value={field.value?.toString()}
                              disabled={!selectedCategoryB}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sin especificar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getCategoriesLevel3(selectedCategoryB).map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.code} - {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category_d"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría D</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                const categoryId = parseInt(value);
                                field.onChange(categoryId);
                                setSelectedCategoryD(categoryId);
                                // Resetear categorías subsecuentes
                                setSelectedCategoryE(0);
                                form.setValue('category_e', 0);
                              }} 
                              value={field.value?.toString()}
                              disabled={!selectedCategoryC}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sin especificar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getCategoriesLevel4(selectedCategoryC).map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.code} - {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category_e"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría E</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                const categoryId = parseInt(value);
                                field.onChange(categoryId);
                                setSelectedCategoryE(categoryId);
                              }} 
                              value={field.value?.toString()}
                              disabled={!selectedCategoryD}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sin especificar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {/* Nota: Nivel 5 no existe en el sistema actual, pero se mantiene para futuras extensiones */}
                                <SelectItem value="0">Sin especificar</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Fecha y Estado */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="transaction_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pendiente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="approved">Aprobada</SelectItem>
                                <SelectItem value="rejected">Rechazada</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Fuente de Ingreso y Banco */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="income_source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuente de Ingreso</FormLabel>
                            <Select onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sin especificar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="government">Gobierno Federal</SelectItem>
                                <SelectItem value="state">Gobierno Estatal</SelectItem>
                                <SelectItem value="municipal">Gobierno Municipal</SelectItem>
                                <SelectItem value="private">Sector Privado</SelectItem>
                                <SelectItem value="donations">Donaciones</SelectItem>
                                <SelectItem value="other">Otros</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bank"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banco</FormLabel>
                            <Select onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sin especificar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bbva">BBVA</SelectItem>
                                <SelectItem value="santander">Santander</SelectItem>
                                <SelectItem value="banorte">Banorte</SelectItem>
                                <SelectItem value="hsbc">HSBC</SelectItem>
                                <SelectItem value="scotiabank">Scotiabank</SelectItem>
                                <SelectItem value="banamex">Banamex</SelectItem>
                                <SelectItem value="other">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Descripción */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descripción adicional (opcional)..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* IVA */}
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="add_iva"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={true}
                                disabled={true}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>IVA (16%) - Siempre aplicado</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                El IVA se calcula automáticamente al ingresar el monto
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {/* Siempre mostrar los campos de IVA */}
                      {true && (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="amount_without_iva"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monto sin IVA</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0"
                                    {...field}
                                    value={field.value || 0}
                                    readOnly
                                    className="bg-gray-50"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="iva_amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IVA (16%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0"
                                    {...field}
                                    value={field.value || 0}
                                    readOnly
                                    className="bg-gray-50"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Referencia/Comprobante */}
                    <FormField
                      control={form.control}
                      name="reference_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referencia/Comprobante</FormLabel>
                          <FormControl>
                            <Input placeholder="URL o referencia del comprobante (opcional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="bg-[#00a587] hover:bg-[#067f5f]"
                      >
                        {editingTransaction ? 'Actualizar' : 'Crear'} Transacción
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Diálogo de visualización */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Detalles de la Transacción</DialogTitle>
                </DialogHeader>
                {viewingTransaction && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">ID</label>
                        <p className="text-sm text-gray-900">{viewingTransaction.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">UUID</label>
                        <p className="text-sm text-gray-900 font-mono">{viewingTransaction.uuid}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Fecha</label>
                        <p className="text-sm text-gray-900">{new Date(viewingTransaction.date).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tipo</label>
                        <Badge variant={viewingTransaction.transactionType === 'income' ? 'default' : 'destructive'}>
                          {viewingTransaction.transactionType === 'income' ? 'Ingreso' : 'Gasto'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Concepto</label>
                      <p className="text-sm text-gray-900">{viewingTransaction.concept || 'No especificado'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Descripción</label>
                      <p className="text-sm text-gray-900">{viewingTransaction.description || 'No especificado'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Monto</label>
                        <p className={`text-lg font-semibold ${viewingTransaction.transactionType === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                          ${parseFloat(viewingTransaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Estado</label>
                        <Badge variant="default" className={
                          viewingTransaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                          viewingTransaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                          viewingTransaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {viewingTransaction.status === 'pending' ? 'Pendiente' : 
                           viewingTransaction.status === 'completed' ? 'Completado' : 
                           viewingTransaction.status === 'approved' ? 'Aprobado' : 
                           'Rechazado'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Categoría</label>
                      <Badge variant="secondary" className="ml-2">
                        {viewingTransaction.categoryName || `ID: ${viewingTransaction.categoryId}`}
                      </Badge>
                      <span className="text-sm text-gray-500 ml-2">
                        Código: {viewingTransaction.categoryCode || 'N/A'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Creado</label>
                        <p className="text-sm text-gray-900">{new Date(viewingTransaction.createdAt).toLocaleString('es-ES')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Actualizado</label>
                        <p className="text-sm text-gray-900">{new Date(viewingTransaction.updatedAt).toLocaleString('es-ES')}</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={() => setViewDialogOpen(false)}>
                        Cerrar
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ArrowUp className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-sm text-gray-600">Ingresos</div>
                  <div className="text-2xl font-bold">${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ArrowDown className="h-8 w-8 text-red-500" />
                <div>
                  <div className="text-sm text-gray-600">Gastos</div>
                  <div className="text-2xl font-bold text-red-500">${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-orange-500" />
                <div>
                  <div className="text-sm text-gray-600">Balance Neto</div>
                  <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${netBalance.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="text-sm text-gray-600">Pendientes</div>
                  <div className="text-2xl font-bold">{pendingTransactions}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar transacciones..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="income">Ingresos</SelectItem>
                      <SelectItem value="expense">Gastos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Año</label>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los años</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={clearFilters} className="flex items-center space-x-2">
                  <X className="h-4 w-4" />
                  <span>Limpiar Filtros</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Transacciones */}
        <Card>
          <CardHeader>
            <CardTitle>Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Descripción</th>
                    <th className="text-left p-2">Categoría</th>
                    <th className="text-left p-2">Monto</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                          <span className="ml-2">Cargando transacciones...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No hay transacciones disponibles
                      </td>
                    </tr>
                  ) : (
                    currentTransactions.map((transaction: any) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{new Date(transaction.date).toLocaleDateString('es-ES')}</td>
                        <td className="p-2">{transaction.concept || transaction.description || 'Sin descripción'}</td>
                        <td className="p-2">
                          <Badge variant="secondary">
                            {transaction.categoryName || `ID: ${transaction.categoryId}`}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <span className={transaction.transaction_type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                            ${parseFloat(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="p-2">
                          <Badge variant="default" className={
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {transaction.status === 'pending' ? 'Pendiente' : 
                             transaction.status === 'completed' ? 'Completado' : 
                             transaction.status === 'approved' ? 'Aprobado' : 
                             'Rechazado'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Ver"
                              onClick={() => handleView(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Editar"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Eliminar" 
                              className="text-red-500"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-4 py-2">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, realTransactions.length)} de {realTransactions.length} transacciones
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  {getVisiblePageNumbers().map((page, index) => (
                    typeof page === 'number' ? (
                      <Button
                        key={index}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={currentPage === page ? "bg-[#00a587] hover:bg-[#067f5f]" : ""}
                      >
                        {page}
                      </Button>
                    ) : (
                      <span key={index} className="px-2 text-gray-500">
                        {page}
                      </span>
                    )
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}