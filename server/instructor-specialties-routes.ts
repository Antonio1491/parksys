import { Request, Response, Router } from "express";
import { db } from "./db";
import { instructors } from "../shared/schema";

const router = Router();

// Endpoint para obtener estadísticas de especialidades de instructores
router.get("/instructor-specialties/stats", async (req: Request, res: Response) => {
  try {
    console.log("📊 Calculando estadísticas de especialidades de instructores...");

    // Obtener todos los instructores con sus especialidades
    const allInstructors = await db.select({
      id: instructors.id,
      specialties: instructors.specialties,
      status: instructors.status
    }).from(instructors);

    console.log(`📊 Total instructores encontrados: ${allInstructors.length}`);

    // Procesar especialidades
    const specialtyCount = new Map<string, number>();
    let activeInstructorsWithSpecialties = 0;
    
    allInstructors.forEach((instructor: any) => {
      if (instructor.specialties && instructor.specialties.length > 0) {
        if (instructor.status === 'active') {
          activeInstructorsWithSpecialties++;
        }
        
        instructor.specialties.forEach((specialty: string) => {
          if (specialty && specialty.trim()) {
            const cleanSpecialty = specialty.trim();
            specialtyCount.set(cleanSpecialty, (specialtyCount.get(cleanSpecialty) || 0) + 1);
          }
        });
      }
    });

    // Convertir a array y ordenar por frecuencia
    const topSpecialties = Array.from(specialtyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([specialty, count]) => ({
        name: specialty,
        count: count
      }));

    const stats = {
      totalUniqueSpecialties: specialtyCount.size,
      totalInstructors: allInstructors.length,
      activeInstructorsWithSpecialties,
      topSpecialties,
      specialtyDistribution: Array.from(specialtyCount.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([specialty, count]) => ({
          specialty,
          count,
          percentage: Math.round((count / allInstructors.length) * 100)
        }))
    };

    console.log("📊 Estadísticas de especialidades calculadas:", {
      totalUniqueSpecialties: stats.totalUniqueSpecialties,
      totalInstructors: stats.totalInstructors,
      activeInstructorsWithSpecialties: stats.activeInstructorsWithSpecialties,
      topSpecialtiesCount: stats.topSpecialties.length
    });

    res.json(stats);

  } catch (error) {
    console.error("Error calculando estadísticas de especialidades:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

export default router;