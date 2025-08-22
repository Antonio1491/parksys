import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Mail, 
  Phone, 
  Award, 
  Star, 
  Briefcase, 
  ChevronRight,
  Eye,
  BookOpen,
  MessageSquare,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InstructorProfileDialog from './InstructorProfileDialog';
import InstructorEditDialog from './InstructorEditDialog';

// Tipo para los instructores
interface InstructorCardProps {
  instructor: {
    id: number;
    full_name: string;
    email: string;
    phone?: string;
    specialties?: string;
    experience_years: number;
    status: string;
    profile_image_url?: string;
    created_at?: string;
    rating?: number;
  };
  showActions?: boolean;
  compact?: boolean;
}

export default function InstructorCard({ instructor, showActions = true, compact = false }: InstructorCardProps) {
  const [, setLocation] = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Iniciales para avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Renderizar especialidades
  const renderSpecialties = (specialties?: string) => {
    if (!specialties) return null;
    
    let specialtiesList: string[] = [];
    
    try {
      // Intentar parsear como JSON/array PostgreSQL si tiene formato de array
      if (specialties.startsWith('{') && specialties.endsWith('}')) {
        // Es un array PostgreSQL, limpiar y parsear
        const arrayContent = specialties.slice(1, -1);
        
        // Manejo especial para arrays PostgreSQL con comillas dobles escapadas
        // Patrón común: {"Danza","Ballet","Danza folclórica"} o {""Danza"",""Ballet""}
        specialtiesList = arrayContent
          .split(',')
          .map(s => {
            let cleaned = s.trim();
            
            // Limpieza completa paso a paso para PostgreSQL
            // 1. Remover comillas dobles del inicio y final (cualquier cantidad)
            cleaned = cleaned.replace(/^"+/, '').replace(/"+$/, '');
            
            // 2. Remover comillas simples del inicio y final  
            cleaned = cleaned.replace(/^'+/, '').replace(/'+$/, '');
            
            // 3. Remover corchetes del inicio y final
            cleaned = cleaned.replace(/^\[+/, '').replace(/\]+$/, '');
            
            // 4. Limpieza de espacios
            cleaned = cleaned.trim();
            
            return cleaned;
          })
          .filter(s => s.length > 0);
      } else if (specialties.startsWith('[') && specialties.endsWith(']')) {
        // Es un array JSON
        specialtiesList = JSON.parse(specialties);
      } else {
        // Es una cadena separada por comas simple
        specialtiesList = specialties.split(',').map(s => s.trim());
      }
    } catch (error) {
      // Si falla el parsing, usar split por comas como fallback con limpieza agresiva
      specialtiesList = specialties.split(',')
        .map(s => {
          let cleaned = s.trim();
          // Aplicar todas las limpiezas posibles para casos de error
          cleaned = cleaned.replace(/^["'\[\]]+/, '').replace(/["'\[\]]+$/, '');
          return cleaned.trim();
        })
        .filter(s => s.length > 0);
    }
    
    // Aplicar una limpieza final para asegurar que no queden caracteres no deseados
    specialtiesList = specialtiesList
      .map(s => {
        let cleaned = s.trim();
        // Limpieza final: remover cualquier carácter de puntuación al inicio/final
        cleaned = cleaned.replace(/^["'\[\]{}]+/, '').replace(/["'\[\]{}]+$/, '');
        return cleaned.trim();
      })
      .filter(s => s && s.length > 0);
    
    if (specialtiesList.length <= 2 || compact) {
      return specialtiesList.map((specialty, index) => (
        <Badge key={index} variant="outline" className="mr-1 mb-1">{specialty}</Badge>
      ));
    } else {
      return (
        <>
          <Badge variant="outline" className="mr-1 mb-1">{specialtiesList[0]}</Badge>
          <Badge variant="outline" className="mr-1 mb-1">{specialtiesList[1]}</Badge>
          <Badge variant="outline" className="mb-1">+{specialtiesList.length - 2} más</Badge>
        </>
      );
    }
  };

  // Color de fondo basado en el status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 border-green-200';
      case 'inactive': return 'bg-gray-50 border-gray-200';
      case 'pending': return 'bg-yellow-50 border-yellow-200';
      default: return '';
    }
  };

  // Renderizar estrellas para la calificación
  const renderRating = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
        />
      );
    }
    
    return <div className="flex items-center">{stars}</div>;
  };
  
  return (
    <>
      <Card className={`h-full overflow-hidden transition-all ${getStatusColor(instructor.status)}`}>
        <CardHeader className="pb-0 pt-4">
          <div className="flex items-center">
            <Avatar className="h-14 w-14 mr-3">
              <AvatarImage src={instructor.profile_image_url} alt={instructor.full_name} />
              <AvatarFallback>
                {getInitials(instructor.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">{instructor.full_name}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Briefcase className="h-4 w-4 mr-1" />
                <span>{instructor.experience_years} {instructor.experience_years === 1 ? 'año' : 'años'} de experiencia</span>
              </div>
              {!compact && instructor.rating && (
                <div className="mt-1">
                  {renderRating(instructor.rating)}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          {!compact && (
            <>
              <div className="text-sm mb-3 flex items-center text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span className="truncate">{instructor.email}</span>
              </div>
              
              {instructor.phone && (
                <div className="text-sm mb-3 flex items-center text-gray-500">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{instructor.phone}</span>
                </div>
              )}
            </>
          )}
          
          <div className="mt-2 flex flex-wrap">
            {renderSpecialties(instructor.specialties)}
          </div>
        </CardContent>
        
        {showActions && (
          <CardFooter className="flex justify-between border-t p-3 bg-gray-50">
            {/* Menú de acciones */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-1" />
                  Acciones
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar perfil
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setLocation(`/admin/activities/instructors/${instructor.id}/assignments`)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Asignaciones
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation(`/admin/activities/instructors/${instructor.id}/evaluations`)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Evaluaciones
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation(`/admin/activities/instructors/${instructor.id}/recognitions`)}>
                    <Award className="h-4 w-4 mr-2" />
                    Reconocimientos
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Botones de acceso rápido */}
            <div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsProfileOpen(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Diálogo para ver el perfil del instructor */}
      <InstructorProfileDialog 
        instructorId={instructor.id}
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
      
      {/* Diálogo para editar el perfil del instructor */}
      <InstructorEditDialog 
        instructorId={instructor.id}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
}