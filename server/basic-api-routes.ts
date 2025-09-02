import type { Express } from "express";
import { pool } from "./db";

/**
 * Rutas básicas de API para resolver conectividad inmediata
 * Estas rutas bypass los errores de TypeScript en routes.ts
 */
export function registerBasicApiRoutes(app: Express) {
  console.log("🔧 Registrando rutas básicas de API...");

  // Ruta básica de parques
  app.get('/api/parks', async (req, res) => {
    try {
      console.log("📡 Solicitando lista de parques...");
      
      const result = await pool.query(`
        SELECT 
          p.id,
          p.name,
          p.municipality_id,
          p.park_type,
          p.address,
          p.latitude,
          p.longitude,
          p.area,
          p.description,
          p.foundation_year,
          p.conservation_status,
          p.contact_email,
          p.contact_phone,
          p.opening_hours,
          p.url as website,
          p.regulation_url,
          p.video_url,
          p.certificaciones,
          p.administrator,
          p.created_at,
          p.updated_at,
          m.name as municipality_name
        FROM parks p
        LEFT JOIN municipalities m ON p.municipality_id = m.id
        WHERE p.is_deleted = false OR p.is_deleted IS NULL
        ORDER BY p.name ASC
      `);
      
      console.log(`✅ Encontrados ${result.rows.length} parques`);
      res.json({ data: result.rows });
      
    } catch (error) {
      console.error("❌ Error en /api/parks:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: "No se pudieron cargar los parques"
      });
    }
  });

  // Ruta básica de eventos
  app.get('/api/events', async (req, res) => {
    try {
      console.log("📡 Solicitando lista de eventos...");
      
      const result = await pool.query(`
        SELECT 
          e.id,
          e.title,
          e.description,
          e.location,
          e.start_date,
          e.end_date,
          e.start_time,
          e.end_time,
          e.capacity,
          e.featured_image_url,
          e.event_type,
          e.status,
          e.is_free,
          e.price,
          e.requires_approval,
          e.target_audience,
          e.organizer_name,
          e.organizer_email,
          e.created_at,
          e.updated_at
        FROM events e
        ORDER BY e.start_date DESC
      `);
      
      console.log(`✅ Encontrados ${result.rows.length} eventos`);
      res.json({ data: result.rows });
      
    } catch (error) {
      console.error("❌ Error en /api/events:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: "No se pudieron cargar los eventos"
      });
    }
  });

  // Ruta básica de sponsors
  app.get('/api/sponsors', async (req, res) => {
    try {
      console.log("📡 Solicitando lista de sponsors...");
      
      const result = await pool.query(`
        SELECT 
          s.id,
          s.name,
          s.category,
          s.logo,
          s.website_url,
          s.email,
          s.phone,
          s.address,
          s.status,
          s.contract_start,
          s.contract_end,
          s.contract_value,
          s.representative,
          s.package_name,
          s.created_at,
          s.updated_at
        FROM sponsors s
        WHERE s.status = 'active'
        ORDER BY s.name ASC
      `);
      
      console.log(`✅ Encontrados ${result.rows.length} sponsors`);
      res.json({ data: result.rows });
      
    } catch (error) {
      console.error("❌ Error en /api/sponsors:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: "No se pudieron cargar los sponsors"
      });
    }
  });

  // Ruta básica de actividades
  app.get('/api/activities', async (req, res) => {
    try {
      console.log("📡 Solicitando lista de actividades...");
      
      const result = await pool.query(`
        SELECT 
          a.id,
          a.title,
          a.description,
          a.category,
          a.park_id,
          a.instructor_id,
          a.start_date,
          a.end_date,
          a.start_time,
          a.end_time,
          a.capacity,
          a.status,
          a.location,
          a.is_free,
          a.price,
          a.created_at,
          p.name as park_name
        FROM activities a
        LEFT JOIN parks p ON a.park_id = p.id
        ORDER BY a.start_date DESC
        LIMIT 100
      `);
      
      console.log(`✅ Encontradas ${result.rows.length} actividades`);
      res.json({ data: result.rows });
      
    } catch (error) {
      console.error("❌ Error en /api/activities:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: "No se pudieron cargar las actividades"
      });
    }
  });

  // Ruta básica de usuarios
  app.get('/api/users', async (req, res) => {
    try {
      console.log("📡 Solicitando lista de usuarios...");
      
      const result = await pool.query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.role,
          u.municipality_id,
          u.created_at,
          u.updated_at,
          m.name as municipality_name
        FROM users u
        LEFT JOIN municipalities m ON u.municipality_id = m.id
        ORDER BY u.created_at DESC
        LIMIT 100
      `);
      
      console.log(`✅ Encontrados ${result.rows.length} usuarios`);
      res.json({ data: result.rows });
      
    } catch (error) {
      console.error("❌ Error en /api/users:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: "No se pudieron cargar los usuarios"
      });
    }
  });

  // Ruta básica de voluntarios  
  app.get('/api/volunteers', async (req, res) => {
    try {
      console.log("📡 Solicitando lista de voluntarios...");
      
      const result = await pool.query(`
        SELECT 
          v.id,
          v.name,
          v.email,
          v.phone,
          v.availability,
          v.skills,
          v.status,
          v.profile_image_url,
          v.created_at,
          v.updated_at
        FROM volunteers v
        ORDER BY v.created_at DESC
        LIMIT 100
      `);
      
      console.log(`✅ Encontrados ${result.rows.length} voluntarios`);
      res.json({ data: result.rows });
      
    } catch (error) {
      console.error("❌ Error en /api/volunteers:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: "No se pudieron cargar los voluntarios"
      });
    }
  });

  // Ruta básica de empleados
  app.get('/api/hr/employees', async (req, res) => {
    try {
      console.log("📡 Solicitando lista de empleados...");
      
      const result = await pool.query(`
        SELECT 
          e.id,
          e.name,
          e.position,
          e.department,
          e.email,
          e.phone,
          e.hire_date,
          e.salary,
          e.status,
          e.created_at,
          e.updated_at
        FROM employees e
        ORDER BY e.hire_date DESC
        LIMIT 100
      `);
      
      console.log(`✅ Encontrados ${result.rows.length} empleados`);
      res.json({ data: result.rows });
      
    } catch (error) {
      console.error("❌ Error en /api/hr/employees:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: "No se pudieron cargar los empleados"
      });
    }
  });

  // Ruta básica de concesiones activas
  app.get('/api/active-concessions', async (req, res) => {
    try {
      console.log("📡 Solicitando lista de concesiones activas...");
      
      const result = await pool.query(`
        SELECT 
          c.id,
          c.name,
          c.description,
          c.location,
          c.status,
          c.start_date,
          c.end_date,
          c.created_at,
          c.updated_at
        FROM concessions c
        WHERE c.status = 'active'
        ORDER BY c.start_date DESC
        LIMIT 100
      `);
      
      console.log(`✅ Encontradas ${result.rows.length} concesiones activas`);
      res.json({ data: result.rows });
      
    } catch (error) {
      console.error("❌ Error en /api/active-concessions:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: "No se pudieron cargar las concesiones"
      });
    }
  });

  // Ruta básica de conteo de visitantes
  app.get('/api/visitor-counts', async (req, res) => {
    try {
      console.log("📡 Solicitando conteo de visitantes...");
      
      const result = await pool.query(`
        SELECT 
          vc.id,
          vc.park_id,
          vc.date,
          vc.visitor_count,
          vc.demographic_data,
          vc.created_at,
          p.name as park_name
        FROM visitor_counts vc
        LEFT JOIN parks p ON vc.park_id = p.id
        ORDER BY vc.date DESC
        LIMIT 100
      `);
      
      console.log(`✅ Encontrados ${result.rows.length} registros de visitantes`);
      res.json({ data: result.rows });
      
    } catch (error) {
      console.error("❌ Error en /api/visitor-counts:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: "No se pudieron cargar los conteos de visitantes"
      });
    }
  });

  // Ruta básica de categorías de actividades
  app.get('/api/activity-categories', async (req, res) => {
    try {
      console.log("📡 Solicitando categorías de actividades...");
      
      // Categorías estándar del sistema
      const categories = [
        { id: 1, name: "Deportivo", description: "Actividades deportivas y de acondicionamiento físico" },
        { id: 2, name: "Recreación y Bienestar", description: "Actividades de relajación y bienestar" },
        { id: 3, name: "Arte y Cultura", description: "Actividades artísticas y culturales" },
        { id: 4, name: "Naturaleza y Ciencia", description: "Actividades educativas sobre naturaleza" },
        { id: 5, name: "Comunidad", description: "Actividades comunitarias y de integración" },
        { id: 6, name: "Eventos de Temporada", description: "Eventos especiales y de temporada" }
      ];
      
      console.log(`✅ Devolviendo ${categories.length} categorías de actividades`);
      res.json({ data: categories });
      
    } catch (error) {
      console.error("❌ Error en /api/activity-categories:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: "No se pudieron cargar las categorías"
      });
    }
  });

  // Ruta básica de fotos de actividades
  app.get('/api/actividades-fotos', async (req, res) => {
    try {
      console.log("📡 Solicitando fotos de actividades...");
      
      const result = await pool.query(`
        SELECT 
          ai.id,
          ai.activity_id,
          ai.image_url,
          ai.caption,
          ai.created_at,
          a.name as activity_name
        FROM activity_images ai
        LEFT JOIN activities a ON ai.activity_id = a.id
        ORDER BY ai.created_at DESC
        LIMIT 100
      `);
      
      console.log(`✅ Encontradas ${result.rows.length} fotos de actividades`);
      res.json({ data: result.rows });
      
    } catch (error) {
      console.error("❌ Error en /api/actividades-fotos:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: "No se pudieron cargar las fotos de actividades"
      });
    }
  });

  console.log("✅ Rutas básicas de API registradas correctamente");
}