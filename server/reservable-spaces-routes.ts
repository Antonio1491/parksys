import { Express } from "express";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { db } from "./db";
import { reservableSpaces, spaceReservations, parks, spaceImages, spaceDocuments, spaceAvailability } from "../shared/schema";
import { insertSpaceImageSchema, insertSpaceDocumentSchema } from "../shared/schema";
import { ObjectStorageService } from "./objectStorage";
import { replitObjectStorage } from "./objectStorage-replit";
import multer from "multer";
import path from "path";

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    const uploadsDir = isProduction ? 'public/uploads/spaces' : 'uploads/spaces';
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

export function registerReservableSpacesRoutes(app: Express) {
  
  // Obtener todos los espacios reservables con información del parque
  app.get("/api/reservable-spaces", async (req, res) => {
    try {
      const spaces = await db
        .select({
          id: reservableSpaces.id,
          name: reservableSpaces.name,
          description: reservableSpaces.description,
          spaceType: reservableSpaces.spaceType,
          capacity: reservableSpaces.capacity,
          hourlyRate: reservableSpaces.hourlyRate,
          minimumHours: reservableSpaces.minimumHours,
          maximumHours: reservableSpaces.maximumHours,
          amenities: reservableSpaces.amenities,
          rules: reservableSpaces.rules,
          isActive: reservableSpaces.isActive,
          requiresApproval: reservableSpaces.requiresApproval,
          advanceBookingDays: reservableSpaces.advanceBookingDays,
          coordinates: reservableSpaces.coordinates,
          parkId: reservableSpaces.parkId,
          parkName: parks.name,
          createdAt: reservableSpaces.createdAt,
          updatedAt: reservableSpaces.updatedAt
        })
        .from(reservableSpaces)
        .leftJoin(parks, eq(reservableSpaces.parkId, parks.id))
        .where(eq(reservableSpaces.isActive, true))
        .orderBy(reservableSpaces.name);

      // Obtener imágenes para cada espacio
      const spacesWithImages = await Promise.all(spaces.map(async (space) => {
        const images = await db
          .select({
            imageUrl: spaceImages.imageUrl,
            isPrimary: spaceImages.isPrimary
          })
          .from(spaceImages)
          .where(eq(spaceImages.spaceId, space.id))
          .orderBy(desc(spaceImages.isPrimary));

        console.log(`🖼️ Espacio ${space.name} (ID: ${space.id}) tiene ${images.length} imágenes:`, images.map(img => img.imageUrl));

        // Formar URLs completas para las imágenes y string separado por comas con normalización
        const imageUrls = images.map(img => {
          return replitObjectStorage.normalizeUrl(img.imageUrl);
        }).join(',');
        
        return {
          ...space,
          images: imageUrls.length > 0 ? imageUrls : null
        };
      }));

      console.log(`🎪 Encontrados ${spacesWithImages.length} espacios reservables`);
      res.json(spacesWithImages);
    } catch (error) {
      console.error("Error al obtener espacios reservables:", error);
      res.status(500).json({ error: "Error al obtener espacios reservables" });
    }
  });

  // Obtener un espacio reservable específico (dos rutas para compatibilidad)
  const getSpaceById = async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      const space = await db
        .select({
          id: reservableSpaces.id,
          name: reservableSpaces.name,
          description: reservableSpaces.description,
          spaceType: reservableSpaces.spaceType,
          capacity: reservableSpaces.capacity,
          hourlyRate: reservableSpaces.hourlyRate,
          minimumHours: reservableSpaces.minimumHours,
          maximumHours: reservableSpaces.maximumHours,
          amenities: reservableSpaces.amenities,
          rules: reservableSpaces.rules,
          isActive: reservableSpaces.isActive,
          requiresApproval: reservableSpaces.requiresApproval,
          advanceBookingDays: reservableSpaces.advanceBookingDays,
          coordinates: reservableSpaces.coordinates,
          parkId: reservableSpaces.parkId,
          parkName: parks.name,
          createdAt: reservableSpaces.createdAt,
          updatedAt: reservableSpaces.updatedAt
        })
        .from(reservableSpaces)
        .leftJoin(parks, eq(reservableSpaces.parkId, parks.id))
        .where(eq(reservableSpaces.id, parseInt(id)))
        .limit(1);

      if (space.length === 0) {
        return res.status(404).json({ error: "Espacio no encontrado" });
      }

      // Obtener imágenes del espacio
      const images = await db
        .select({
          imageUrl: spaceImages.imageUrl,
          isPrimary: spaceImages.isPrimary
        })
        .from(spaceImages)
        .where(eq(spaceImages.spaceId, parseInt(id)))
        .orderBy(desc(spaceImages.isPrimary));

      console.log(`🖼️ Imágenes encontradas para espacio ${id}:`, images);

      // Formar URLs completas para las imágenes y string separado por comas con normalización automática
      const imageUrls = images.map(img => {
        return replitObjectStorage.normalizeUrl(img.imageUrl);
      }).join(',');
      
      const spaceWithImages = {
        ...space[0],
        images: imageUrls.length > 0 ? imageUrls : null,
        imageUrls: images.length > 0 ? images.map(img => replitObjectStorage.normalizeUrl(img.imageUrl)) : null // Array de URLs normalizadas para compatibilidad
      };

      console.log(`🏛️ Espacio encontrado: ${spaceWithImages.name}`);
      res.json(spaceWithImages);
    } catch (error) {
      console.error("Error al obtener detalles del espacio:", error);
      res.status(500).json({ error: "Error al obtener detalles del espacio" });
    }
  };

  // Registrar ambas rutas para compatibilidad
  app.get("/api/reservable-spaces/:id", getSpaceById);
  app.get("/api/spaces/:id", getSpaceById);

  // Obtener reservas existentes para un espacio específico
  app.get("/api/space-reservations/space/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const reservations = await db
        .select()
        .from(spaceReservations)
        .where(eq(spaceReservations.spaceId, parseInt(id)))
        .orderBy(desc(spaceReservations.createdAt));

      console.log(`📅 Encontradas ${reservations.length} reservas para espacio ${id}`);
      res.json(reservations);
    } catch (error) {
      console.error("Error al obtener reservas del espacio:", error);
      res.status(500).json({ error: "Error al obtener reservas del espacio" });
    }
  });

  // Obtener estadísticas generales de reservas
  app.get("/api/space-reservations/stats", async (req, res) => {
    try {
      const stats = await db
        .select({
          totalReservations: count(),
          confirmedReservations: sql<number>`SUM(CASE WHEN ${spaceReservations.status} = 'confirmed' THEN 1 ELSE 0 END)`,
          pendingReservations: sql<number>`SUM(CASE WHEN ${spaceReservations.status} = 'pending' THEN 1 ELSE 0 END)`,
          cancelledReservations: sql<number>`SUM(CASE WHEN ${spaceReservations.status} = 'cancelled' THEN 1 ELSE 0 END)`
        })
        .from(spaceReservations);

      const result = stats.length > 0 ? stats[0] : {
        totalReservations: 0,
        confirmedReservations: 0,
        pendingReservations: 0,
        cancelledReservations: 0
      };

      console.log(`📊 Estadísticas generales de reservas:`, result);
      res.json(result);
    } catch (error) {
      console.error("Error al obtener estadísticas generales:", error);
      res.status(500).json({ error: "Error al obtener estadísticas generales" });
    }
  });

  // Obtener estadísticas de reservas para un espacio específico
  app.get("/api/space-reservations/stats/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const stats = await db
        .select({
          totalReservations: count(),
          confirmedReservations: sql<number>`SUM(CASE WHEN ${spaceReservations.status} = 'confirmed' THEN 1 ELSE 0 END)`,
          pendingReservations: sql<number>`SUM(CASE WHEN ${spaceReservations.status} = 'pending' THEN 1 ELSE 0 END)`,
          cancelledReservations: sql<number>`SUM(CASE WHEN ${spaceReservations.status} = 'cancelled' THEN 1 ELSE 0 END)`
        })
        .from(spaceReservations)
        .where(eq(spaceReservations.spaceId, parseInt(id)))
        .groupBy(spaceReservations.spaceId);

      const result = stats.length > 0 ? stats[0] : {
        totalReservations: 0,
        confirmedReservations: 0,
        pendingReservations: 0,
        cancelledReservations: 0
      };

      console.log(`📊 Estadísticas para espacio ${id}:`, result);
      res.json(result);
    } catch (error) {
      console.error("Error al obtener estadísticas del espacio:", error);
      res.status(500).json({ error: "Error al obtener estadísticas del espacio" });
    }
  });

  // Crear una nueva reserva de espacio
  app.post("/api/space-reservations/spaces/:id/reserve", async (req, res) => {
    try {
      const { id } = req.params;
      const {
        customerName,
        customerEmail,
        customerPhone,
        reservationDate,
        startTime,
        endTime,
        specialRequests
      } = req.body;

      // Validar campos requeridos
      if (!customerName || !customerEmail || !customerPhone || !reservationDate || !startTime || !endTime) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }

      // Obtener información del espacio
      const space = await db
        .select()
        .from(reservableSpaces)
        .where(eq(reservableSpaces.id, parseInt(id)))
        .limit(1);

      if (space.length === 0) {
        return res.status(404).json({ error: "Espacio no encontrado" });
      }

      // Calcular duración y costo
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      const totalHours = endHour - startHour;
      const hourlyRate = parseFloat(space[0].hourlyRate || '0');
      const totalCost = totalHours * hourlyRate;

      // Validar disponibilidad del horario
      const existingReservations = await db
        .select()
        .from(spaceReservations)
        .where(
          and(
            eq(spaceReservations.spaceId, parseInt(id)),
            eq(spaceReservations.reservationDate, reservationDate),
            sql`${spaceReservations.status} != 'cancelled'`
          )
        );

      const isTimeSlotAvailable = !existingReservations.some(reservation => 
        (startTime >= reservation.startTime && startTime < reservation.endTime) ||
        (endTime > reservation.startTime && endTime <= reservation.endTime) ||
        (startTime <= reservation.startTime && endTime >= reservation.endTime)
      );

      if (!isTimeSlotAvailable) {
        return res.status(400).json({ error: "El horario seleccionado no está disponible" });
      }

      // Crear la reserva - usando el esquema correcto de la base de datos
      const newReservation = await db
        .insert(spaceReservations)
        .values({
          spaceId: parseInt(id),
          reservedBy: 1, // TODO: usar usuario autenticado cuando esté disponible
          contactName: customerName,
          contactEmail: customerEmail,
          contactPhone: customerPhone,
          reservationDate,
          startTime,
          endTime,
          expectedAttendees: null,
          purpose: specialRequests || 'Reserva general de espacio',
          specialRequests: specialRequests || null,
          totalCost: totalCost.toString(),
          depositPaid: "0.00",
          status: space[0].requiresApproval ? 'pending' : 'confirmed'
        })
        .returning();

      console.log(`✅ Reserva creada para espacio ${space[0].name}: ${customerName} (${reservationDate} ${startTime}-${endTime})`);

      // TODO: Enviar email de confirmación
      // await sendSpaceReservationConfirmationEmail(newReservation[0], space[0]);

      res.status(201).json({
        success: true,
        reservation: newReservation[0],
        message: space[0].requiresApproval 
          ? "Reserva creada exitosamente. Está pendiente de aprobación."
          : "Reserva confirmada exitosamente."
      });

    } catch (error) {
      console.error("Error al crear reserva:", error);
      res.status(500).json({ error: "Error al crear la reserva" });
    }
  });

  // Crear un nuevo espacio reservable
  app.post("/api/reservable-spaces", async (req, res) => {
    try {
      const {
        name,
        description,
        parkId,
        spaceType,
        capacity,
        hourlyRate,
        minimumHours,
        maximumHours,
        amenities,
        rules,
        isActive,
        requiresApproval,
        advanceBookingDays,
        coordinates
      } = req.body;

      // Validar campos requeridos
      if (!name || !parkId || !spaceType) {
        return res.status(400).json({ error: "Nombre, parque y tipo de espacio son requeridos" });
      }

      // Validar que el parque existe
      const park = await db
        .select()
        .from(parks)
        .where(eq(parks.id, parseInt(parkId)))
        .limit(1);

      if (park.length === 0) {
        return res.status(404).json({ error: "Parque no encontrado" });
      }

      // Crear el espacio
      const newSpace = await db
        .insert(reservableSpaces)
        .values({
          name,
          description: description || null,
          parkId: parseInt(parkId),
          spaceType,
          capacity: capacity ? parseInt(capacity) : null,
          hourlyRate: hourlyRate || "0.00",
          minimumHours: minimumHours ? parseInt(minimumHours) : 1,
          maximumHours: maximumHours ? parseInt(maximumHours) : 8,
          amenities: amenities || null,
          rules: rules || null,
          isActive: isActive !== false, // Default true
          requiresApproval: requiresApproval === true, // Default false
          advanceBookingDays: advanceBookingDays ? parseInt(advanceBookingDays) : 7,
          coordinates: coordinates || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log(`✅ Nuevo espacio reservable creado: ${newSpace[0].name} en ${park[0].name}`);

      res.status(201).json({
        success: true,
        space: newSpace[0],
        message: "Espacio reservable creado exitosamente"
      });

    } catch (error) {
      console.error("Error al crear espacio reservable:", error);
      res.status(500).json({ error: "Error al crear el espacio reservable" });
    }
  });

  // Actualizar un espacio reservable
  app.put("/api/reservable-spaces/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log(`🔧 Actualizando espacio ${id} con datos:`, updateData);

      // Validar que el espacio existe
      const existingSpace = await db
        .select()
        .from(reservableSpaces)
        .where(eq(reservableSpaces.id, parseInt(id)))
        .limit(1);

      if (existingSpace.length === 0) {
        return res.status(404).json({ error: "Espacio no encontrado" });
      }

      // Actualizar el espacio
      const updatedSpace = await db
        .update(reservableSpaces)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(reservableSpaces.id, parseInt(id)))
        .returning();

      console.log(`✅ Espacio ${id} actualizado exitosamente`);

      res.json({
        success: true,
        space: updatedSpace[0],
        message: "Espacio actualizado exitosamente"
      });

    } catch (error) {
      console.error("Error al actualizar espacio:", error);
      res.status(500).json({ error: "Error al actualizar el espacio" });
    }
  });

  // Ruta para subir imagen directamente (temporal para solucionar problemas de Object Storage)
  app.post("/api/spaces/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se subió ningún archivo" });
      }

      const fileUrl = `/uploads/spaces/${req.file.filename}`;
      console.log(`✅ Archivo subido localmente: ${fileUrl}`);
      
      // Simular la respuesta esperada por Uppy
      res.json({ 
        uploadURL: `${req.protocol}://${req.get('host')}${fileUrl}`,
        filename: req.file.filename,
        originalname: req.file.originalname
      });
    } catch (error) {
      console.error("Error al subir archivo:", error);
      res.status(500).json({ error: "Error al subir el archivo" });
    }
  });

  // Ruta para guardar imagen después de la subida
  app.post("/api/spaces/:id/images", async (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrl, caption, isPrimary } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl es requerido" });
      }

      // Usar la URL tal como viene (ya es una URL local válida)
      const finalImageUrl = imageUrl;
      console.log(`✅ Imagen procesada correctamente: ${finalImageUrl}`);

      // Si es imagen principal, quitar la marca de las demás
      if (isPrimary) {
        await db
          .update(spaceImages)
          .set({ isPrimary: false })
          .where(eq(spaceImages.spaceId, parseInt(id)));
      }

      const newImage = await db
        .insert(spaceImages)
        .values({
          spaceId: parseInt(id),
          imageUrl: finalImageUrl,
          caption: caption || null,
          isPrimary: isPrimary || false,
        })
        .returning();

      console.log(`✅ Imagen guardada para espacio ${id}: ${finalImageUrl}`);

      res.json({
        success: true,
        image: newImage[0],
        message: "Imagen guardada exitosamente"
      });

    } catch (error) {
      console.error("Error al guardar imagen:", error);
      res.status(500).json({ error: "Error al guardar la imagen" });
    }
  });

  // Ruta para guardar documento después de la subida
  app.post("/api/spaces/:id/documents", async (req, res) => {
    try {
      const { id } = req.params;
      const { documentUrl, title, description, fileSize } = req.body;

      if (!documentUrl || !title) {
        return res.status(400).json({ error: "documentUrl y title son requeridos" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(documentUrl);

      const newDocument = await db
        .insert(spaceDocuments)
        .values({
          spaceId: parseInt(id),
          documentUrl: normalizedPath,
          title,
          description: description || null,
          fileSize: fileSize || null,
        })
        .returning();

      res.json({
        success: true,
        document: newDocument[0],
        message: "Documento guardado exitosamente"
      });

    } catch (error) {
      console.error("Error al guardar documento:", error);
      res.status(500).json({ error: "Error al guardar el documento" });
    }
  });

  // Ruta para obtener imágenes de un espacio
  app.get("/api/spaces/:id/images", async (req, res) => {
    try {
      const { id } = req.params;
      
      const images = await db
        .select()
        .from(spaceImages)
        .where(eq(spaceImages.spaceId, parseInt(id)))
        .orderBy(desc(spaceImages.isPrimary), desc(spaceImages.createdAt));

      res.json(images);
    } catch (error) {
      console.error("Error al obtener imágenes:", error);
      res.status(500).json({ error: "Error al obtener las imágenes" });
    }
  });

  // Ruta para obtener documentos de un espacio
  app.get("/api/spaces/:id/documents", async (req, res) => {
    try {
      const { id } = req.params;
      
      const documents = await db
        .select()
        .from(spaceDocuments)
        .where(eq(spaceDocuments.spaceId, parseInt(id)))
        .orderBy(desc(spaceDocuments.createdAt));

      res.json(documents);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
      res.status(500).json({ error: "Error al obtener los documentos" });
    }
  });

  // Ruta para eliminar una imagen
  app.delete("/api/spaces/images/:imageId", async (req, res) => {
    try {
      const { imageId } = req.params;
      
      await db
        .delete(spaceImages)
        .where(eq(spaceImages.id, parseInt(imageId)));

      res.json({
        success: true,
        message: "Imagen eliminada exitosamente"
      });
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
      res.status(500).json({ error: "Error al eliminar la imagen" });
    }
  });

  // Ruta para eliminar un documento
  app.delete("/api/spaces/documents/:documentId", async (req, res) => {
    try {
      const { documentId } = req.params;
      
      await db
        .delete(spaceDocuments)
        .where(eq(spaceDocuments.id, parseInt(documentId)));

      res.json({
        success: true,
        message: "Documento eliminado exitosamente"
      });
    } catch (error) {
      console.error("Error al eliminar documento:", error);
      res.status(500).json({ error: "Error al eliminar el documento" });
    }
  });

  // Ruta para eliminar un espacio reservable
  app.delete("/api/reservable-spaces/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const force = req.query.force === 'true';
      
      // Verificar que el espacio existe
      const existingSpace = await db
        .select()
        .from(reservableSpaces)
        .where(eq(reservableSpaces.id, parseInt(id)))
        .limit(1);

      if (existingSpace.length === 0) {
        return res.status(404).json({ error: "Espacio no encontrado" });
      }

      // Verificar si hay reservas activas para este espacio
      const activeReservations = await db
        .select()
        .from(spaceReservations)
        .where(
          and(
            eq(spaceReservations.spaceId, parseInt(id)),
            sql`${spaceReservations.status} != 'cancelled'`
          )
        );

      if (activeReservations.length > 0 && !force) {
        return res.status(400).json({ 
          error: "No se puede eliminar el espacio porque tiene reservas activas",
          hasActiveReservations: true,
          activeReservationsCount: activeReservations.length
        });
      }

      // Eliminar disponibilidad asociada primero
      await db
        .delete(spaceAvailability)
        .where(eq(spaceAvailability.spaceId, parseInt(id)));

      // Eliminar imágenes asociadas
      await db
        .delete(spaceImages)
        .where(eq(spaceImages.spaceId, parseInt(id)));

      // Eliminar documentos asociados
      await db
        .delete(spaceDocuments)
        .where(eq(spaceDocuments.spaceId, parseInt(id)));

      // Eliminar todas las reservas (histórico)
      await db
        .delete(spaceReservations)
        .where(eq(spaceReservations.spaceId, parseInt(id)));

      // Finalmente eliminar el espacio
      await db
        .delete(reservableSpaces)
        .where(eq(reservableSpaces.id, parseInt(id)));

      console.log(`🗑️ Espacio reservable ${existingSpace[0].name} (ID: ${id}) eliminado exitosamente`);

      res.json({
        success: true,
        message: "Espacio eliminado exitosamente"
      });

    } catch (error) {
      console.error("Error al eliminar espacio:", error);
      res.status(500).json({ error: "Error al eliminar el espacio" });
    }
  });

  // Rutas para object storage uploads
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Error al obtener URL de subida" });
    }
  });

  // Ruta duplicada eliminada - ya existe arriba con corrección automática

  // Ruta para agregar documento a espacio después de upload
  app.post("/api/spaces/:id/documents", async (req, res) => {
    try {
      const { id } = req.params;
      const { documentUrl, title, description, fileSize } = req.body;

      if (!documentUrl) {
        return res.status(400).json({ error: "URL de documento es requerida" });
      }

      if (!title) {
        return res.status(400).json({ error: "Título es requerido" });
      }

      const result = await db
        .insert(spaceDocuments)
        .values({
          spaceId: parseInt(id),
          documentUrl,
          title,
          description: description || null,
          fileSize: fileSize || null
        })
        .returning();

      res.json({ 
        success: true, 
        message: "Documento agregado exitosamente",
        document: result[0]
      });
    } catch (error) {
      console.error("Error al agregar documento:", error);
      res.status(500).json({ error: "Error al agregar el documento" });
    }
  });

  // Ruta para eliminar una reserva específica
  app.delete("/api/space-reservations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que la reserva existe
      const existingReservation = await db
        .select()
        .from(spaceReservations)
        .where(eq(spaceReservations.id, parseInt(id)))
        .limit(1);

      if (existingReservation.length === 0) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      const reservation = existingReservation[0];

      // Eliminar la reserva
      await db
        .delete(spaceReservations)
        .where(eq(spaceReservations.id, parseInt(id)));

      console.log(`🗑️ Reserva ${reservation.id} para ${reservation.customerName} eliminada exitosamente`);

      res.json({
        success: true,
        message: "Reserva eliminada exitosamente"
      });

    } catch (error) {
      console.error("Error al eliminar reserva:", error);
      res.status(500).json({ error: "Error al eliminar la reserva" });
    }
  });
}