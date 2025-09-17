import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { db } from '../db';
import { users, userRoles } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';

// Configurar Firebase Admin SDK si no está configurado
if (!admin.apps.length) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  
  if (projectId) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId
      });
      console.log('🔥 [AUTH-MIDDLEWARE] Firebase Admin SDK inicializado');
    } catch (error) {
      console.warn('⚠️ [AUTH-MIDDLEWARE] Error inicializando Firebase Admin:', error);
    }
  }
}

// Tipo extendido para incluir el usuario en la petición
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware de autenticación con Firebase
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`🚨 [AUTH-DEBUG] Middleware ejecutándose para ${req.method} ${req.path}`);
  try {
    const authHeader = req.headers.authorization;
    let firebaseUid: string | null = null;

    // 1. Verificar token de Firebase
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7);
      
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        firebaseUid = decodedToken.uid;
        console.log(`🔐 [AUTH] Token Firebase verificado: ${firebaseUid}`);
      } catch (error) {
        console.error('❌ [AUTH] Error verificando token Firebase:', error);
      }
    }

    // 2. TEMPORAL: Permitir x-firebase-uid header para usuarios aprobados durante migración
    const isDevelopment = process.env.NODE_ENV === 'development';
    const allowHeaderAuth = process.env.ALLOW_HEADER_AUTH === 'true' || isDevelopment;
    console.log(`🔍 [DEBUG-TEMP] NODE_ENV: ${process.env.NODE_ENV}, ALLOW_HEADER_AUTH: ${process.env.ALLOW_HEADER_AUTH}, allowHeaderAuth: ${allowHeaderAuth}, x-firebase-uid: ${req.headers['x-firebase-uid']}`);
    
    if (!firebaseUid && req.headers['x-firebase-uid'] && allowHeaderAuth) {
      const headerUid = req.headers['x-firebase-uid'] as string;
      
      // Whitelist de usuarios aprobados durante la migración
      const approvedUids = [
        'AgDictDqdqUOo9hKUYlXPT3t5Bv1', // Luis
        'QAo7RspJkFY1KDQmAnN0L4M3vsS2'  // Olivia
      ];
      
      if (approvedUids.includes(headerUid)) {
        firebaseUid = headerUid;
        console.log(`🔗 [AUTH-TEMP] Using approved Firebase UID from header: ${firebaseUid}`);
      } else {
        console.log(`❌ [AUTH-TEMP] UID not in approved list: ${headerUid}`);
      }
    }

    // 3. MODO DESARROLLO ESTRICTO: Solo permitir usuario fijo en desarrollo explícito
    const allowDevFallback = process.env.ALLOW_DEV_ADMIN_FALLBACK === 'true';
    
    if (!firebaseUid && isDevelopment && allowDevFallback) {
      console.log('🛠️ [AUTH] DESARROLLO: Usando usuario administrador fijo (solo en dev)');
      req.user = {
        id: 1,
        username: 'Luis Romahn',
        role: 'super_admin',  // ✅ CORREGIDO: usar underscore consistente
        isActive: true,
        roleId: 1,
        firebaseUid: 'AgDictDqdqUOo9hKUYlXPT3t5Bv1',
        uid: 'AgDictDqdqUOo9hKUYlXPT3t5Bv1'
      };
      return next();
    }

    // 4. Si no hay Firebase UID, denegar acceso
    if (!firebaseUid) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    // 5. Buscar usuario en base de datos local por Firebase UID (usando SQL crudo para evitar JOINs)
    console.log(`🔧 [AUTH-DEBUG] Buscando usuario con Firebase UID: ${firebaseUid}`);
    const userResult = await db.execute(sql`
      SELECT id, firebase_uid, email, username, full_name, role_id, is_active, needs_password_reset
      FROM users 
      WHERE firebase_uid = ${firebaseUid}
      LIMIT 1
    `);
    const localUser = userResult.rows[0] as any;

    if (!localUser) {
      console.log(`❌ [AUTH] Usuario no encontrado para Firebase UID: ${firebaseUid}`);
      return res.status(401).json({ message: 'Usuario no autorizado en el sistema' });
    }

    console.log(`🔍 [AUTH-DEBUG] is_active value: "${localUser.is_active}", type: ${typeof localUser.is_active}`);
    if (!localUser.is_active) {
      console.log(`❌ [AUTH] Usuario inactivo: ${localUser.email}`);
      return res.status(401).json({ message: 'Cuenta desactivada' });
    }

    // 6. Obtener roles del usuario (BYPASS TEMPORAL DURANTE MIGRACIÓN)
    // Durante la migración Firebase, usar directamente el roleId legacy para evitar errores de tabla user_roles
    console.log(`🚨 [AUTH-BYPASS] Usando rol legacy directo durante migración Firebase`);
    const userRolesList = localUser.roleId ? [{ roleId: localUser.roleId }] : [];

    // 7. Configurar objeto usuario en request con rol normalizado
    // Normalizar rol desde DB - usar roleId como fuente de verdad principal
    const roleMapping: Record<number, string> = {
      1: 'super_admin',  // ✅ UNIFICADO: usar underscore consistentemente
      2: 'admin', 
      3: 'director',
      4: 'manager',
      5: 'supervisor',
      6: 'user'
    };
    const normalizedRole = roleMapping[localUser.roleId ?? 0] || 'user'; // ✅ SIEMPRE usar roleId como fuente principal, manejar null
    
    req.user = {
      id: localUser.id,
      firebaseUid: localUser.firebaseUid,
      username: localUser.username,
      email: localUser.email,
      fullName: localUser.fullName,
      role: normalizedRole, // ✅ AGREGADO: rol normalizado como string
      roleId: localUser.roleId,
      isActive: localUser.isActive,
      roles: userRolesList,
      needsPasswordReset: localUser.needsPasswordReset
    };

    console.log(`✅ [AUTH] Usuario autenticado: ${localUser.email}`);
    next();

  } catch (error) {
    console.error('💥 [AUTH] Error en middleware de autenticación:', error);
    res.status(500).json({ message: 'Error interno de autenticación' });
  }
};

// Middleware para verificar si el usuario tiene acceso a un municipio específico
export const hasMunicipalityAccess = (municipalityId?: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Si no hay usuario autenticado, no tiene acceso
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    // DESARROLLO: Permitir acceso SOLO con flag explícito
    const isDevelopment = process.env.NODE_ENV === 'development';
    const allowMunicipalBypass = process.env.ALLOW_MUNICIPAL_ACCESS_BYPASS === 'true';
    if (isDevelopment && allowMunicipalBypass && req.user.role === 'admin') {
      console.log('🛠️ [DEV] Modo desarrollo - Permitiendo acceso municipal para admin');
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

  // DESARROLLO: Permitir acceso SOLO con flags explícitos
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowParkBypass = process.env.ALLOW_PARK_ACCESS_BYPASS === 'true';
  
  if (isDevelopment && allowParkBypass) {
    console.log("🛠️ [DEV] Permitiendo acceso al parque (solo desarrollo)");
    return next();
  }
  
  // ✅ PRODUCCIÓN: Implementar verificación real de permisos
  // Si el usuario es super admin, tiene acceso a todos los parques
  if (req.user.role === 'super_admin' || req.user.role === 'admin') {
    return next();
  }
  
  // ✅ SEGURIDAD: Solo admin/super_admin tienen acceso hasta implementar verificación específica
  return res.status(403).json({ 
    message: 'No tiene permisos para acceder a este parque' 
  });
  
  /* TODO: Implementar verificación completa de municipio y parque específicos
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

    // Si es super admin o admin, permitir todo (roles especiales)
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      return next();
    }

    try {
      // Por ahora, implementamos una verificación básica de permisos
      // En el futuro, esto se conectará con la base de datos de permisos
      const userRole = req.user.role;
      
      // Definir permisos básicos por rol
      const basicPermissions: any = {
        'super_admin': ['*'], // ✅ Super Admin tiene todos los permisos
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