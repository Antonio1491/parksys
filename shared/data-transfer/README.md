# Sistema Unificado de Importación/Exportación - ParkSys

## Estructura de Archivos

```
shared/data-transfer/
├── index.ts              # Punto de entrada - exporta todo
├── types.ts              # Definiciones de tipos TypeScript
├── field-labels.ts       # Etiquetas humanas para campos
├── field-resolver.ts     # Combina Drizzle schema + etiquetas
├── entity-registry.ts    # Registro de entidades soportadas
├── validators.ts         # Sistema de validación
└── template-generator.ts # Generador de plantillas
```

## Instalación

1. Copiar la carpeta `shared/data-transfer/` a tu proyecto en `shared/`

2. Agregar etiquetas para tus campos en `field-labels.ts`:
```typescript
export const FIELD_LABELS = {
  'miEntidad.miCampo': 'Mi Etiqueta',
  // ...
};
```

3. Inicializar el registro al iniciar el servidor:
```typescript
// server/index.ts o server/routes.ts
import * as schema from '../shared/schema';
import { initializeEntityRegistry } from '../shared/data-transfer';

// Al inicio
initializeEntityRegistry(schema);
```

## Uso Básico

### Obtener configuración de una entidad
```typescript
import { getEntityConfig } from '@shared/data-transfer';

const parkConfig = getEntityConfig('parks');
console.log(parkConfig.fields); // Todos los campos con metadata
```

### Obtener campos exportables
```typescript
const exportableFields = parkConfig.fields.filter(f => f.exportable);
```

### Generar plantilla de importación
```typescript
import { generateImportTemplate, generateCSVContent } from '@shared/data-transfer';

const template = generateImportTemplate(parkConfig, 'csv');
const csvContent = generateCSVContent(template);
```

### Validar datos antes de importar
```typescript
import { validateFile, applyTransformations } from '@shared/data-transfer';

const records = [/* datos parseados del archivo */];
const importableFields = parkConfig.fields.filter(f => f.importable);

const validation = validateFile(records, importableFields);

if (validation.valid) {
  const transformedData = applyTransformations(records, validation);
  // Insertar transformedData en la BD
} else {
  // Mostrar validation.records con errores
}
```

## Agregar una Nueva Entidad

1. **Agregar etiquetas** en `field-labels.ts`:
```typescript
// En FIELD_LABELS
'miEntidad.campo1': 'Etiqueta 1',
'miEntidad.campo2': 'Etiqueta 2',
```

2. **Registrar la entidad** en `entity-registry.ts`:
```typescript
// En initializeEntityRegistry()
if (schema.miEntidad) {
  registerEntity(
    createEntityConfig(
      schema.miEntidad,
      'miEntidad',
      'Mi Entidad',      // singular
      'Mis Entidades',   // plural
      {
        import: {
          uniqueFields: ['campo1'], // campos para detectar duplicados
        },
      }
    )
  );
}
```

## Personalización de Validadores

Los validadores se aplican automáticamente según:
- Tipo de dato (number → numeric, date → date, etc.)
- Nombre del campo (email → email, latitude → latitude, etc.)
- Campo required → required

Para agregar validadores personalizados:
```typescript
// En validators.ts
const validators = {
  // ...existentes...
  
  miValidador: (value, field) => {
    if (/* condición inválida */) {
      return { valid: false, error: 'Mensaje de error' };
    }
    return { valid: true, transformedValue: value };
  },
};
```

## Flujo de Importación Recomendado

```
1. Usuario sube archivo
       ↓
2. Parsear en cliente (Papa Parse / SheetJS)
       ↓
3. Enviar a /api/data/:entity/validate
       ↓
4. Mostrar preview con errores/advertencias
       ↓
5. Usuario confirma
       ↓
6. Enviar a /api/data/:entity/import
       ↓
7. Insertar en BD con datos transformados
```

## Integración con Sistema Existente

El sistema está diseñado para coexistir con las implementaciones actuales.
Migración recomendada:

1. **Fase 1**: Integrar el sistema base
2. **Fase 2**: Migrar Parques como piloto
3. **Fase 3**: Migrar resto de módulos uno por uno
4. **Fase 4**: Eliminar código duplicado antiguo

## Campos que NO se importan/exportan

Automáticamente excluidos:
- `id`
- `createdAt` / `created_at`
- `updatedAt` / `updated_at`
- `deletedAt` / `deleted_at`
- Campos con `password`, `token`, `apiKey`, etc.

Para excluir campos adicionales, agrégalos a `SYSTEM_FIELDS` en `field-labels.ts`.
