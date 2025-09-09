import { Request, Response, Router } from "express";
import { pool } from "./db";
import multer from "multer";
import csv from "csv-parser";

// Configuración de multer para subida de archivos
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

export function registerAssetCategoriesRoutes(app: any, apiRouter: Router) {
  
  // ===== ENDPOINTS PARA CATEGORÍAS DE ACTIVOS CON JERARQUÍA =====

  // GET: Obtener todas las categorías con estructura jerárquica
  apiRouter.get("/asset-categories", async (_req: Request, res: Response) => {
    try {
      console.log("🏷️ Obteniendo categorías de activos con estructura jerárquica");
      
      // Consulta SQL directa usando pool para evitar problemas de Drizzle ORM
      const result = await pool.query(`
        SELECT 
          c.id,
          c.name,
          c.description,
          c.icon,
          c.color,
          c.parent_id as "parentId",
          c.created_at as "createdAt",
          c.updated_at as "updatedAt",
          COUNT(children.id) as "childrenCount",
          CASE WHEN COUNT(children.id) > 0 THEN true ELSE false END as "hasChildren"
        FROM asset_categories c
        LEFT JOIN asset_categories children ON children.parent_id = c.id
        GROUP BY c.id, c.name, c.description, c.icon, c.color, c.parent_id, c.created_at, c.updated_at
        ORDER BY 
          CASE WHEN c.parent_id IS NULL THEN c.name END,
          CASE WHEN c.parent_id IS NOT NULL THEN c.name END
      `);

      const categories = result.rows.map(cat => ({
        ...cat,
        childrenCount: parseInt(cat.childrenCount),
        hasChildren: cat.hasChildren
      }));

      console.log(`📊 Encontradas ${categories.length} categorías (${categories.filter(c => !c.parentId).length} principales, ${categories.filter(c => c.parentId).length} subcategorías)`);
      res.json(categories);
    } catch (error) {
      console.error("❌ Error al obtener categorías de activos:", error);
      res.status(500).json({ message: "Error al obtener categorías de activos" });
    }
  });

  // POST: Crear nueva categoría de activo
  apiRouter.post("/asset-categories", async (req: Request, res: Response) => {
    try {
      const { name, description, icon, color, parentId } = req.body;
      
      console.log("🆕 Creando nueva categoría de activo:", { name, parentId });
      
      // Validaciones básicas
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "El nombre de la categoría es requerido" });
      }

      // Verificar que no existe una categoría con el mismo nombre y padre
      const existingCheck = await pool.query(`
        SELECT id FROM asset_categories 
        WHERE name = $1 AND COALESCE(parent_id, 0) = COALESCE($2, 0)
      `, [name.trim(), parentId || null]);

      if (existingCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: "Ya existe una categoría con ese nombre en el mismo nivel" 
        });
      }

      // Insertar nueva categoría
      const result = await pool.query(`
        INSERT INTO asset_categories (name, description, icon, color, parent_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, name, description, icon, color, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
      `, [
        name.trim(),
        description?.trim() || null,
        icon || null,
        color || '#6b7280',
        parentId || null
      ]);

      const newCategory = result.rows[0];
      console.log("✅ Categoría creada exitosamente:", newCategory.id);
      
      res.status(201).json({
        success: true,
        category: newCategory,
        message: "Categoría creada correctamente"
      });
    } catch (error: any) {
      console.error("❌ Error al crear categoría:", error);
      res.status(500).json({ 
        message: "Error al crear categoría", 
        details: error.message 
      });
    }
  });

  // PUT: Actualizar categoría existente
  apiRouter.put("/asset-categories/:id", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      const { name, description, icon, color, parentId } = req.body;
      
      console.log("📝 Actualizando categoría:", categoryId);
      
      // Validaciones
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "El nombre de la categoría es requerido" });
      }

      // Verificar que la categoría existe
      const existingCategory = await pool.query(`
        SELECT id FROM asset_categories WHERE id = $1
      `, [categoryId]);

      if (existingCategory.rows.length === 0) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }

      // Verificar que no se está creando un ciclo (una categoría no puede ser padre de sí misma)
      if (parentId === categoryId) {
        return res.status(400).json({ message: "Una categoría no puede ser subcategoría de sí misma" });
      }

      // Verificar duplicados (excluyendo la categoría actual)
      const duplicateCheck = await pool.query(`
        SELECT id FROM asset_categories 
        WHERE name = $1 AND COALESCE(parent_id, 0) = COALESCE($2, 0) AND id != $3
      `, [name.trim(), parentId || null, categoryId]);

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: "Ya existe otra categoría con ese nombre en el mismo nivel" 
        });
      }

      // Actualizar categoría
      const result = await pool.query(`
        UPDATE asset_categories 
        SET name = $1, description = $2, icon = $3, color = $4, parent_id = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING id, name, description, icon, color, parent_id as "parentId", created_at as "createdAt", updated_at as "updatedAt"
      `, [
        name.trim(),
        description?.trim() || null,
        icon || null,
        color || '#6b7280',
        parentId || null,
        categoryId
      ]);

      const updatedCategory = result.rows[0];
      console.log("✅ Categoría actualizada exitosamente:", categoryId);
      
      res.json({
        success: true,
        category: updatedCategory,
        message: "Categoría actualizada correctamente"
      });
    } catch (error: any) {
      console.error("❌ Error al actualizar categoría:", error);
      res.status(500).json({ 
        message: "Error al actualizar categoría", 
        details: error.message 
      });
    }
  });

  // DELETE: Eliminar categoría
  apiRouter.delete("/asset-categories/:id", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      console.log("🗑️ Eliminando categoría:", categoryId);
      
      // Verificar que la categoría existe
      const existingCategory = await pool.query(`
        SELECT id, name FROM asset_categories WHERE id = $1
      `, [categoryId]);

      if (existingCategory.rows.length === 0) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }

      // Verificar que no tiene subcategorías
      const childrenCheck = await pool.query(`
        SELECT COUNT(*) as count FROM asset_categories WHERE parent_id = $1
      `, [categoryId]);

      if (parseInt(childrenCheck.rows[0].count) > 0) {
        return res.status(400).json({ 
          message: "No se puede eliminar una categoría que tiene subcategorías. Elimine primero las subcategorías." 
        });
      }

      // Verificar que no tiene activos asociados
      const assetsCheck = await pool.query(`
        SELECT COUNT(*) as count FROM assets WHERE category_id = $1
      `, [categoryId]);

      if (parseInt(assetsCheck.rows[0].count) > 0) {
        return res.status(400).json({ 
          message: "No se puede eliminar una categoría que tiene activos asociados. Reasigne los activos a otra categoría primero." 
        });
      }

      // Eliminar categoría
      await pool.query(`DELETE FROM asset_categories WHERE id = $1`, [categoryId]);
      
      console.log("✅ Categoría eliminada exitosamente:", categoryId);
      
      res.json({
        success: true,
        message: "Categoría eliminada correctamente"
      });
    } catch (error: any) {
      console.error("❌ Error al eliminar categoría:", error);
      res.status(500).json({ 
        message: "Error al eliminar categoría", 
        details: error.message 
      });
    }
  });

  // GET: Obtener solo categorías principales (sin padre)
  apiRouter.get("/asset-categories/parents", async (_req: Request, res: Response) => {
    try {
      console.log("🏷️ Obteniendo categorías principales (sin padre)");
      
      const result = await pool.query(`
        SELECT 
          c.id,
          c.name,
          c.description,
          c.icon,
          c.color,
          c.created_at as "createdAt",
          c.updated_at as "updatedAt",
          COUNT(children.id) as "childrenCount"
        FROM asset_categories c
        LEFT JOIN asset_categories children ON children.parent_id = c.id
        WHERE c.parent_id IS NULL
        GROUP BY c.id, c.name, c.description, c.icon, c.color, c.created_at, c.updated_at
        ORDER BY c.name
      `);

      const categories = result.rows.map(cat => ({
        ...cat,
        childrenCount: parseInt(cat.childrenCount),
        hasChildren: parseInt(cat.childrenCount) > 0
      }));

      console.log(`📊 Encontradas ${categories.length} categorías principales`);
      res.json(categories);
    } catch (error) {
      console.error("❌ Error al obtener categorías principales:", error);
      res.status(500).json({ message: "Error al obtener categorías principales" });
    }
  });

  // GET: Obtener subcategorías de una categoría específica
  apiRouter.get("/asset-categories/:parentId/children", async (req: Request, res: Response) => {
    try {
      const parentId = parseInt(req.params.parentId);
      console.log("🏷️ Obteniendo subcategorías para categoría:", parentId);
      
      const result = await pool.query(`
        SELECT 
          id,
          name,
          description,
          icon,
          color,
          parent_id as "parentId",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM asset_categories 
        WHERE parent_id = $1
        ORDER BY name
      `, [parentId]);

      console.log(`📊 Encontradas ${result.rows.length} subcategorías para categoría ${parentId}`);
      res.json(result.rows);
    } catch (error) {
      console.error("❌ Error al obtener subcategorías:", error);
      res.status(500).json({ message: "Error al obtener subcategorías" });
    }
  });

  // GET: Obtener estructura de árbol completa (lista plana con niveles)
  apiRouter.get("/asset-categories/tree/structure", async (_req: Request, res: Response) => {
    try {
      console.log("🏷️ Generando estructura de árbol de categorías (formato plano)");
      
      // Obtener todas las categorías
      const result = await pool.query(`
        SELECT 
          id,
          name,
          description,
          icon,
          color,
          parent_id as "parentId",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM asset_categories 
        ORDER BY 
          CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
          name
      `);

      const categories = result.rows;
      const flatStructure = [];

      // Función para generar ruta jerárquica
      const buildPath = (category, allCategories) => {
        const path = [category.name];
        let current = category;
        
        while (current.parentId) {
          const parent = allCategories.find(c => c.id === current.parentId);
          if (parent) {
            path.unshift(parent.name);
            current = parent;
          } else {
            break;
          }
        }
        
        return path.join(' > ');
      };

      // Primero agregar categorías principales (nivel 0)
      const parentCategories = categories.filter(cat => !cat.parentId);
      parentCategories.forEach(parent => {
        flatStructure.push({
          ...parent,
          level: 0,
          pathNames: parent.name
        });
        
        // Luego agregar sus subcategorías (nivel 1)
        const children = categories.filter(cat => cat.parentId === parent.id);
        children.forEach(child => {
          flatStructure.push({
            ...child,
            level: 1,
            pathNames: buildPath(child, categories)
          });
        });
      });

      console.log(`🌳 Estructura plana generada: ${parentCategories.length} categorías principales con ${categories.filter(c => c.parentId).length} subcategorías`);
      console.log(`📋 Total elementos en estructura plana: ${flatStructure.length}`);
      
      res.json(flatStructure);
    } catch (error) {
      console.error("❌ Error al generar estructura de árbol:", error);
      res.status(500).json({ message: "Error al generar estructura de categorías" });
    }
  });

  // POST: Importar categorías desde CSV
  apiRouter.post("/asset-categories/import", upload.single('csvFile'), async (req: Request, res: Response) => {
    try {
      console.log("📤 [CSV ENDPOINT] Endpoint de importación CSV llamado");
      console.log("📤 [CSV ENDPOINT] Headers recibidos:", JSON.stringify(req.headers, null, 2));
      console.log("📤 [CSV ENDPOINT] Body keys:", Object.keys(req.body || {}));
      console.log("📤 [CSV ENDPOINT] File presente:", !!req.file);
      
      if (!req.file) {
        console.log("❌ [CSV ENDPOINT] No se encontró archivo en req.file");
        return res.status(400).json({ message: "No se ha proporcionado un archivo CSV" });
      }
      
      console.log("📤 [CSV ENDPOINT] Archivo recibido:", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const results: any[] = [];
      const errors: string[] = [];
      let success = 0;

      // Convertir el buffer a string y parsearlo
      const csvString = req.file.buffer.toString('utf-8');
      const lines = csvString.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        return res.status(400).json({ message: "El archivo CSV debe contener al menos una fila de datos además del header" });
      }

      // Verificar header
      const header = lines[0].toLowerCase().split(',').map(h => h.trim());
      const expectedColumns = ['category', 'subcategory', 'use', 'id'];
      const hasAllColumns = expectedColumns.every(col => header.includes(col));
      
      if (!hasAllColumns) {
        return res.status(400).json({ 
          message: `El archivo CSV debe contener las columnas: ${expectedColumns.join(', ')}. Encontradas: ${header.join(', ')}` 
        });
      }

      // Mapear índices de columnas
      const columnIndices = {
        category: header.indexOf('category'),
        subcategory: header.indexOf('subcategory'),
        use: header.indexOf('use'),
        id: header.indexOf('id')
      };

      // Procesar cada fila
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '')); // Remover comillas
        
        if (values.length < expectedColumns.length) {
          errors.push(`Fila ${i + 1}: Insuficientes columnas`);
          continue;
        }

        const category = values[columnIndices.category];
        const subcategory = values[columnIndices.subcategory];
        const use = values[columnIndices.use];
        const customId = values[columnIndices.id];

        if (!category) {
          errors.push(`Fila ${i + 1}: La categoría principal es requerida`);
          continue;
        }

        try {
          // Crear/obtener categoría principal
          let parentId: number | null = null;
          
          const existingParent = await pool.query(`
            SELECT id FROM asset_categories WHERE name = $1 AND parent_id IS NULL
          `, [category]);

          if (existingParent.rows.length > 0) {
            parentId = existingParent.rows[0].id;
            console.log(`📁 Categoría principal existente encontrada: ${category} (ID: ${parentId})`);
          } else {
            // Crear categoría principal
            const newParent = await pool.query(`
              INSERT INTO asset_categories (name, description, icon, color, parent_id, created_at, updated_at)
              VALUES ($1, $2, $3, $4, NULL, NOW(), NOW())
              RETURNING id
            `, [category, use || null, 'tag', '#3B82F6']);
            
            parentId = newParent.rows[0].id;
            success++;
            console.log(`➕ Categoría principal creada: ${category} (ID: ${parentId})`);
          }

          // Si hay subcategoría, crearla
          if (subcategory && subcategory.trim() !== '') {
            const existingSubcategory = await pool.query(`
              SELECT id FROM asset_categories WHERE name = $1 AND parent_id = $2
            `, [subcategory, parentId]);

            if (existingSubcategory.rows.length === 0) {
              await pool.query(`
                INSERT INTO asset_categories (name, description, icon, color, parent_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
              `, [subcategory, use || null, 'tag', '#10B981', parentId]);
              
              success++;
              console.log(`➕ Subcategoría creada: ${subcategory} bajo ${category}`);
            } else {
              console.log(`📁 Subcategoría existente: ${subcategory} bajo ${category}`);
            }
          }

        } catch (error: any) {
          console.error(`❌ Error procesando fila ${i + 1}:`, error);
          errors.push(`Fila ${i + 1}: ${error.message}`);
        }
      }

      console.log(`✅ Importación completada: ${success} categorías procesadas, ${errors.length} errores`);
      
      res.json({
        success,
        errors,
        message: `Importación completada: ${success} categorías importadas`
      });

    } catch (error: any) {
      console.error("❌ Error en importación CSV:", error);
      res.status(500).json({ 
        message: "Error al procesar el archivo CSV", 
        details: error.message 
      });
    }
  });

  console.log("🏷️ Rutas de categorías de activos registradas exitosamente");
}