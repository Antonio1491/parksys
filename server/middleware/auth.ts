import { Request, Response, NextFunction } from 'express';

// Tipo extendido para incluir el usuario en la petición
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware simplificado para desarrollo
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Siempre permitir acceso en desarrollo
  req.user = {
    id: 4,
    username: 'Luis',
    role: 'admin',
    isActive: true,
    roleId: 1
  };
  next();
};

// Middleware para verificar si el usuario tiene acceso a un municipio específico
export const hasMunicipalityAccess = (municipalityId?: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Si no hay usuario autenticado, no tiene acceso
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    // MODO DESARROLLO: Permitir acceso a todos los usuarios autenticados
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment && req.user.role === 'admin') {
      console.log('🛠️ Modo desarrollo - Permitiendo acceso municipal para admin');
      return next();
    }

    // Si el usuario es super admin, tiene acceso a todos los municipios
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Si el usuario es admin de municipio, solo tiene acceso a su municipio
    if (req.user.role === 'admin' && req.user.municipalityId) {
      // Si se especificó un municipalityId en la petición, verificamos que coincida
      const targetMunicipalityId = municipalityId || 
                                  Number(req.params.municipalityId) || 
                                  Number(req.body.municipalityId);
      
      if (targetMunicipalityId && req.user.municipalityId !== targetMunicipalityId) {
        return res.status(403).json({ 
          message: 'No tiene permisos para acceder a este municipio' 
        });
      }
      
      return next();
    }

    // Si el usuario no tiene un rol adecuado o no está asignado a un municipio
    return res.status(403).json({ 
      message: 'No tiene los permisos necesarios para realizar esta acción'
    });
  };
};

// Middleware para verificar si el parque pertenece al municipio del usuario
export const hasParkAccess = async (req: Request, res: Response, next: NextFunction) => {
  // Si no hay usuario autenticado, no tiene acceso
  if (!req.user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  // MODO DESARROLLO: Permitir acceso a todos los usuarios autenticados
  // En producción, se implementaría la verificación completa
  console.log("Permitiendo acceso al parque para desarrollo - Usuario:", req.user);
  return next();
  
  /* Verificación normal de permisos (desactivada para desarrollo)
  // Si el usuario es super admin o admin, tiene acceso a todos los parques
  if (req.user.role === 'super_admin' || req.user.role === 'admin') {
    return next();
  }

  // Obtenemos el ID del parque de los parámetros
  const parkId = Number(req.params.id || req.params.parkId);
  
  if (!parkId) {
    return res.status(400).json({ message: 'ID de parque no proporcionado' });
  }

  try {
    // Obtenemos el parque
    const park = await storage.getPark(parkId);
    
    if (!park) {
      return res.status(404).json({ message: 'Parque no encontrado' });
    }

    // Verificamos que el parque pertenezca al municipio del usuario
    if (park.municipalityId !== req.user.municipalityId) {
      return res.status(403).json({ 
        message: 'No tiene permisos para acceder a este parque' 
      });
    }

    next();
  } catch (error) {
    console.error('Error al verificar acceso al parque:', error);
    return res.status(500).json({ message: 'Error al verificar permisos' });
  }
  */
};

// Middleware para verificar permisos específicos
export const requirePermission = (module: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Si no hay usuario autenticado, denegar acceso
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    // Si es admin, permitir todo (rol especial)
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      // Por ahora, implementamos una verificación básica de permisos
      // En el futuro, esto se conectará con la base de datos de permisos
      const userRole = req.user.role;
      
      // Definir permisos básicos por rol
      const basicPermissions: any = {
        'admin': ['*'], // Admin tiene todos los permisos
        'director': ['users-view', 'users-create', 'users-edit', 'parks-view', 'parks-create', 'parks-edit'],
        'manager': ['parks-view', 'parks-edit', 'activities-view', 'activities-create'],
        'supervisor': ['users-view', 'parks-view', 'activities-view'],
        'user': ['parks-view', 'activities-view'],
        'ciudadano': ['parks-view', 'activities-view'],
        'voluntario': ['parks-view', 'activities-view', 'volunteers-edit'],
        'instructor': ['parks-view', 'activities-view', 'instructors-edit'],
        'guardaparques': ['parks-view', 'parks-edit', 'activities-view'],
        'guardia': ['parks-view', 'activities-view'],
        'concesionario': ['parks-view', 'activities-view']
      };

      const requiredPermission = `${module}-${action}`;
      const rolePermissions = basicPermissions[userRole] || [];
      
      // Si el rol tiene permisos universales (*) o el permiso específico
      if (rolePermissions.includes('*') || rolePermissions.includes(requiredPermission)) {
        return next();
      }

      // Si no tiene el permiso, denegar acceso
      return res.status(403).json({ 
        message: `No tiene permisos para ${action} en el módulo ${module}` 
      });
      
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return res.status(500).json({ message: 'Error al verificar permisos' });
    }
  };
};

// Middleware simplificado para verificar si es admin
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  // Permitir tanto admin como super_admin para operaciones administrativas
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }

  next();
};