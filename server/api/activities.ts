import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { insertActivitySchema } from '@shared/schema';
import { storage } from '../storage';

/**
 * Controlador para obtener todas las actividades
 */
export async function getAllActivities(req: Request, res: Response) {
  try {
    const activities = await storage.getAllActivities();
    res.json(activities);
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ message: 'Error al recuperar actividades' });
  }
}

/**
 * Controlador para obtener una actividad específica por ID
 */
export async function getActivity(req: Request, res: Response) {
  try {
    const activityId = Number(req.params.id);
    const activity = await storage.getActivity(activityId);

    if (!activity) {
      return res.status(404).json({ message: "Actividad no encontrada" });
    }

    res.json(activity);
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    res.status(500).json({ message: 'Error al recuperar actividad' });
  }
}

/**
 * Controlador para obtener las actividades de un parque específico
 */
export async function getParkActivities(req: Request, res: Response) {
  try {
    const parkId = Number(req.params.id);
    const activities = await storage.getActivitiesByParkId(parkId);
    res.json(activities);
  } catch (error) {
    console.error('Error al obtener actividades del parque:', error);
    res.status(500).json({ message: 'Error al recuperar actividades del parque' });
  }
}

/**
 * Controlador para crear una nueva actividad
 */
export async function createActivity(req: Request, res: Response) {
  try {
    const parkId = Number(req.params.id);
    console.log("Datos recibidos en createActivity:", req.body);
    
    // Extraer los datos
    const { startDate, endDate, ...otherData } = req.body;
    
    // Convertir las fechas explícitamente a objetos Date
    let parsedStartDate: Date;
    let parsedEndDate: Date | undefined;
    
    try {
      parsedStartDate = new Date(startDate);
      if (endDate) {
        parsedEndDate = new Date(endDate);
      }
    } catch (e) {
      console.error("Error al convertir fechas:", e);
      return res.status(400).json({ message: "Formato de fecha inválido" });
    }
    
    // Verificar que la fecha de inicio es válida
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ message: "La fecha de inicio no es válida" });
    }
    
    // Verificar que la fecha de fin es válida (si existe)
    if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ message: "La fecha de fin no es válida" });
    }
    
    // Crear el objeto con los datos procesados
    const activityData = { 
      ...otherData, 
      parkId,
      startDate: parsedStartDate,
      ...(parsedEndDate && { endDate: parsedEndDate })
    };
    
    console.log("Datos procesados para creación:", activityData);
    
    const data = insertActivitySchema.parse(activityData);
    const result = await storage.createActivity(data);
    
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      console.error("Error de validación Zod:", error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error("Error al crear actividad:", error);
    res.status(500).json({ message: "Error al agregar actividad al parque" });
  }
}

/**
 * Controlador para actualizar una actividad existente
 */
export async function updateActivity(req: Request, res: Response) {
  try {
    const activityId = Number(req.params.id);
    console.log("Datos recibidos en updateActivity:", req.body);
    
    // Verificar si la actividad existe
    const existingActivity = await storage.getActivity(activityId);
    if (!existingActivity) {
      return res.status(404).json({ message: "Actividad no encontrada" });
    }
    
    // Extraer los datos
    const { startDate, endDate, parkId, ...otherData } = req.body;
    
    // Convertir las fechas explícitamente a objetos Date
    let parsedStartDate: Date;
    let parsedEndDate: Date | undefined;
    
    try {
      parsedStartDate = new Date(startDate);
      if (endDate) {
        parsedEndDate = new Date(endDate);
      }
    } catch (e) {
      console.error("Error al convertir fechas:", e);
      return res.status(400).json({ message: "Formato de fecha inválido" });
    }
    
    // Verificar que la fecha de inicio es válida
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ message: "La fecha de inicio no es válida" });
    }
    
    // Verificar que la fecha de fin es válida (si existe)
    if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ message: "La fecha de fin no es válida" });
    }
    
    // Crear el objeto con los datos procesados
    const activityData = { 
      ...otherData,
      startDate: parsedStartDate,
      ...(parsedEndDate && { endDate: parsedEndDate })
    };
    
    console.log("Datos procesados para actualización:", activityData);
    
    // Validar los datos
    const result = await storage.updateActivity(activityId, activityData);
    
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      console.error("Error de validación Zod:", error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error("Error al actualizar actividad:", error);
    res.status(500).json({ message: "Error al actualizar actividad" });
  }
}

/**
 * Controlador para eliminar una actividad
 */
export async function deleteActivity(req: Request, res: Response) {
  try {
    const activityId = Number(req.params.id);
    
    // Verificar si la actividad existe
    const existingActivity = await storage.getActivity(activityId);
    if (!existingActivity) {
      return res.status(404).json({ message: "Actividad no encontrada" });
    }
    
    await storage.deleteActivity(activityId);
    
    res.status(200).json({ success: true, message: "Actividad eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar actividad:", error);
    res.status(500).json({ message: "Error al eliminar actividad" });
  }
}