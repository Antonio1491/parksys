import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import type { Consumable, ConsumableCategory } from "@shared/schema";

export default function ConsumablesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['/api/warehouse/categories'],
    queryFn: async () => {
      const response = await fetch('/api/warehouse/categories');
      if (!response.ok) throw new Error('Error al cargar categorías');
      return response.json();
    }
  });

  const { data: consumables, isLoading } = useQuery({
    queryKey: ['/api/warehouse/consumables', { search, categoryId: selectedCategory || undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      
      const response = await fetch(`/api/warehouse/consumables?${params}`);
      if (!response.ok) throw new Error('Error al cargar consumibles');
      return response.json();
    }
  });

  const deleteConsumable = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/warehouse/consumables/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/consumables'] });
    }
  });

  const formatCurrency = (amount: number | null) => {
    if (!amount || amount === 0) return 'N/A';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <AdminLayout title="Gestión de Consumibles" subtitle="Administra los materiales y suministros del almacén">
      <div className="space-y-6" data-testid="consumables-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consumibles</h1>
          <p className="text-muted-foreground">Gestión de productos y materiales consumibles</p>
        </div>
        <Button data-testid="button-add-consumable">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Consumible
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-consumables"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
          data-testid="select-category-filter"
        >
          <option value="">Todas las categorías</option>
          {categories?.map((category: ConsumableCategory) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="consumables-grid">
          {consumables?.map((consumable: Consumable & { category?: ConsumableCategory }) => (
            <Card key={consumable.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{consumable.name}</CardTitle>
                    <CardDescription className="font-mono text-sm">
                      {consumable.code}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" data-testid={`button-edit-${consumable.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteConsumable.mutate(consumable.id)}
                      data-testid={`button-delete-${consumable.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {consumable.category && (
                    <Badge variant="secondary" className="text-xs">
                      {consumable.category.name}
                    </Badge>
                  )}
                  
                  {consumable.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {consumable.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Unidad:</span>
                      <p className="font-medium">{consumable.unitOfMeasure}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stock mín:</span>
                      <p className="font-medium">{consumable.minimumStock || 'N/A'}</p>
                    </div>
                    {consumable.unitCost && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Costo:</span>
                        <p className="font-medium">{formatCurrency(consumable.unitCost || 0)}</p>
                      </div>
                    )}
                  </div>

                  {(consumable.perishable || consumable.hazardous) && (
                    <div className="flex gap-1 flex-wrap">
                      {consumable.perishable && (
                        <Badge variant="outline" className="text-xs">Perecedero</Badge>
                      )}
                      {consumable.hazardous && (
                        <Badge variant="destructive" className="text-xs">Peligroso</Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!consumables || consumables.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay consumibles</h3>
            <p className="text-muted-foreground mb-4">
              {search || selectedCategory 
                ? "No se encontraron consumibles con los filtros aplicados"
                : "Comienza agregando tu primer consumible al almacén"
              }
            </p>
            <Button data-testid="button-add-first-consumable">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Consumible
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </AdminLayout>
  );
}

function Package({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16.5 9.4L7.5 4.21l-2.4 1.2L14 10.6z" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
      <line x1="12" x2="12" y1="22.08" y2="12" />
    </svg>
  );
}