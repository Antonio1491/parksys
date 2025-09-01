import { Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function handleLogin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    
    // Primero buscar el usuario por nombre de usuario o email
    const result = await db.execute(sql`
      SELECT u.id, u.username, u.email, u.full_name, u.role_id, r.name as role_name, u.municipality_id, u.password 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username = ${username} OR u.email = ${username}
    `);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    
    const userData = result.rows[0];
    
    // Verificar la contraseña usando bcrypt
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    
    // Si el usuario pertenece a un municipio, incluimos su información
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
    
    // Convertimos a formato camelCase para mantener consistencia en el frontend
    const user = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      fullName: userData.full_name,
      role: userData.role_name,
      roleId: userData.role_id,
      municipalityId: userData.municipality_id
    };
    
    res.json({
      user: {
        ...user,
        municipality: municipalityData
      },
      token: 'dummy-token-' + Date.now()
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error durante el inicio de sesión" });
  }
}