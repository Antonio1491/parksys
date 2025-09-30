import { db } from "./db";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const concessionairesData = [
  {
    // Usuario 1: Café Verde Natural
    user: {
      username: "cafe_verde_natural",
      password: "temp123",
      email: "contacto@cafeverdenatural.com",
      role: "concessionaire",
      fullName: "María Elena Rodríguez García",
      phone: "33-1234-5678",
      gender: "femenino",
      birthDate: "1985-03-15"
    },
    profile: {
      type: "persona_fisica",
      rfc: "ROGM850315AB7",
      taxAddress: "Av. Revolución 1234, Col. Americana, Guadalajara, Jalisco",
      legalRepresentative: "María Elena Rodríguez García",
      notes: "Especializada en café orgánico y productos sustentables"
    }
  },
  {
    // Usuario 2: Deportes Extremos GDL
    user: {
      username: "deportes_extremos_gdl",
      password: "temp123",
      email: "admin@deportesextremoscdl.mx",
      role: "concessionaire",
      fullName: "Carlos Alberto Mendoza Ruiz",
      phone: "33-2345-6789",
      gender: "masculino",
      birthDate: "1978-08-22"
    },
    profile: {
      type: "persona_moral",
      rfc: "DEG780822C45",
      taxAddress: "Blvd. Marcelino García Barragán 1421, Col. Olímpica, Guadalajara",
      legalRepresentative: "Carlos Alberto Mendoza Ruiz",
      notes: "Renta de equipo deportivo y actividades de aventura"
    }
  },
  {
    // Usuario 3: Alimentos Saludables Luna
    user: {
      username: "alimentos_luna",
      password: "temp123",
      email: "ventas@alimentosluna.com.mx",
      role: "concessionaire",
      fullName: "Ana Sofía Luna Hernández",
      phone: "33-3456-7890",
      gender: "femenino",
      birthDate: "1990-12-03"
    },
    profile: {
      type: "persona_fisica",
      rfc: "LUHA901203XY2",
      taxAddress: "Calle Morelos 567, Col. Centro, Guadalajara, Jalisco",
      legalRepresentative: "Ana Sofía Luna Hernández",
      notes: "Venta de snacks saludables y bebidas naturales"
    }
  },
  {
    // Usuario 4: Entretenimiento Familiar SA
    user: {
      username: "entretenimiento_familiar",
      password: "temp123",
      email: "contacto@entfamiliar.com",
      role: "concessionaire",
      fullName: "Roberto Javier Torres Sánchez",
      phone: "33-4567-8901",
      gender: "masculino",
      birthDate: "1982-06-18"
    },
    profile: {
      type: "persona_moral",
      rfc: "EFS820618MX9",
      taxAddress: "Av. Patria 2890, Col. Jardines Universidad, Zapopan, Jalisco",
      legalRepresentative: "Roberto Javier Torres Sánchez",
      notes: "Juegos infantiles, inflables y entretenimiento familiar"
    }
  },
  {
    // Usuario 5: Artesanías Tradición Mexicana
    user: {
      username: "artesanias_tradicion",
      password: "temp123",
      email: "info@tradicionmexicana.mx",
      role: "concessionaire",
      fullName: "Guadalupe Fernández López",
      phone: "33-5678-9012",
      gender: "femenino",
      birthDate: "1975-11-25"
    },
    profile: {
      type: "persona_fisica",
      rfc: "FELG751125QW8",
      taxAddress: "Calle Independencia 890, Col. Tlaquepaque Centro, Tlaquepaque",
      legalRepresentative: "Guadalupe Fernández López",
      notes: "Venta de artesanías mexicanas y productos tradicionales"
    }
  },
  {
    // Usuario 6: Eco Bikes Guadalajara
    user: {
      username: "eco_bikes_gdl",
      password: "temp123",
      email: "renta@ecobikescdl.com",
      role: "concessionaire",
      fullName: "Miguel Ángel Vargas Moreno",
      phone: "33-6789-0123",
      gender: "masculino",
      birthDate: "1988-04-10"
    },
    profile: {
      type: "persona_moral",
      rfc: "EBG880410RT5",
      taxAddress: "Av. López Mateos Norte 2375, Col. Ciudad del Sol, Zapopan",
      legalRepresentative: "Miguel Ángel Vargas Moreno",
      notes: "Renta de bicicletas eléctricas y equipo ecológico"
    }
  },
  {
    // Usuario 7: Helados Artesanales Jalisco
    user: {
      username: "helados_artesanales",
      password: "temp123",
      email: "ventas@heladosjalisco.mx",
      role: "concessionaire",
      fullName: "Patricia Isabel Ramírez Gutiérrez",
      phone: "33-7890-1234",
      gender: "femenino",
      birthDate: "1983-09-07"
    },
    profile: {
      type: "persona_fisica",
      rfc: "RAGP830907UI3",
      taxAddress: "Calle Juárez 123, Col. Mezquitán Country, Guadalajara",
      legalRepresentative: "Patricia Isabel Ramírez Gutiérrez",
      notes: "Helados artesanales con sabores tradicionales mexicanos"
    }
  },
  {
    // Usuario 8: Tecnología Verde SA
    user: {
      username: "tecnologia_verde",
      password: "temp123",
      email: "info@tecverde.com.mx",
      role: "concessionaire",
      fullName: "Fernando José Castillo Herrera",
      phone: "33-8901-2345",
      gender: "masculino",
      birthDate: "1979-01-14"
    },
    profile: {
      type: "persona_moral",
      rfc: "TVS790114OP6",
      taxAddress: "Av. Américas 1500, Col. Providencia, Guadalajara, Jalisco",
      legalRepresentative: "Fernando José Castillo Herrera",
      notes: "Estaciones de carga solar y tecnología sustentable"
    }
  },
  {
    // Usuario 9: Flores y Plantas del Bosque
    user: {
      username: "flores_plantas_bosque",
      password: "temp123",
      email: "contacto@floresbosque.mx",
      role: "concessionaire",
      fullName: "Sandra Liliana Jiménez Paz",
      phone: "33-9012-3456",
      gender: "femenino",
      birthDate: "1987-05-30"
    },
    profile: {
      type: "persona_fisica",
      rfc: "JIPS870530AS4",
      taxAddress: "Calle Reforma 456, Col. Ladrón de Guevara, Guadalajara",
      legalRepresentative: "Sandra Liliana Jiménez Paz",
      notes: "Venta de plantas ornamentales y productos de jardinería"
    }
  },
  {
    // Usuario 10: Servicios Turísticos Tapatíos
    user: {
      username: "servicios_turisticos",
      password: "temp123",
      email: "tours@turisticostapatos.com",
      role: "concessionaire",
      fullName: "Alejandro Daniel Morales Castro",
      phone: "33-0123-4567",
      gender: "masculino",
      birthDate: "1984-10-12"
    },
    profile: {
      type: "persona_moral",
      rfc: "STT841012FG1",
      taxAddress: "Av. Chapultepec Norte 123, Col. Americana, Guadalajara",
      legalRepresentative: "Alejandro Daniel Morales Castro",
      notes: "Tours guiados, información turística y servicios de guía"
    }
  }
];

export async function seedConcessionaires() {
  console.log("🏢 Iniciando creación de concesionarios de prueba...");
  
  try {
    for (const concessionaireData of concessionairesData) {
      // Verificar si el usuario ya existe
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, concessionaireData.user.email)
      });

      if (existingUser) {
        console.log(`⚠️ Usuario ${concessionaireData.user.email} ya existe, saltando...`);
        continue;
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(concessionaireData.user.password, 10);

      // Crear el usuario
      const [newUser] = await db.insert(schema.users).values({
        username: concessionaireData.user.username,
        password: hashedPassword,
        email: concessionaireData.user.email,
        role: concessionaireData.user.role as "concessionaire",
        fullName: concessionaireData.user.fullName,
        phone: concessionaireData.user.phone,
        gender: concessionaireData.user.gender as "masculino" | "femenino",
        birthDate: concessionaireData.user.birthDate,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log(`✅ Usuario creado: ${newUser.fullName} (ID: ${newUser.id})`);

      // Crear el perfil de concesionario
      await db.insert(schema.concessionaireProfiles).values({
        userId: newUser.id,
        type: concessionaireData.profile.type,
        rfc: concessionaireData.profile.rfc,
        taxAddress: concessionaireData.profile.taxAddress,
        legalRepresentative: concessionaireData.profile.legalRepresentative,
        notes: concessionaireData.profile.notes,
        status: "activo",
        registrationDate: new Date().toISOString().split('T')[0], // Solo fecha sin hora
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Perfil de concesionario creado para: ${newUser.fullName}`);
    }

    console.log("🎉 ¡Concesionarios de prueba creados exitosamente!");
    
    // Mostrar resumen
    const totalConcessionaires = await db.query.users.findMany({
      where: eq(schema.users.role, "concessionaire")
    });
    
    console.log(`📊 Total de concesionarios en el sistema: ${totalConcessionaires.length}`);
    
    return true;
  } catch (error) {
    console.error("❌ Error al crear concesionarios de prueba:", error);
    return false;
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedConcessionaires().then(() => {
    console.log("✅ Proceso completado");
    process.exit(0);
  }).catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
}