import { db, pool } from './db';
import { eq, sql, desc } from "drizzle-orm";
import * as schema from "@shared/schema";

const {
  users,
  municipalities,
  parks,
  parkAmenities,
  amenities,
  trees,
  treeMaintenances,
  activities,
  incidents,
  parkImages,
  volunteers,
  instructors,
  documents,
  assets,
  assetCategories,
  assetMaintenances,
  assetAssignments
} = schema;

// Definición simplificada para almacenamiento
export interface IStorage {
  getParks(filters?: any): Promise<any[]>;
  getExtendedParks(filters?: any): Promise<any[]>;
  getPark(id: number): Promise<any>;
  createPark(data: any): Promise<any>;
  updatePark(id: number, data: any): Promise<any>;
  deletePark(id: number): Promise<boolean>;
  getMunicipalities(): Promise<any[]>;
  getAmenities(): Promise<any[]>;
  getUser(id: number): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  getUsers(): Promise<any[]>;
  getUserByEmail(email: string): Promise<any>;
  createUser(userData: any): Promise<any>;
  updateUser(id: number, userData: any): Promise<any>;
  deleteUser(id: number): Promise<boolean>;
  getAssetCategories(): Promise<any[]>;
  getAssetCategory(id: number): Promise<any>;
  getCategoryAssets(categoryId: number): Promise<any[]>;
  createAssetCategory(category: any): Promise<any>;
  updateAssetCategory(id: number, category: any): Promise<any>;
  deleteAssetCategory(id: number): Promise<boolean>;
  getAssets(filters?: any): Promise<any[]>;
  getAsset(id: number): Promise<any>;
  createAsset(assetData: any): Promise<any>;
  updateAsset(id: number, assetData: any): Promise<any>;
  deleteAsset(id: number): Promise<boolean>;
  createAssetHistoryEntry(historyData: any): Promise<any>;
  getAssetMaintenances(assetId?: number): Promise<any[]>;
  getAssetMaintenance(id: number): Promise<any>;
  createAssetMaintenance(maintenanceData: any): Promise<any>;
  updateAssetMaintenance(id: number, maintenanceData: any): Promise<any>;
  deleteAssetMaintenance(id: number): Promise<boolean>;
  getAssetAssignments(assetId?: number): Promise<any[]>;
  getAssetAssignment(id: number): Promise<any>;
  createAssetAssignment(assignmentData: any): Promise<any>;
  updateAssetAssignment(id: number, assignmentData: any): Promise<any>;
  deleteAssetAssignment(id: number): Promise<boolean>;
  getParkAmenities(parkId: number): Promise<any[]>;
  addAmenityToPark(data: any): Promise<any>;
  removeAmenityFromPark(parkId: number, amenityId: number): Promise<boolean>;
  isAmenityInUse(amenityId: number): Promise<boolean>;
  deleteAmenity(amenityId: number): Promise<boolean>;
  getParkImages(parkId: number): Promise<any[]>;
  createParkImage(imageData: any): Promise<any>;
  updateParkImage(id: number, data: any): Promise<any>;
  deleteParkImage(id: number): Promise<boolean>;
  getParkDocuments(parkId: number): Promise<any[]>;
  createDocument(documentData: any): Promise<any>;
  getDocument(id: number): Promise<any>;
  deleteDocument(id: number): Promise<boolean>;
  getAllDocuments(): Promise<any[]>;
  getAllActivities(): Promise<any[]>;
  getParkActivities(parkId: number): Promise<any[]>;
  createActivity(activityData: any): Promise<any>;
  getActivity(id: number): Promise<any>;
  updateActivity(id: number, activityData: any): Promise<any>;
  deleteActivity(id: number): Promise<boolean>;
  getParkComments(parkId: number): Promise<any[]>;
  createComment(commentData: any): Promise<any>;
  getAllComments(): Promise<any[]>;
  getComment(id: number): Promise<any>;
  approveComment(id: number): Promise<any>;
  deleteComment(id: number): Promise<boolean>;
  createIncident(incidentData: any): Promise<any>;
  getIncident(id: number): Promise<any>;
  updateIncidentStatus(id: number, status: string): Promise<any>;
  getParkIncidents(parkId: number): Promise<any[]>;
  
  // Activity Registration methods
  getActivityById(id: number): Promise<any>;
  getActivityRegistrationById(id: number): Promise<any>;
  updateActivityRegistration(id: number, data: any): Promise<any>;
}

// Implementación simplificada
export class DatabaseStorage implements IStorage {
  async getParks(filters?: any): Promise<any[]> {
    return getParksDirectly(filters);
  }
  
  async getExtendedParks(filters?: any): Promise<any[]> {
    try {
      const parksData = await this.getParks(filters);
      
      // Obtener las amenidades reales para cada parque
      const parksWithAmenities = await Promise.all(
        parksData.map(async (park) => {
          const amenities = await this.getParkAmenities(park.id);
          return {
            ...park,
            amenities: amenities || [],
            activities: [],
            documents: [],
            images: [],
            trees: {
              total: 0,
              bySpecies: {},
              byHealth: {
                'Bueno': 0,
                'Regular': 0,
                'Malo': 0,
                'Desconocido': 0
              }
            }
          };
        })
      );
      
      return parksWithAmenities;
    } catch (error) {
      console.error("Error al obtener parques extendidos:", error);
      return [];
    }
  }
  
  async getAmenities(): Promise<any[]> {
    return getAmenitiesDirectly();
  }

  async getParkDependencies(parkId: number): Promise<{
    trees: number;
    treeMaintenances: number;
    activities: number;
    incidents: number;
    amenities: number;
    images: number;
    assets: number;
    volunteers: number;
    instructors: number;
    evaluations: number;
    documents: number;
    total: number;
  }> {
    try {
      // Usar consultas SQL directas para mayor compatibilidad
      const results = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM trees WHERE park_id = ${parkId}) as trees,
          (SELECT COUNT(*) FROM tree_maintenances WHERE park_id = ${parkId}) as tree_maintenances,
          (SELECT COUNT(*) FROM activities WHERE park_id = ${parkId}) as activities,
          (SELECT COUNT(*) FROM incidents WHERE park_id = ${parkId}) as incidents,
          (SELECT COUNT(*) FROM park_amenities WHERE park_id = ${parkId}) as amenities,
          (SELECT COUNT(*) FROM park_images WHERE park_id = ${parkId}) as images,
          (SELECT COUNT(*) FROM assets WHERE park_id = ${parkId}) as assets,
          (SELECT COUNT(*) FROM volunteers WHERE preferred_park_id = ${parkId}) as volunteers,
          (SELECT COUNT(*) FROM instructors WHERE preferred_park_id = ${parkId}) as instructors,
          (SELECT COUNT(*) FROM evaluations WHERE park_id = ${parkId}) as evaluations,
          (SELECT COUNT(*) FROM documents WHERE park_id = ${parkId}) as documents
      `);
      
      const row = results.rows[0] as any;
      
      const dependencies = {
        trees: parseInt(row.trees) || 0,
        treeMaintenances: parseInt(row.tree_maintenances) || 0,
        activities: parseInt(row.activities) || 0,
        incidents: parseInt(row.incidents) || 0,
        amenities: parseInt(row.amenities) || 0,
        images: parseInt(row.images) || 0,
        assets: parseInt(row.assets) || 0,
        volunteers: parseInt(row.volunteers) || 0,
        instructors: parseInt(row.instructors) || 0,
        evaluations: parseInt(row.evaluations) || 0,
        documents: parseInt(row.documents) || 0,
        total: 0
      };
      
      dependencies.total = Object.values(dependencies).reduce((sum, count) => sum + count, 0) - dependencies.total;
      return dependencies;
    } catch (error) {
      console.error("Error obteniendo dependencias del parque:", error);
      // Retornar valores por defecto en caso de error
      return {
        trees: 0,
        treeMaintenances: 0,
        activities: 0,
        incidents: 0,
        amenities: 0,
        images: 0,
        assets: 0,
        volunteers: 0,
        instructors: 0,
        evaluations: 0,
        documents: 0,
        total: 0
      };
    }
  }

  async deleteParkWithDependencies(id: number): Promise<boolean> {
    try {
      console.log(`Iniciando eliminación completa del parque ${id} con todas sus dependencias`);
      
      // Usar transacción SQL directa para mayor control
      await db.execute(sql`
        BEGIN;
        
        -- Eliminar en orden de dependencias (de más específico a más general)
        DELETE FROM tree_maintenances WHERE park_id = ${id};
        DELETE FROM trees WHERE park_id = ${id};
        DELETE FROM evaluations WHERE park_id = ${id};
        DELETE FROM documents WHERE park_id = ${id};
        DELETE FROM park_amenities WHERE park_id = ${id};
        DELETE FROM park_images WHERE park_id = ${id};
        DELETE FROM activities WHERE park_id = ${id};
        DELETE FROM incidents WHERE park_id = ${id};
        DELETE FROM assets WHERE park_id = ${id};
        
        -- Actualizar referencias de voluntarios e instructores (no eliminar usuarios)
        UPDATE volunteers SET preferred_park_id = NULL WHERE preferred_park_id = ${id};
        UPDATE instructors SET preferred_park_id = NULL WHERE preferred_park_id = ${id};
        
        -- Finalmente eliminar el parque
        DELETE FROM parks WHERE id = ${id};
        
        COMMIT;
      `);
      
      console.log(`Parque ${id} y todas sus dependencias eliminados exitosamente`);
      return true;
    } catch (error) {
      console.error("Error al eliminar parque con dependencias:", error);
      // Intentar rollback en caso de error
      try {
        await db.execute(sql`ROLLBACK;`);
      } catch (rollbackError) {
        console.error("Error en rollback:", rollbackError);
      }
      return false;
    }
  }

  async deletePark(id: number): Promise<boolean> {
    // Usar la nueva función que maneja dependencias
    return this.deleteParkWithDependencies(id);
  }

  async removeAmenityFromPark(parkId: number, amenityId: number): Promise<boolean> {
    try {
      const result = await db.delete(parkAmenities)
        .where(sql`park_id = ${parkId} AND amenity_id = ${amenityId}`);
      return true;
    } catch (error) {
      console.error("Error al remover amenidad del parque:", error);
      return false;
    }
  }

  async isAmenityInUse(amenityId: number): Promise<boolean> {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT COUNT(*) as count 
        FROM park_amenities 
        WHERE amenity_id = $1
      `, [amenityId]);
      const count = Number(result.rows[0]?.count || 0);
      console.log(`Amenidad ${amenityId} está siendo usada en ${count} parques`);
      return count > 0;
    } catch (error) {
      console.error("Error al verificar uso de amenidad:", error);
      return true; // Por seguridad, asumimos que está en uso si hay error
    }
  }

  async deleteAmenity(amenityId: number): Promise<boolean> {
    try {
      console.log(`[STORAGE] Iniciando eliminación de amenidad ID: ${amenityId}`);
      
      // Usar SQL directo y simple
      const { pool } = await import('./db');
      console.log(`[STORAGE] Pool importado correctamente`);
      
      // Verificar existencia
      const existsResult = await pool.query('SELECT id, name FROM amenities WHERE id = $1', [amenityId]);
      console.log(`[STORAGE] Amenidad existe: ${existsResult.rows.length > 0}`);
      
      if (existsResult.rows.length === 0) {
        console.log(`[STORAGE] Amenidad ${amenityId} no encontrada`);
        return false;
      }
      
      console.log(`[STORAGE] Amenidad encontrada: ${existsResult.rows[0].name}`);
      
      // Eliminar
      const deleteResult = await pool.query('DELETE FROM amenities WHERE id = $1 RETURNING id', [amenityId]);
      console.log(`[STORAGE] Filas eliminadas: ${deleteResult.rows.length}`);
      
      if (deleteResult.rows.length > 0) {
        console.log(`[STORAGE] Amenidad ${amenityId} eliminada exitosamente`);
        return true;
      }
      
      console.log(`[STORAGE] No se pudo eliminar la amenidad`);
      return false;
      
    } catch (error) {
      console.error("[STORAGE] Error completo:", error);
      console.error("[STORAGE] Stack trace:", error.stack);
      return false;
    }
  }
  
  async getUser(id: number): Promise<any> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<any> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error al obtener usuario por nombre:", error);
      return undefined;
    }
  }
  
  async getUsers(): Promise<any[]> {
    try {
      // Usar consulta SQL directa con JOIN para obtener información de roles
      const result = await db.execute(
        sql`SELECT u.id, u.username, u.email, u.full_name as "fullName", 
            u.role_id as "roleId", r.name as "roleName", r.level as "roleLevel",
            u.municipality_id as "municipalityId",
            u.created_at as "createdAt", u.updated_at as "updatedAt",
            u.is_active as "isActive", u.last_login as "lastLogin",
            u.department, u.position, u.phone, u.gender, 
            u.birth_date as "birthDate", u.bio, 
            u.profile_image_url as "profileImageUrl"
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY u.id`
      );
      
      console.log(`Total usuarios obtenidos del storage: ${result.rows.length}`);
      
      // Debug: log primeros usuarios para verificar roleId
      if (result.rows.length > 0) {
        console.log('🔍 Primer usuario del storage:', {
          id: result.rows[0].id,
          roleId: result.rows[0].roleId,
          roleName: result.rows[0].roleName,
          roleLevel: result.rows[0].roleLevel
        });
      }
      
      return result.rows;
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return [];
    }
  }
  
  async getUserByEmail(email: string): Promise<any> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error al obtener usuario por email:", error);
      return undefined;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      const [newUser] = await db.insert(users).values({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        roleId: userData.roleId || (userData.role ? parseInt(userData.role) : 1), // Usar roleId directamente
        fullName: userData.fullName,
        municipalityId: userData.municipalityId,
        phone: userData.phone || null,
        gender: userData.gender || null,
        birthDate: userData.birthDate ? new Date(userData.birthDate) : null,
        bio: userData.bio || null,
        profileImageUrl: userData.profileImageUrl || null,
        isActive: true // Por defecto activo
      }).returning();
      return newUser;
    } catch (error) {
      console.error("Error al crear usuario:", error);
      throw error;
    }
  }

  async updateUser(id: number, userData: any): Promise<any> {
    try {
      const [updatedUser] = await db.update(users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error(`Error al actualizar usuario ${id}:`, error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      console.log(`🗑️ Iniciando eliminación del usuario ${id}...`);
      
      // Eliminar todas las referencias que apuntan al usuario
      // Orden importante: eliminar dependencias antes que las tablas padre
      
      // 1. Eliminar registros que dependen de employees
      await db.execute(sql`DELETE FROM time_off_requests WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ${id})`);
      await db.execute(sql`DELETE FROM time_records WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ${id})`);
      await db.execute(sql`DELETE FROM payroll_details WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ${id})`);
      await db.execute(sql`DELETE FROM payroll_receipts WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ${id})`);
      await db.execute(sql`DELETE FROM vacation_balances WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ${id})`);
      await db.execute(sql`DELETE FROM work_schedules WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ${id})`);
      await db.execute(sql`DELETE FROM daily_time_sheets WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ${id})`);
      console.log(`✅ Dependencias de employees eliminadas para usuario ${id}`);
      
      // 2. Eliminar registros que referencian directamente al usuario
      await db.execute(sql`DELETE FROM active_concession_images WHERE uploaded_by = ${id}`);
      await db.execute(sql`DELETE FROM active_concessions WHERE concessionaire_id = ${id}`);
      await db.execute(sql`UPDATE activity_registrations SET approved_by = NULL WHERE approved_by = ${id}`);
      await db.execute(sql`DELETE FROM ad_media_files WHERE uploaded_by = ${id}`);
      await db.execute(sql`UPDATE asset_images SET uploaded_by_id = NULL WHERE uploaded_by_id = ${id}`);
      await db.execute(sql`UPDATE contract_income_reports SET verified_by = NULL WHERE verified_by = ${id}`);
      await db.execute(sql`UPDATE contract_monthly_payments SET calculated_by = NULL WHERE calculated_by = ${id}`);
      await db.execute(sql`UPDATE contract_renewals SET created_by = NULL WHERE created_by = ${id}`);
      await db.execute(sql`UPDATE daily_time_sheets SET approved_by = NULL WHERE approved_by = ${id}`);
      console.log(`✅ Referencias directas del usuario eliminadas/actualizadas para usuario ${id}`);
      
      // 3. Eliminar incidentes y dependencias
      await db.execute(sql`DELETE FROM incident_assignments WHERE assigned_to_user_id = ${id} OR assigned_by_user_id = ${id}`);
      await db.execute(sql`DELETE FROM incident_attachments WHERE uploaded_by_user_id = ${id}`);
      await db.execute(sql`DELETE FROM incident_comments WHERE user_id = ${id}`);
      await db.execute(sql`DELETE FROM incident_history WHERE user_id = ${id}`);
      await db.execute(sql`DELETE FROM incident_notifications WHERE user_id = ${id}`);
      await db.execute(sql`UPDATE incidents SET assigned_to_user_id = NULL WHERE assigned_to_user_id = ${id}`);
      console.log(`✅ Referencias de incidentes eliminadas para usuario ${id}`);
      
      // 4. Actualizar evaluaciones e invitaciones
      await db.execute(sql`UPDATE instructor_evaluations SET moderated_by = NULL WHERE moderated_by = ${id}`);
      await db.execute(sql`UPDATE instructor_invitations SET invited_by = NULL WHERE invited_by = ${id}`);
      await db.execute(sql`UPDATE park_evaluations SET moderated_by = NULL WHERE moderated_by = ${id}`);
      await db.execute(sql`UPDATE park_feedback SET assigned_to = NULL WHERE assigned_to = ${id}`);
      console.log(`✅ Referencias de evaluaciones actualizadas para usuario ${id}`);
      
      // 5. Eliminar/actualizar otros registros
      await db.execute(sql`UPDATE payroll_receipts SET generated_by_id = NULL WHERE generated_by_id = ${id}`);
      await db.execute(sql`UPDATE time_records SET registered_by = NULL WHERE registered_by = ${id}`);
      await db.execute(sql`UPDATE tree_maintenances SET performed_by = NULL WHERE performed_by = ${id}`);
      await db.execute(sql`UPDATE trees SET created_by = NULL WHERE created_by = ${id}`);
      await db.execute(sql`UPDATE time_off_requests SET approved_by = NULL WHERE approved_by = ${id}`);
      await db.execute(sql`DELETE FROM vacation_requests WHERE requested_by = ${id} OR approved_by = ${id}`);
      await db.execute(sql`UPDATE visitor_counts SET registered_by = NULL WHERE registered_by = ${id}`);
      await db.execute(sql`UPDATE work_schedules SET created_by = NULL WHERE created_by = ${id}`);
      console.log(`✅ Otras referencias actualizadas para usuario ${id}`);
      
      // 6. Eliminar registros de empleados
      await db.execute(sql`DELETE FROM employees WHERE user_id = ${id}`);
      console.log(`✅ Registro de employees eliminado para usuario ${id}`);
      
      // 7. concessionaire_profiles ya no tiene user_id en la nueva arquitectura
      console.log(`ℹ️ concessionaire_profiles es ahora independiente, no hay user_id que eliminar`);
      
      // 8. Manejar todas las referencias críticas a users.id
      await db.execute(sql`UPDATE active_concessions SET concessionaire_id = NULL WHERE concessionaire_id = ${id}`);
      await db.execute(sql`UPDATE incidents SET assigned_to_user_id = NULL WHERE assigned_to_user_id = ${id}`);
      await db.execute(sql`UPDATE incident_assignments SET assigned_to_user_id = NULL WHERE assigned_to_user_id = ${id}`);
      await db.execute(sql`UPDATE incident_assignments SET assigned_by_user_id = NULL WHERE assigned_by_user_id = ${id}`);
      await db.execute(sql`UPDATE park_feedback SET assigned_to = NULL WHERE assigned_to = ${id}`);
      await db.execute(sql`UPDATE vacation_requests SET employee_id = NULL WHERE employee_id = ${id}`);
      await db.execute(sql`UPDATE vacation_requests SET requested_by = NULL WHERE requested_by = ${id}`);
      console.log(`✅ Todas las referencias críticas actualizadas para usuario ${id}`);

      // Nota: instructors, volunteers ya no tienen user_id en la nueva arquitectura
      
      // 8. Finalmente eliminar el usuario de la tabla users
      const result = await db.delete(users).where(eq(users.id, id));
      console.log(`✅ Usuario ${id} eliminado exitosamente de la tabla users`);
      return true;
    } catch (error) {
      console.error(`❌ Error al eliminar usuario ${id}:`, error);
      throw error;
    }
  }

  async getParkImages(parkId: number): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT id, park_id as "parkId", image_url as "imageUrl", is_primary as "isPrimary", caption, created_at as "createdAt"
        FROM park_images
        WHERE park_id = $1
        ORDER BY is_primary DESC, id ASC
      `, [parkId]);
      return result.rows || [];
    } catch (error) {
      console.error("Error al obtener imágenes del parque:", error);
      return [];
    }
  }

  async getParkImage(id: number): Promise<any> {
    try {
      const result = await db
        .select()
        .from(parkImages)
        .where(eq(parkImages.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error("Error al obtener imagen individual:", error);
      return null;
    }
  }

  async createParkImage(imageData: any): Promise<any> {
    try {
      const result = await pool.query(`
        INSERT INTO park_images (park_id, image_url, caption, is_primary, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, park_id as "parkId", image_url as "imageUrl", is_primary as "isPrimary", caption, created_at as "createdAt"
      `, [
        imageData.parkId,
        imageData.imageUrl,
        imageData.caption || null,
        imageData.isPrimary || false
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error("Error al crear imagen del parque:", error);
      throw error;
    }
  }

  async updateParkImage(id: number, data: any): Promise<any> {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (data.caption !== undefined) {
        updateFields.push(`caption = $${paramIndex++}`);
        values.push(data.caption);
      }
      if (data.isPrimary !== undefined) {
        updateFields.push(`is_primary = $${paramIndex++}`);
        values.push(data.isPrimary);
      }
      if (data.imageUrl !== undefined) {
        updateFields.push(`image_url = $${paramIndex++}`);
        values.push(data.imageUrl);
      }

      if (updateFields.length === 0) {
        throw new Error("No hay campos para actualizar");
      }

      values.push(id); // Add ID at the end
      
      const result = await pool.query(`
        UPDATE park_images 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, park_id as "parkId", image_url as "imageUrl", is_primary as "isPrimary", caption, created_at as "createdAt"
      `, values);

      return result.rows[0];
    } catch (error) {
      console.error("Error al actualizar imagen del parque:", error);
      throw error;
    }
  }

  async deleteParkImage(id: number): Promise<boolean> {
    try {
      const result = await pool.query(`
        DELETE FROM park_images WHERE id = $1
      `, [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error al eliminar imagen del parque:", error);
      return false;
    }
  }

  async getParkImage(id: number): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT id, park_id as "parkId", image_url as "imageUrl", is_primary as "isPrimary", caption, created_at as "createdAt"
        FROM park_images
        WHERE id = $1
      `, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error al obtener imagen del parque:", error);
      return null;
    }
  }


  
  async getAssetCategories(): Promise<any[]> {
    try {
      const result = await db.execute(`
        SELECT id, name, description, icon, color, parent_id as "parentId",
               created_at as "createdAt", updated_at as "updatedAt"
        FROM asset_categories
        ORDER BY name
      `);
      
      // Añadir propiedades predeterminadas para mantener compatibilidad con el frontend
      return (result.rows || []).map(category => ({
        ...category,
        iconType: "system",
        customIconUrl: null
      }));
    } catch (error) {
      console.error("Error al obtener categorías de activos:", error);
      return [];
    }
  }
  
  async getAssetCategory(id: number): Promise<any> {
    try {
      const result = await db.execute(`
        SELECT id, name, description, icon, color, parent_id as "parentId",
               created_at as "createdAt", updated_at as "updatedAt"
        FROM asset_categories
        WHERE id = $1
      `, [id]);
      
      if (result.rows && result.rows.length > 0) {
        // Añadir propiedades predeterminadas para mantener compatibilidad con el frontend
        return {
          ...result.rows[0],
          iconType: "system",
          customIconUrl: null
        };
      }
      
      return undefined;
    } catch (error) {
      console.error(`Error al obtener categoría de activo ${id}:`, error);
      return undefined;
    }
  }
  
  async getCategoryAssets(categoryId: number): Promise<any[]> {
    try {
      const result = await db.execute(`
        SELECT id, name
        FROM assets
        WHERE category_id = $1
      `, [categoryId]);
      return result.rows || [];
    } catch (error) {
      console.error(`Error al obtener activos de la categoría ${categoryId}:`, error);
      return [];
    }
  }
  
  async createAssetCategory(category: any): Promise<any> {
    try {
      const { name, description, icon, iconType, customIconUrl, color } = category;
      const result = await db.execute(`
        INSERT INTO asset_categories (
          name, description, icon, icon_type, custom_icon_url, color, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        ) RETURNING id, name, description, icon, icon_type as "iconType", 
                   custom_icon_url as "customIconUrl", color,
                   created_at as "createdAt", updated_at as "updatedAt"
      `, [name, description, icon, iconType, customIconUrl, color]);
      
      return result.rows[0];
    } catch (error) {
      console.error("Error al crear categoría de activo:", error);
      throw error;
    }
  }
  
  async updateAssetCategory(id: number, category: any): Promise<any> {
    try {
      // Construir query dinámica para actualizar solo los campos proporcionados
      let setClause = [];
      let params = [];
      let paramIndex = 1;
      
      if (category.name !== undefined) {
        setClause.push(`name = $${paramIndex++}`);
        params.push(category.name);
      }
      
      if (category.description !== undefined) {
        setClause.push(`description = $${paramIndex++}`);
        params.push(category.description);
      }
      
      if (category.icon !== undefined) {
        setClause.push(`icon = $${paramIndex++}`);
        params.push(category.icon);
      }
      
      if (category.iconType !== undefined) {
        setClause.push(`icon_type = $${paramIndex++}`);
        params.push(category.iconType);
      }
      
      if (category.customIconUrl !== undefined) {
        setClause.push(`custom_icon_url = $${paramIndex++}`);
        params.push(category.customIconUrl);
      }
      
      if (category.color !== undefined) {
        setClause.push(`color = $${paramIndex++}`);
        params.push(category.color);
      }
      
      setClause.push(`updated_at = NOW()`);
      
      if (setClause.length === 0) {
        return this.getAssetCategory(id); // No hay nada que actualizar
      }
      
      // Agregar el ID como último parámetro
      params.push(id);
      
      const result = await db.execute(`
        UPDATE asset_categories
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, description, icon, icon_type as "iconType", 
                 custom_icon_url as "customIconUrl", color,
                 created_at as "createdAt", updated_at as "updatedAt"
      `, params);
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error al actualizar categoría de activo ${id}:`, error);
      throw error;
    }
  }
  
  async deleteAssetCategory(id: number): Promise<boolean> {
    try {
      const result = await db.execute(`
        DELETE FROM asset_categories
        WHERE id = $1
        RETURNING id
      `, [id]);
      
      return result.rows && result.rows.length > 0;
    } catch (error) {
      console.error(`Error al eliminar categoría de activo ${id}:`, error);
      return false;
    }
  }
  
  async getPark(id: number): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT 
          id, name, municipality_id as "municipalityId", municipality_text as "municipalityText",
          park_type as "parkType", description, address,
          postal_code as "postalCode", latitude, longitude,
          area, green_area as "greenArea", foundation_year as "foundationYear",
          administrator, conservation_status as "conservationStatus",
          regulation_url as "regulationUrl", opening_hours as "openingHours",
          contact_email as "contactEmail", contact_phone as "contactPhone",
          video_url as "videoUrl", certificaciones,
          is_deleted as "isDeleted", created_at as "createdAt", updated_at as "updatedAt"
        FROM parks
        WHERE id = $1
      `, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error al obtener parque:", error);
      return null;
    }
  }



  async updatePark(id: number, data: any): Promise<any> {
    try {
      console.log("🔄 Actualizando parque con datos:", data);
      
      // Construir la consulta SQL dinámicamente
      const fields = [];
      const values = [];
      let paramIndex = 1;
      
      if (data.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.municipalityText !== undefined) {
        fields.push(`municipality_text = $${paramIndex++}`);
        values.push(data.municipalityText);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.address !== undefined) {
        fields.push(`address = $${paramIndex++}`);
        values.push(data.address);
      }
      if (data.postalCode !== undefined) {
        fields.push(`postal_code = $${paramIndex++}`);
        values.push(data.postalCode);
      }
      if (data.latitude !== undefined) {
        fields.push(`latitude = $${paramIndex++}`);
        values.push(data.latitude);
      }
      if (data.longitude !== undefined) {
        fields.push(`longitude = $${paramIndex++}`);
        values.push(data.longitude);
      }
      if (data.area !== undefined) {
        fields.push(`area = $${paramIndex++}`);
        values.push(data.area);
      }
      if (data.foundationYear !== undefined) {
        fields.push(`foundation_year = $${paramIndex++}`);
        values.push(data.foundationYear);
      }
      if (data.administrator !== undefined) {
        fields.push(`administrator = $${paramIndex++}`);
        values.push(data.administrator);
      }
      if (data.contactPhone !== undefined) {
        fields.push(`contact_phone = $${paramIndex++}`);
        values.push(data.contactPhone);
      }
      if (data.contactEmail !== undefined) {
        fields.push(`contact_email = $${paramIndex++}`);
        values.push(data.contactEmail);
      }
      if (data.certificaciones !== undefined) {
        fields.push(`certificaciones = $${paramIndex++}`);
        values.push(data.certificaciones);
      }
      if (data.dailySchedule !== undefined) {
        fields.push(`opening_hours = $${paramIndex++}`);
        values.push(JSON.stringify(data.dailySchedule));
      }
      
      // Siempre actualizar updated_at
      fields.push(`updated_at = NOW()`);
      values.push(id); // ID para el WHERE
      
      if (fields.length === 1) { // Solo tiene updated_at
        throw new Error("No hay campos para actualizar");
      }
      
      const result = await pool.query(`
        UPDATE parks 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING 
          id, name, municipality_id as "municipalityId", municipality_text as "municipalityText",
          park_type as "parkType", description, address,
          postal_code as "postalCode", latitude, longitude,
          area, green_area as "greenArea", foundation_year as "foundationYear",
          administrator, conservation_status as "conservationStatus",
          regulation_url as "regulationUrl", opening_hours as "openingHours",
          contact_email as "contactEmail", contact_phone as "contactPhone",
          video_url as "videoUrl", certificaciones,
          is_deleted as "isDeleted", created_at as "createdAt", updated_at as "updatedAt"
      `, values);
      
      console.log("✅ Parque actualizado exitosamente:", result.rows[0]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error al actualizar parque:", error);
      throw error;
    }
  }

  async getMunicipalities(): Promise<any[]> {
    try {
      console.log("Obteniendo municipios...");
      const result = await db.select().from(municipalities);
      console.log("Municipios encontrados:", result);
      return result || [];
    } catch (error) {
      console.error("Error al obtener municipios:", error);
      return [];
    }
  }

  async getAssets(filters?: any): Promise<any[]> {
    try {
      let query = `
        SELECT 
          a.*,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color,
          p.name as park_name
        FROM assets a
        LEFT JOIN asset_categories c ON a.category_id = c.id
        LEFT JOIN parks p ON a.park_id = p.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      if (filters?.parkId) {
        query += ` AND a.park_id = $${paramIndex}`;
        params.push(filters.parkId);
        paramIndex++;
      }
      
      if (filters?.categoryId) {
        query += ` AND a.category_id = $${paramIndex}`;
        params.push(filters.categoryId);
        paramIndex++;
      }
      
      if (filters?.status) {
        query += ` AND a.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }
      
      if (filters?.condition) {
        query += ` AND a.condition = $${paramIndex}`;
        params.push(filters.condition);
        paramIndex++;
      }
      
      if (filters?.search) {
        query += ` AND (a.name ILIKE $${paramIndex} OR a.serial_number ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }
      
      query += ` ORDER BY a.created_at DESC`;
      
      const result = await pool.query(query, params);
      return result.rows || [];
    } catch (error) {
      console.error("Error al obtener activos:", error);
      return [];
    }
  }
  
  async getAsset(id: number): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT 
          a.*,
          ac.name as "categoryName",
          p.name as "parkName",
          am.name as "amenityName",
          u.username as "responsiblePersonName"
        FROM assets a
        LEFT JOIN asset_categories ac ON a.category_id = ac.id
        LEFT JOIN parks p ON a.park_id = p.id
        LEFT JOIN amenities am ON a.amenity_id = am.id
        LEFT JOIN users u ON a.responsible_person_id = u.id
        WHERE a.id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error al obtener activo ${id}:`, error);
      return null;
    }
  }

  async createAsset(assetData: any): Promise<any> {
    try {
      console.log("Datos recibidos en createAsset:", assetData);
      
      // Crear una inserción más simple con solo los campos requeridos
      const result = await pool.query(`
        INSERT INTO assets (
          name, serial_number, category_id, park_id, amenity_id,
          location_description, latitude, longitude, 
          status, condition, notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        ) RETURNING *
      `, [
        assetData.name,
        assetData.serialNumber || assetData.serial_number || null,
        assetData.categoryId || assetData.category_id,
        assetData.parkId || assetData.park_id,
        assetData.amenityId || assetData.amenity_id || null,
        assetData.locationDescription || assetData.location_description || null,
        assetData.latitude || null,
        assetData.longitude || null,
        assetData.status || 'Activo',
        assetData.condition || 'Bueno',
        assetData.notes || null
      ]);

      console.log("Activo creado exitosamente:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("Error al crear activo:", error);
      throw error;
    }
  }

  async updateAsset(id: number, assetData: any): Promise<any> {
    try {
      // Preparar los datos de actualización, omitiendo valores undefined
      const updateData: any = {};
      
      if (assetData.name !== undefined) updateData.name = assetData.name;
      if (assetData.serialNumber !== undefined) updateData.serialNumber = assetData.serialNumber;
      if (assetData.categoryId !== undefined) updateData.categoryId = assetData.categoryId;
      if (assetData.parkId !== undefined) updateData.parkId = assetData.parkId;
      if (assetData.amenityId !== undefined) updateData.amenityId = assetData.amenityId;
      if (assetData.location !== undefined) updateData.location = assetData.location;
      if (assetData.latitude !== undefined) updateData.latitude = assetData.latitude;
      if (assetData.longitude !== undefined) updateData.longitude = assetData.longitude;
      if (assetData.acquisitionDate !== undefined) updateData.acquisitionDate = assetData.acquisitionDate;
      if (assetData.acquisitionCost !== undefined) updateData.acquisitionCost = assetData.acquisitionCost;
      if (assetData.currentValue !== undefined) updateData.currentValue = assetData.currentValue;
      if (assetData.manufacturer !== undefined) updateData.manufacturer = assetData.manufacturer;
      if (assetData.model !== undefined) updateData.model = assetData.model;
      if (assetData.status !== undefined) updateData.status = assetData.status;
      if (assetData.condition !== undefined) updateData.condition = assetData.condition;
      if (assetData.maintenanceFrequency !== undefined) updateData.maintenanceFrequency = assetData.maintenanceFrequency;
      if (assetData.lastMaintenanceDate !== undefined) updateData.lastMaintenanceDate = assetData.lastMaintenanceDate;
      if (assetData.nextMaintenanceDate !== undefined) updateData.nextMaintenanceDate = assetData.nextMaintenanceDate;
      if (assetData.expectedLifespan !== undefined) updateData.expectedLifespan = assetData.expectedLifespan;
      if (assetData.notes !== undefined) updateData.notes = assetData.notes;
      if (assetData.qrCode !== undefined) updateData.qrCode = assetData.qrCode;
      if (assetData.responsiblePersonId !== undefined) updateData.responsiblePersonId = assetData.responsiblePersonId;
      if (assetData.description !== undefined) updateData.description = assetData.description;
      
      // Siempre actualizar updatedAt
      updateData.updatedAt = new Date();

      const [updatedAsset] = await db
        .update(assets)
        .set(updateData)
        .where(eq(assets.id, id))
        .returning();

      return updatedAsset;
    } catch (error) {
      console.error(`Error al actualizar activo ${id}:`, error);
      throw error;
    }
  }

  async deleteAsset(id: number): Promise<boolean> {
    try {
      const result = await db.delete(assets).where(eq(assets.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error(`Error al eliminar activo ${id}:`, error);
      return false;
    }
  }

  async createAssetHistoryEntry(historyData: any): Promise<any> {
    try {
      // Por ahora, simplemente registrar la acción
      console.log("Entrada de historial creada:", historyData);
      return { id: Date.now(), ...historyData };
    } catch (error) {
      console.error("Error al crear entrada de historial:", error);
      throw error;
    }
  }

  // Métodos para mantenimientos de activos
  async getAssetMaintenances(assetId?: number): Promise<any[]> {
    try {
      let query = `
        SELECT 
          am.*,
          a.name as "assetName"
        FROM asset_maintenances am
        LEFT JOIN assets a ON am.asset_id = a.id
      `;
      const params: any[] = [];
      
      if (assetId) {
        query += ` WHERE am.asset_id = $1`;
        params.push(assetId);
      }
      
      query += ` ORDER BY am.created_at DESC`;
      
      const result = await pool.query(query, params);
      return result.rows || [];
    } catch (error) {
      console.error("Error al obtener mantenimientos:", error);
      return [];
    }
  }

  async getAssetMaintenance(id: number): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT 
          am.*,
          a.name as "assetName"
        FROM asset_maintenances am
        LEFT JOIN assets a ON am.asset_id = a.id
        WHERE am.id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error al obtener mantenimiento ${id}:`, error);
      return null;
    }
  }

  async createAssetMaintenance(maintenanceData: any): Promise<any> {
    try {
      const result = await pool.query(`
        INSERT INTO asset_maintenances (
          asset_id, maintenance_type, description, scheduled_date,
          completed_date, performed_by, cost, status, priority, notes,
          parts_replaced, hours_worked, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        ) RETURNING *
      `, [
        maintenanceData.assetId || maintenanceData.asset_id,
        maintenanceData.maintenanceType || maintenanceData.maintenance_type,
        maintenanceData.description,
        maintenanceData.scheduledDate || maintenanceData.scheduled_date,
        maintenanceData.completedDate || maintenanceData.completed_date,
        maintenanceData.performedBy || maintenanceData.performed_by,
        maintenanceData.cost,
        maintenanceData.status || 'scheduled',
        maintenanceData.priority || 'medium',
        maintenanceData.notes,
        maintenanceData.partsReplaced || maintenanceData.parts_replaced || [],
        maintenanceData.hoursWorked || maintenanceData.hours_worked
      ]);

      return result.rows[0];
    } catch (error) {
      console.error("Error al crear mantenimiento:", error);
      throw error;
    }
  }

  async updateAssetMaintenance(id: number, maintenanceData: any): Promise<any> {
    try {
      const result = await pool.query(`
        UPDATE asset_maintenances 
        SET 
          maintenance_type = COALESCE($1, maintenance_type),
          description = COALESCE($2, description),
          scheduled_date = COALESCE($3, scheduled_date),
          completed_date = COALESCE($4, completed_date),
          performed_by = COALESCE($5, performed_by),
          cost = COALESCE($6, cost),
          status = COALESCE($7, status),
          priority = COALESCE($8, priority),
          notes = COALESCE($9, notes),
          parts_replaced = COALESCE($10, parts_replaced),
          hours_worked = COALESCE($11, hours_worked),
          updated_at = NOW()
        WHERE id = $12
        RETURNING *
      `, [
        maintenanceData.maintenanceType || maintenanceData.maintenance_type,
        maintenanceData.description,
        maintenanceData.scheduledDate || maintenanceData.scheduled_date,
        maintenanceData.completedDate || maintenanceData.completed_date,
        maintenanceData.performedBy || maintenanceData.performed_by,
        maintenanceData.cost,
        maintenanceData.status,
        maintenanceData.priority,
        maintenanceData.notes,
        maintenanceData.partsReplaced || maintenanceData.parts_replaced,
        maintenanceData.hoursWorked || maintenanceData.hours_worked,
        id
      ]);

      return result.rows[0];
    } catch (error) {
      console.error(`Error al actualizar mantenimiento ${id}:`, error);
      throw error;
    }
  }

  async deleteAssetMaintenance(id: number): Promise<boolean> {
    try {
      const result = await pool.query(`DELETE FROM asset_maintenances WHERE id = $1`, [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error(`Error al eliminar mantenimiento ${id}:`, error);
      return false;
    }
  }

  // Métodos para asignaciones de activos
  async getAssetAssignments(assetId?: number): Promise<any[]> {
    try {
      let query = `
        SELECT 
          aa.*,
          a.name as "assetName",
          i.name as "instructorName",
          act.name as "activityName"
        FROM asset_assignments aa
        LEFT JOIN assets a ON aa.asset_id = a.id
        LEFT JOIN instructors i ON aa.instructor_id = i.id
        LEFT JOIN activities act ON aa.activity_id = act.id
      `;
      const params: any[] = [];
      
      if (assetId) {
        query += ` WHERE aa.asset_id = $1`;
        params.push(assetId);
      }
      
      query += ` ORDER BY aa.created_at DESC`;
      
      const result = await pool.query(query, params);
      return result.rows || [];
    } catch (error) {
      console.error("Error al obtener asignaciones:", error);
      return [];
    }
  }

  async getAssetAssignment(id: number): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT 
          aa.*,
          a.name as "assetName",
          i.name as "instructorName",
          act.name as "activityName"
        FROM asset_assignments aa
        LEFT JOIN assets a ON aa.asset_id = a.id
        LEFT JOIN instructors i ON aa.instructor_id = i.id
        LEFT JOIN activities act ON aa.activity_id = act.id
        WHERE aa.id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error al obtener asignación ${id}:`, error);
      return null;
    }
  }

  async createAssetAssignment(assignmentData: any): Promise<any> {
    try {
      const result = await pool.query(`
        INSERT INTO asset_assignments (
          asset_id, instructor_id, activity_id, assignment_date,
          return_date, purpose, condition, notes, status,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        ) RETURNING *
      `, [
        assignmentData.assetId || assignmentData.asset_id,
        assignmentData.instructorId || assignmentData.instructor_id,
        assignmentData.activityId || assignmentData.activity_id,
        assignmentData.assignmentDate || assignmentData.assignment_date,
        assignmentData.returnDate || assignmentData.return_date,
        assignmentData.purpose,
        assignmentData.condition || 'good',
        assignmentData.notes,
        assignmentData.status || 'active'
      ]);

      return result.rows[0];
    } catch (error) {
      console.error("Error al crear asignación:", error);
      throw error;
    }
  }

  async updateAssetAssignment(id: number, assignmentData: any): Promise<any> {
    try {
      const result = await pool.query(`
        UPDATE asset_assignments 
        SET 
          instructor_id = COALESCE($1, instructor_id),
          activity_id = COALESCE($2, activity_id),
          assignment_date = COALESCE($3, assignment_date),
          return_date = COALESCE($4, return_date),
          purpose = COALESCE($5, purpose),
          condition = COALESCE($6, condition),
          notes = COALESCE($7, notes),
          status = COALESCE($8, status),
          updated_at = NOW()
        WHERE id = $9
        RETURNING *
      `, [
        assignmentData.instructorId || assignmentData.instructor_id,
        assignmentData.activityId || assignmentData.activity_id,
        assignmentData.assignmentDate || assignmentData.assignment_date,
        assignmentData.returnDate || assignmentData.return_date,
        assignmentData.purpose,
        assignmentData.condition,
        assignmentData.notes,
        assignmentData.status,
        id
      ]);

      return result.rows[0];
    } catch (error) {
      console.error(`Error al actualizar asignación ${id}:`, error);
      throw error;
    }
  }

  async deleteAssetAssignment(id: number): Promise<boolean> {
    try {
      const result = await pool.query(`DELETE FROM asset_assignments WHERE id = $1`, [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error(`Error al eliminar asignación ${id}:`, error);
      return false;
    }
  }

  async getParkAmenities(parkId: number): Promise<any[]> {
    try {
      // Usar consulta SQL directa para evitar problemas con relaciones de Drizzle
      const result = await pool.query(`
        SELECT 
          pa.id,
          pa.park_id as "parkId",
          pa.amenity_id as "amenityId",
          pa.module_name as "moduleName",
          pa.location_latitude as "locationLatitude",
          pa.location_longitude as "locationLongitude",
          pa.surface_area as "surfaceArea",
          pa.status,
          pa.description,
          a.name as "amenityName",
          a.icon as "amenityIcon"
        FROM park_amenities pa
        INNER JOIN amenities a ON pa.amenity_id = a.id
        WHERE pa.park_id = $1
        ORDER BY a.name
      `, [parkId]);
      
      console.log(`Amenidades encontradas para parque ${parkId}:`, result.rows.length);
      return result.rows || [];
    } catch (error) {
      console.error(`Error al obtener amenidades del parque ${parkId}:`, error);
      return [];
    }
  }

  async addAmenityToPark(data: any): Promise<any> {
    try {
      const result = await db.insert(parkAmenities).values({
        parkId: data.parkId,
        amenityId: data.amenityId,
        moduleName: data.moduleName || '',
        locationLatitude: data.locationLatitude,
        locationLongitude: data.locationLongitude,
        surfaceArea: data.surfaceArea,
        description: data.description || ''
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error("Error al agregar amenidad al parque:", error);
      throw error;
    }
  }

  async createPark(parkData: any): Promise<any> {
    try {
      console.log('🏗️ [STORAGE] Datos recibidos:', Object.keys(parkData));
      
      // ESTRATEGIA NUEVA: Construir objeto completamente limpio sin campos problemáticos
      const insertData = {
        name: parkData.name,
        municipalityId: parkData.municipalityId,
        parkType: parkData.parkType || 'urbano',
        description: parkData.description || '',
        address: parkData.address || '',
        postalCode: parkData.postalCode || '',
        latitude: parkData.latitude || '0',
        longitude: parkData.longitude || '0',
        area: parkData.area || '0',
        foundationYear: parkData.foundationYear || new Date().getFullYear(),
        administrator: parkData.administrator || '',
        conservationStatus: parkData.conservationStatus || 'Good',
        regulationUrl: parkData.regulationUrl || '',
        openingHours: parkData.openingHours || '{}',
        contactEmail: parkData.contactEmail || '',
        contactPhone: parkData.contactPhone || '',
        certificaciones: parkData.certificaciones || null,
        videoUrl: parkData.videoUrl || '',
        isDeleted: false
      };
      
      console.log('✅ [STORAGE] Objeto limpio para inserción:', Object.keys(insertData));
      
      const result = await db.insert(parks).values(insertData).returning();
      
      console.log('✅ [STORAGE] Parque creado exitosamente con ID:', result[0].id);
      return result[0];
    } catch (error) {
      console.error("Error al crear parque:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();

// Consulta directa para obtener parques sin usar el storage
export async function getParksDirectly(filters?: {
  municipalityId?: number;
  parkType?: string;
  postalCode?: string;
  search?: string;
}) {
  try {
    // Construimos la consulta SQL básica
    let queryStr = `
      SELECT 
        id, name, municipality_id as "municipalityId", 
        park_type as "parkType", description, address, 
        postal_code as "postalCode", latitude, longitude, 
        area, foundation_year as "foundationYear",
        administrator, conservation_status as "conservationStatus",
        regulation_url as "regulationUrl", opening_hours as "openingHours", 
        contact_email as "contactEmail", contact_phone as "contactPhone"
      FROM parks
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // Añadimos filtros si existen
    if (filters?.municipalityId !== undefined) {
      queryStr += ` AND municipality_id = $${paramIndex++}`;
      params.push(filters.municipalityId);
    }
    
    if (filters?.parkType) {
      queryStr += ` AND park_type = $${paramIndex++}`;
      params.push(filters.parkType);
    }
    
    if (filters?.postalCode) {
      queryStr += ` AND postal_code = $${paramIndex++}`;
      params.push(filters.postalCode);
    }
    
    if (filters?.search) {
      queryStr += ` AND (
        name ILIKE $${paramIndex} OR
        COALESCE(description, '') ILIKE $${paramIndex} OR
        address ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    // Ordenar por nombre
    queryStr += ` ORDER BY name`;
    
    // Ejecutar la consulta
    const result = await db.execute(queryStr, params);
    
    // Transformar los resultados
    return result.rows.map(park => ({
      ...park,
      // Añadimos estos campos para compatibilidad con la interfaz esperada
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
      surfaceArea: park.area || null,
      closingHours: null,
      mainImageUrl: null,
      // Añadimos estructuras vacías para los datos relacionados
      amenities: [],
      activities: [],
      documents: [],
      images: [],
      trees: {
        total: 0,
        bySpecies: {},
        byHealth: {
          'Bueno': 0,
          'Regular': 0,
          'Malo': 0,
          'Desconocido': 0
        }
      }
    }));
  } catch (error) {
    console.error("Error en getParksDirectly:", error);
    return [];
  }
}

// Consulta directa para obtener amenidades sin usar el storage
export async function getAmenitiesDirectly() {
  try {
    // Consulta SQL directa
    const result = await db.execute(`
      SELECT id, name, icon, category, icon_type as "iconType", custom_icon_url as "customIconUrl"
      FROM amenities
      ORDER BY name
    `);
    
    // Añadimos campos requeridos por el frontend
    return result.rows.map(amenity => ({
      ...amenity,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  } catch (error) {
    console.error("Error en getAmenitiesDirectly:", error);
    return [];
  }
}

// Métodos adicionales implementados en la clase DatabaseStorage
DatabaseStorage.prototype.getParkDocuments = async function(parkId: number): Promise<any[]> {
  try {
    console.log(`📋 STORAGE: Consultando documentos para parque ${parkId}`);
    const result = await pool.query(`
      SELECT 
        id,
        park_id as "parkId",
        title,
        file_url as "fileUrl",
        file_size as "fileSize",
        file_type as "fileType",
        description,
        uploaded_by_id as "uploadedById",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM documents 
      WHERE park_id = $1
      ORDER BY created_at DESC
    `, [parkId]);
    
    console.log(`📋 STORAGE: Documentos encontrados para parque ${parkId}: ${result.rows.length}`);
    return result.rows;
  } catch (error) {
    console.error(`❌ STORAGE: Error consultando documentos del parque ${parkId}:`, error);
    return [];
  }
};

DatabaseStorage.prototype.createDocument = async function(documentData: any): Promise<any> {
  try {
    console.log(`📝 STORAGE: Creando documento:`, documentData);
    const result = await pool.query(`
      INSERT INTO documents (
        park_id, title, file_url, file_type, description, uploaded_by_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), NOW()
      ) RETURNING 
        id,
        park_id as "parkId",
        title,
        file_url as "fileUrl",
        file_size as "fileSize",
        file_type as "fileType",
        description,
        uploaded_by_id as "uploadedById",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, [
      documentData.parkId,
      documentData.title,
      documentData.fileUrl,
      documentData.fileType,
      documentData.description || '',
      documentData.uploadedById || null
    ]);
    
    const document = result.rows[0];
    console.log(`✅ STORAGE: Documento creado con ID ${document.id}`);
    return document;
  } catch (error) {
    console.error(`❌ STORAGE: Error creando documento:`, error);
    throw error;
  }
};

DatabaseStorage.prototype.getDocument = async function(id: number): Promise<any> {
  try {
    console.log(`📋 STORAGE: Consultando documento con ID ${id}`);
    const result = await pool.query(`
      SELECT 
        id,
        park_id as "parkId",
        title,
        file_url as "fileUrl",
        file_size as "fileSize",
        file_type as "fileType",
        description,
        uploaded_by_id as "uploadedById",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM documents 
      WHERE id = $1
    `, [id]);
    
    const document = result.rows[0] || null;
    console.log(`📋 STORAGE: Documento ${id} ${document ? 'encontrado' : 'no encontrado'}`);
    return document;
  } catch (error) {
    console.error(`❌ STORAGE: Error consultando documento ${id}:`, error);
    return null;
  }
};

DatabaseStorage.prototype.deleteDocument = async function(id: number): Promise<boolean> {
  try {
    console.log(`🗑️ STORAGE: Eliminando documento con ID ${id}`);
    const result = await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    const deleted = (result.rowCount || 0) > 0;
    console.log(`🗑️ STORAGE: Documento ${id} ${deleted ? 'eliminado' : 'no encontrado'}, filas afectadas: ${result.rowCount}`);
    return deleted;
  } catch (error) {
    console.error(`❌ STORAGE: Error eliminando documento ${id}:`, error);
    return false;
  }
};

DatabaseStorage.prototype.getAllDocuments = async function(): Promise<any[]> {
  return [];
};

DatabaseStorage.prototype.getAllActivities = async function(): Promise<any[]> {
  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.start_date as "startDate",
        a.end_date as "endDate",
        a.category,
        a.category_id as "categoryId",
        a.park_id as "parkId",
        a.location,
        a.capacity,
        a.price,
        a.instructor_id as "instructorId",
        a.created_at as "createdAt",
        p.name as "parkName",
        c.name as "categoryName",
        i.full_name as "instructorName",
        img.image_url as "imageUrl",
        img.caption as "imageCaption"
      FROM activities a
      LEFT JOIN parks p ON a.park_id = p.id
      LEFT JOIN activity_categories c ON a.category_id = c.id
      LEFT JOIN instructors i ON a.instructor_id = i.id
      LEFT JOIN activity_images img ON a.id = img.activity_id AND img.is_primary = true
      ORDER BY a.created_at DESC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      startDate: row.startDate,
      endDate: row.endDate,
      category: row.categoryName || row.category,
      categoryId: row.categoryId,
      parkId: row.parkId,
      parkName: row.parkName,
      location: row.location,
      capacity: row.capacity || 0,
      price: row.price || 0,
      instructorId: row.instructorId,
      instructorName: row.instructorName,
      imageUrl: row.imageUrl,
      imageCaption: row.imageCaption
    }));
  } catch (error) {
    console.error("Error al obtener todas las actividades:", error);
    return [];
  }
};

DatabaseStorage.prototype.getParkActivities = async function(parkId: number): Promise<any[]> {
  console.log("🎯 GET PARK ACTIVITIES - Park ID:", parkId);
  
  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.start_date as "startDate",
        a.end_date as "endDate", 
        a.start_time as "startTime",
        a.end_time as "endTime",
        a.category,
        a.category_id as "categoryId",
        a.park_id as "parkId",
        a.location,
        a.capacity,
        a.duration,
        a.price,
        a.is_free as "isFree",
        a.materials,
        a.requirements,
        a.is_recurring as "isRecurring",
        a.recurring_days as "recurringDays",
        a.target_market as "targetMarket",
        a.special_needs as "specialNeeds",
        a.instructor_id as "instructorId",
        a.created_at as "createdAt",
        p.name as "parkName",
        ac.name as "categoryName",
        i.full_name as "instructorName",
        ai.image_url
      FROM activities a
      LEFT JOIN parks p ON a.park_id = p.id
      LEFT JOIN activity_categories ac ON a.category_id = ac.id
      LEFT JOIN instructors i ON a.instructor_id = i.id
      LEFT JOIN activity_images ai ON a.id = ai.activity_id AND ai.is_primary = true
      WHERE a.park_id = $1
      ORDER BY a.start_date DESC
    `, [parkId]);

    console.log("🎯 GET PARK ACTIVITIES - Activities found for park", parkId, ":", result.rows.length);
    if (result.rows.length > 0) {
      console.log("🎯 GET PARK ACTIVITIES - Sample activity:", result.rows[0]);
    }
    
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      startDate: row.startDate,
      endDate: row.endDate,
      startTime: row.startTime,
      endTime: row.endTime,
      category: row.categoryName || row.category,
      categoryId: row.categoryId,
      parkId: row.parkId,
      parkName: row.parkName,
      location: row.location,
      capacity: row.capacity,
      duration: row.duration,
      price: row.price,
      isFree: row.isFree,
      materials: row.materials,
      requirements: row.requirements,
      isRecurring: row.isRecurring,
      recurringDays: row.recurringDays,
      targetMarket: row.targetMarket,
      specialNeeds: row.specialNeeds,
      instructorId: row.instructorId,
      instructorName: row.instructorName,
      imageUrl: row.image_url,
      createdAt: row.createdAt
    }));
  } catch (error) {
    console.error("Error al obtener actividades del parque:", error);
    return [];
  }
};

DatabaseStorage.prototype.createActivity = async function(activityData: any): Promise<any> {
  console.log("🔥 CREANDO ACTIVIDAD - Datos recibidos:", activityData);
  
  try {
    const [newActivity] = await db.insert(activities).values(activityData).returning();
    
    console.log("✅ Actividad creada exitosamente:", newActivity);
    return newActivity;
  } catch (error) {
    console.error("❌ Error al crear actividad en la base de datos:", error);
    throw error;
  }
};

DatabaseStorage.prototype.getActivity = async function(id: number): Promise<any> {
  console.log("🎯 GET ACTIVITY ENDPOINT - ID:", id);
  
  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.start_date as "startDate",
        a.end_date as "endDate", 
        a.start_time as "startTime",
        a.end_time as "endTime",
        a.category,
        a.category_id as "categoryId",
        a.park_id as "parkId",
        a.location,
        a.capacity,
        a.duration,
        a.price,
        a.is_free as "isFree",
        a.materials,
        a.requirements,
        a.is_recurring as "isRecurring",
        a.recurring_days as "recurringDays",
        a.target_market as "targetMarket",
        a.special_needs as "specialNeeds",
        a.instructor_id as "instructorId",
        a.registration_enabled as "registrationEnabled",
        a.max_registrations as "maxRegistrations",
        a.registration_deadline as "registrationDeadline",
        a.requires_approval as "requiresApproval",
        a.created_at as "createdAt",
        p.name as "parkName",
        ac.name as "category",
        i.full_name as "instructorName"
      FROM activities a
      LEFT JOIN parks p ON a.park_id = p.id
      LEFT JOIN activity_categories ac ON a.category_id = ac.id
      LEFT JOIN instructors i ON a.instructor_id = i.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const activity = result.rows[0];
    
    // Parsear campos JSON
    console.log("🔍 targetMarket raw:", activity.targetMarket);
    console.log("🔍 specialNeeds raw:", activity.specialNeeds);
    
    if (activity.targetMarket) {
      if (Array.isArray(activity.targetMarket)) {
        // Ya es un array, usarlo directamente
        console.log("✅ targetMarket is already array:", activity.targetMarket);
      } else if (typeof activity.targetMarket === 'string') {
        try {
          activity.targetMarket = JSON.parse(activity.targetMarket);
          console.log("✅ targetMarket parsed:", activity.targetMarket);
        } catch (e) {
          // Si falla el parsing, tratarlo como string separado por comas
          activity.targetMarket = activity.targetMarket.split(',').map(s => s.trim()).filter(s => s.length > 0);
          console.log("✅ targetMarket parsed as CSV:", activity.targetMarket);
        }
      } else {
        console.log("❌ Error parsing targetMarket:", typeof activity.targetMarket);
        activity.targetMarket = [];
      }
    } else {
      console.log("⚠️ targetMarket is null/undefined");
      activity.targetMarket = [];
    }
    
    if (activity.specialNeeds) {
      if (Array.isArray(activity.specialNeeds)) {
        // Ya es un array, usarlo directamente
        console.log("✅ specialNeeds is already array:", activity.specialNeeds);
      } else if (typeof activity.specialNeeds === 'string') {
        try {
          activity.specialNeeds = JSON.parse(activity.specialNeeds);
          console.log("✅ specialNeeds parsed:", activity.specialNeeds);
        } catch (e) {
          // Si falla el parsing, tratarlo como string separado por comas
          activity.specialNeeds = activity.specialNeeds.split(',').map(s => s.trim()).filter(s => s.length > 0);
          console.log("✅ specialNeeds parsed as CSV:", activity.specialNeeds);
        }
      } else {
        console.log("❌ Error parsing specialNeeds:", typeof activity.specialNeeds);
        activity.specialNeeds = [];
      }
    } else {
      console.log("⚠️ specialNeeds is null/undefined");
      activity.specialNeeds = [];
    }

    console.log("🎯 Actividad encontrada:", activity);
    return activity;
  } catch (error) {
    console.error("Error obteniendo actividad:", error);
    return null;
  }
};

DatabaseStorage.prototype.updateActivity = async function(id: number, activityData: any): Promise<any> {
  console.log("🔄 Actualizando actividad:", id, "con datos:", activityData);
  
  try {
    // Mapear los campos del frontend al schema de la base de datos
    const updateData: any = {};
    
    if (activityData.title) updateData.title = activityData.title;
    if (activityData.description) updateData.description = activityData.description;
    if (activityData.parkId) updateData.park_id = Number(activityData.parkId);
    if (activityData.startDate) updateData.start_date = activityData.startDate;
    if (activityData.endDate) updateData.end_date = activityData.endDate;
    if (activityData.startTime) updateData.start_time = activityData.startTime;
    if (activityData.endTime) updateData.end_time = activityData.endTime;
    if (activityData.location) updateData.location = activityData.location;
    if (activityData.capacity) updateData.capacity = Number(activityData.capacity);
    if (activityData.duration !== undefined) updateData.duration = Number(activityData.duration);
    if (activityData.price !== undefined) updateData.price = Number(activityData.price);
    if (activityData.isFree !== undefined) updateData.is_free = Boolean(activityData.isFree);
    if (activityData.isPriceRandom !== undefined) updateData.is_price_random = Boolean(activityData.isPriceRandom);
    if (activityData.materials) updateData.materials = activityData.materials;
    if (activityData.requirements) updateData.requirements = activityData.requirements;
    if (activityData.isRecurring !== undefined) updateData.is_recurring = Boolean(activityData.isRecurring);
    if (activityData.recurringDays !== undefined) updateData.recurring_days = Array.isArray(activityData.recurringDays) ? JSON.stringify(activityData.recurringDays) : activityData.recurringDays;
    if (activityData.targetMarket !== undefined) updateData.target_market = Array.isArray(activityData.targetMarket) ? JSON.stringify(activityData.targetMarket) : activityData.targetMarket;
    if (activityData.specialNeeds !== undefined) updateData.special_needs = Array.isArray(activityData.specialNeeds) ? JSON.stringify(activityData.specialNeeds) : activityData.specialNeeds;
    
    // Campos de inscripciones - usando nombres correctos de la base de datos
    if (activityData.registrationEnabled !== undefined || activityData.allowsPublicRegistration !== undefined) {
      updateData.registration_enabled = Boolean(activityData.allowsPublicRegistration || activityData.registrationEnabled);
    }
    if (activityData.maxRegistrations !== undefined) updateData.max_registrations = activityData.maxRegistrations ? Number(activityData.maxRegistrations) : null;
    if (activityData.registrationDeadline !== undefined) updateData.registration_deadline = activityData.registrationDeadline;
    if (activityData.registrationInstructions !== undefined) updateData.registration_instructions = activityData.registrationInstructions;
    if (activityData.requiresApproval !== undefined) updateData.requires_approval = Boolean(activityData.requiresApproval);
    if (activityData.ageRestrictions !== undefined) updateData.age_restrictions = activityData.ageRestrictions;
    if (activityData.healthRequirements !== undefined) updateData.health_requirements = activityData.healthRequirements;
    
    // Campos específicos que necesitan mapeo especial
    if (activityData.categoryId || activityData.category_id) {
      updateData.category_id = Number(activityData.categoryId || activityData.category_id);
      updateData.category = null; // Limpiar el campo legacy
    }
    
    if (activityData.instructorId) {
      updateData.instructor_id = Number(activityData.instructorId);
    }
    
    console.log("📝 Datos mapeados para actualizar:", updateData);
    console.log("🔍 Valores específicos a verificar:", {
      category_id: updateData.category_id,
      registration_enabled: updateData.registration_enabled,
      categoryIdFromFrontend: activityData.categoryId,
      allowsPublicRegistrationFromFrontend: activityData.allowsPublicRegistration
    });
    
    // Realizar la actualización usando Drizzle ORM
    const result = await db
      .update(activities)
      .set(updateData)
      .where(eq(activities.id, id))
      .returning();
    
    console.log("✅ Actividad actualizada:", result[0]);
    
    if (result.length === 0) {
      throw new Error("No se pudo actualizar la actividad");
    }
    
    return result[0];
  } catch (error) {
    console.error("❌ Error actualizando actividad:", error);
    throw error;
  }
};

DatabaseStorage.prototype.deleteActivity = async function(id: number): Promise<boolean> {
  return true;
};

DatabaseStorage.prototype.getParkComments = async function(parkId: number): Promise<any[]> {
  return [];
};

DatabaseStorage.prototype.createComment = async function(commentData: any): Promise<any> {
  return { id: Date.now(), ...commentData };
};

DatabaseStorage.prototype.getAllComments = async function(): Promise<any[]> {
  return [];
};

DatabaseStorage.prototype.getComment = async function(id: number): Promise<any> {
  return null;
};

DatabaseStorage.prototype.approveComment = async function(id: number): Promise<any> {
  return { id, approved: true };
};

DatabaseStorage.prototype.deleteComment = async function(id: number): Promise<boolean> {
  return true;
};

DatabaseStorage.prototype.createIncident = async function(incidentData: any): Promise<any> {
  return { id: Date.now(), ...incidentData };
};

DatabaseStorage.prototype.getIncident = async function(id: number): Promise<any> {
  return null;
};

DatabaseStorage.prototype.updateIncidentStatus = async function(id: number, status: string): Promise<any> {
  return { id, status };
};

DatabaseStorage.prototype.getParkIncidents = async function(parkId: number): Promise<any[]> {
  return [];
};

// Activity Registration implementations
DatabaseStorage.prototype.getActivityById = async function(id: number): Promise<any> {
  try {
    const result = await db.select().from(activities).where(eq(activities.id, id));
    return result[0] || null;
  } catch (error) {
    console.error("Error getting activity by ID:", error);
    return null;
  }
};

DatabaseStorage.prototype.getActivityRegistrationById = async function(id: number): Promise<any> {
  try {
    const { activityRegistrations } = schema;
    const result = await db.select().from(activityRegistrations).where(eq(activityRegistrations.id, id));
    return result[0] || null;
  } catch (error) {
    console.error("Error getting activity registration by ID:", error);
    return null;
  }
};

DatabaseStorage.prototype.updateActivityRegistration = async function(id: number, data: any): Promise<any> {
  try {
    const { activityRegistrations } = schema;
    const result = await db.update(activityRegistrations)
      .set(data)
      .where(eq(activityRegistrations.id, id))
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error("Error updating activity registration:", error);
    throw error;
  }
};