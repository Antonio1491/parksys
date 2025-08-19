import React from 'react';
import { useForm } from 'react-hook-form';
import { AdminLayout } from '@/components/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

interface SimpleEventForm {
  title: string;
  description: string;
  organizerName: string;
  organizerOrganization: string;
  organizerEmail: string;
  organizerPhone: string;
  startDate: string;
  endDate: string;
}

const NewEventSimplePage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<SimpleEventForm>({
    defaultValues: {
      title: '',
      description: '',
      organizerName: '',
      organizerOrganization: '',
      organizerEmail: '',
      organizerPhone: '',
      startDate: '',
      endDate: ''
    }
  });

  const onSubmit = (data: SimpleEventForm) => {
    console.log('Datos del evento:', data);
    alert('Formulario enviado - revisar consola');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <Plus className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Evento (Versión Simple)</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Formulario simplificado para crear eventos
          </p>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Información básica */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Información básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title">Título del evento</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'El título es requerido' })}
                  placeholder="Título del evento"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="startDate">Fecha de inicio</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register('startDate', { required: 'La fecha de inicio es requerida' })}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Descripción del evento"
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Información de contacto del organizador */}
          <Card className="p-6 border-2 border-blue-200 bg-blue-50">
            <h3 className="text-lg font-medium mb-4 text-blue-800">
              🏢 Información de contacto del organizador
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="organizerName">Nombre del organizador *</Label>
                <Input
                  id="organizerName"
                  {...register('organizerName', { required: 'El nombre del organizador es requerido' })}
                  placeholder="Nombre completo del organizador"
                  className="bg-white"
                />
                {errors.organizerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.organizerName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="organizerOrganization">Empresa / Organización</Label>
                <Input
                  id="organizerOrganization"
                  {...register('organizerOrganization')}
                  placeholder="Nombre de la empresa u organización"
                  className="bg-white"
                />
                <p className="text-gray-600 text-sm mt-1">
                  Opcional: entidad que organiza el evento
                </p>
              </div>

              <div>
                <Label htmlFor="organizerEmail">Email de contacto *</Label>
                <Input
                  id="organizerEmail"
                  type="email"
                  {...register('organizerEmail', { 
                    required: 'El email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  placeholder="email@ejemplo.com"
                  className="bg-white"
                />
                {errors.organizerEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.organizerEmail.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="organizerPhone">Teléfono de contacto</Label>
                <Input
                  id="organizerPhone"
                  type="tel"
                  {...register('organizerPhone')}
                  placeholder="(555) 555-5555"
                  className="bg-white"
                />
                <p className="text-gray-600 text-sm mt-1">
                  Opcional: para contacto directo
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit" className="min-w-24">
              Guardar Evento
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default NewEventSimplePage;