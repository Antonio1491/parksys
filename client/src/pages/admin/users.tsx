import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  UserRound, 
  Search,
  Plus, 
  Edit, 
  Trash2, 
  Loader,
  X,
  CheckCircle,
  Calendar,
  FileSymlink,
  Eye,
  Award,
  Clock,
  MapPin,
  AlertCircle,
  Info,
  Star,
  User,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import UserProfileImage from '@/components/UserProfileImage';
import AdminLayout from '@/components/AdminLayout';
import { RoleBadge, SYSTEM_ROLES } from '@/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';


type User = {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  roleId: number; // Campo principal del JOIN con roles
  roleName?: string; // Nombre del rol del JOIN
  roleLevel?: number; // Nivel del rol del JOIN
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  lastLogin?: Date | null;
  department?: string;
  position?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  bio?: string;
  profileImageUrl?: string;
  // Campos adicionales que pueden existir según el rol
  experience?: string;
  specialties?: string[];
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredParkId?: number;
  legalConsent?: boolean;
};

interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: string; // Legacy - mantener compatibilidad
  role_id?: number; // Nueva referencia jerárquica
  // Campos comunes adicionales
  phone?: string;
  profileImageUrl?: string;
  profileImageFile?: File | null;
  bio?: string;
  
  // Campos para todos los usuarios
  gender?: 'masculino' | 'femenino' | 'no_especificar';
  birthDate?: string;
  
  // Campos específicos para instructores
  experience?: string;
  specialties?: string[];
  curriculumFile?: File | null;
  
  // Campos específicos para voluntarios
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredParkId?: number | null;
  legalConsent?: boolean;
  
  // Nuevos campos para voluntarios - Experiencia y disponibilidad
  volunteerExperience?: string;
  skills?: string;
  availability?: 'weekdays' | 'weekends' | 'evenings' | 'mornings' | 'flexible';
  
  // Campos para áreas de interés
  interestNature?: boolean;
  interestEvents?: boolean;
  interestEducation?: boolean;
  interestMaintenance?: boolean;
  interestSports?: boolean;
  interestCultural?: boolean;
  
  // Campos para documentos
  idDocumentFile?: File | null;
  addressDocumentFile?: File | null;
  
  // Campos para términos legales adicionales
  ageConsent?: boolean;
  conductConsent?: boolean;
  
  // Campos específicos para concesionarios
  tipo?: 'persona_fisica' | 'persona_moral';
  rfc?: string;
  domicilioFiscal?: string;
  representanteLegal?: string;
}

// User detail/edit component
const UserDetail: React.FC<{
  user: User | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (userData: UserFormData) => void;
  isSaving: boolean;
  editingUserId?: number | null;
}> = ({ user, isNew, onClose, onSave, isSaving, editingUserId }) => {
  const [userData, setUserData] = useState<UserFormData>({
    // Elegir rol es el primer paso - ahora usar roleId
    role: user?.roleId ? String(user.roleId) : '1',
    
    // Información básica de la cuenta
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    password: '',
    
    // Campos comunes para todos los usuarios
    phone: user?.phone || '',
    gender: user?.gender || 'no_especificar',
    birthDate: user?.birthDate || '',
    profileImageUrl: user?.profileImageUrl || '',
    profileImageFile: null,
    bio: user?.bio || '',
    
    // Campos para instructores
    experience: user?.experience || '',
    specialties: user?.specialties || [],
    curriculumFile: null,
    
    // Campos para voluntarios
    address: user?.address || '',
    emergencyContactName: user?.emergencyContactName || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
    // Siempre asignamos un valor por defecto para el parque preferido (el parque con ID 3 como respaldo)
    preferredParkId: user?.preferredParkId !== undefined ? user?.preferredParkId : 3,
    legalConsent: user?.legalConsent !== undefined ? user?.legalConsent : false,
  });

  // Efecto para cargar y sincronizar los datos del voluntario desde la API
  useEffect(() => {
    if (user && user.roleId === 6 && editingUserId) { // roleId 6 = Operador de Campo (voluntarios)
      console.log("🔥 DATOS RECIBIDOS DEL USUARIO:", user);
      
      // Usar un efecto asíncrono para cargar los datos adicionales del voluntario
      const loadVolunteerData = async () => {
        try {
          const response = await fetch(`/api/volunteers/by-user/${editingUserId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const volunteerData = await response.json();
            console.log("✅ DATOS DE VOLUNTARIO CARGADOS:", volunteerData);
            
            // Actualizamos el estado del formulario con los datos completos
            setUserData(prevData => ({
              ...prevData,
              // Datos específicos del voluntario - Información básica
              address: volunteerData.address || '',
              emergencyContactName: volunteerData.emergency_contact || '',
              emergencyContactPhone: volunteerData.emergency_phone || '',
              preferredParkId: volunteerData.preferred_park_id || 3,
              
              // Experiencia y disponibilidad
              volunteerExperience: volunteerData.previous_experience || '',
              skills: volunteerData.skills || '',
              availability: volunteerData.available_hours || 'flexible',
              
              // Áreas de interés (convertimos de array o JSON a booleanos individuales)
              interestNature: volunteerData.interest_areas?.includes('nature') || false,
              interestEvents: volunteerData.interest_areas?.includes('events') || false,
              interestEducation: volunteerData.interest_areas?.includes('education') || false,
              interestMaintenance: volunteerData.interest_areas?.includes('maintenance') || false,
              interestSports: volunteerData.interest_areas?.includes('sports') || false,
              interestCultural: volunteerData.interest_areas?.includes('cultural') || false,
              
              // Términos legales
              legalConsent: volunteerData.legal_consent === true,
              ageConsent: volunteerData.age_consent === true || false,
              conductConsent: volunteerData.conduct_consent === true || false
            }));
          } else {
            console.error("Error al cargar datos de voluntario:", await response.text());
          }
        } catch (error) {
          console.error("Error al obtener datos de voluntario:", error);
        }
      };
      
      loadVolunteerData();
    }
  }, [user, editingUserId]);

  // Cargar parques para el selector de parque preferido
  const { data: parks = [] } = useQuery({
    queryKey: ['/api/public/parks/list'],
    // Siempre cargamos los parques para evitar problemas
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3
  });

  // Cargar roles del sistema jerárquico
  const { data: roles = [] } = useQuery<any[]>({
    queryKey: ['/api/roles'],
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 3
  });
  
  // Debugger para el parque preferido
  useEffect(() => {
    const selectedRole = roles.find((r: any) => String(r.id) === userData.role);
    const isVolunteerRole = selectedRole?.name?.toLowerCase().includes('voluntario');
    
    if (user && isVolunteerRole) {
      console.log('Datos del usuario cargados:', {
        userId: user.id,
        userPreferredParkId: user?.preferredParkId,
        formPreferredParkId: userData.preferredParkId,
        availableParks: parks?.length || 0,
        selectedRole: selectedRole?.name
      });
    }
  }, [user, userData.role, userData.preferredParkId, parks, roles]);

  const handleChange = (field: keyof UserFormData, value: string | number | null | boolean | File | string[]) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Manejar la carga de imágenes
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Crear un FormData para enviar la imagen al servidor
        const formData = new FormData();
        formData.append('profileImage', file);
        
        // Usamos el editingUserId que recibimos como prop directamente
        // Este valor es más confiable que el ID del objeto user
        const userIdToUpdate = editingUserId || (user && user.id);
        
        // Agregar el userId al formData si tenemos un ID válido
        if (userIdToUpdate) {
          formData.append('userId', userIdToUpdate.toString());
          console.log(`Subiendo imagen para usuario ID: ${userIdToUpdate}`);
        }
        
        const response = await fetch('/api/upload/profile-image', {
          method: 'POST',
          body: formData,
          headers: {
            // No incluir Content-Type, el navegador lo configura automáticamente con el boundary
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al cargar la imagen');
        }
        
        const data = await response.json();
        
        // Actualizar la URL de la imagen con la URL permanente devuelta por el servidor
        handleChange('profileImageUrl', data.url);
        // Ya no necesitamos guardar el archivo, ya que se ha subido al servidor
        handleChange('profileImageFile', null);
        
        // Guardar la URL en la caché solo si tenemos un ID válido
        if (userIdToUpdate) {
          try {
            // Llamar al endpoint para guardar la URL en la caché
            await fetch(`/api/users/${userIdToUpdate}/profile-image`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({ imageUrl: data.url })
            });
            console.log(`Imagen de perfil guardada en caché para el usuario ${userIdToUpdate}`);
            
            // Actualizar también el localStorage para forzar la actualización inmediata
            const localStorageKey = `profile_image_${userIdToUpdate}`;
            const cacheInvalidationKey = `profile_image_cache_${userIdToUpdate}`;
            localStorage.setItem(localStorageKey, data.url);
            localStorage.setItem(cacheInvalidationKey, Date.now().toString());
            
            // Disparar un evento personalizado para que los componentes de imagen se actualicen
            window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
              detail: { userId: userIdToUpdate, imageUrl: data.url } 
            }));
            
            // Mostrar notificación de éxito
            toast({
              title: "Imagen actualizada",
              description: "La foto de perfil se ha actualizado correctamente.",
              variant: "default",
            });
            
          } catch (error) {
            console.error('Error al guardar la URL en la caché:', error);
            // Continuamos aunque falle el guardado en caché
          }
        }
      } catch (error) {
        console.error('Error al cargar la imagen:', error);
        // En caso de error, creamos una URL temporal para la vista previa
        const imageUrl = URL.createObjectURL(file);
        handleChange('profileImageUrl', imageUrl);
        handleChange('profileImageFile', file);
      }
    }
  };
  
  // Manejar la carga del curriculum
  const handleCurriculumUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange('curriculumFile', file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(userData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Crear nuevo usuario' : 'Editar usuario'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Selección de rol - primer paso */}
          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-lg text-primary-600">Rol del Usuario</h3>
            
            <div className="space-y-2">
              <Select
                value={userData.role}
                onValueChange={(value) => handleChange('role', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: any) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full`} 
                              style={{backgroundColor: role.color}} />
                        <span>{role.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          Nivel {role.level}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                El rol determina los permisos y funciones disponibles para el usuario.
              </p>
            </div>
          </div>
          
          {/* Información básica de la cuenta */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-lg">Información de Cuenta</h3>
            
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">Nombre Completo</label>
              <Input
                id="fullName"
                value={userData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                required
                placeholder="Ej: Juan Pérez García"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">Nombre de usuario</label>
              <Input
                id="username"
                value={userData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {isNew ? 'Contraseña' : 'Contraseña (dejar en blanco para no cambiar)'}
              </label>
              <Input
                id="password"
                type="password"
                value={userData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required={isNew}
              />
            </div>
          </div>
          
          {/* Información de contacto y perfil - para todos los usuarios */}
          <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-lg">Información de Contacto y Perfil</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Columna de foto de perfil */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="profileImage" className="text-sm font-medium">Foto de perfil</label>
                  <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                      {!isNew && editingUserId ? (
                        <UserProfileImage 
                          userId={editingUserId} 
                          role={userData.role} 
                          name={userData.fullName || 'Usuario'}
                          size="xl"
                          className="w-32 h-32 border border-gray-300"
                        />
                      ) : userData.profileImageUrl ? (
                        <div className="relative">
                          <img 
                            src={userData.profileImageUrl} 
                            alt="Vista previa" 
                            className="w-32 h-32 rounded-full object-cover border border-gray-300"
                          />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                            onClick={() => {
                              handleChange('profileImageUrl', '');
                              handleChange('profileImageFile', null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserRound className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <label 
                      htmlFor="imageUpload"
                      className="cursor-pointer py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded text-sm text-center"
                    >
                      Subir imagen
                      <input 
                        id="imageUpload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      Formatos: JPG, PNG. Máx: 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Columna de información de contacto */}
              <div className="space-y-4 col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">Teléfono</label>
                    <Input
                      id="phone"
                      value={userData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="Ej: 555-123-4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="gender" className="text-sm font-medium">Género</label>
                    <Select
                      value={userData.gender}
                      onValueChange={(value) => handleChange('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="no_especificar">Prefiero no decir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="birthDate" className="text-sm font-medium">Fecha de nacimiento</label>
                  <div className="relative">
                    <Input
                      id="birthDate"
                      type="date"
                      value={userData.birthDate}
                      onChange={(e) => handleChange('birthDate', e.target.value)}
                      className="w-full"
                    />
                    <Calendar className="h-4 w-4 absolute right-3 top-3 text-gray-400" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="bio" className="text-sm font-medium">Biografía</label>
                  <Textarea
                    id="bio"
                    value={userData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Breve descripción personal"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección específica basada en rol jerárquico */}
          {(() => {
            const selectedRole = roles.find((r: any) => String(r.id) === userData.role);
            const roleName = selectedRole?.name?.toLowerCase() || '';
            
            if (roleName.includes('instructor')) {
              return (
                <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-lg">Información de Instructor</h3>
                  <p className="text-sm text-gray-600">
                    Complete la información básica para crear el perfil de instructor.
                  </p>
                </div>
              );
            }
            
            if (roleName.includes('concesionario')) {
              return (
                <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-lg">Información de Concesionario</h3>
                  <p className="text-sm text-gray-600">
                    Complete la información básica para crear el perfil de concesionario.
                  </p>
                </div>
              );
            }
            
            if (roleName.includes('voluntario')) {
              return (
                <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-lg">Información de Voluntario</h3>
                  <p className="text-sm text-gray-600">
                    Complete la información básica para crear el perfil de voluntario.
                  </p>
                </div>
              );
            }
            
            return null;
          })()}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              {isNew ? 'Crear usuario' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Confirmation dialog component
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ isOpen, title, message, onConfirm, onCancel, isLoading }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>{message}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main component
const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Estados para ordenamiento y filtrado
  const [sortField, setSortField] = useState<keyof User>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para asignación masiva de roles
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedNewRole, setSelectedNewRole] = useState<string>('');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  // Fetch users
  const {
    data: usersResponse,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['/api/users'],
    retry: 1,
    queryFn: async () => {
      try {
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Usuarios obtenidos de la API:', data);
        return data;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    }
  });
  
  // Manejar formato de respuesta - API devuelve array directamente
  const users = Array.isArray(usersResponse) ? usersResponse : [];
  console.log('Total usuarios procesados:', users.length);

  // Create or update user mutation
  const saveUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const isUpdate = !!selectedUser;
      const url = isUpdate ? `/api/users/${selectedUser?.id}` : '/api/users';
      const method = isUpdate ? 'PUT' : 'POST';

      // Si estamos actualizando y la contraseña está vacía, la eliminamos
      if (isUpdate && !userData.password) {
        const { password, ...dataWithoutPassword } = userData;
        userData = dataWithoutPassword as UserFormData;
      }

      // Mostramos en consola para depuración
      console.log(`${method} usuario:`, userData);
      
      // Realizamos la llamada a la API
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al procesar la solicitud');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidar la consulta de usuarios para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Mostrar notificación
      toast({
        title: isNewUser ? 'Usuario creado' : 'Usuario actualizado',
        description: isNewUser 
          ? 'El usuario ha sido creado exitosamente'
          : 'Los datos del usuario han sido actualizados',
      });
      
      // Cerrar el diálogo y limpiar estado
      handleCloseUserDialog();
    },
    onError: (error) => {
      console.error('Error saving user:', error);
      toast({
        title: 'Error',
        description: `No se pudo ${isNewUser ? 'crear' : 'actualizar'} el usuario. Inténtalo de nuevo.`,
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      console.log('DELETE usuario:', userId);
      
      // Realizar la eliminación real del usuario
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar el usuario');
      }
      
      return userId;
    },
    onSuccess: () => {
      // Invalidar la consulta de usuarios para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Mostrar notificación
      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado exitosamente',
      });
      
      // Cerrar el diálogo de confirmación
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario. Inténtalo de nuevo.',
        variant: 'destructive',
      });
      setShowDeleteConfirm(false);
    },
  });

  // Handlers
  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsNewUser(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditingUserId(user.id);
    setIsNewUser(false);
  };

  const handleCloseUserDialog = () => {
    setSelectedUser(null);
    setEditingUserId(null);
    setIsNewUser(false);
  };

  const handleSaveUser = async (userData: UserFormData) => {
    // Obtener el ID del usuario que estamos editando
    const userId = editingUserId || (selectedUser && selectedUser.id);
    
    // Verificar si tenemos un ID válido y una URL de imagen
    if (userData.profileImageUrl && userId) {
      try {
        // Guardar la imagen en localStorage para todos los usuarios (respaldo universal)
        localStorage.setItem(`profile_image_${userId}`, userData.profileImageUrl);
        console.log(`Imagen guardada en localStorage para usuario ID: ${userId}`);
        
        // Guardar explícitamente la imagen en la caché antes de la actualización
        const response = await fetch(`/api/users/${userId}/profile-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ imageUrl: userData.profileImageUrl })
        });
        
        if (response.ok) {
          console.log(`✅ Imagen guardada con éxito para el usuario ID: ${userId}`);
        } else {
          console.error(`❌ Error al guardar la imagen para el usuario ID: ${userId}`);
        }
        
        // Programar verificaciones adicionales para todos los usuarios
        // Esto ayuda a garantizar que la imagen persista para todos los usuarios
        const verifyImage = () => {
          fetch(`/api/users/${userId}/profile-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ imageUrl: userData.profileImageUrl })
          }).then(() => console.log(`Verificación adicional completada para usuario ID: ${userId}`));
        };
        
        // Realizar verificaciones a intervalos diferentes para mejorar las probabilidades de éxito
        setTimeout(verifyImage, 500);
        setTimeout(verifyImage, 1500);
      } catch (error) {
        console.error('Error al guardar la imagen en la caché:', error);
      }
    }
    
    // Proceder con la actualización del usuario
    saveUserMutation.mutate(userData);
  };

  const handleConfirmDelete = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  // Funciones de ordenamiento y filtrado
  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof User) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setSortField('id');
    setSortDirection('asc');
    setCurrentPage(1);
  };

  // Calcular estadísticas por rol
  const getRoleStatistics = () => {
    const stats: { [key: string]: number } = {};
    
    // Inicializar contadores para todos los roles
    SYSTEM_ROLES.forEach(role => {
      stats[role.id] = 0;
    });
    
    console.log('🔍 Debug: Total usuarios para estadísticas:', users.length);
    
    // Contar usuarios por rol - ahora usando roleId del JOIN con roles
    users.forEach((user: any, index) => {
      console.log(`🔍 Debug Usuario ${index + 1}:`, { 
        id: user.id, 
        roleId: user.roleId, 
        roleName: user.roleName, 
        roleLevel: user.roleLevel 
      });
      
      if (user.roleId) {
        const roleId = String(user.roleId);
        stats[roleId] = (stats[roleId] || 0) + 1;
        console.log(`✅ Rol ID encontrado: ${roleId} (${user.roleName}), Contador: ${stats[roleId]}`);
      } else {
        // Fallback para usuarios sin roleId (no debería ocurrir ahora)
        stats['7'] = (stats['7'] || 0) + 1;
        console.log(`⚠️ Usuario sin roleId, asignado a rol 7, Contador: ${stats['7']}`);
      }
    });
    
    console.log('📊 Estadísticas finales por rol:', stats);
    return stats;
  };

  // Funciones para selección masiva
  const handleUserSelection = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(currentUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Función para asignación masiva de roles
  const handleBulkRoleAssignment = async () => {
    if (!selectedNewRole || selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona usuarios y un rol para asignar",
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Implementar API call para asignación masiva
      console.log('Asignación masiva:', { users: selectedUsers, roleId: selectedNewRole });
      
      toast({
        title: "Roles asignados",
        description: `Se asignó el rol a ${selectedUsers.length} usuarios exitosamente`,
      });
      
      setSelectedUsers([]);
      setSelectedNewRole('');
      // Refrescar datos
      // refetch();
    } catch (error) {
      toast({
        title: "Error en asignación masiva",
        description: "No se pudieron asignar los roles",
        variant: "destructive",
      });
    }
  };

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter((user: User) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
        (user.roleName && user.roleName.toLowerCase().includes(searchLower));
      
      // Filtro por rol jerárquico mejorado
      let matchesRole = true;
      if (roleFilter !== 'all' && roleFilter) {
        // Usar roleId del JOIN con roles
        matchesRole = user.roleId ? String(user.roleId) === roleFilter : false;
      }
      
      // Filtro por estado/tipo de usuario - ahora usando roleId
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        switch (statusFilter) {
          case 'admin':
            matchesStatus = user.roleId && [1, 2].includes(Number(user.roleId)); // Super Admin, Admin General
            break;
          case 'staff':
            matchesStatus = user.roleId && [3, 4, 5].includes(Number(user.roleId)); // Coordinador, Supervisor, Técnico
            break;
          case 'community':
            matchesStatus = user.roleId && Number(user.roleId) === 6; // Operador de Campo
            break;
          case 'business':
            matchesStatus = user.roleId && Number(user.roleId) === 7; // Consultor Auditor
            break;
          case 'active':
            matchesStatus = user.createdAt ? new Date(user.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : false;
            break;
          default:
            matchesStatus = true;
        }
      }
      
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a: User, b: User) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Paginación
  const totalUsers = filteredAndSortedUsers.length;
  console.log('Usuarios después del filtro:', totalUsers);
  const totalPages = Math.ceil(totalUsers / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentUsers = filteredAndSortedUsers.slice(startIndex, endIndex);
  console.log('Usuarios en página actual:', currentUsers.length);

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  // Format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Fecha inválida";
    }
  };

  // Get role badge usando el nuevo sistema jerárquico
  const getRoleBadge = (user: any) => {
    // Ahora usamos roleId directamente del JOIN con la tabla roles
    if (user.roleId) {
      return <RoleBadge roleId={String(user.roleId)} size="sm" />;
    }
    
    // Fallback para usuarios sin roleId (no debería ocurrir)
    return <RoleBadge roleId="7" size="sm" />;
  };

  const { t } = useTranslation('common');
  const { t: tUsers } = useTranslation('users');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con título */}
        <Card className="p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-gray-900" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{tUsers('title')}</h1>
                <p className="text-gray-600 mt-2">{tUsers('subtitle')}</p>
              </div>
            </div>
            <Button onClick={handleCreateUser} className="bg-[#00a587] hover:bg-[#067f5f]">
              <Plus className="h-4 w-4 mr-2" />
              {tUsers('newUser')}
            </Button>
          </div>
        </Card>

        {/* Estadísticas por Rol */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {SYSTEM_ROLES.map((role) => {
            const count = getRoleStatistics()[role.id] || 0;
            const Icon = role.icon;
            return (
              <Card key={role.id} className="p-4 hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-100 text-blue-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-600">{role.displayName}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        
        {/* Search and actions bar */}
        <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={`${t('actions.search')} ${t('navigation.users')}...`}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {t('actions.filter')}
          </Button>
        </div>

        {/* Filtros expandibles */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por rol específico
                </label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {SYSTEM_ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <RoleBadge roleId={role.id} size="sm" showText={false} />
                          <span>{role.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por tipo de usuario
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="admin">Administración</SelectItem>
                    <SelectItem value="staff">Personal</SelectItem>
                    <SelectItem value="community">Comunidad</SelectItem>
                    <SelectItem value="business">Negocios</SelectItem>
                    <SelectItem value="active">Usuarios activos (últimos 30 días)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="flex items-center gap-2 w-full"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-600 pt-2 border-t">
              <span>Mostrando {totalUsers} de {users.length} usuarios</span>
              <span>Página {currentPage} de {totalPages}</span>
            </div>
          </div>
        )}
      </div>

      {/* Asignación masiva de roles - Solo visible cuando hay usuarios seleccionados */}
      {selectedUsers.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-blue-900">
                {selectedUsers.length} usuario{selectedUsers.length > 1 ? 's' : ''} seleccionado{selectedUsers.length > 1 ? 's' : ''}
              </div>
              <Select value={selectedNewRole} onValueChange={setSelectedNewRole}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Seleccionar nuevo rol" />
                </SelectTrigger>
                <SelectContent>
                  {SYSTEM_ROLES.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <RoleBadge roleId={role.id} size="sm" showText={false} />
                        <span>{role.displayName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleBulkRoleAssignment}
                disabled={!selectedNewRole}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Asignar Rol
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedUsers([])}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Users table */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="flex justify-center items-center p-8 text-red-500">
            <X className="h-8 w-8 mr-2" />
            <span>Error al cargar los usuarios. Inténtalo de nuevo.</span>
          </div>
        ) : currentUsers.length === 0 ? (
          <div className="flex flex-col justify-center items-center p-8 text-gray-500">
            <UserRound className="h-12 w-12 mb-2" />
            <h3 className="text-lg font-medium">No se encontraron usuarios</h3>
            {searchQuery ? (
              <p>No hay resultados para "{searchQuery}". Intenta con otra búsqueda.</p>
            ) : (
              <p>No hay usuarios registrados en el sistema.</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('id')}
                  >
                    ID {getSortIcon('id')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('username')}
                  >
                    Usuario {getSortIcon('username')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('email')}
                  >
                    Email {getSortIcon('email')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('fullName')}
                  >
                    Nombre {getSortIcon('fullName')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('role')}
                  >
                    Rol {getSortIcon('role')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('createdAt')}
                  >
                    Fecha de Creación {getSortIcon('createdAt')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserProfileImage 
                        userId={user.id} 
                        role={user.role} 
                        name={user.fullName || `${user.firstName || ''} ${user.lastName || ''}`}
                        size="sm" 
                      />
                      <span>{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.fullName || 'Sin nombre'}</TableCell>
                  <TableCell>{getRoleBadge(user)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        title="Editar usuario"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleConfirmDelete(user)}
                        title="Eliminar usuario"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Paginación */}
      {totalUsers > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a {Math.min(endIndex, totalUsers)} de {totalUsers} usuarios
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleFirstPage}
              disabled={currentPage === 1}
              title="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                const isActive = pageNumber === currentPage;
                
                return (
                  <Button
                    key={pageNumber}
                    variant={isActive ? "default" : "outline"}
                    size="icon"
                    onClick={() => handlePageChange(pageNumber)}
                    className={isActive ? "bg-primary text-primary-foreground" : ""}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleLastPage}
              disabled={currentPage === totalPages}
              title="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      )}

      {/* User detail/edit dialog */}
      {(selectedUser !== null || isNewUser) && (
        <UserDetail
          user={selectedUser}
          isNew={isNewUser}
          onClose={handleCloseUserDialog}
          onSave={handleSaveUser}
          isSaving={saveUserMutation.isPending}
          editingUserId={editingUserId}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar al usuario ${userToDelete?.username}?`}
        onConfirm={handleDeleteUser}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={deleteUserMutation.isPending}
      />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;