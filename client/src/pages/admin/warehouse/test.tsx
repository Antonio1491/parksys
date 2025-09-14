import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WarehouseTest() {
  return (
    <AdminLayout title="Test del Almacén" subtitle="Prueba de funcionamiento del módulo de almacén">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🎉 ¡El módulo de almacén está funcionando!</CardTitle>
            <CardDescription>
              Si puedes ver esta página, significa que el routing del módulo de almacén está configurado correctamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Las rutas del módulo de almacén están funcionando correctamente:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>/admin/warehouse/dashboard - Dashboard del almacén</li>
                <li>/admin/warehouse/consumables - Gestión de consumibles</li>
                <li>/admin/warehouse/stock - Control de inventario</li>
                <li>/admin/warehouse/movements - Movimientos de almacén</li>
                <li>/admin/warehouse/requisitions - Requisiciones</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}