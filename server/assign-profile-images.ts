import { db } from "./db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import fs from 'fs';
import path from 'path';

/**
 * Script para asignar imágenes de perfil a los usuarios
 * 
 * Asigna imágenes aleatorias a los usuarios que no tienen una imagen de perfil
 * y conserva las imágenes existentes para los usuarios que ya las tienen.
 */
export async function assignProfileImages() {
  try {
    console.log("Iniciando asignación de imágenes de perfil a usuarios...");
    
    // Obtener todos los usuarios
    const allUsers = await db.select().from(users);
    console.log(`Encontrados ${allUsers.length} usuarios en la base de datos.`);
    
    // Fotos de perfil aleatorias para diferentes roles
    const randomProfileImages = {
      admin: [
        "/uploads/profiles/admin-profile-1.jpg",
        "/uploads/profiles/admin-profile-2.jpg",
        "/uploads/profiles/admin-profile-3.jpg"
      ],
      director: [
        "/uploads/profiles/director-profile-1.jpg",
        "/uploads/profiles/director-profile-2.jpg"
      ],
      manager: [
        "/uploads/profiles/manager-profile-1.jpg",
        "/uploads/profiles/manager-profile-2.jpg"
      ],
      supervisor: [
        "/uploads/profiles/supervisor-profile-1.jpg",
        "/uploads/profiles/supervisor-profile-2.jpg"
      ],
      instructor: [
        "/uploads/profiles/instructor-profile-1.jpg",
        "/uploads/profiles/instructor-profile-2.jpg",
        "/uploads/profiles/instructor-profile-3.jpg"
      ],
      citizen: [
        "/uploads/profiles/citizen-profile-1.jpg",
        "/uploads/profiles/citizen-profile-2.jpg"
      ],
      default: [
        "/uploads/profiles/default-profile-1.jpg",
        "/uploads/profiles/default-profile-2.jpg",
        "/uploads/profiles/default-profile-3.jpg",
        "/uploads/profiles/default-profile-4.jpg"
      ]
    };
    
    // Función para obtener una imagen aleatoria según el rol
    const getRandomImageForRole = (role: string): string => {
      const roleImages = randomProfileImages[role as keyof typeof randomProfileImages] || randomProfileImages.default;
      const randomIndex = Math.floor(Math.random() * roleImages.length);
      return roleImages[randomIndex];
    };
    
    // Crear fotos de ejemplo en la carpeta de perfiles
    const profilesDir = path.resolve('./public/uploads/profiles');
    
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
    
    // Generar archivos de ejemplo para las imágenes (solo si no existen)
    Object.values(randomProfileImages).flat().forEach(imagePath => {
      const filename = path.basename(imagePath);
      const filePath = path.join(profilesDir, filename);
      
      if (!fs.existsSync(filePath)) {
        // Crea un archivo de imagen básico
        const svgContent = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#${Math.floor(Math.random()*16777215).toString(16)}" />
          <circle cx="100" cy="80" r="50" fill="#${Math.floor(Math.random()*16777215).toString(16)}" />
          <rect x="60" y="140" width="80" height="40" fill="#${Math.floor(Math.random()*16777215).toString(16)}" />
        </svg>
        `;
        fs.writeFileSync(filePath, svgContent);
      }
    });
    
    // Contador de actualizaciones
    let updatedCount = 0;
    
    // Actualizar usuarios sin imagen de perfil
    for (const user of allUsers) {
      // Conservar las imágenes existentes
      if (user.profileImageUrl) {
        console.log(`Usuario ${user.username} ya tiene imagen de perfil: ${user.profileImageUrl}`);
        continue;
      }
      
      // Para los voluntarios, intentar usar su foto existente
      if (user.role === 'volunteer') {
        try {
          // Buscar si existe un voluntario con el mismo correo o nombre
          const volunteerResult = await db.execute(sql`
            SELECT profile_image_url FROM volunteers 
            WHERE email = ${user.email} OR full_name = ${user.fullName}
          `);
          
          const volunteers = volunteerResult.rows as any[];
          
          if (volunteers.length > 0 && volunteers[0].profile_image_url) {
            // Usar la imagen de perfil del voluntario
            await db.update(users)
              .set({ profileImageUrl: volunteers[0].profile_image_url })
              .where(eq(users.id, user.id));
            
            console.log(`Actualizado usuario ${user.username} (${user.role}) con imagen de perfil de voluntario: ${volunteers[0].profile_image_url}`);
            updatedCount++;
            continue;
          }
        } catch (error) {
          console.error("Error al buscar imagen de voluntario:", error);
        }
      }
      
      // Para los instructores, intentar usar su foto existente
      if (user.role === 'instructor') {
        try {
          // Buscar si existe un instructor con el mismo correo o nombre
          const instructorResult = await db.execute(sql`
            SELECT profile_image_url FROM instructors 
            WHERE email = ${user.email} OR full_name = ${user.fullName}
          `);
          
          const instructors = instructorResult.rows as any[];
          
          if (instructors.length > 0 && instructors[0].profile_image_url) {
            // Usar la imagen de perfil del instructor
            await db.update(users)
              .set({ profileImageUrl: instructors[0].profile_image_url })
              .where(eq(users.id, user.id));
            
            console.log(`Actualizado usuario ${user.username} (${user.role}) con imagen de perfil de instructor: ${instructors[0].profile_image_url}`);
            updatedCount++;
            continue;
          }
        } catch (error) {
          console.error("Error al buscar imagen de instructor:", error);
        }
      }
      
      // Para el resto de usuarios, asignar una imagen aleatoria según su rol
      const randomImage = getRandomImageForRole(user.role);
      
      await db.update(users)
        .set({ profileImageUrl: randomImage })
        .where(eq(users.id, user.id));
      
      console.log(`Asignada imagen aleatoria a usuario ${user.username} (${user.role}): ${randomImage}`);
      updatedCount++;
    }
    
    console.log(`Actualización completada. ${updatedCount} usuarios han recibido nuevas imágenes de perfil.`);
    return { success: true, updatedUsers: updatedCount };
    
  } catch (error) {
    console.error("Error al asignar imágenes de perfil:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}