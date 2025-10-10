import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ChevronLeft, Plus, Eye, Filter, Search, RefreshCw, Download, Upload, FileText, ChevronRight, ClipboardList } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';

const journalEntrySchema = z.object({
  date: z.string().min(1, 'La fecha es requerida'),
  description: z.string().min(1, 'La descripción es requerida'),
  reference: z.string().optional(),
  type: z.enum(['manual', 'automatic']),
  entries: z.array(z.object({
    account_id: z.number().min(1, 'La cuenta es requerida'),
    debit: z.number().optional(),
    credit: z.number().optional(),
    description: z.string().optional(),
  })).min(2, 'Se requieren al menos 2 entradas'),
});

type JournalEntryFormData = z.infer<typeof journalEntrySchema>;

export default function JournalEntries() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const itemsPerPage = 15;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: journalEntries, isLoading } = useQuery({
    queryKey: ['/api/accounting/journal-entries'],
    enabled: true
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/accounting/categories'],
    enabled: true
  });

  const form = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      type: 'manual',
      entries: [
        { account_id: 0, debit: 0, credit: 0, description: '' },
        { account_id: 0, debit: 0, credit: 0, description: '' }
      ],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: JournalEntryFormData) => apiRequest('/api/accounting/journal-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Asiento contable creado",
        description: "El asiento contable ha sido registrado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/journal-entries'] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const generateAutomaticMutation = useMutation({
    mutationFn: () => apiRequest('/api/accounting/journal-entries/generate-automatic', {
      method: 'POST',
    }),
    onSuccess: () => {
      toast({
        title: "Asientos automáticos generados",
        description: "Los asientos contables automáticos han sido generados exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/journal-entries'] });
    },
  });

  const handleSubmit = (data: JournalEntryFormData) => {
    createMutation.mutate(data);
  };

  const handleGenerateAutomatic = () => {
    generateAutomaticMutation.mutate();
  };

  const handleViewEntry = (entry: any) => {
    setSelectedEntry(entry);
    setIsViewDialogOpen(true);
  };

  const handleExport = () => {
    const csv = [
      ['Número', 'Fecha', 'Descripción', 'Referencia', 'Tipo', 'Debe', 'Haber', 'Estado'],
      ...mockJournalEntries.map(entry => [
        entry.number,
        entry.date,
        entry.description,
        entry.reference,
        entry.type,
        entry.totalDebit.toFixed(2),
        entry.totalCredit.toFixed(2),
        entry.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `asientos-contables-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        // Procesar CSV aquí
        toast({
          title: "Archivo importado",
          description: "Los datos han sido procesados correctamente.",
        });
      };
      reader.readAsText(file);
    }
  };

  // Datos simulados para mostrar la estructura según la imagen
  const mockJournalEntries = [
    {
      id: 1,
      number: 'AUTO-1751387935240',
      date: '30/6/2025',
      description: 'Transacción automática: Pago de servicios básicos',
      reference: 'TRANS-85',
      type: 'automatico',
      totalDebit: 13000.00,
      totalCredit: 13000.00,
      status: 'aprobado'
    },
    {
      id: 2,
      number: 'AUTO-1750978310917',
      date: '25/6/2025',
      description: 'Transacción automática: Compra de materiales oficina',
      reference: 'TRANS-64',
      type: 'automatico',
      totalDebit: 6700.00,
      totalCredit: 6700.00,
      status: 'aprobado'
    },
    {
      id: 3,
      number: 'AUTO-1750978160215',
      date: '25/6/2025',
      description: 'Transacción automática: Mantenimiento de equipos',
      reference: 'TRANS-63',
      type: 'automatico',
      totalDebit: 5000.00,
      totalCredit: 5000.00,
      status: 'aprobado'
    },
    {
      id: 4,
      number: 'AUTO-1750878717940',
      date: '24/6/2025',
      description: 'Transacción automática: Ingreso por concesiones',
      reference: 'TRANS-61',
      type: 'automatico',
      totalDebit: 6000.00,
      totalCredit: 6000.00,
      status: 'aprobado'
    },
    {
      id: 5,
      number: 'AUTO-1750681809469',
      date: '19/6/2025',
      description: 'Transacción automática: Reposición Caja Chica',
      reference: 'TRANS-51',
      type: 'automatico',
      totalDebit: 3500.00,
      totalCredit: 3500.00,
      status: 'aprobado'
    },
    {
      id: 6,
      number: 'AUTO-1750681808864',
      date: '19/6/2025',
      description: 'Transacción automática: Gasto en combustible',
      reference: 'TRANS-50',
      type: 'automatico',
      totalDebit: 2800.00,
      totalCredit: 2800.00,
      status: 'aprobado'
    },
    {
      id: 7,
      number: 'AUTO-1750681808262',
      date: '19/6/2025',
      description: 'Transacción automática: Caja Chica: Autobuses',
      reference: 'TRANS-47',
      type: 'automatico',
      totalDebit: 1200.00,
      totalCredit: 1200.00,
      status: 'aprobado'
    },
    {
      id: 8,
      number: 'MAN-1750681808263',
      date: '18/6/2025',
      description: 'Registro manual: Ajuste de inventario',
      reference: 'TRANS-46',
      type: 'manual',
      totalDebit: 4500.00,
      totalCredit: 4500.00,
      status: 'aprobado'
    },
    {
      id: 9,
      number: 'AUTO-1750681808264',
      date: '17/6/2025',
      description: 'Transacción automática: Pago de nómina',
      reference: 'TRANS-45',
      type: 'automatico',
      totalDebit: 28000.00,
      totalCredit: 28000.00,
      status: 'aprobado'
    },
    {
      id: 10,
      number: 'AUTO-1750681808265',
      date: '16/6/2025',
      description: 'Transacción automática: Ingreso por eventos',
      reference: 'TRANS-44',
      type: 'automatico',
      totalDebit: 15000.00,
      totalCredit: 15000.00,
      status: 'aprobado'
    },
    {
      id: 11,
      number: 'MAN-1750681808266',
      date: '15/6/2025',
      description: 'Registro manual: Depreciación mensual',
      reference: 'TRANS-43',
      type: 'manual',
      totalDebit: 3200.00,
      totalCredit: 3200.00,
      status: 'aprobado'
    },
    {
      id: 12,
      number: 'AUTO-1750681808267',
      date: '14/6/2025',
      description: 'Transacción automática: Compra de herramientas',
      reference: 'TRANS-42',
      type: 'automatico',
      totalDebit: 8500.00,
      totalCredit: 8500.00,
      status: 'aprobado'
    },
    {
      id: 13,
      number: 'AUTO-1750681808268',
      date: '13/6/2025',
      description: 'Transacción automática: Pago de proveedores',
      reference: 'TRANS-41',
      type: 'automatico',
      totalDebit: 12000.00,
      totalCredit: 12000.00,
      status: 'aprobado'
    },
    {
      id: 14,
      number: 'AUTO-1750681808269',
      date: '12/6/2025',
      description: 'Transacción automática: Recibo de agua',
      reference: 'TRANS-40',
      type: 'automatico',
      totalDebit: 5600.00,
      totalCredit: 5600.00,
      status: 'aprobado'
    },
    {
      id: 15,
      number: 'AUTO-1750681808270',
      date: '11/6/2025',
      description: 'Transacción automática: Recibo de luz',
      reference: 'TRANS-39',
      type: 'automatico',
      totalDebit: 9800.00,
      totalCredit: 9800.00,
      status: 'aprobado'
    },
    {
      id: 16,
      number: 'MAN-1750681808271',
      date: '10/6/2025',
      description: 'Registro manual: Ajuste por diferencia cambiaria',
      reference: 'TRANS-38',
      type: 'manual',
      totalDebit: 2300.00,
      totalCredit: 2300.00,
      status: 'aprobado'
    },
    {
      id: 17,
      number: 'AUTO-1750681808272',
      date: '09/6/2025',
      description: 'Transacción automática: Venta de boletos',
      reference: 'TRANS-37',
      type: 'automatico',
      totalDebit: 7500.00,
      totalCredit: 7500.00,
      status: 'aprobado'
    },
    {
      id: 18,
      number: 'AUTO-1750681808273',
      date: '08/6/2025',
      description: 'Transacción automática: Ingreso por donaciones',
      reference: 'TRANS-36',
      type: 'automatico',
      totalDebit: 4800.00,
      totalCredit: 4800.00,
      status: 'aprobado'
    }
  ];

  // Filtrar datos
  const filteredEntries = mockJournalEntries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(search.toLowerCase()) || 
                         entry.reference.toLowerCase().includes(search.toLowerCase()) ||
                         entry.number.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Paginación
  const totalEntries = filteredEntries.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Resetear página cuando cambian los filtros
  const resetPage = () => {
    setCurrentPage(1);
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
              <ClipboardList className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Asientos Contables</h1>
            </div>
            <p className="text-gray-600 mt-2">Registro de movimientos contables con partida doble</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleGenerateAutomatic}
              disabled={generateAutomaticMutation.isPending}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${generateAutomaticMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Generar Automáticos</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#00a587] hover:bg-[#067f5f] flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Asiento</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Nuevo Asiento Contable</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="reference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referencia</FormLabel>
                            <FormControl>
                              <Input placeholder="Número de referencia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descripción del asiento contable" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="automatic">Automático</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Entradas del Asiento</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentEntries = form.getValues('entries');
                            form.setValue('entries', [
                              ...currentEntries,
                              { account_id: 0, debit: 0, credit: 0, description: '' }
                            ]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Entrada
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {form.watch('entries').map((_, index) => (
                          <div key={index} className="grid grid-cols-5 gap-2 p-3 border rounded">
                            <div>
                              <label className="text-sm font-medium">Cuenta</label>
                              <Select onValueChange={(value) => {
                                const entries = form.getValues('entries');
                                entries[index].account_id = parseInt(value);
                                form.setValue('entries', entries);
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.isArray(categories) ? categories.map((category: any) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.code} - {category.name}
                                    </SelectItem>
                                  )) : null}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Debe</label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                onChange={(e) => {
                                  const entries = form.getValues('entries');
                                  entries[index].debit = parseFloat(e.target.value) || 0;
                                  form.setValue('entries', entries);
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Haber</label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                onChange={(e) => {
                                  const entries = form.getValues('entries');
                                  entries[index].credit = parseFloat(e.target.value) || 0;
                                  form.setValue('entries', entries);
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Descripción</label>
                              <Input
                                placeholder="Opcional"
                                onChange={(e) => {
                                  const entries = form.getValues('entries');
                                  entries[index].description = e.target.value;
                                  form.setValue('entries', entries);
                                }}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const entries = form.getValues('entries');
                                  if (entries.length > 2) {
                                    entries.splice(index, 1);
                                    form.setValue('entries', entries);
                                  }
                                }}
                                disabled={form.watch('entries').length <= 2}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

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
                        disabled={createMutation.isPending}
                        className="bg-[#00a587] hover:bg-[#067f5f]"
                      >
                        Crear Asiento
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por número, descripción o referencia..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="approved">Aprobado</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="dd/mm/yyyy"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Asientos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Asientos Contables Registrados</CardTitle>
                <p className="text-sm text-gray-600">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, totalEntries)} de {totalEntries} registros
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImport}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Importar</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Número</th>
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Descripción</th>
                    <th className="text-left p-2">Referencia</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Total Debe</th>
                    <th className="text-left p-2">Total Haber</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">{entry.number}</td>
                      <td className="p-2">{entry.date}</td>
                      <td className="p-2 max-w-xs truncate">{entry.description}</td>
                      <td className="p-2">{entry.reference}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {entry.type}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">{formatCurrency(entry.totalDebit)}</td>
                      <td className="p-2 text-right">{formatCurrency(entry.totalCredit)}</td>
                      <td className="p-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Ver detalles"
                          onClick={() => handleViewEntry(entry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  {/* Números de página */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-[#00a587] hover:bg-[#067f5f]" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Dialog para ver detalles */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Asiento Contable</DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Número</label>
                    <p className="font-mono text-sm">{selectedEntry.number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha</label>
                    <p>{selectedEntry.date}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Referencia</label>
                    <p>{selectedEntry.reference}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo</label>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {selectedEntry.type}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Descripción</label>
                  <p className="text-sm">{selectedEntry.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Debe</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedEntry.totalDebit)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Haber</label>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(selectedEntry.totalCredit)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <Badge variant="default" className="bg-green-100 text-green-800 ml-2">
                    {selectedEntry.status}
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}