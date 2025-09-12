import { Request, Response } from 'express';
import { db } from './db';
import { pool } from './db';
import { 
  sponsorshipPackages, 
  sponsorshipBenefits,
  sponsorshipPackageBenefits,
  sponsors, 
  sponsorshipCampaigns,
  sponsorshipContracts,
  sponsorshipEvents,
  sponsorshipEventsLinks,
  sponsorshipMetrics,
  sponsorshipEvaluations,
  sponsorshipRenewals,
  sponsorshipAssets,
  events,
  assets,
  insertSponsorshipPackageSchema,
  insertSponsorshipBenefitSchema,
  insertSponsorshipPackageBenefitSchema,
  insertSponsorSchema, 
  insertSponsorshipCampaignSchema,
  insertSponsorshipContractSchema,
  insertSponsorshipEventSchema,
  insertSponsorshipEventLinkSchema,
  insertSponsorshipMetricsSchema,
  insertSponsorshipEvaluationSchema,
  insertSponsorshipRenewalSchema,
  insertSponsorshipAssetSchema
} from '../shared/schema';
import { eq, desc, sql, and, notInArray } from 'drizzle-orm';

/**
 * Rutas para el sistema de patrocinios
 */
export function registerSponsorshipRoutes(app: any, apiRouter: any, isAuthenticated: any) {
  
  // ===== PAQUETES DE PATROCINIO =====
  
  // Obtener todos los paquetes de patrocinio
  apiRouter.get('/sponsorship-packages', async (req: Request, res: Response) => {
    try {
      const packages = await db
        .select()
        .from(sponsorshipPackages)
        .orderBy(sponsorshipPackages.id); // Ordenar por ID ascendente (1 al 10)
      
      res.json(packages);
    } catch (error) {
      console.error('Error al obtener paquetes de patrocinio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Obtener un paquete específico
  apiRouter.get('/sponsorship-packages/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const packageResult = await db
        .select()
        .from(sponsorshipPackages)
        .where(eq(sponsorshipPackages.id, parseInt(id)))
        .limit(1);
      
      if (packageResult.length === 0) {
        return res.status(404).json({ error: 'Paquete no encontrado' });
      }
      
      res.json(packageResult[0]);
    } catch (error) {
      console.error('Error al obtener paquete:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Crear nuevo paquete de patrocinio
  apiRouter.post('/sponsorship-packages', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { benefits, ...packageData } = req.body;
      const validatedData = insertSponsorshipPackageSchema.parse(packageData);
      
      // Crear el paquete primero
      const [newPackage] = await db
        .insert(sponsorshipPackages)
        .values(validatedData)
        .returning();
      
      // Si hay beneficios, crearlos también en una transacción
      if (benefits && Array.isArray(benefits) && benefits.length > 0) {
        try {
          for (const benefit of benefits) {
            const validatedBenefit = insertSponsorshipPackageBenefitSchema.parse({
              packageId: newPackage.id,
              benefitId: benefit.benefitId,
              quantity: benefit.quantity || 1,
              customValue: benefit.customValue || ''
            });
            
            await db
              .insert(sponsorshipPackageBenefits)
              .values(validatedBenefit);
          }
        } catch (benefitError) {
          // Si falla la creación de beneficios, eliminar el paquete creado
          await db
            .delete(sponsorshipPackages)
            .where(eq(sponsorshipPackages.id, newPackage.id));
          
          throw new Error(`Error al crear beneficios del paquete: ${benefitError}`);
        }
      }
      
      res.status(201).json(newPackage);
    } catch (error) {
      console.error('Error al crear paquete de patrocinio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Actualizar paquete de patrocinio
  apiRouter.put('/sponsorship-packages/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertSponsorshipPackageSchema.parse(req.body);
      
      const [updatedPackage] = await db
        .update(sponsorshipPackages)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(sponsorshipPackages.id, parseInt(id)))
        .returning();
      
      if (!updatedPackage) {
        return res.status(404).json({ error: 'Paquete no encontrado' });
      }
      
      res.json(updatedPackage);
    } catch (error) {
      console.error('Error al actualizar paquete:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Eliminar paquete de patrocinio
  apiRouter.delete('/sponsorship-packages/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [deletedPackage] = await db
        .delete(sponsorshipPackages)
        .where(eq(sponsorshipPackages.id, parseInt(id)))
        .returning();
      
      if (!deletedPackage) {
        return res.status(404).json({ error: 'Paquete no encontrado' });
      }
      
      res.json({ message: 'Paquete eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar paquete:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // ===== BENEFICIOS DE PATROCINIO =====
  
  // Obtener todas las categorías de beneficios disponibles
  apiRouter.get('/sponsorship-benefit-categories', async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`SELECT unnest(enum_range(NULL::benefits_categories)) AS value ORDER BY value`);
      const categories = result.rows.map((row: any) => {
        const value = row.value;
        let label = value;
        let icon = "🔗";
        
        // Mapear a etiquetas e iconos apropiados para categorías originales
        switch (value) {
          case "Visibilidad":
            label = "Visibilidad";
            icon = "👁️";
            break;
          case "Acceso":
            label = "Acceso";
            icon = "🔑";
            break;
          case "Branding":
            label = "Branding";
            icon = "🎨";
            break;
          case "Otro":
            label = "Otro";
            icon = "🔗";
            break;
        }
        
        return { value, label, icon };
      });
      
      res.json(categories);
    } catch (error) {
      console.error('Error al obtener categorías de beneficios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Obtener todos los beneficios de patrocinio
  apiRouter.get('/sponsorship-benefits', async (req: Request, res: Response) => {
    try {
      const benefits = await db
        .select()
        .from(sponsorshipBenefits)
        .orderBy(sponsorshipBenefits.id);
      
      res.json(benefits);
    } catch (error) {
      console.error('Error al obtener beneficios de patrocinio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Obtener un beneficio específico
  apiRouter.get('/sponsorship-benefits/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const benefitResult = await db
        .select()
        .from(sponsorshipBenefits)
        .where(eq(sponsorshipBenefits.id, parseInt(id)))
        .limit(1);
      
      if (benefitResult.length === 0) {
        return res.status(404).json({ error: 'Beneficio no encontrado' });
      }
      
      res.json(benefitResult[0]);
    } catch (error) {
      console.error('Error al obtener beneficio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Crear nuevo beneficio de patrocinio
  apiRouter.post('/sponsorship-benefits', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSponsorshipBenefitSchema.parse(req.body);
      
      const [newBenefit] = await db
        .insert(sponsorshipBenefits)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newBenefit);
    } catch (error) {
      console.error('Error al crear beneficio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Actualizar beneficio de patrocinio
  apiRouter.put('/sponsorship-benefits/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertSponsorshipBenefitSchema.parse(req.body);
      
      const [updatedBenefit] = await db
        .update(sponsorshipBenefits)
        .set({ 
          ...validatedData, 
          updatedAt: new Date() 
        })
        .where(eq(sponsorshipBenefits.id, parseInt(id)))
        .returning();
      
      if (!updatedBenefit) {
        return res.status(404).json({ error: 'Beneficio no encontrado' });
      }
      
      res.json(updatedBenefit);
    } catch (error) {
      console.error('Error al actualizar beneficio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Eliminar beneficio de patrocinio
  apiRouter.delete('/sponsorship-benefits/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [deletedBenefit] = await db
        .delete(sponsorshipBenefits)
        .where(eq(sponsorshipBenefits.id, parseInt(id)))
        .returning();
      
      if (!deletedBenefit) {
        return res.status(404).json({ error: 'Beneficio no encontrado' });
      }
      
      res.json({ message: 'Beneficio eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar beneficio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // ===== BENEFICIOS DE PAQUETES =====
  
  // Obtener beneficios de un paquete específico
  apiRouter.get('/sponsorship-packages/:id/benefits', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
        
      const packageBenefits = await db
        .select({
          id: sponsorshipPackageBenefits.id,
          packageId: sponsorshipPackageBenefits.packageId,
          benefitId: sponsorshipPackageBenefits.benefitId,
          quantity: sponsorshipPackageBenefits.quantity,
          customValue: sponsorshipPackageBenefits.customValue,
          createdAt: sponsorshipPackageBenefits.createdAt,
          updatedAt: sponsorshipPackageBenefits.updatedAt,
          // Datos del beneficio
          benefitName: sponsorshipBenefits.name,
          benefitDescription: sponsorshipBenefits.description,
          benefitCategory: sponsorshipBenefits.category
        })
        .from(sponsorshipPackageBenefits)
        .innerJoin(sponsorshipBenefits, eq(sponsorshipPackageBenefits.benefitId, sponsorshipBenefits.id))
        .where(eq(sponsorshipPackageBenefits.packageId, parseInt(id)));
      
      
      res.json(packageBenefits);
    } catch (error) {
      console.error('Error al obtener beneficios del paquete:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Agregar beneficio a un paquete
  apiRouter.post('/sponsorship-packages/:id/benefits', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertSponsorshipPackageBenefitSchema.parse({
        ...req.body,
        packageId: parseInt(id)
      });
      
      const [newPackageBenefit] = await db
        .insert(sponsorshipPackageBenefits)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newPackageBenefit);
    } catch (error) {
      console.error('Error al agregar beneficio al paquete:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Actualizar beneficio de un paquete
  apiRouter.put('/sponsorship-packages/:id/benefits/:benefitId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id, benefitId } = req.params;
      
      const [updatedBenefit] = await db
        .update(sponsorshipPackageBenefits)
        .set({
          quantity: req.body.quantity,
          customValue: req.body.customValue,
          updatedAt: new Date()
        })
        .where(eq(sponsorshipPackageBenefits.id, parseInt(benefitId)))
        .returning();
      
      if (!updatedBenefit) {
        return res.status(404).json({ error: 'Beneficio del paquete no encontrado' });
      }
      
      res.json(updatedBenefit);
    } catch (error) {
      console.error('Error al actualizar beneficio del paquete:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Eliminar beneficio de un paquete
  apiRouter.delete('/sponsorship-packages/:id/benefits/:benefitId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id, benefitId } = req.params;
      
      const [deletedBenefit] = await db
        .delete(sponsorshipPackageBenefits)
        .where(eq(sponsorshipPackageBenefits.id, parseInt(benefitId)))
        .returning();
      
      if (!deletedBenefit) {
        return res.status(404).json({ error: 'Beneficio del paquete no encontrado' });
      }
      
      res.json({ message: 'Beneficio eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar beneficio del paquete:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // ===== PATROCINADORES =====
  
  // Obtener todos los patrocinadores
  apiRouter.get('/sponsors', async (req: Request, res: Response) => {
    try {
      console.log('🔍 Obteniendo patrocinadores...');
      
      // Usar query SQL directo para la nueva estructura simplificada
      const result = await pool.query(`
        SELECT 
          s.id,
          s.name,
          s.sector,
          s.logo_url,
          s.status,
          s.website_url,
          s.representative,
          s.contact_info,
          s.updated_at
        FROM sponsors s
        ORDER BY s.id DESC
      `);
      
      // Mapear a camelCase para la nueva estructura simplificada
      const mappedSponsors = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        sector: row.sector,
        logo_url: row.logo_url,
        status: row.status,
        website_url: row.website_url,
        representative: row.representative,
        contact_info: row.contact_info,
        updatedAt: row.updated_at
      }));
      
      console.log('✅ Patrocinadores encontrados:', mappedSponsors.length);
      if (mappedSponsors.length > 0) {
        console.log('📄 Primer patrocinador:', {
          name: mappedSponsors[0].name,
          sector: mappedSponsors[0].sector,
          status: mappedSponsors[0].status,
          representative: mappedSponsors[0].representative
        });
      }
      
      res.json(mappedSponsors);
    } catch (error) {
      console.error('Error al obtener patrocinadores:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Obtener un patrocinador específico
  apiRouter.get('/sponsors/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const sponsor = await db
        .select()
        .from(sponsors)
        .where(eq(sponsors.id, parseInt(id)))
        .limit(1);
      
      if (sponsor.length === 0) {
        return res.status(404).json({ error: 'Patrocinador no encontrado' });
      }
      
      res.json(sponsor[0]);
    } catch (error) {
      console.error('Error al obtener patrocinador:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Crear nuevo patrocinador
  apiRouter.post('/sponsors', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSponsorSchema.parse(req.body);
      
      const [newSponsor] = await db
        .insert(sponsors)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newSponsor);
    } catch (error) {
      console.error('Error al crear patrocinador:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Eliminar patrocinador
  apiRouter.delete('/sponsors/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query('DELETE FROM sponsors WHERE id = $1 RETURNING *', [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Patrocinador no encontrado' });
      }
      
      res.json({ message: 'Patrocinador eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar patrocinador:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Actualizar patrocinador
  apiRouter.put('/sponsors/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log('🔧 Datos recibidos para actualización:', req.body);
      
      const validatedData = insertSponsorSchema.parse(req.body);
      console.log('✅ Datos validados:', validatedData);
      
      const [updatedSponsor] = await db
        .update(sponsors)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(sponsors.id, parseInt(id)))
        .returning();
      
      if (!updatedSponsor) {
        return res.status(404).json({ error: 'Patrocinador no encontrado' });
      }
      
      console.log('✅ Patrocinador actualizado exitosamente');
      res.json(updatedSponsor);
    } catch (error: unknown) {
      console.error('Error al actualizar patrocinador:', error);
      if (error instanceof Error && 'name' in error && error.name === 'ZodError') {
        console.error('Detalles del error de validación:', (error as any).errors);
        return res.status(400).json({ error: 'Datos inválidos', details: (error as any).errors });
      }
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Eliminar patrocinador
  apiRouter.delete('/sponsors/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [deletedSponsor] = await db
        .delete(sponsors)
        .where(eq(sponsors.id, parseInt(id)))
        .returning();
      
      if (!deletedSponsor) {
        return res.status(404).json({ error: 'Patrocinador no encontrado' });
      }
      
      res.json({ message: 'Patrocinador eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar patrocinador:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // ===== CAMPAÑAS DE PATROCINIO =====
  
  // Obtener todas las campañas
  apiRouter.get('/sponsorship-campaigns', async (req: Request, res: Response) => {
    try {
      const campaigns = await db
        .select()
        .from(sponsorshipCampaigns)
        .orderBy(desc(sponsorshipCampaigns.createdAt));
      
      res.json(campaigns);
    } catch (error) {
      console.error('Error al obtener campañas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Crear nueva campaña
  apiRouter.post('/sponsorship-campaigns', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSponsorshipCampaignSchema.parse(req.body);
      
      const [newCampaign] = await db
        .insert(sponsorshipCampaigns)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newCampaign);
    } catch (error) {
      console.error('Error al crear campaña:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // ===== CONTRATOS DE PATROCINIO =====
  
  // Obtener todos los contratos
  apiRouter.get('/sponsorship-contracts', async (req: Request, res: Response) => {
    try {
      console.log('🔍 Obteniendo contratos de patrocinio...');
      
      // Primero, probar consulta simple  
      const contractsResult = await pool.query('SELECT * FROM sponsorship_contracts ORDER BY id DESC');
      console.log('✅ Contratos base encontrados:', contractsResult.rows.length);
      
      // Si hay contratos, devolver directamente los datos básicos
      if (contractsResult.rows.length > 0) {
        // Obtener información básica de sponsors para los contratos
        const sponsorIds = contractsResult.rows.map((contract: any) => contract.sponsor_id).filter((id: number) => id);
        let sponsorNames: { [key: number]: { name: string; logo: string | null } } = {};
        
        if (sponsorIds.length > 0) {
          const sponsorsResult = await pool.query(`
            SELECT id, name, logo_url 
            FROM sponsors 
            WHERE id = ANY($1)
          `, [sponsorIds]);
          
          sponsorsResult.rows.forEach((sponsor: any) => {
            sponsorNames[sponsor.id] = {
              name: sponsor.name,
              logo: sponsor.logo_url
            };
          });
        }
        
        // Agregar información de sponsor a cada contrato
        const contractsWithSponsors = contractsResult.rows.map((contract: any) => ({
          ...contract,
          sponsor_name: sponsorNames[contract.sponsor_id]?.name || 'Sin asignar',
          sponsor_logo: sponsorNames[contract.sponsor_id]?.logo || null
        }));
        
        console.log('✅ Contratos con sponsors:', contractsWithSponsors.length);
        console.log('📋 Primer contrato:', contractsWithSponsors[0]);
        res.json(contractsWithSponsors);
      } else {
        console.log('⚠️ No hay contratos en la base de datos');
        res.json([]);
      }
    } catch (error: unknown) {
      console.error('❌ Error al obtener contratos:', error);
      console.error('❌ Error details:', (error as Error).message);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Crear nuevo contrato
  apiRouter.post('/sponsorship-contracts', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const {
        sponsorId,
        packageId,
        number,
        type,
        amount,
        startDate,
        endDate,
        status,
        notes
      } = req.body;

      const result = await pool.query(`
        INSERT INTO sponsorship_contracts (
          sponsor_id, package_id, number, type, amount,
          start_date, end_date, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        sponsorId, packageId || null, number, type, amount,
        startDate, endDate, status || 'en_negociacion', notes || null
      ]);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error al crear contrato:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Obtener un contrato específico
  apiRouter.get('/sponsorship-contracts/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`
        SELECT 
          sc.*,
          s.name as sponsor_name,
          s.logo_url as sponsor_logo,
          s.contact_person as sponsor_contact,
          s.contact_email as sponsor_email,
          s.contact_phone as sponsor_phone,
          sp.name as package_name,
          sp.tier as package_tier,
          sp.description as package_description
        FROM sponsorship_contracts sc
        LEFT JOIN sponsors s ON sc.sponsor_id = s.id
        LEFT JOIN sponsorship_packages sp ON sc.package_id = sp.id
        WHERE sc.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error al obtener contrato:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Actualizar contrato
  apiRouter.put('/sponsorship-contracts/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        sponsorId,
        packageId,
        number,
        type,
        amount,
        startDate,
        endDate,
        status,
        notes
      } = req.body;

      const result = await pool.query(`
        UPDATE sponsorship_contracts SET
          sponsor_id = $1, package_id = $2, number = $3, type = $4,
          amount = $5, start_date = $6, end_date = $7, status = $8,
          notes = $9
        WHERE id = $10
        RETURNING *
      `, [
        sponsorId, packageId || null, number, type, amount,
        startDate, endDate, status, notes || null, id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error al actualizar contrato:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Eliminar contrato
  apiRouter.delete('/sponsorship-contracts/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM sponsorship_contracts WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }
      
      res.json({ message: 'Contrato eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar contrato:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Obtener contratos por patrocinador
  apiRouter.get('/sponsors/:sponsorId/contracts', async (req: Request, res: Response) => {
    try {
      const { sponsorId } = req.params;
      const result = await pool.query(`
        SELECT 
          sc.*,
          s.name as sponsor_name,
          sp.name as package_name
        FROM sponsorship_contracts sc
        LEFT JOIN sponsors s ON sc.sponsor_id = s.id
        LEFT JOIN sponsorship_packages sp ON sc.package_id = sp.id
        WHERE sc.sponsor_id = $1
        ORDER BY sc.id DESC
      `, [sponsorId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener contratos del patrocinador:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Obtener pagos de un contrato
  apiRouter.get('/sponsorship-contracts/:id/payments', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`
        SELECT * FROM contract_payments 
        WHERE contract_id = $1 
        ORDER BY payment_number
      `, [id]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener pagos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Obtener eventos de un contrato
  apiRouter.get('/sponsorship-contracts/:id/events', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`
        SELECT ce.*, p.name as park_name
        FROM contract_events ce
        LEFT JOIN parks p ON ce.park_id = p.id
        WHERE ce.contract_id = $1 
        ORDER BY ce.event_date
      `, [id]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Obtener activos de un contrato
  apiRouter.get('/sponsorship-contracts/:id/assets', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`
        SELECT ca.*, p.name as park_name
        FROM contract_assets ca
        LEFT JOIN parks p ON ca.park_id = p.id
        WHERE ca.contract_id = $1 
        ORDER BY ca.created_at
      `, [id]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener activos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // ===== EVENTOS PATROCINADOS =====
  
  // Obtener todos los eventos patrocinados - TEMPORALMENTE DESHABILITADO
  apiRouter.get('/sponsor-events', async (req: Request, res: Response) => {
    try {
      // La tabla sponsor_events no existe aún - usando array vacío
      res.json({ data: [] });
    } catch (error) {
      console.error('Error al obtener eventos patrocinados:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Alias para compatibilidad con el frontend - TEMPORALMENTE DESHABILITADO  
  apiRouter.get('/sponsorship-events', async (req: Request, res: Response) => {
    try {
      // La tabla sponsor_events no existe aún - usando array vacío
      res.json({ data: [] });
    } catch (error) {
      console.error('Error al obtener eventos patrocinados:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Crear nuevo evento patrocinado
  apiRouter.post('/sponsor-events', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const {
        sponsorId,
        contractId,
        eventName,
        eventDate,
        eventLocation,
        sponsorshipLevel,
        logoPlacement,
        exposureMinutes,
        standSize,
        activationBudget,
        specialRequirements,
        status = 'pending'
      } = req.body;
      
      const result = await pool.query(`
        INSERT INTO sponsor_events (
          sponsor_id, contract_id, event_name, event_date, event_location,
          sponsorship_level, logo_placement, exposure_minutes, stand_size,
          activation_budget, special_requirements, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        sponsorId, contractId, eventName, eventDate, eventLocation,
        sponsorshipLevel, logoPlacement, exposureMinutes, standSize,
        activationBudget, specialRequirements, status
      ]);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error al crear evento patrocinado:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Actualizar evento patrocinado
  apiRouter.put('/sponsor-events/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        sponsorId,
        contractId,
        eventName,
        eventDate,
        eventLocation,
        sponsorshipLevel,
        logoPlacement,
        exposureMinutes,
        standSize,
        activationBudget,
        specialRequirements,
        status
      } = req.body;
      
      const result = await pool.query(`
        UPDATE sponsor_events SET
          sponsor_id = $1,
          contract_id = $2,
          event_name = $3,
          event_date = $4,
          event_location = $5,
          sponsorship_level = $6,
          logo_placement = $7,
          exposure_minutes = $8,
          stand_size = $9,
          activation_budget = $10,
          special_requirements = $11,
          status = $12,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING *
      `, [
        sponsorId, contractId, eventName, eventDate, eventLocation,
        sponsorshipLevel, logoPlacement, exposureMinutes, standSize,
        activationBudget, specialRequirements, status, id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error al actualizar evento patrocinado:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Eliminar evento patrocinado
  apiRouter.delete('/sponsor-events/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query('DELETE FROM sponsor_events WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      
      res.json({ message: 'Evento eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar evento patrocinado:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Obtener eventos de un patrocinador específico
  apiRouter.get('/sponsors/:sponsorId/events', async (req: Request, res: Response) => {
    try {
      const { sponsorId } = req.params;
      const result = await pool.query(`
        SELECT 
          id,
          sponsor_id as "sponsorId",
          event_name as "eventName",
          event_date as "eventDate",
          event_location as "eventLocation",
          sponsorship_level as "sponsorshipLevel",
          activation_budget as "activationBudget",
          status,
          created_at as "createdAt"
        FROM sponsor_events 
        WHERE sponsor_id = $1
        ORDER BY created_at DESC
      `, [parseInt(sponsorId)]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener eventos del patrocinador:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // ===== MÉTRICAS DE PATROCINIO =====
  
  // Obtener todas las métricas de patrocinio
  apiRouter.get('/sponsorship-metrics', async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT 
          id,
          sponsor_id as "sponsorId",
          event_id as "eventId",
          impressions,
          reach,
          engagement,
          leads_generated as "leadsGenerated",
          conversions,
          brand_mentions as "brandMentions",
          social_media_reach as "socialMediaReach",
          website_clicks as "websiteClicks",
          email_signups as "emailSignups",
          measurement_period as "measurementPeriod",
          report_date as "reportDate",
          roi_percentage as "roiPercentage",
          cost_per_lead as "costPerLead",
          cost_per_conversion as "costPerConversion",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM sponsorship_metrics 
        ORDER BY report_date DESC
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener métricas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Obtener métricas de un patrocinador
  apiRouter.get('/sponsors/:sponsorId/metrics', async (req: Request, res: Response) => {
    try {
      const { sponsorId } = req.params;
      const result = await pool.query(`
        SELECT 
          id,
          sponsor_id as "sponsorId",
          event_id as "eventId",
          impressions,
          reach,
          engagement,
          leads_generated as "leadsGenerated",
          conversions,
          brand_mentions as "brandMentions",
          social_media_reach as "socialMediaReach",
          website_clicks as "websiteClicks",
          email_signups as "emailSignups",
          measurement_period as "measurementPeriod",
          report_date as "reportDate",
          roi_percentage as "roiPercentage",
          cost_per_lead as "costPerLead",
          cost_per_conversion as "costPerConversion",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM sponsorship_metrics 
        WHERE sponsor_id = $1
        ORDER BY report_date DESC
      `, [parseInt(sponsorId)]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener métricas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Crear nuevas métricas
  apiRouter.post('/sponsorship-metrics', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSponsorshipMetricsSchema.parse(req.body);
      
      const [newMetrics] = await db
        .insert(sponsorshipMetrics)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newMetrics);
    } catch (error) {
      console.error('Error al crear métricas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // ===== ACTIVOS PROMOCIONALES =====
  
  // Obtener todos los activos promocionales
  apiRouter.get('/sponsor-assets', async (req: Request, res: Response) => {
    try {
      const assets = await db
        .select()
        .from(sponsorshipAssets)
        .orderBy(desc(sponsorshipAssets.createdAt));
      
      res.json(assets);
    } catch (error) {
      console.error('Error al obtener activos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Obtener activos de un patrocinador
  apiRouter.get('/sponsors/:sponsorId/assets', async (req: Request, res: Response) => {
    try {
      const { sponsorId } = req.params;
      const result = await pool.query(`
        SELECT 
          id,
          sponsor_id as "sponsorId",
          asset_type as "assetType",
          asset_name as "assetName",
          file_url as "fileUrl",
          file_size as "fileSize",
          description,
          created_at as "createdAt"
        FROM sponsorship_assets 
        WHERE sponsor_id = $1
        ORDER BY created_at DESC
      `, [parseInt(sponsorId)]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener activos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Crear nuevo activo
  apiRouter.post('/sponsor-assets', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSponsorshipAssetSchema.parse(req.body);
      
      const [newAsset] = await db
        .insert(sponsorshipAssets)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newAsset);
    } catch (error) {
      console.error('Error al crear activo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Aprobar activo
  apiRouter.patch('/sponsor-assets/:id/approve', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { approvalStatus, approvedBy } = req.body;
      
      const [updatedAsset] = await db
        .update(sponsorshipAssets)
        .set({ 
          approvalStatus,
          approvedBy,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(sponsorshipAssets.id, parseInt(id)))
        .returning();
      
      res.json(updatedAsset);
    } catch (error) {
      console.error('Error al aprobar activo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // ===== EVALUACIONES DE PATROCINIO =====
  
  // Obtener todas las evaluaciones de patrocinio
  apiRouter.get('/sponsorship-evaluations', async (req: Request, res: Response) => {
    try {
      const evaluations = await db
        .select()
        .from(sponsorshipEvaluations)
        .orderBy(desc(sponsorshipEvaluations.createdAt));
      
      res.json(evaluations);
    } catch (error) {
      console.error('Error al obtener evaluaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Obtener evaluaciones de un patrocinador
  apiRouter.get('/sponsors/:sponsorId/evaluations', async (req: Request, res: Response) => {
    try {
      const { sponsorId } = req.params;
      const result = await pool.query(`
        SELECT 
          id,
          sponsor_id as "sponsorId",
          evaluator_name as "evaluatorName",
          evaluator_email as "evaluatorEmail",
          rating,
          feedback,
          evaluation_date as "evaluationDate",
          created_at as "createdAt"
        FROM sponsorship_evaluations 
        WHERE sponsor_id = $1
        ORDER BY evaluation_date DESC
      `, [parseInt(sponsorId)]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener evaluaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Crear nueva evaluación
  apiRouter.post('/sponsorship-evaluations', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSponsorshipEvaluationSchema.parse(req.body);
      
      const [newEvaluation] = await db
        .insert(sponsorshipEvaluations)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newEvaluation);
    } catch (error) {
      console.error('Error al crear evaluación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // ===== RENOVACIONES =====
  
  // Obtener renovaciones pendientes
  apiRouter.get('/sponsorship-renewals', async (req: Request, res: Response) => {
    try {
      const renewals = await db
        .select()
        .from(sponsorshipRenewals)
        .orderBy(desc(sponsorshipRenewals.createdAt));
      
      res.json(renewals);
    } catch (error) {
      console.error('Error al obtener renovaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Crear proceso de renovación
  apiRouter.post('/sponsorship-renewals', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSponsorshipRenewalSchema.parse(req.body);
      
      const [newRenewal] = await db
        .insert(sponsorshipRenewals)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newRenewal);
    } catch (error) {
      console.error('Error al crear renovación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // ===== DASHBOARD Y REPORTES =====
  
  // Dashboard general de patrocinios (versión SQL pura)
  apiRouter.get('/sponsorship-dashboard', async (req: Request, res: Response) => {
    try {
      console.log('📊 Iniciando consulta del dashboard...');
      
      // Usar consultas SQL directas para evitar problemas de esquema
      const totalSponsorsQuery = await pool.query('SELECT COUNT(*) as count FROM sponsors');
      const totalSponsors = parseInt(totalSponsorsQuery.rows[0].count);
      console.log('✅ Total sponsors:', totalSponsors);
      
      const activeContractsQuery = await pool.query("SELECT COUNT(*) as count FROM sponsorship_contracts WHERE status = 'active'");
      const activeContracts = parseInt(activeContractsQuery.rows[0].count);
      console.log('✅ Active contracts:', activeContracts);
      
      const totalRevenueQuery = await pool.query('SELECT SUM(CAST(total_amount AS DECIMAL)) as total FROM sponsorship_contracts');
      const totalRevenue = parseFloat(totalRevenueQuery.rows[0].total || '0');
      console.log('✅ Total revenue:', totalRevenue);
      
      const avgSatisfactionQuery = await pool.query('SELECT AVG(rating) as avg FROM sponsorship_evaluations');
      const avgSatisfaction = parseFloat(avgSatisfactionQuery.rows[0].avg || '0');
      console.log('✅ Average satisfaction:', avgSatisfaction);
      
      const dashboardData = {
        totalSponsors,
        activeContracts,
        totalRevenue,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10
      };
      
      console.log('📊 Dashboard data:', dashboardData);
      res.json(dashboardData);
    } catch (error) {
      console.error('❌ Error al obtener dashboard:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Reporte de ROI por patrocinador
  apiRouter.get('/sponsors/:sponsorId/roi-report', async (req: Request, res: Response) => {
    try {
      const { sponsorId } = req.params;
      
      // Obtener datos del patrocinador, métricas y evaluaciones
      const [sponsor] = await db
        .select()
        .from(sponsors)
        .where(eq(sponsors.id, parseInt(sponsorId)))
        .limit(1);
      
      if (!sponsor) {
        return res.status(404).json({ error: 'Patrocinador no encontrado' });
      }
      
      const [metrics, evaluations, events] = await Promise.all([
        db.select().from(sponsorshipMetrics).where(eq(sponsorshipMetrics.sponsorId, parseInt(sponsorId))),
        db.select().from(sponsorshipEvaluations).where(eq(sponsorshipEvaluations.sponsorId, parseInt(sponsorId))),
        db.select().from(sponsorshipEvents).where(eq(sponsorshipEvents.sponsorId, parseInt(sponsorId)))
      ]);
      
      // Calcular ROI (usando un campo existente o 0 por defecto)
      const totalInvestment = 0; // TODO: Implementar cálculo basado en contratos reales
      const totalLeads = metrics.reduce((sum, m) => sum + (m.leadsGenerated || 0), 0);
      const totalConversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0);
      const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
      const avgSatisfaction = evaluations.length > 0 
        ? evaluations.reduce((sum, evaluation) => sum + (evaluation.overallSatisfaction || 0), 0) / evaluations.length 
        : 0;
      
      res.json({
        sponsor,
        metrics: {
          totalInvestment,
          totalLeads,
          totalConversions,
          totalImpressions,
          avgSatisfaction,
          eventsCount: events.length,
          conversionRate: totalLeads > 0 ? (totalConversions / totalLeads * 100).toFixed(2) : 0,
          costPerLead: totalLeads > 0 ? (totalInvestment / totalLeads).toFixed(2) : 0,
          costPerConversion: totalConversions > 0 ? (totalInvestment / totalConversions).toFixed(2) : 0
        },
        detailedMetrics: metrics,
        evaluations
      });
    } catch (error) {
      console.error('Error al generar reporte ROI:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  // ===== VINCULACIÓN DE EVENTOS CON CONTRATOS =====
  
  // Obtener eventos vinculados a contratos de patrocinio
  apiRouter.get('/sponsorship-events-links', async (req: Request, res: Response) => {
    try {
      const linkedEvents = await db
        .select({
          id: sponsorshipEventsLinks.id,
          contractId: sponsorshipEventsLinks.contractId,
          eventId: sponsorshipEventsLinks.eventId,
          visibility: sponsorshipEventsLinks.visibility,
          createdAt: sponsorshipEventsLinks.createdAt,
          updatedAt: sponsorshipEventsLinks.updatedAt,
          // Event data
          eventTitle: events.title,
          eventDescription: events.description,
          eventStartDate: events.startDate,
          eventEndDate: events.endDate,
          eventLocation: events.location,
          // Contract data
          contractNumber: sponsorshipContracts.number,
          sponsorName: sponsors.name
        })
        .from(sponsorshipEventsLinks)
        .leftJoin(events, eq(sponsorshipEventsLinks.eventId, events.id))
        .leftJoin(sponsorshipContracts, eq(sponsorshipEventsLinks.contractId, sponsorshipContracts.id))
        .leftJoin(sponsors, eq(sponsorshipContracts.sponsorId, sponsors.id))
        .orderBy(desc(sponsorshipEventsLinks.createdAt));

      const formattedEvents = linkedEvents.map(row => ({
        id: row.id,
        contractId: row.contractId,
        eventId: row.eventId,
        visibility: row.visibility,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        event: {
          id: row.eventId,
          title: row.eventTitle,
          description: row.eventDescription,
          startDate: row.eventStartDate,
          endDate: row.eventEndDate,
          location: row.eventLocation
        },
        contract: {
          id: row.contractId,
          number: row.contractNumber,
          sponsorName: row.sponsorName
        }
      }));
      
      res.json({ data: formattedEvents });
    } catch (error) {
      console.error('Error al obtener eventos vinculados:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Vincular evento existente con contrato de patrocinio
  apiRouter.post('/sponsorship-events-links', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('🔍 [DEBUG] Raw request body:', req.body);
      
      // Validate input data with Zod schema
      const validatedData = insertSponsorshipEventLinkSchema.parse(req.body);
      console.log('✅ [DEBUG] Validated data:', validatedData);
      
      const { contractId, eventId, visibility } = validatedData;
      
      // Verify contract exists and is active
      const contract = await db
        .select()
        .from(sponsorshipContracts)
        .where(eq(sponsorshipContracts.id, contractId))
        .limit(1);
      
      if (contract.length === 0) {
        return res.status(404).json({ error: 'Contrato de patrocinio no encontrado' });
      }
      
      // Verify event exists
      const event = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);
      
      if (event.length === 0) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      
      // Check if the link already exists
      const existingLink = await db
        .select()
        .from(sponsorshipEventsLinks)
        .where(and(
          eq(sponsorshipEventsLinks.contractId, contractId),
          eq(sponsorshipEventsLinks.eventId, eventId)
        ))
        .limit(1);
      
      if (existingLink.length > 0) {
        return res.status(409).json({ 
          error: 'Este evento ya está vinculado con este contrato',
          details: 'Un evento solo puede estar vinculado una vez al mismo contrato' 
        });
      }
      
      // Create the link
      const [newLink] = await db
        .insert(sponsorshipEventsLinks)
        .values(validatedData)
        .returning();
      
      res.status(201).json({ data: newLink });
    } catch (error) {
      console.error('Error al vincular evento:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos de entrada inválidos', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Actualizar vinculación de evento
  apiRouter.put('/sponsorship-events-links/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { visibility } = req.body;
      
      // Validate visibility value
      if (!visibility || typeof visibility !== 'string') {
        return res.status(400).json({ error: 'El campo visibility es requerido y debe ser una cadena de texto' });
      }
      
      const [updatedLink] = await db
        .update(sponsorshipEventsLinks)
        .set({ 
          visibility, 
          updatedAt: new Date() 
        })
        .where(eq(sponsorshipEventsLinks.id, parseInt(id)))
        .returning();
      
      if (!updatedLink) {
        return res.status(404).json({ error: 'Vinculación no encontrada' });
      }
      
      res.json({ data: updatedLink });
    } catch (error) {
      console.error('Error al actualizar vinculación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Desvincular evento del contrato
  apiRouter.delete('/sponsorship-events-links/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [deletedLink] = await db
        .delete(sponsorshipEventsLinks)
        .where(eq(sponsorshipEventsLinks.id, parseInt(id)))
        .returning();
      
      if (!deletedLink) {
        return res.status(404).json({ error: 'Vinculación no encontrada' });
      }
      
      res.json({ message: 'Evento desvinculado exitosamente' });
    } catch (error) {
      console.error('Error al desvincular evento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // ===== VINCULACIÓN DE ACTIVOS FÍSICOS CON CONTRATOS =====
  
  // Obtener todas las vinculaciones de activos con contratos
  apiRouter.get('/sponsorship-assets', async (req: Request, res: Response) => {
    try {
      const linksResult = await db
        .select({
          id: sponsorshipAssets.id,
          contractId: sponsorshipAssets.contractId,
          assetId: sponsorshipAssets.assetId,
          branding: sponsorshipAssets.branding,
          createdAt: sponsorshipAssets.createdAt,
          updatedAt: sponsorshipAssets.updatedAt,
          // Info del contrato
          contractStatus: sponsorshipContracts.status,
          sponsorName: sponsors.name,
          sponsorTier: sponsors.tier,
          // Info del activo
          assetName: assets.name,
          assetCategory: assets.categoryId,
          assetParkId: assets.parkId
        })
        .from(sponsorshipAssets)
        .leftJoin(sponsorshipContracts, eq(sponsorshipAssets.contractId, sponsorshipContracts.id))
        .leftJoin(sponsors, eq(sponsorshipContracts.sponsorId, sponsors.id))
        .leftJoin(assets, eq(sponsorshipAssets.assetId, assets.id))
        .orderBy(desc(sponsorshipAssets.createdAt));

      res.json({ data: linksResult });
    } catch (error) {
      console.error('Error al obtener vinculaciones de activos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Obtener activos vinculados a un contrato específico
  apiRouter.get('/sponsorship-contracts/:id/linked-assets', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const linkedAssets = await db
        .select({
          id: sponsorshipAssets.id,
          contractId: sponsorshipAssets.contractId,
          assetId: sponsorshipAssets.assetId,
          branding: sponsorshipAssets.branding,
          createdAt: sponsorshipAssets.createdAt,
          // Info del activo
          assetName: assets.name,
          assetDescription: assets.description,
          assetSerialNumber: assets.serialNumber,
          assetLocation: assets.locationDescription,
          assetParkId: assets.parkId
        })
        .from(sponsorshipAssets)
        .leftJoin(assets, eq(sponsorshipAssets.assetId, assets.id))
        .where(eq(sponsorshipAssets.contractId, parseInt(id)))
        .orderBy(desc(sponsorshipAssets.createdAt));

      res.json({ data: linkedAssets });
    } catch (error) {
      console.error('Error al obtener activos del contrato:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Obtener activos físicos disponibles para patrocinio
  apiRouter.get('/assets/available-for-sponsorship', async (req: Request, res: Response) => {
    try {
      const { contractId } = req.query;
      
      let availableAssets;
      
      if (contractId) {
        // Obtener activos no vinculados a este contrato específico
        const linkedAssetIds = await db
          .select({ assetId: sponsorshipAssets.assetId })
          .from(sponsorshipAssets)
          .where(eq(sponsorshipAssets.contractId, parseInt(contractId as string)));
        
        const linkedIds = linkedAssetIds.map(item => item.assetId);
        
        if (linkedIds.length > 0) {
          availableAssets = await db
            .select({
              id: assets.id,
              name: assets.name,
              description: assets.description,
              serialNumber: assets.serialNumber,
              categoryId: assets.categoryId,
              parkId: assets.parkId,
              locationDescription: assets.locationDescription,
              status: assets.status
            })
            .from(assets)
            .where(notInArray(assets.id, linkedIds))
            .orderBy(assets.name);
        } else {
          availableAssets = await db
            .select({
              id: assets.id,
              name: assets.name,
              description: assets.description,
              serialNumber: assets.serialNumber,
              categoryId: assets.categoryId,
              parkId: assets.parkId,
              locationDescription: assets.locationDescription,
              status: assets.status
            })
            .from(assets)
            .orderBy(assets.name);
        }
      } else {
        // Obtener todos los activos físicos
        availableAssets = await db
          .select({
            id: assets.id,
            name: assets.name,
            description: assets.description,
            serialNumber: assets.serialNumber,
            categoryId: assets.categoryId,
            parkId: assets.parkId,
            locationDescription: assets.locationDescription,
            status: assets.status
          })
          .from(assets)
          .orderBy(assets.name);
      }

      res.json({ data: availableAssets });
    } catch (error) {
      console.error('Error al obtener activos disponibles:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Crear nueva vinculación activo-contrato
  apiRouter.post('/sponsorship-assets', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSponsorshipAssetSchema.parse(req.body);
      
      // Verificar que el contrato existe y está activo
      const contractExists = await db
        .select({ id: sponsorshipContracts.id, status: sponsorshipContracts.status })
        .from(sponsorshipContracts)
        .where(eq(sponsorshipContracts.id, validatedData.contractId))
        .limit(1);
      
      if (contractExists.length === 0) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }
      
      if (contractExists[0].status !== 'active') {
        return res.status(400).json({ error: 'Solo se pueden vincular activos a contratos activos' });
      }

      // Verificar que el activo existe
      const assetExists = await db
        .select({ id: assets.id })
        .from(assets)
        .where(eq(assets.id, validatedData.assetId))
        .limit(1);
      
      if (assetExists.length === 0) {
        return res.status(404).json({ error: 'Activo no encontrado' });
      }

      // Verificar que no existe ya una vinculación entre este contrato y activo
      const existingLink = await db
        .select({ id: sponsorshipAssets.id })
        .from(sponsorshipAssets)
        .where(and(
          eq(sponsorshipAssets.contractId, validatedData.contractId),
          eq(sponsorshipAssets.assetId, validatedData.assetId)
        ))
        .limit(1);
      
      if (existingLink.length > 0) {
        return res.status(409).json({ error: 'Este activo ya está vinculado a este contrato' });
      }

      // Crear la vinculación
      const [newLink] = await db
        .insert(sponsorshipAssets)
        .values({
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.status(201).json({ data: newLink });
    } catch (error) {
      console.error('Error al crear vinculación activo-contrato:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Actualizar vinculación activo-contrato
  apiRouter.put('/sponsorship-assets/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertSponsorshipAssetSchema.parse(req.body);
      
      const [updatedLink] = await db
        .update(sponsorshipAssets)
        .set({ 
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(sponsorshipAssets.id, parseInt(id)))
        .returning();
      
      if (!updatedLink) {
        return res.status(404).json({ error: 'Vinculación no encontrada' });
      }
      
      res.json({ data: updatedLink });
    } catch (error) {
      console.error('Error al actualizar vinculación activo-contrato:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Eliminar vinculación activo-contrato
  apiRouter.delete('/sponsorship-assets/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [deletedLink] = await db
        .delete(sponsorshipAssets)
        .where(eq(sponsorshipAssets.id, parseInt(id)))
        .returning();
      
      if (!deletedLink) {
        return res.status(404).json({ error: 'Vinculación no encontrada' });
      }
      
      res.json({ message: 'Vinculación eliminada exitosamente' });
    } catch (error) {
      console.error('Error al eliminar vinculación activo-contrato:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  console.log('✅ Rutas de patrocinios registradas correctamente');
}