import React, { useState } from 'react';
// import { useQuery } from '@tanstack/react-query'; - No longer needed
import { ArrowLeft, FileUp, Download, Upload, AlertTriangle, Check } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

const ParksImport = () => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    parksImported?: number;
    errors?: string[];
  } | null>(null);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/template/parks-import');
      
      if (!response.ok) {
        throw new Error('Error al descargar la plantilla');
      }
      
      // Obtener el blob del archivo
      const blob = await response.blob();
      
      // Crear URL para descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_importacion_parques.xlsx';
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Plantilla descargada",
        description: "La plantilla ha sido descargada correctamente.",
      });
    } catch (error) {
      console.error('Error al descargar la plantilla:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar la plantilla. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Debe seleccionar un archivo para importar.",
        variant: "destructive",
      });
      return;
    }

    
    try {
      setUploading(true);
      setImportResult(null);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      console.log('🚀 Enviando solicitud de importación...');
      console.log('FormData:', formData);
      console.log('Archivo:', selectedFile);
      
      const response = await fetch('/api/parks/import', {
        method: 'POST',
        body: formData,
      });
      
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      const result = await response.json();
      console.log('📋 Resultado:', result);
      
      if (response.ok) {
        setImportResult({
          success: true,
          message: result.message || 'Parques importados correctamente',
          parksImported: result.parksImported,
        });
        
        toast({
          title: "Importación exitosa",
          description: `Se han importado ${result.parksImported} parques correctamente.`,
        });
      } else {
        setImportResult({
          success: false,
          message: result.message || 'Error al importar parques',
          errors: result.errors,
        });
        
        toast({
          title: "Error en la importación",
          description: result.message || 'Hubo errores durante la importación.',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error al importar parques:', error);
      setImportResult({
        success: false,
        message: 'Error al procesar la solicitud',
      });
      
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout title="Importación de Parques">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/admin/parks"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Parques
          </Button>
          <h2 className="text-2xl font-semibold text-gray-800">Importación Masiva de Parques</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Instrucciones de Importación</CardTitle>
            <CardDescription>
              Siga estos pasos para importar múltiples parques mediante una hoja de cálculo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Descargue la plantilla de Excel para importación.</li>
              <li>Complete la información de los parques siguiendo la estructura del archivo.</li>
              <li>Guarde el archivo y súbalo utilizando el formulario a continuación.</li>
              <li>Verifique el resultado de la importación y corrija errores si es necesario.</li>
            </ol>
            
            <Button onClick={downloadTemplate} variant="outline" className="mt-4">
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subir Archivo de Importación</CardTitle>
            <CardDescription>
              Seleccione el archivo Excel/CSV con los datos de los parques a importar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Archivo de Importación</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500">
                  Formatos aceptados: Excel (.xlsx, .xls) o CSV (.csv)
                </p>
              </div>

              <Button type="submit" disabled={!selectedFile || uploading} className="w-full">
                {uploading ? (
                  <>
                    <FileUp className="h-4 w-4 mr-2 animate-pulse" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Parques
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {importResult && (
          <Alert variant={importResult.success ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {importResult.success ? (
                <Check className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <AlertTitle>{importResult.success ? 'Importación Exitosa' : 'Error en la Importación'}</AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              {importResult.message}
              
              {importResult.parksImported && (
                <p className="mt-1">Parques importados: {importResult.parksImported}</p>
              )}
              
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium">Errores encontrados:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AdminLayout>
  );
};

export default ParksImport;