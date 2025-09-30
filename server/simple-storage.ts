import { db, pool } from './db';
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";

const {
  parks,
  municipalities,
  amenities,
  parkAmenities,
  activities,
  incidents,
  documents,
  parkImages,
  volunteers,
  trees
} = schema;

// Simple storage implementation that works
export class SimpleStorage {
  async getParks(filters?: any): Promise<any[]> {
    try {
      return await db.select().from(parks);
    } catch (error) {
      console.error("Error fetching parks:", error);
      return [];
    }
  }
  
  async getExtendedParks(filters?: any): Promise<any[]> {
    try {
      return await db.select({
        park: parks,
      })
      .from(parks);
    } catch (error) {
      console.error("Error fetching extended parks:", error);
      return [];
    }
  }
  
  async getPark(id: number): Promise<any> {
    try {
      const result = await db.select().from(parks).where(eq(parks.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error fetching park:", error);
      return null;
    }
  }
  
  async updatePark(id: number, data: any): Promise<any> {
    try {
      const result = await db.update(parks).set(data).where(eq(parks.id, id)).returning();
      return result[0] || null;
    } catch (error) {
      console.error("Error updating park:", error);
      return null;
    }
  }
  
  async deletePark(id: number): Promise<boolean> {
    try {
      await db.delete(parks).where(eq(parks.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting park:", error);
      return false;
    }
  }
  
  async getMunicipalities(): Promise<any[]> {
    try {
      return await db.select().from(municipalities);
    } catch (error) {
      console.error("Error fetching municipalities:", error);
      return [];
    }
  }
  
  async getAmenities(): Promise<any[]> {
    try {
      // Usar consulta SQL directa para evitar problemas con columnas inexistentes
      const result = await pool.query(`
        SELECT 
          id,
          name,
          icon,
          category,
          icon_type as "iconType",
          custom_icon_url as "customIconUrl"
        FROM amenities
        ORDER BY name
      `);
      return result.rows;
    } catch (error) {
      console.error("Error fetching amenities:", error);
      return [];
    }
  }
  
  async getParkAmenities(parkId: number): Promise<any[]> {
    try {
      return await db.select({
        amenity: amenities
      })
      .from(parkAmenities)
      .leftJoin(amenities, eq(parkAmenities.amenityId, amenities.id))
      .where(eq(parkAmenities.parkId, parkId));
    } catch (error) {
      console.error("Error fetching park amenities:", error);
      return [];
    }
  }

  // Minimal implementations for required methods
  async getUser(id: number): Promise<any> { return null; }
  async getUserByUsername(username: string): Promise<any> { return null; }
  async getUsers(): Promise<any[]> { return []; }
  async getUserByEmail(email: string): Promise<any> { return null; }
  async createUser(userData: any): Promise<any> { return null; }
  async updateUser(id: number, userData: any): Promise<any> { return null; }
  async deleteUser(id: number): Promise<boolean> { return false; }
  async getAssetCategories(): Promise<any[]> { return []; }
  async getAssetCategory(id: number): Promise<any> { return null; }
  async getCategoryAssets(categoryId: number): Promise<any[]> { return []; }
  async createAssetCategory(category: any): Promise<any> { return null; }
  async updateAssetCategory(id: number, category: any): Promise<any> { return null; }
  async deleteAssetCategory(id: number): Promise<boolean> { return false; }
  async getAssets(filters?: any): Promise<any[]> { return []; }
  async getAsset(id: number): Promise<any> { return null; }
  async createAsset(assetData: any): Promise<any> { return null; }
  async updateAsset(id: number, assetData: any): Promise<any> { return null; }
  async deleteAsset(id: number): Promise<boolean> { return false; }
  async createAssetHistoryEntry(historyData: any): Promise<any> { return null; }
  async getAssetMaintenances(assetId?: number): Promise<any[]> { return []; }
  async getAssetMaintenance(id: number): Promise<any> { return null; }
  async createAssetMaintenance(maintenanceData: any): Promise<any> { return null; }
  async updateAssetMaintenance(id: number, maintenanceData: any): Promise<any> { return null; }
  async deleteAssetMaintenance(id: number): Promise<boolean> { return false; }
  async getAssetAssignments(assetId?: number): Promise<any[]> { return []; }
  async getAssetAssignment(id: number): Promise<any> { return null; }
  async createAssetAssignment(assignmentData: any): Promise<any> { return null; }
  async updateAssetAssignment(id: number, assignmentData: any): Promise<any> { return null; }
  async deleteAssetAssignment(id: number): Promise<boolean> { return false; }
  async addAmenityToPark(data: any): Promise<any> { return null; }
  async removeAmenityFromPark(parkId: number, amenityId: number): Promise<boolean> { return false; }
  async isAmenityInUse(amenityId: number): Promise<boolean> { return false; }
  async deleteAmenity(amenityId: number): Promise<boolean> { return false; }
  async getParkImages(parkId: number): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT id, park_id as "parkId", image_url as "imageUrl", is_primary as "isPrimary", caption, created_at as "createdAt"
        FROM park_images
        WHERE park_id = $1
        ORDER BY is_primary DESC, id ASC
      `, [parkId]);
      console.log(`🖼️ SIMPLE STORAGE: Encontradas ${result.rows.length} imágenes para parque ${parkId}`);
      return result.rows || [];
    } catch (error) {
      console.error("Error al obtener imágenes del parque desde simple-storage:", error);
      return [];
    }
  }
  async createParkImage(imageData: any): Promise<any> { return null; }
  async updateParkImage(id: number, data: any): Promise<any> { return null; }
  async deleteParkImage(id: number): Promise<boolean> { return false; }
  async getParkDocuments(parkId: number): Promise<any[]> {
    try {
      return await db.select().from(documents).where(eq(documents.parkId, parkId));
    } catch (error) {
      console.error("Error fetching park documents:", error);
      return [];
    }
  }
  async createDocument(documentData: any): Promise<any> {
    try {
      const result = await db.insert(documents).values(documentData).returning();
      return result[0] || null;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }
  async getDocument(id: number): Promise<any> { return null; }
  async deleteDocument(id: number): Promise<boolean> { return false; }
  async getAllDocuments(): Promise<any[]> { return []; }
  async getAllActivities(): Promise<any[]> { 
    try {
      return await db.select().from(activities);
    } catch (error) {
      return [];
    }
  }
  async getParkActivities(parkId: number): Promise<any[]> { 
    try {
      return await db.select().from(activities).where(eq(activities.parkId, parkId));
    } catch (error) {
      return [];
    }
  }
  async createActivity(activityData: any): Promise<any> { return null; }
  async getActivity(id: number): Promise<any> { return null; }
  async updateActivity(id: number, activityData: any): Promise<any> { return null; }
  async deleteActivity(id: number): Promise<boolean> { return false; }
  async getParkComments(parkId: number): Promise<any[]> { return []; }
  async createComment(commentData: any): Promise<any> { return null; }
  async getAllComments(): Promise<any[]> { return []; }
  async getComment(id: number): Promise<any> { return null; }
  async approveComment(id: number): Promise<any> { return null; }
  async deleteComment(id: number): Promise<boolean> { return false; }
  async createIncident(incidentData: any): Promise<any> { return null; }
  async getIncident(id: number): Promise<any> { return null; }
  async updateIncidentStatus(id: number, status: string): Promise<any> { return null; }
  async getParkIncidents(parkId: number): Promise<any[]> { return []; }
}

export const storage = new SimpleStorage();