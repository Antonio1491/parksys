import { Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export async function getCurrentUser(req: Request, res: Response) {
  try {
    // En desarrollo, obtener el usuario del middleware
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // Obtener datos completos del usuario desde la base de datos
    const result = await db.execute(sql`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.municipality_id,
             u.role_id, r.name as role_name, r.level as role_level, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${req.user.id}
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const userData = result.rows[0];

    // Obtener información del municipio si existe
    let municipalityData = null;
    if (userData.municipality_id) {
      const municipalityResult = await db.execute(sql`
        SELECT id, name, state, logo_url 
        FROM municipalities 
        WHERE id = ${userData.municipality_id}
      `);
      
      if (municipalityResult.rows.length > 0) {
        const municipality = municipalityResult.rows[0];
        municipalityData = {
          id: municipality.id,
          name: municipality.name,
          state: municipality.state,
          logoUrl: municipality.logo_url
        };
      }
    }

    const user = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      fullName: userData.full_name,
      role: userData.role,
      municipalityId: userData.municipality_id,
      roleId: userData.role_id,
      roleName: userData.role_name,
      roleLevel: userData.role_level,
      rolePermissions: userData.role_permissions,
      municipality: municipalityData
    };

    res.json(user);
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}
