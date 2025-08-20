import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Upload, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Progress } from "@/components/ui/progress"; // Not needed for this component
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";
import { apiRequest } from "@/lib/queryClient";

interface ImportResult {
  success: boolean;
  message: string;
  processed: number;
  imported: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
}

export default function AmenitiesImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('/api/amenities/import', {
        method: 'POST',
        body: formData,
      });
      
      return response;
    },
    onSuccess: (data) => {
      setImportResult(data);
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/amenities'] });
        toast({
          title: "Importación completada",
          description: `${data.imported} amenidades importadas exitosamente`,
        });
      } else {
        toast({
          title: "Error en la importación",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al procesar el archivo",
        variant: "destructive",
      });
      console.error('Import error:', error);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Formato no válido",
          description: "Solo se permiten archivos CSV, XLS o XLSX",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      await importMutation.mutateAsync(selectedFile);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await fetch(`/api/amenities/template?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla_amenidades.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Plantilla descargada",
        description: `Se ha descargado la plantilla en formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al descargar la plantilla",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/amenities">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Amenidades
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Importar Amenidades</h1>
            <p className="text-muted-foreground">
              Importa amenidades masivamente desde un archivo CSV o Excel
            </p>
          </div>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Instrucciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Instrucciones de Importación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Descarga la plantilla</h4>
                    <p className="text-sm text-muted-foreground">
                      Descarga la plantilla con los campos requeridos para amenidades
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Completa los datos</h4>
                    <p className="text-sm text-muted-foreground">
                      Llena la plantilla con la información de las amenidades. Los campos obligatorios son: name, icon, category
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Sube el archivo</h4>
                    <p className="text-sm text-muted-foreground">
                      Selecciona el archivo completado y procesa la importación
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Valores válidos:</strong>
                  <br />• <strong>category:</strong> servicios, infraestructura, recreativo, deportivo, cultural, ambiental
                  <br />• <strong>icon_type:</strong> system, custom (por defecto: system)
                  <br />• <strong>icon:</strong> Para system: playground, sports, bathroom, parking, restaurant, bench, fountain, wifi, security, garden, park
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Descarga de plantilla */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Descargar Plantilla
              </CardTitle>
              <CardDescription>
                Descarga la plantilla con los campos necesarios para importar amenidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate('csv')}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Plantilla CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate('xlsx')}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Plantilla Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subida de archivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Subir Archivo de Importación
              </CardTitle>
              <CardDescription>
                Selecciona el archivo CSV o Excel con los datos de amenidades a importar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Archivo</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {selectedFile && (
                <Button 
                  onClick={handleImport}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando archivo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Amenidades
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Resultados */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  Resultados de la Importación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-600">Registros procesados</div>
                    <div className="text-2xl font-bold text-blue-700">{importResult.processed}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-600">Registros importados</div>
                    <div className="text-2xl font-bold text-green-700">{importResult.imported}</div>
                  </div>
                </div>

                {importResult.message && (
                  <Alert variant={importResult.success ? "default" : "destructive"}>
                    <AlertDescription>{importResult.message}</AlertDescription>
                  </Alert>
                )}

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-700">Errores encontrados:</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {importResult.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription>
                            <strong>Fila {error.row}:</strong> {error.field && `${error.field} - `}{error.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}