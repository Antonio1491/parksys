import { db } from "./db";
import { parks, parkAreas, trees, treeSpecies } from "@shared/schema";
import { eq, sql, and, isNull, desc } from "drizzle-orm";

export async function generateParkPrefix(parkName: string): Promise<string> {
  const cleanName = parkName
    .replace(/^(el|la|los|las|parque)\s+/gi, '')
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (cleanName.length < 2) {
    throw new Error(`El nombre del parque es muy corto: "${parkName}"`);
  }

  let basePrefix = cleanName.substring(0, 2);
  let prefix = basePrefix;
  let attempts = 0;
  const maxAttempts = 26;

  while (attempts < maxAttempts) {
    const exists = await checkPrefixExists(prefix);

    if (!exists) {
      return prefix;
    }

    attempts++;

    if (attempts < cleanName.length) {
      prefix = basePrefix[0] + cleanName[attempts].toUpperCase();
    } else {
      const letterIndex = (attempts - cleanName.length) % 26;
      prefix = basePrefix[0] + String.fromCharCode(65 + letterIndex);
    }
  }

  throw new Error(`No se pudo generar un prefijo único para: "${parkName}"`);
}

async function checkPrefixExists(prefix: string): Promise<boolean> {
  const result = await db
    .select({ codePrefix: parks.codePrefix })
    .from(parks)
    .where(eq(parks.codePrefix, prefix))
    .limit(1);

  return result.length > 0;
}

export async function generateAreaCode(
  areaName: string,
  parkId: number
): Promise<string> {
  const park = await db
    .select({ codePrefix: parks.codePrefix })
    .from(parks)
    .where(eq(parks.id, parkId))
    .limit(1);

  if (!park.length || !park[0].codePrefix) {
    throw new Error(
      `El parque con ID ${parkId} no tiene un código prefijo asignado`
    );
  }

  const parkPrefix = park[0].codePrefix;

  const cleanName = areaName
    .replace(/^(zona|área|sector|sección)\s+/gi, '')
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (cleanName.length < 2) {
    throw new Error(`El nombre del área es muy corto: "${areaName}"`);
  }

  const words = cleanName.split(/\s+/);
  let areaLetters: string;

  if (words.length >= 2) {
    areaLetters = words[0][0] + words[1][0];
  } else {
    areaLetters = cleanName.substring(0, 2);
  }

  let areaCode = `${parkPrefix}-${areaLetters}`;
  let attempts = 0;
  const maxAttempts = 26;

  while (attempts < maxAttempts) {
    const exists = await checkAreaCodeExists(areaCode, parkId);

    if (!exists) {
      return areaCode;
    }

    attempts++;

    if (attempts < cleanName.length) {
      areaCode = `${parkPrefix}-${areaLetters[0]}${cleanName[attempts].toUpperCase()}`;
    } else {
      const letterIndex = (attempts - cleanName.length) % 26;
      areaCode = `${parkPrefix}-${areaLetters[0]}${String.fromCharCode(65 + letterIndex)}`;
    }
  }

  throw new Error(`No se pudo generar un código único para el área: "${areaName}"`);
}

async function checkAreaCodeExists(
  areaCode: string,
  parkId: number
): Promise<boolean> {
  const result = await db
    .select({ areaCode: parkAreas.areaCode })
    .from(parkAreas)
    .where(
      and(
        eq(parkAreas.areaCode, areaCode),
        eq(parkAreas.parkId, parkId)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function generateSpeciesCode(
  commonName: string,
  scientificName?: string
): Promise<string> {
  const baseName = commonName || scientificName || '';

  if (!baseName || baseName.length < 2) {
    throw new Error(`El nombre de la especie es muy corto: "${baseName}"`);
  }

  const cleanName = baseName
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const words = cleanName.split(/\s+/);
  let baseCode: string;

  if (words.length >= 2) {
    baseCode = words
      .slice(0, 3)
      .map(word => word[0])
      .join('');
  } else {
    baseCode = cleanName.substring(0, 2);
  }

  let speciesCode = baseCode;
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const exists = await checkSpeciesCodeExists(speciesCode);

    if (!exists) {
      return speciesCode;
    }

    attempts++;

    if (attempts === 1 && baseCode.length === 2 && cleanName.length >= 3) {
      speciesCode = cleanName.substring(0, 3);
    } else if (attempts < cleanName.length) {
      speciesCode = baseCode[0] + cleanName[attempts].toUpperCase();
    } else {
      speciesCode = `${baseCode}${attempts - cleanName.length + 1}`;
    }
  }

  throw new Error(`No se pudo generar un código único para la especie: "${baseName}"`);
}

async function checkSpeciesCodeExists(speciesCode: string): Promise<boolean> {
  const result = await db
    .select({ speciesCode: treeSpecies.speciesCode })
    .from(treeSpecies)
    .where(eq(treeSpecies.speciesCode, speciesCode))
    .limit(1);

  return result.length > 0;
}

export async function generateTreeCode(
  speciesId: number,
  areaId?: number | null,
  parkId?: number | null
): Promise<string> {
  const species = await db
    .select({ speciesCode: treeSpecies.speciesCode })
    .from(treeSpecies)
    .where(eq(treeSpecies.id, speciesId))
    .limit(1);

  if (!species.length || !species[0].speciesCode) {
    throw new Error(
      `La especie con ID ${speciesId} no tiene un código asignado. Asigne un código antes de registrar árboles de esta especie.`
    );
  }

  const speciesCode = species[0].speciesCode;

  if (areaId) {
    const area = await db
      .select({ areaCode: parkAreas.areaCode })
      .from(parkAreas)
      .where(eq(parkAreas.id, areaId))
      .limit(1);

    if (!area.length || !area[0].areaCode) {
      throw new Error(`El área con ID ${areaId} no tiene un código asignado`);
    }

    const areaCode = area[0].areaCode;

    const pattern = `${areaCode}-${speciesCode}-%`;
    const lastTree = await db
      .select({ treeCode: trees.treeCode })
      .from(trees)
      .where(sql`${trees.treeCode} LIKE ${pattern}`)
      .orderBy(desc(trees.treeCode))
      .limit(1);

    let nextNumber = 1;

    if (lastTree.length && lastTree[0].treeCode) {
      const match = lastTree[0].treeCode.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const paddedNumber = nextNumber.toString().padStart(4, '0');
    return `${areaCode}-${speciesCode}-${paddedNumber}`;
  }

  if (parkId) {
    const park = await db
      .select({ codePrefix: parks.codePrefix })
      .from(parks)
      .where(eq(parks.id, parkId))
      .limit(1);

    if (!park.length || !park[0].codePrefix) {
      throw new Error(
        `El parque con ID ${parkId} no tiene un código prefijo asignado`
      );
    }

    const parkPrefix = park[0].codePrefix;

    const pattern = `${parkPrefix}-XX-${speciesCode}-%`;
    const lastTree = await db
      .select({ treeCode: trees.treeCode })
      .from(trees)
      .where(
        and(
          eq(trees.park_id, parkId),
          isNull(trees.area_id),
          eq(trees.species_id, speciesId),
          sql`${trees.treeCode} LIKE ${pattern}`
        )
      )
      .orderBy(desc(trees.treeCode))
      .limit(1);

    let nextNumber = 1;

    if (lastTree.length && lastTree[0].treeCode) {
      const match = lastTree[0].treeCode.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const paddedNumber = nextNumber.toString().padStart(4, '0');
    return `${parkPrefix}-XX-${speciesCode}-${paddedNumber}`;
  }

  throw new Error('Se requiere areaId o parkId para generar el código del árbol');
}

export async function detectAreaByCoordinates(
  latitude: number,
  longitude: number,
  parkId: number
): Promise<number | null> {
  const areas = await db
    .select({
      id: parkAreas.id,
      polygon: parkAreas.polygon,
    })
    .from(parkAreas)
    .where(
      and(
        eq(parkAreas.parkId, parkId),
        sql`${parkAreas.polygon} IS NOT NULL`
      )
    );

  for (const area of areas) {
    if (area.polygon) {
      try {
        const polygon = JSON.parse(area.polygon as string);
        if (isPointInPolygon({ lat: latitude, lng: longitude }, polygon)) {
          return area.id;
        }
      } catch (error) {
        console.error(`Error parsing polygon for area ${area.id}:`, error);
      }
    }
  }

  return null;
}

function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

export function generateAreaCodePreview(
  areaName: string,
  parkPrefix: string
): string {
  if (!parkPrefix || !areaName) {
    return '';
  }

  const cleanName = areaName
    .replace(/^(zona|área|sector|sección)\s+/gi, '')
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (cleanName.length < 2) {
    return `${parkPrefix}-??`;
  }

  const words = cleanName.split(/\s+/);
  let areaLetters: string;

  if (words.length >= 2) {
    areaLetters = words[0][0] + words[1][0];
  } else {
    areaLetters = cleanName.substring(0, 2);
  }

  return `${parkPrefix}-${areaLetters}`;
}