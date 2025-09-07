import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, ShieldCheck, Crown, User, UserCog, Eye, Settings,
  Plus
} from 'lucide-react';

// Esquema de validación para crear rol
const createRoleSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres').regex(/^[a-z-]+$/, 'Solo letras minúsculas y guiones'),
  description: z.string().optional(),
  level: z.number().min(1).max(3)
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

// Niveles de rol predefinidos con sus características
const ROLE_LEVELS = [
  { level: 1, name: 'Super-admin', description: 'Acceso y control total del sistema, permisos CRUD para roles de cualquier nivel', icon: Crown },
  { level: 2, name: 'Admin', description: 'Acceso y control total con excepciones, permisos CRUD para roles de nivel inferior, solo lectura para su nivel y superiores', icon: ShieldCheck },
  { level: 3, name: 'User', description: 'Acceso y control según asignación por niveles superiores (gestión, operación, coordinación, etc.)', icon: User }
];

interface RoleCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RoleCreationModal: React.FC<RoleCreationModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      level: 3
    }
  });

  // Mutación para crear rol
  const createRoleMutation = useMutation({
    mutationFn: async (data: CreateRoleFormData) => {
      return apiRequest('/api/roles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Rol creado",
        description: "El nuevo rol se ha creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear rol",
        description: error.message || "No se pudo crear el rol",
        variant: "destructive",
      });
    }
  });

  // Auto-generar slug desde nombre
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    form.setValue('slug', slug);
  };

  // Enviar formulario
  const onSubmit = (data: CreateRoleFormData) => {
    createRoleMutation.mutate(data);
  };

  const selectedLevelInfo = ROLE_LEVELS.find(rl => rl.level === form.watch('level'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Crear Nuevo Rol
          </DialogTitle>
          <DialogDescription>
            Configure la información básica del nuevo rol
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica del rol */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Rol *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  onChange={(e) => {
                    form.setValue('name', e.target.value);
                    handleNameChange(e.target.value);
                  }}
                  placeholder="Ej: Coordinador de Parques"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="slug">Identificador (Slug) *</Label>
                <Input
                  id="slug"
                  {...form.register('slug')}
                  placeholder="coordinador-parques"
                />
                {form.formState.errors.slug && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Describe las responsabilidades y alcance de este rol..."
                rows={3}
              />
            </div>

            {/* Nivel jerárquico */}
            <div>
              <Label htmlFor="level">Nivel Jerárquico *</Label>
              <Select value={form.watch('level').toString()} onValueChange={(value) => form.setValue('level', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_LEVELS.map(roleLevel => {
                    const Icon = roleLevel.icon;
                    return (
                      <SelectItem key={roleLevel.level} value={roleLevel.level.toString()}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>Nivel {roleLevel.level}: {roleLevel.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {form.formState.errors.level && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.level.message}</p>
              )}
              
              {selectedLevelInfo && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <selectedLevelInfo.icon className="h-4 w-4" />
                    <span className="font-medium">{selectedLevelInfo.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedLevelInfo.description}</p>
                </div>
              )}
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={createRoleMutation.isPending}
            className="min-w-24"
          >
            {createRoleMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear Rol
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};