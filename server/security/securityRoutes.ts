import { Router, Request, Response } from 'express';
import { SecurityService } from './securityService';
import { changePasswordSchema, unlockAccountSchema } from '../../shared/security-schema';
import { z } from 'zod';

const router = Router();

// Middleware para obtener IP del cliente
const getClientIP = (req: Request): string => {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         'unknown';
};

// Middleware para verificar si el usuario es admin
const isAdmin = (req: any, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  const userRole = req.user.role;
  if (!['admin', 'super_admin'].includes(userRole)) {
    return res.status(403).json({ error: 'Acceso denegado - Se requieren permisos de administrador' });
  }
  
  next();
};

// ========== RUTAS PÚBLICAS (REQUIEREN AUTENTICACIÓN) ==========

// Obtener actividad personal del usuario
router.get('/activity', async (req: any, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await SecurityService.getUserActivity(req.user.id, page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo actividad del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cambiar contraseña
router.post('/change-password', async (req: any, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Validar datos de entrada
    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: validation.error.errors
      });
    }

    const { currentPassword, newPassword } = validation.data;
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await SecurityService.changePassword(
      req.user.id,
      req.user.username,
      currentPassword,
      newPassword,
      ipAddress,
      userAgent
    );

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Validar fortaleza de contraseña en tiempo real
router.post('/validate-password', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }

    const validation = SecurityService.validatePassword(password);
    res.json(validation);
  } catch (error) {
    console.error('Error validando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS ADMINISTRATIVAS (SOLO ADMIN) ==========

// Obtener estadísticas de seguridad
router.get('/api/admin/stats', isAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await SecurityService.getSecurityStats(days);
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas de seguridad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener actividad sospechosa
router.get('/api/admin/suspicious-activity', isAdmin, async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const activities = await SecurityService.getSuspiciousActivity(hours);
    res.json(activities);
  } catch (error) {
    console.error('Error obteniendo actividad sospechosa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Desbloquear cuenta
router.post('/api/admin/unlock-account', isAdmin, async (req: any, res: Response) => {
  try {
    // Validar datos de entrada
    const validation = unlockAccountSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: validation.error.errors
      });
    }

    const { username } = validation.data;
    const success = await SecurityService.unlockAccount(username);

    if (success) {
      // Log de la acción del admin
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      await SecurityService.logUserActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'admin_unlock_account',
        ipAddress,
        userAgent,
        success: true,
        details: { unlocked_username: username }
      });

      res.json({ message: `Cuenta de ${username} desbloqueada correctamente` });
    } else {
      res.status(400).json({ error: 'Error desbloqueando la cuenta' });
    }
  } catch (error) {
    console.error('Error desbloqueando cuenta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los logs de auditoría (para admin)
router.get('/api/admin/audit-logs', isAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string;
    const username = req.query.username as string;

    // Esta función necesitaría ser implementada en SecurityService
    // Por ahora retornamos una respuesta básica
    res.json({
      logs: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    });
  } catch (error) {
    console.error('Error obteniendo logs de auditoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de prueba para verificar que el módulo funciona
router.get('/test', async (req: Request, res: Response) => {
  try {
    res.json({
      message: 'Módulo de seguridad funcionando correctamente',
      timestamp: new Date().toISOString(),
      routes: [
        'GET /api/security/activity - Actividad personal del usuario',
        'POST /api/security/change-password - Cambiar contraseña',
        'POST /api/security/validate-password - Validar contraseña',
        'GET /api/security/admin/stats - Estadísticas (admin)',
        'GET /api/security/admin/suspicious-activity - Actividad sospechosa (admin)',
        'POST /api/security/admin/unlock-account - Desbloquear cuenta (admin)'
      ]
    });
  } catch (error) {
    console.error('Error en ruta de prueba:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;