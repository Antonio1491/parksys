import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { 
  ChevronLeft, 
  Search, 
  BookOpen, 
  Users,
  MapPin,
  TreeDeciduous,
  Activity,
  DollarSign,
  Shield,
  MessageSquare,
  Home,
  FileText,
  List,
  Hash
} from 'lucide-react';

interface DocumentationViewerProps {
  documentId: string;
  onBack?: () => void;
}

interface DocSection {
  id: string;
  title: string;
  level: number;
  content: string;
}

// Function to safely render Markdown content
const renderMarkdown = (content: string): string => {
  try {
    const htmlContent = marked(content, {
      breaks: true,
      gfm: true
    });
    return DOMPurify.sanitize(htmlContent as string);
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return content;
  }
};

// Mock documentation content - En producción esto vendría del servidor
const documentationContent: Record<string, { title: string; icon: React.ReactNode; sections: DocSection[] }> = {
  'visitantes-manual': {
    title: 'Manual Completo - Módulo de Visitantes',
    icon: <Users className="h-5 w-5" />,
    sections: [
      {
        id: 'intro',
        title: 'Introducción al Módulo',
        level: 1,
        content: `
El **Módulo de Visitantes** es una herramienta integral diseñada para la gestión completa de la experiencia ciudadana en los parques urbanos de Guadalajara. Este módulo permite el monitoreo, análisis y mejora continua de la satisfacción de los visitantes mediante cinco componentes principales:

### ¿Para qué sirve?
- **Monitorear** el flujo de visitantes en tiempo real
- **Medir** la satisfacción ciudadana de manera sistemática
- **Analizar** tendencias de uso y preferencias
- **Mejorar** la calidad del servicio basado en datos reales
- **Reportar** métricas ejecutivas para toma de decisiones

### Acceso al Módulo
1. Inicie sesión en ParkSys con sus credenciales administrativas
2. En el sidebar administrativo, localice la sección **"Visitantes"**
3. Expanda el menú para acceder a las cinco funcionalidades
        `
      },
      {
        id: 'dashboard',
        title: 'Dashboard de Visitantes',
        level: 1,
        content: `
### Descripción
El Dashboard proporciona una vista ejecutiva consolidada de todas las métricas relacionadas con visitantes, evaluaciones y retroalimentación ciudadana.

### Características Principales
- **Métricas Unificadas**: Total de visitantes, evaluaciones recibidas y promedio de calificaciones
- **Análisis Temporal**: Tendencias de visitación por períodos configurables
- **Vista por Parques**: Filtrado específico por ubicación
- **Gráficas Interactivas**: Visualización de datos mediante charts dinámicos

### Cómo Usar el Dashboard

#### Paso 1: Acceso
- Navegue a **Visitantes > Dashboard** en el sidebar administrativo
- El sistema cargará automáticamente los datos más recientes

#### Paso 2: Interpretación de Métricas
Las tarjetas superiores muestran:
- **Total Visitantes**: Suma histórica de todos los registros
- **Evaluaciones**: Cantidad total de evaluaciones recibidas
- **Promedio General**: Calificación promedio del sistema (escala 1-5 estrellas)
- **Retroalimentación**: Cantidad de comentarios y sugerencias

#### Paso 3: Filtrado de Información
- Use el **selector de parques** para filtrar datos específicos
- Seleccione **"Todos los parques"** para vista general
- Los datos se actualizarán automáticamente según su selección
        `
      },
      {
        id: 'conteo',
        title: 'Conteo de Visitantes',
        level: 1,
        content: `
### Descripción
Sistema integral para el registro, seguimiento y análisis de la afluencia de visitantes en todos los parques del sistema.

### Funcionalidades Disponibles

#### Registro Manual de Visitantes
Permite capturar datos de visitación cuando no se cuenta con sistemas automáticos.

**Campos de Registro:**
- **Fecha**: Selección de fecha específica de registro
- **Parque**: Ubicación donde se realiza el conteo
- **Cantidad**: Número total de visitantes registrados
- **Método de Conteo**: Manual, Automático, o Estimado
- **Condiciones Climáticas**: Soleado, Nublado, Lluvioso, Otro
- **Observaciones**: Notas adicionales relevantes

#### Paso a Paso: Registrar Conteo Manual

1. **Acceso al Formulario**
   - Vaya a **Visitantes > Conteo**
   - Haga clic en **"Nuevo Registro"**

2. **Completar Información Básica**
   - Seleccione la **fecha** del conteo
   - Elija el **parque** correspondiente
   - Ingrese la **cantidad** de visitantes

3. **Especificar Método y Condiciones**
   - Seleccione **"Manual"** en método de conteo
   - Indique las **condiciones climáticas** observadas
   - Agregue **observaciones** si son relevantes

4. **Guardar Registro**
   - Revise la información ingresada
   - Haga clic en **"Guardar"**
   - El sistema confirmará el registro exitoso
        `
      },
      {
        id: 'evaluaciones',
        title: 'Evaluaciones de Visitantes',
        level: 1,
        content: `
### Descripción
Sistema completo para capturar, gestionar y analizar la satisfacción de los visitantes mediante evaluaciones estructuradas.

### Componentes del Sistema

#### Formularios de Evaluación
Los ciudadanos pueden completar evaluaciones que incluyen:
- **Calificación General**: Escala de 1 a 5 estrellas
- **Criterios Específicos**: Limpieza, seguridad, amenidades, etc.
- **Comentarios Escritos**: Retroalimentación cualitativa
- **Datos del Evaluador**: Información demográfica opcional

#### Gestión Administrativa

**Vista de Lista:**
- Tabla completa de todas las evaluaciones recibidas
- Filtros por parque, calificación, fecha
- Paginación para manejo eficiente de volumen
- Exportación a CSV/Excel

**Vista de Fichas:**
- Formato visual tipo tarjetas
- Información resumida por evaluación
- Acceso rápido a detalles completos
- Ideal para revisión ejecutiva
        `
      },
      {
        id: 'criterios',
        title: 'Criterios de Evaluación',
        level: 1,
        content: `
### Descripción
Módulo de configuración que permite definir y personalizar los parámetros de evaluación que utilizarán los visitantes.

### Gestión de Criterios

#### Criterios Predefinidos
El sistema incluye criterios base como:
- **Limpieza General**: Estado de limpieza del parque
- **Seguridad**: Percepción de seguridad personal
- **Amenidades**: Calidad de instalaciones (baños, bancas, etc.)
- **Mantenimiento**: Estado de conservación general
- **Accesibilidad**: Facilidad de acceso para personas con discapacidad

#### Mejores Prácticas
- **Límite de Criterios**: Mantenga entre 5-8 criterios para evitar fatiga del evaluador
- **Claridad**: Use nombres y descripciones fáciles de entender
- **Consistencia**: Mantenga escalas uniformes entre criterios similares
- **Relevancia**: Enfoque en aspectos que realmente puede mejorar
        `
      },
      {
        id: 'retroalimentacion',
        title: 'Retroalimentación Ciudadana',
        level: 1,
        content: `
### Descripción
Canal directo de comunicación entre ciudadanos y administración para reportes, sugerencias y comentarios no estructurados.

### Tipos de Retroalimentación

#### Formularios Disponibles
1. **Compartir Experiencia**: Relatos positivos o negativos detallados
2. **Reportar Problema**: Incidencias específicas que requieren atención
3. **Sugerir Mejora**: Propuestas constructivas de los ciudadanos
4. **Proponer Evento**: Ideas para actividades en los parques

#### Estados de Seguimiento
- **Pendiente**: Retroalimentación recién recibida
- **En Progreso**: Se está trabajando en la respuesta/solución
- **Resuelto**: Acción completada o respuesta enviada
- **Archivado**: Comentarios para referencia histórica

### Sistema de Notificaciones Automáticas
- **Email Automático**: Se envía notificación a administradores al recibir nueva retroalimentación
- **Dashboard Alerts**: Indicadores visuales de items pendientes
- **Reportes Semanales**: Resumen automático de actividad
        `
      },
      {
        id: 'faq',
        title: 'Preguntas Frecuentes',
        level: 1,
        content: `
### Generales

**P: ¿Con qué frecuencia se actualizan los datos en el Dashboard?**
R: Los datos se actualizan en tiempo real. Al ingresar nuevos registros, las métricas se reflejan inmediatamente en todas las vistas.

**P: ¿Puedo recuperar datos si elimino accidentalmente un registro?**
R: El sistema mantiene respaldos automáticos. Contacte al administrador técnico para recuperación de datos eliminados accidentalmente.

### Conteo de Visitantes

**P: ¿Qué hago si me equivoco al ingresar un conteo?**
R: Localice el registro en la lista, haga clic en "Editar" y corrija la información. El sistema mantendrá un historial de cambios.

**P: ¿Qué método de conteo debo seleccionar?**
R: Use "Manual" para conteos realizados por personal, "Automático" para datos de sensores, y "Estimado" para aproximaciones basadas en observación.

### Evaluaciones

**P: ¿Puedo modificar una evaluación después de que un ciudadano la envió?**
R: No es recomendable modificar evaluaciones de ciudadanos. Si hay errores evidentes, documente la situación y mantenga la evaluación original para transparencia.

### Técnicas

**P: ¿Qué navegadores son compatibles?**
R: El sistema funciona en Chrome, Firefox, Safari y Edge en sus versiones más recientes.

**P: ¿Puedo acceder desde dispositivos móviles?**
R: Sí, la interfaz es completamente responsive y funciona en tablets y smartphones.
        `
      }
    ]
  },
  'parques-manual': {
    title: 'Manual Completo - Gestión de Parques',
    icon: <MapPin className="h-5 w-5" />,
    sections: [
      {
        id: 'introduccion',
        title: 'Introducción al Módulo',
        level: 1,
        content: `
El **Módulo de Parques** es el corazón del sistema ParkSys, diseñado para la gestión integral de espacios verdes urbanos en la Ciudad de Guadalajara. Este módulo centraliza toda la información relacionada con la administración, mantenimiento y optimización de los parques municipales.

### Propósito Principal
- **Centralizar** la información de todos los parques del sistema
- **Monitorear** el estado operativo y de mantenimiento
- **Gestionar** amenidades y servicios disponibles
- **Analizar** datos de evaluaciones ciudadanas
- **Facilitar** la toma de decisiones basada en datos

### Acceso al Módulo
1. Inicie sesión en ParkSys con credenciales administrativas
2. En el sidebar administrativo, localice la sección **"Gestión"**
3. Expanda el menú y seleccione **"Parques"**
4. Acceda a los siguientes submenús:
   - Dashboard de Parques
   - Gestión de Parques
   - Evaluaciones de Parques
   - Dashboard de Amenidades
        `
      },
      {
        id: 'dashboard',
        title: 'Dashboard de Parques',
        level: 1,
        content: `
### Descripción General
El Dashboard proporciona una vista ejecutiva consolidada de todos los indicadores clave de rendimiento (KPIs) relacionados con la gestión de parques urbanos.

### Características Principales

#### Métricas Fundamentales
- **Total de Parques**: Cantidad total de espacios verdes registrados
- **Parques Activos**: Espacios operativos y disponibles al público
- **Amenidades Totales**: Servicios e instalaciones disponibles
- **Evaluaciones Recibidas**: Retroalimentación ciudadana recopilada

#### Visualizaciones Interactivas
- **Gráficas de Estado**: Distribución de parques por condición operativa
- **Análisis de Amenidades**: Tipos de servicios más comunes
- **Tendencias de Evaluación**: Evolución de la satisfacción ciudadana
- **Distribución Geográfica**: Mapeo de parques por zona

### Guía de Uso Paso a Paso

#### Paso 1: Acceso al Dashboard
1. Navegue a **Gestión > Parques > Dashboard**
2. El sistema cargará automáticamente los datos más recientes
3. Verifique que las métricas se muestren correctamente

#### Paso 2: Interpretación de Métricas
- **Tarjetas Superiores**: Muestran totales absolutos y porcentajes
- **Gráficas Principales**: Representan distribuciones y tendencias
- **Indicadores de Estado**: Código de colores para alertas

#### Paso 3: Análisis de Datos
- Use los filtros disponibles para segmentar información
- Compare períodos para identificar tendencias
- Identifique parques que requieren atención prioritaria

### Casos de Uso Recomendados

#### Revisión Diaria (5-10 minutos)
- Verificar estado general del sistema
- Identificar alertas o problemas críticos
- Revisar nuevas evaluaciones ciudadanas

#### Análisis Semanal (30-45 minutos)
- Comparar métricas con semana anterior
- Identificar tendencias emergentes
- Planificar intervenciones necesarias
        `
      },
      {
        id: 'gestion',
        title: 'Gestión de Parques',
        level: 1,
        content: `
### Descripción General
La sección de Gestión permite la administración completa del inventario de parques, incluyendo creación, edición, visualización y eliminación de registros.

### Funcionalidades Principales

#### Vista de Lista de Parques
- **Listado Completo**: Todos los parques registrados en el sistema
- **Información Clave**: Nombre, ubicación, estado, amenidades principales
- **Búsqueda Avanzada**: Filtros por nombre, ubicación, estado y tipo
- **Acciones Rápidas**: Ver, editar, gestionar y eliminar parques

#### Creación de Nuevos Parques
**Información Básica Requerida:**
- Nombre oficial del parque
- Dirección completa y referencias
- Coordenadas geográficas (latitud/longitud)
- Área total en metros cuadrados
- Tipo de parque (urbano, metropolitano, vecinal, etc.)

**Información Adicional:**
- Descripción detallada del espacio
- Historia y contexto del parque
- Horarios de operación
- Contacto de administración local
- Fotografías representativas

#### Edición de Parques Existentes
1. **Acceso**: Click en "Editar" desde la lista de parques
2. **Modificación**: Actualizar cualquier campo disponible
3. **Validación**: El sistema verifica la integridad de los datos
4. **Confirmación**: Guardar cambios con registro de auditoría

### Gestión de Amenidades

#### Asignación de Amenidades
- **Selección Múltiple**: Asignar varias amenidades simultáneamente
- **Categorización**: Organizar por tipo de servicio
- **Estado**: Activar/desactivar amenidades específicas
- **Notas**: Agregar observaciones sobre condición o disponibilidad

#### Tipos de Amenidades Disponibles
**Recreación:**
- Juegos infantiles
- Canchas deportivas
- Áreas de ejercicio
- Espacios para mascotas

**Servicios:**
- Baños públicos
- Bebederos
- Estacionamiento
- Iluminación

**Infraestructura:**
- Bancas y mobiliario
- Senderos y caminos
- Áreas verdes
- Sistemas de riego
        `
      },
      {
        id: 'evaluaciones',
        title: 'Evaluaciones de Parques',
        level: 1,
        content: `
### Descripción General
Sistema integral para la gestión y análisis de evaluaciones ciudadanas sobre la calidad y servicios de los parques urbanos.

### Características del Sistema

#### Recopilación de Evaluaciones
- **Formularios Web**: Disponibles en páginas públicas de cada parque
- **Aplicación Móvil**: Evaluación in-situ por parte de visitantes
- **Encuestas Programadas**: Campañas específicas de retroalimentación
- **Integración QR**: Códigos QR en parques para evaluación rápida

#### Métricas de Evaluación
**Criterios Principales:**
- Limpieza y mantenimiento (1-5 estrellas)
- Seguridad y iluminación (1-5 estrellas)
- Calidad de amenidades (1-5 estrellas)
- Accesibilidad universal (1-5 estrellas)
- Experiencia general (1-5 estrellas)

**Información del Evaluador:**
- Nombre completo (opcional)
- Correo electrónico para seguimiento
- Edad y género (estadísticas demográficas)
- Frecuencia de visita al parque
- Motivo principal de la visita

### Análisis y Reportes

#### Dashboard de Evaluaciones
- **Resumen Ejecutivo**: Promedio general y total de evaluaciones
- **Distribución por Criterio**: Gráficas de calificaciones específicas
- **Tendencias Temporales**: Evolución de satisfacción por período
- **Ranking de Parques**: Clasificación por calificación promedio

#### Filtros y Segmentación
- **Por Parque**: Evaluaciones específicas de un espacio
- **Por Período**: Rangos de fechas personalizables
- **Por Calificación**: Filtrar por nivel de satisfacción
- **Por Evaluador**: Análisis demográfico de usuarios

#### Gestión de Retroalimentación
1. **Visualización**: Lista completa de evaluaciones recibidas
2. **Detalle Individual**: Información completa de cada evaluación
3. **Seguimiento**: Estado de atención a comentarios y sugerencias
4. **Respuesta**: Sistema de comunicación con evaluadores
        `
      },
      {
        id: 'amenidades',
        title: 'Dashboard de Amenidades',
        level: 1,
        content: `
### Descripción General
Panel especializado para la gestión integral del inventario de amenidades y servicios disponibles en todos los parques del sistema.

### Funcionalidades Principales

#### Inventario de Amenidades
- **Catálogo Completo**: Todas las amenidades registradas en el sistema
- **Clasificación por Tipo**: Categorización según función y propósito
- **Estado Operativo**: Disponible, en mantenimiento, fuera de servicio
- **Distribución por Parques**: Qué amenidades tiene cada espacio

#### Análisis de Distribución
**Gráficas de Distribución:**
- Amenidades más comunes en el sistema
- Parques con mayor cantidad de servicios
- Tipos de amenidades por zona geográfica
- Evolución del inventario por período

**Indicadores de Cobertura:**
- Porcentaje de parques con amenidades básicas
- Identificación de gaps en servicios
- Recomendaciones de equipamiento
- Análisis de necesidades no cubiertas

#### Gestión de Categorías
1. **Creación de Categorías**: Nuevos tipos de amenidades
2. **Organización**: Jerarquía y subcategorías
3. **Descripción**: Especificaciones técnicas y funcionales
4. **Iconografía**: Símbolos y representación visual

### Administración de Amenidades

#### Registro de Nuevas Amenidades
**Información Requerida:**
- Nombre descriptivo de la amenidad
- Categoría y subcategoría
- Descripción detallada
- Especificaciones técnicas
- Estado inicial (activa/inactiva)

#### Asignación a Parques
1. **Selección de Parque**: Elegir espacio específico
2. **Selección de Amenidades**: Múltiple selección disponible
3. **Configuración**: Estado y observaciones específicas
4. **Validación**: Verificar compatibilidad y requisitos

#### Mantenimiento y Actualización
- **Cambio de Estado**: Activar/desactivar servicios
- **Actualización de Información**: Modificar descripciones y especificaciones
- **Registro de Incidencias**: Reportes de problemas o daños
- **Programación de Mantenimiento**: Calendarios preventivos
        `
      },
      {
        id: 'mejores-practicas',
        title: 'Mejores Prácticas',
        level: 1,
        content: `
### Gestión de Datos

#### Calidad de la Información
1. **Completitud**: Asegurar que todos los campos obligatorios estén llenos
2. **Precisión**: Verificar coordenadas geográficas y direcciones
3. **Actualización**: Mantener información de amenidades al día
4. **Consistencia**: Usar nomenclatura estándar para categorías

#### Fotografías y Multimedia
1. **Calidad**: Imágenes de alta resolución y buena iluminación
2. **Representatividad**: Mostrar aspectos más importantes del parque
3. **Actualización**: Renovar fotos cuando cambien instalaciones
4. **Organización**: Mantener galería organizada y etiquetada

### Análisis de Evaluaciones

#### Frecuencia de Revisión
- **Evaluaciones Críticas** (1-2 estrellas): Revisión inmediata
- **Evaluaciones Generales**: Revisión diaria
- **Análisis de Tendencias**: Revisión semanal
- **Reportes Ejecutivos**: Revisión mensual

#### Respuesta a Ciudadanos
1. **Tiempo de Respuesta**: Máximo 48 horas para evaluaciones críticas
2. **Tono Profesional**: Respuestas corteses y constructivas
3. **Seguimiento**: Informar sobre acciones tomadas
4. **Cierre del Ciclo**: Confirmar resolución de problemas

### Optimización del Sistema

#### Rendimiento
1. **Carga de Imágenes**: Usar formatos optimizados (WebP preferible)
2. **Filtros Eficientes**: Combinar criterios para búsquedas rápidas
3. **Exportaciones**: Programar reportes grandes en horarios de baja demanda
4. **Cache**: Aprovechar almacenamiento temporal para consultas frecuentes

#### Seguridad
1. **Contraseñas Seguras**: Políticas robustas para cuentas administrativas
2. **Accesos Limitados**: Principio de menor privilegio
3. **Auditoría**: Registro completo de acciones administrativas
4. **Respaldos**: Exportaciones regulares de datos críticos
        `
      },
      {
        id: 'faq',
        title: 'Preguntas Frecuentes',
        level: 1,
        content: `
### Preguntas Generales

**P: ¿Cómo accedo al módulo de Parques?**
R: Inicie sesión en ParkSys, vaya al sidebar administrativo, expanda "Gestión" y seleccione "Parques". Verá los submenús disponibles según sus permisos.

**P: ¿Puedo gestionar varios parques simultáneamente?**
R: Sí, el sistema permite selección múltiple para acciones masivas como asignación de amenidades o exportación de datos.

**P: ¿Con qué frecuencia se actualizan los datos del dashboard?**
R: Los datos se actualizan en tiempo real. Las métricas reflejan información hasta el último registro ingresado en el sistema.

### Gestión de Parques

**P: ¿Qué información es obligatoria para crear un nuevo parque?**
R: Nombre, dirección, coordenadas geográficas, área total y tipo de parque son campos obligatorios.

**P: ¿Puedo modificar las coordenadas de un parque existente?**
R: Sí, desde la opción "Editar" del parque específico. Asegúrese de verificar la precisión de las nuevas coordenadas.

**P: ¿Cómo subo múltiples fotos de un parque?**
R: En la página de gestión del parque, use la sección "Gestión de Imágenes" para subir hasta 10 fotos adicionales a la imagen principal.

### Evaluaciones

**P: ¿Cómo se calculan los promedios de evaluación?**
R: Se promedian todas las calificaciones válidas recibidas. Las evaluaciones sin calificación numérica no afectan el promedio.

**P: ¿Puedo eliminar evaluaciones inapropiadas?**
R: Solo usuarios con permisos de Super Administrador pueden eliminar evaluaciones. Se recomienda marcarlas como "revisadas" en lugar de eliminarlas.

### Amenidades

**P: ¿Cómo creo una nueva categoría de amenidad?**
R: En el Dashboard de Amenidades, use la opción "Gestionar Categorías" para crear nuevos tipos de servicios.

**P: ¿Puedo asignar la misma amenidad a múltiples parques?**
R: Sí, las amenidades pueden asignarse a tantos parques como sea necesario.

### Problemas Técnicos

**P: Las imágenes no cargan correctamente, ¿qué hago?**
R: Verifique que las imágenes sean JPG, PNG o WebP y no excedan 5MB. Limpie la caché del navegador.

**P: ¿Por qué no puedo editar ciertos parques?**
R: Verifique sus permisos de usuario. Es posible que solo tenga acceso de lectura o a parques específicos.
        `
      },
      {
        id: 'soporte',
        title: 'Soporte Técnico',
        level: 1,
        content: `
### Canales de Comunicación

#### Soporte Inmediato
- **Chat en Vivo**: Disponible en horario de oficina (8:00 AM - 6:00 PM)
- **Teléfono**: +52 (33) 1234-5678 ext. 100
- **WhatsApp Business**: +52 (33) 9876-5432

#### Soporte por Email
- **Técnico**: soporte.parksys@guadalajara.gob.mx
- **Administrativo**: admin.parksys@guadalajara.gob.mx
- **Urgencias**: urgencias.parksys@guadalajara.gob.mx

### Procedimiento de Reporte de Problemas

#### Información Requerida
1. **Usuario**: Nombre y rol en el sistema
2. **Fecha/Hora**: Cuándo ocurrió el problema
3. **Acción**: Qué estaba intentando hacer
4. **Error**: Mensaje específico o comportamiento inesperado
5. **Navegador**: Tipo y versión del navegador utilizado
6. **Capturas**: Screenshots que muestren el problema

#### Categorías de Urgencia
**Crítica (Respuesta en 1 hora):**
- Sistema completamente inaccesible
- Pérdida de datos confirmada
- Problemas de seguridad

**Alta (Respuesta en 4 horas):**
- Funcionalidades principales no disponibles
- Errores que impiden operación normal
- Problemas de rendimiento severos

**Media (Respuesta en 24 horas):**
- Funcionalidades específicas con problemas
- Errores menores que permiten trabajo alternativo
- Solicitudes de mejoras importantes

### Acuerdos de Nivel de Servicio (SLA)

#### Disponibilidad del Sistema
- **Objetivo**: 99.5% de uptime mensual
- **Horario de Operación**: 24/7/365
- **Tiempo de Respuesta**: < 2 segundos para operaciones básicas
- **Tiempo de Carga**: < 5 segundos para reportes complejos

#### Soporte Técnico
- **Horario de Atención**: Lunes a viernes 8:00 AM - 6:00 PM
- **Emergencias**: 24/7 para problemas críticos
- **Resolución**: 90% de tickets resueltos en tiempo acordado
- **Satisfacción**: Meta de 95% de satisfacción en encuestas
        `
      }
    ]
  },
  'actividades-manual': {
    title: 'Manual Completo - Módulo de Actividades',
    icon: <Activity className="h-5 w-5" />,
    sections: [
      {
        id: 'intro',
        title: 'Introducción al Módulo de Actividades',
        level: 1,
        content: `
El **Módulo de Actividades** es una herramienta integral diseñada para la gestión completa de actividades recreativas, culturales, deportivas y educativas en los parques urbanos de Guadalajara. Este módulo permite la planificación, organización, seguimiento y análisis de todas las actividades que se realizan en el sistema de parques.

### ¿Para qué sirve?
- **Planificar** y organizar actividades en todos los parques
- **Gestionar** instructores, participantes y recursos
- **Monitorear** la participación ciudadana y satisfacción
- **Analizar** tendencias de participación y preferencias
- **Administrar** categorías, horarios y capacidades
- **Controlar** inscripciones y pagos (cuando aplique)

### Componentes del Módulo
El módulo está organizado en varias secciones principales:

1. **Gestión de Actividades**: Creación, edición y administración
2. **Categorías**: Organización por tipos de actividades
3. **Instructores**: Gestión del personal capacitado
4. **Inscripciones**: Control de participantes y cupos
5. **Horarios**: Programación y calendarios
6. **Reportes**: Análisis y métricas de participación

### Acceso al Módulo
1. Inicie sesión en ParkSys con sus credenciales administrativas
2. En el sidebar administrativo, localice la sección **"Actividades"**
3. Expanda el menú para acceder a las diferentes funcionalidades
4. Use los filtros y herramientas según sus permisos asignados
        `
      },
      {
        id: 'listado',
        title: 'Listado y Gestión de Actividades',
        level: 1,
        content: `
### Descripción General
La sección de **Listado de Actividades** proporciona una vista completa de todas las actividades programadas, activas y finalizadas en el sistema. Es el hub central para administrar el catálogo completo de ofertas recreativas.

### Características Principales

#### Vista Unificada
- **Catálogo Completo**: Todas las actividades del sistema en una sola vista
- **Información Detallada**: Estado, instructor, parque, horarios y participación
- **Filtros Avanzados**: Por categoría, estado, instructor, parque y fechas
- **Búsqueda Inteligente**: Por nombre, descripción o palabras clave

#### Estados de Actividades
Las actividades pueden tener los siguientes estados:
- **🟢 Activa**: Disponible para inscripciones
- **🟡 Programada**: Definida pero aún no iniciada
- **🔴 Cancelada**: Suspendida temporalmente
- **⚫ Finalizada**: Completada y archivada
- **🟠 En Pausa**: Temporalmente suspendida

### Funcionalidades de Gestión

#### Creación de Nuevas Actividades
**Información Básica Requerida:**
- **Nombre**: Título descriptivo de la actividad
- **Descripción**: Detalles completos del contenido
- **Categoría**: Clasificación por tipo (deportiva, cultural, etc.)
- **Instructor**: Personal asignado responsable
- **Parque**: Ubicación donde se realizará
- **Capacidad**: Número máximo de participantes

**Configuración Avanzada:**
- **Horarios**: Días y horas específicas
- **Duración**: Tiempo por sesión
- **Nivel**: Principiante, intermedio, avanzado
- **Edad**: Rangos de edad permitidos
- **Costo**: Gratuita o con tarifa específica
- **Requisitos**: Materiales o condiciones necesarias

#### Gestión de Imágenes
- **Imagen Principal**: Foto representativa de la actividad
- **Galería**: Hasta 5 imágenes adicionales
- **Formatos Soportados**: JPG, PNG, WebP (máximo 5MB)
- **Optimización Automática**: Redimensionado para web

### Acciones Disponibles

#### Por Actividad Individual
1. **👁️ Ver Detalles**: Información completa y estadísticas
2. **✏️ Editar**: Modificar cualquier aspecto de la actividad
3. **📸 Gestionar Imágenes**: Subir, cambiar o eliminar fotos
4. **👥 Ver Inscripciones**: Lista de participantes actuales
5. **📊 Estadísticas**: Métricas de participación y satisfacción
6. **🗑️ Eliminar**: Cancelar permanentemente (solo administradores)

#### Acciones Masivas
- **Exportar**: Generar reportes en Excel/CSV
- **Cambiar Estado**: Modificar múltiples actividades
- **Asignar Instructor**: Reasignar responsables
- **Duplicar**: Crear copias para nuevos períodos
        `
      },
      {
        id: 'categorias',
        title: 'Gestión de Categorías',
        level: 1,
        content: `
### Descripción del Sistema
Las **Categorías de Actividades** permiten organizar y clasificar toda la oferta recreativa de manera coherente y fácil de navegar tanto para administradores como para ciudadanos.

### Categorías Predeterminadas del Sistema

#### 🏃 Deportivo
- **Descripción**: Actividades deportivas y de acondicionamiento físico
- **Ejemplos**: Fútbol, básquetbol, atletismo, natación, gimnasia
- **Color**: Rojo (#e74c3c)
- **Características**: Actividad física intensa y competitiva

#### 💚 Recreación y Bienestar  
- **Descripción**: Actividades recreativas para el bienestar físico y mental
- **Ejemplos**: Yoga, tai chi, caminatas, meditación, relajación
- **Color**: Verde (#2ecc71)
- **Características**: Salud física y mental, relajación

#### 🎨 Arte y Cultura
- **Descripción**: Eventos culturales, artísticos y creativos
- **Ejemplos**: Pintura, danza, música, teatro, exposiciones
- **Color**: Púrpura (#9b59b6)
- **Características**: Desarrollo artístico y expresión creativa

#### 🌱 Naturaleza y Ciencia
- **Descripción**: Actividades de conservación, medio ambiente y educación científica
- **Ejemplos**: Jardinería, observación de aves, talleres ecológicos, experimentos
- **Color**: Verde Oscuro (#27ae60)
- **Características**: Conciencia ambiental y conocimiento científico

#### 👥 Comunidad
- **Descripción**: Eventos de participación y cohesión comunitaria
- **Ejemplos**: Reuniones vecinales, festivales comunitarios, actividades solidarias
- **Color**: Azul (#3498db)
- **Características**: Participación ciudadana y fortalecimiento social

#### 📅 Eventos de Temporada
- **Descripción**: Celebraciones y eventos especiales según temporadas
- **Ejemplos**: Día del niño, festivales navideños, celebraciones patrias
- **Color**: Naranja (#f39c12)
- **Características**: Celebraciones especiales y eventos únicos

### Administración de Categorías

#### Crear Nueva Categoría
**Proceso paso a paso:**
1. Acceda a **Actividades > Categorías**
2. Haga clic en **"Nueva Categoría"**
3. Complete la información requerida:
   - **Nombre**: Identificación clara
   - **Descripción**: Explicación del propósito
   - **Color**: Código hexadecimal para identificación visual
   - **Icono**: Símbolo representativo
   - **Estado**: Activa o inactiva

#### Modificar Categorías Existentes
- **Edición**: Cambiar nombre, descripción o color
- **Activar/Desactivar**: Controlar disponibilidad
- **Reorganizar**: Cambiar orden de aparición
- **Estadísticas**: Ver cantidad de actividades por categoría

### Impacto en el Sistema

#### Para Administradores
- **Organización**: Mejor estructura del catálogo
- **Reportes**: Análisis por tipo de actividad
- **Filtros**: Búsquedas más eficientes
- **Planificación**: Equilibrio en la oferta

#### Para Ciudadanos
- **Navegación**: Encontrar actividades de interés fácilmente
- **Identificación**: Reconocimiento visual rápido
- **Búsqueda**: Filtros intuitivos en el portal público
- **Experiencia**: Interface más organizada y clara
        `
      },
      {
        id: 'instructores',
        title: 'Gestión de Instructores',
        level: 1,
        content: `
### Descripción del Sistema
La **Gestión de Instructores** es fundamental para asegurar la calidad y profesionalismo de todas las actividades. Este módulo maneja desde el registro hasta la evaluación continua del personal.

### Proceso de Registro

#### Invitación por Email
El sistema utiliza un proceso de invitación controlado:

1. **Generación de Invitación**: Administrador crea invitación con datos básicos
2. **Envío Automático**: Email con enlace único y token de seguridad
3. **Registro Completo**: Instructor completa su perfil detallado
4. **Validación**: Revisión administrativa antes de activación

#### Información del Perfil
**Datos Personales:**
- Nombre completo y datos de contacto
- Fotografía de perfil profesional
- Currículum vitae (PDF/DOC)
- Experiencia y certificaciones

**Información Profesional:**
- Especialidades y áreas de expertise
- Años de experiencia
- Tarifas por hora (si aplica)
- Disponibilidad de días y horarios
- Parque preferido de trabajo

### Estados del Instructor

#### 🟢 Activo
- Disponible para asignación a actividades
- Perfil visible en listados internos
- Puede recibir evaluaciones
- Acceso completo al sistema

#### 🟡 Pendiente
- Registro iniciado pero incompleto
- En proceso de validación administrativa
- Sin acceso a funcionalidades
- Requiere completar documentación

#### 🔴 Inactivo
- Temporalmente fuera del sistema
- No disponible para nuevas actividades
- Mantiene historial y evaluaciones
- Puede reactivarse cuando sea necesario

### Funcionalidades de Gestión

#### Perfil Detallado del Instructor
**Vista Completa Incluye:**
- **Información Personal**: Datos básicos y contacto
- **Experiencia**: Historial y especialidades
- **Actividades Actuales**: Programación activa
- **Evaluaciones Recibidas**: Calificaciones y comentarios
- **Currículum**: Descarga/visualización de CV
- **Estadísticas**: Métricas de desempeño

#### Asignación a Actividades
**Proceso de Asignación:**
1. Desde la creación/edición de actividad
2. Selección de instructor disponible
3. Verificación de compatibilidad (horarios, especialidad)
4. Confirmación automática o manual
5. Notificación al instructor

#### Sistema de Evaluaciones
**Evaluación Pública**: Los participantes pueden evaluar instructores
**Evaluación Administrativa**: Revisiones internas periódicas
**Criterios de Evaluación:**
- Conocimiento técnico
- Habilidades de comunicación
- Metodología de enseñanza
- Puntualidad y profesionalismo
- Desempeño general

### Métricas y Reportes

#### Indicadores por Instructor
- **Calificación Promedio**: Basada en evaluaciones recibidas
- **Actividades Impartidas**: Histórico completo
- **Participantes Atendidos**: Total de personas impactadas
- **Índice de Satisfacción**: Porcentaje de evaluaciones positivas

#### Reportes Disponibles
- **Listado Completo**: Todos los instructores con filtros
- **Evaluaciones Detalladas**: Análisis de desempeño
- **Actividad por Período**: Productividad temporal
- **Certificaciones**: Validez de documentos
        `
      },
      {
        id: 'inscripciones',
        title: 'Sistema de Inscripciones',
        level: 1,
        content: `
### Descripción General
El **Sistema de Inscripciones** gestiona la participación ciudadana en actividades, controlando cupos, listas de espera, confirmaciones y seguimiento de asistencia.

### Tipos de Inscripción

#### 🆓 Inscripción Gratuita
- **Proceso Simple**: Solo datos básicos requeridos
- **Confirmación Inmediata**: Sin procesos de pago
- **Control de Cupo**: Límite por capacidad de actividad
- **Lista de Espera**: Automática cuando se llena

#### 💳 Inscripción con Pago
- **Datos Completos**: Información personal y de pago
- **Reserva Temporal**: 15 minutos para completar pago
- **Confirmación**: Solo después del pago exitoso
- **Facturación**: Comprobante automático

### Proceso de Inscripción

#### Para el Ciudadano
1. **Selección**: Elegir actividad de interés
2. **Verificación**: Confirmar horarios y requisitos
3. **Registro**: Completar formulario de inscripción
4. **Pago** (si aplica): Procesar tarifa correspondiente
5. **Confirmación**: Recibir comprobante por email

#### Estados de Inscripción
- **✅ Confirmada**: Lugar asegurado en la actividad
- **⏳ Pendiente**: En proceso de validación/pago
- **📋 En Lista de Espera**: Sin cupo disponible actualmente
- **❌ Cancelada**: Anulada por el participante
- **⚠️ No Presentado**: No asistió a las sesiones

### Gestión Administrativa

#### Panel de Control
**Vista por Actividad:**
- Lista completa de inscritos
- Estado de cada inscripción
- Datos de contacto de participantes
- Historial de asistencias
- Pagos realizados (si aplica)

**Acciones Disponibles:**
- **✏️ Editar Inscripción**: Modificar datos del participante
- **📧 Enviar Comunicación**: Email directo al inscrito
- **📊 Marcar Asistencia**: Control de presencia en sesiones
- **💰 Gestionar Pago**: Ver estado y procesar reembolsos
- **🗑️ Cancelar Inscripción**: Liberar cupo

#### Lista de Espera
**Funcionamiento Automático:**
- Se activa cuando se alcanza capacidad máxima
- Los nuevos interesados se agregan automáticamente
- Notificación inmediata cuando se libera cupo
- Tiempo límite de 48 horas para confirmar

### Comunicaciones Automáticas

#### Emails de Confirmación
**Contenido Incluye:**
- Detalles completos de la actividad
- Ubicación exacta y cómo llegar
- Horarios y fechas de sesiones
- Información del instructor
- Requisitos y materiales necesarios
- Contacto para dudas o cancelaciones

#### Recordatorios
- **24 horas antes**: Primera sesión
- **2 horas antes**: Cada sesión regular
- **Cambios**: Notificación inmediata de modificaciones
- **Cancelaciones**: Aviso con opciones alternatives

### Reportes y Estadísticas

#### Métricas por Actividad
- **Ocupación**: Porcentaje de cupo utilizado
- **Lista de Espera**: Demanda no cubierta
- **Asistencia Real**: Participantes que efectivamente asisten
- **Satisfacción**: Evaluaciones post-actividad

#### Análisis de Participación
- **Demografía**: Edad, género, ubicación de participantes
- **Preferencias**: Categorías más demandadas
- **Comportamiento**: Patrones de inscripción y asistencia
- **Retención**: Participantes que repiten actividades
        `
      },
      {
        id: 'horarios',
        title: 'Gestión de Horarios y Calendarios',
        level: 1,
        content: `
### Sistema de Programación
La **Gestión de Horarios** permite crear calendarios flexibles y detallados para todas las actividades, considerando disponibilidad de espacios, instructores y recursos.

### Configuración de Horarios

#### Tipos de Programación
**🔄 Recurrente Regular:**
- Mismos días y horas cada semana
- Ejemplo: Lunes, Miércoles, Viernes 6:00 PM
- Duración fija por sesión
- Fechas de inicio y fin definidas

**📅 Calendario Personalizado:**
- Fechas específicas no regulares
- Horarios variables por sesión
- Actividades de temporada o especiales
- Eventos únicos o esporádicos

**⚡ Intensivos:**
- Actividades concentradas en pocos días
- Ejemplo: Taller de fin de semana
- Mayor duración por sesión
- Formato tipo campamento o curso

### Herramientas de Programación

#### Vista de Calendario
**Características:**
- **Vista Mensual**: Panorámica general de actividades
- **Vista Semanal**: Detalle de horarios por día
- **Vista Diaria**: Programación específica por fecha
- **Filtros**: Por parque, instructor, categoría o actividad

#### Gestión de Conflictos
**Detección Automática:**
- Solapamiento de horarios del mismo instructor
- Uso simultáneo del mismo espacio
- Exceso de actividades en horario pico
- Conflictos con mantenimiento de instalaciones

**Resolución Asistida:**
- Sugerencias de horarios alternativos
- Notificaciones a instructores afectados
- Reprogramación automática cuando sea posible
- Alertas para administradores

### Administración de Espacios

#### Asignación de Ubicaciones
**Por Actividad:**
- Espacios techados vs. al aire libre
- Capacidad del área vs. participantes esperados
- Requisitos especiales (agua, electricidad, etc.)
- Proximidad a servicios (baños, estacionamiento)

**Control de Disponibilidad:**
- Calendario de mantenimiento
- Eventos especiales que afecten disponibilidad
- Condiciones climáticas (para espacios exteriores)
- Reservas de terceros o eventos municipales

### Flexibilidad Operativa

#### Cambios y Reprogramaciones
**Proceso Controlado:**
1. **Identificar Necesidad**: Cambio solicitado o imprevisto
2. **Evaluar Impact**: Participantes, instructor, espacio afectados
3. **Proponer Alternativas**: Nuevos horarios disponibles
4. **Comunicar Cambios**: Notificación a todos los involucrados
5. **Confirmar Aceptación**: Validar que el cambio es viable

#### Cancelaciones Excepcionales
**Causas Comunes:**
- Condiciones climáticas adversas
- Enfermedad del instructor
- Problemas en las instalaciones
- Emergencias o eventos imprevisto

**Protocolo de Cancelación:**
- Notificación inmediata a participantes
- Opciones de reprogramación
- Política de reembolsos (si aplica)
- Registro del motivo para estadísticas

### Optimización de Recursos

#### Análisis de Utilización
**Métricas Clave:**
- **Ocupación por Horario**: Identificar picos y valles
- **Utilización de Espacios**: Eficiencia de instalaciones
- **Carga de Instructores**: Distribución equitativa
- **Preferencias Ciudadanas**: Horarios más demandados

#### Recomendaciones Automáticas
**El sistema sugiere:**
- Horarios alternativos para nuevas actividades
- Redistribución para mejor aprovechamiento
- Identificación de espacios subutilizados
- Oportunidades para ampliar oferta en horarios populares
        `
      },
      {
        id: 'reportes',
        title: 'Reportes y Análisis',
        level: 1,
        content: `
### Dashboard Ejecutivo
El **Sistema de Reportes** proporciona insights valiosos sobre el desempeño del programa de actividades, participación ciudadana y utilización de recursos.

### Métricas Principales

#### 📊 Indicadores Clave (KPIs)
**Participación:**
- **Total de Actividades**: Cantidad de programas ofrecidos
- **Participantes Únicos**: Ciudadanos diferentes que participan
- **Sesiones Realizadas**: Encuentros efectivamente realizados
- **Tasa de Ocupación**: Porcentaje de cupos utilizados

**Satisfacción:**
- **Calificación Promedio**: Evaluaciones de participantes (1-5 estrellas)
- **Actividades Mejor Calificadas**: Top 10 por satisfacción
- **Índice de Retención**: Participantes que repiten actividades
- **Recomendaciones**: Porcentaje de participantes que recomendarían

#### 📈 Análisis de Tendencias
**Participación por Período:**
- Evolución mensual de inscripciones
- Estacionalidad en diferentes tipos de actividades
- Comparativas año con año
- Proyecciones basadas en tendencias históricas

**Demografía de Participantes:**
- Distribución por rangos de edad
- Participación por género
- Procedencia geográfica (colonias, municipios)
- Preferencias por categoría de actividad

### Reportes Especializados

#### 🎯 Por Categoría de Actividad
**Análisis Comparativo:**
- **Deportivas**: Participación, horarios preferidos, espacios más utilizados
- **Culturales**: Talleres más populares, necesidad de materiales, creatividad mostrada
- **Educativas**: Efectividad del aprendizaje, continuidad en cursos
- **Familiares**: Composición de grupos, satisfacción intergeneracional
- **Ambientales**: Impacto en conciencia ecológica, proyectos realizados

#### 🏞️ Por Parque
**Desempeño por Ubicación:**
- Número total de actividades por parque
- Participación promedio por ubicación
- Categorías más exitosas en cada espacio
- Utilización de instalaciones específicas
- Análisis de accesibilidad y transporte

#### 👨‍🏫 Por Instructor
**Evaluación de Desempeño:**
- Actividades impartidas por período
- Calificaciones promedio recibidas
- Número total de participantes impactados
- Especialidades más demandadas
- Desarrollo profesional y capacitación

### Herramientas de Análisis

#### Filtros Avanzados
**Segmentación Temporal:**
- Filtro por fechas específicas
- Comparación entre períodos
- Análisis estacional
- Tendencias a largo plazo

**Segmentación Geográfica:**
- Por parque individual
- Por zona de la ciudad
- Por accesibilidad (transporte público)
- Por demografía del área

#### Exportación de Datos
**Formatos Disponibles:**
- **Excel**: Análisis detallado y pivot tables
- **PDF**: Reportes ejecutivos presentables
- **CSV**: Integración con otros sistemas
- **JSON**: Integración con APIs externas

### Análisis Predictivo

#### Proyecciones de Demanda
**Factores Considerados:**
- Tendencias históricas de participación
- Estacionalidad por tipo de actividad
- Crecimiento demográfico del área
- Nuevas instalaciones o mejoras planificadas

#### Recomendaciones Estratégicas
**El sistema sugiere:**
- Nuevas categorías de actividades basadas en gaps identificados
- Horarios alternativos para maximizar participación
- Parques con potencial para ampliar oferta
- Instructores especializados necesarios para cubrir demanda

### Impacto Social

#### Indicadores de Beneficio Comunitario
**Medición Cuantitativa:**
- **Cobertura Poblacional**: Porcentaje de ciudadanos que participan
- **Inclusión**: Diversidad demográfica en participantes
- **Accesibilidad**: Facilidad de acceso para diferentes grupos
- **Continuidad**: Participantes que mantienen actividad regular

**Medición Cualitativa:**
- Testimonios y casos de éxito documentados
- Mejoras en salud y bienestar reportadas
- Desarrollo de habilidades y talentos
- Fortalecimiento de vínculos comunitarios

### Benchmarking

#### Comparación con Estándares
**Referentes Nacionales:**
- Sistemas similares en otras ciudades mexicanas
- Mejores prácticas documentadas
- Indicadores de ciudades modelo

**Referentes Internacionales:**
- Programas exitosos en Latinoamérica
- Estándares ONU para espacios públicos
- Innovations en gestión de parques urbanos
        `
      },
      {
        id: 'mejores-practicas',
        title: 'Mejores Prácticas y Recomendaciones',
        level: 1,
        content: `
### Planificación Estratégica

#### Desarrollo de Programación
**Principios Fundamentales:**
1. **Diversidad**: Ofrecer actividades para todos los gustos y edades
2. **Inclusión**: Considerar necesidades especiales y diferentes capacidades
3. **Calidad**: Priorizar instructores capacitados y materiales adecuados
4. **Sostenibilidad**: Actividades que puedan mantenerse a largo plazo

**Proceso de Planificación:**
- **Diagnóstico**: Análisis de necesidades comunitarias
- **Oferta Balanceada**: Mix equilibrado entre categorías
- **Recursos Disponibles**: Evaluación realista de capacidades
- **Evaluación Continua**: Ajustes basados en resultados

#### Gestión de Recursos Humanos
**Selección de Instructores:**
1. **Criterios Técnicos**: Certificaciones y experiencia relevante
2. **Habilidades Pedagógicas**: Capacidad de transmitir conocimiento
3. **Valores**: Alineación con misión del programa
4. **Flexibilidad**: Adaptación a diferentes grupos y situaciones

**Desarrollo Continuo:**
- Capacitación regular en nuevas metodologías
- Intercambio de experiencias entre instructores
- Evaluación 360° (participantes, pares, supervisores)
- Plan de carrera y reconocimientos

### Comunicación Efectiva

#### Promoción de Actividades
**Canales Múltiples:**
- **Redes Sociales**: Instagram, Facebook, TikTok para audiencias jóvenes
- **WhatsApp**: Grupos por colonias y tipos de actividades
- **Carteles**: En parques, centros comunitarios y espacios públicos
- **Radio Local**: Programas matutinos y de tarde

**Mensajes Clave:**
- Beneficios específicos de cada actividad
- Facilidad de inscripción y participación
- Testimonios de participantes satisfechos
- Información clara sobre horarios y ubicaciones

#### Gestión de Expectativas
**Comunicación Clara:**
- Descripción precisa del nivel requerido
- Materiales que debe aportar el participante
- Política de faltas y cancelaciones
- Certificaciones o reconocimientos a obtener

### Gestión Operativa

#### Control de Calidad
**Estándares Mínimos:**
- Puntualidad y asistencia del instructor
- Materiales y equipos en buen estado
- Espacios limpios y seguros
- Seguimiento de protocolos de seguridad

**Monitoreo Continuo:**
- Visitas aleatorias a actividades en curso
- Encuestas regulares de satisfacción
- Buzón de sugerencias y quejas
- Reuniones periódicas con instructores

#### Gestión de Crisis
**Situaciones Comunes y Respuestas:**
- **Clima Adverso**: Protocolos para actividades exteriores
- **Ausencia de Instructor**: Instructores de respaldo capacitados
- **Accidentes Menores**: Primeros auxilios y seguimiento
- **Baja Participación**: Estrategias de revitalización

### Innovación y Mejora Continua

#### Incorporación de Tecnología
**Herramientas Digitales:**
- Apps móviles para inscripciones y seguimiento
- Plataformas de video para actividades híbridas
- Gamificación para aumentar engagement
- Analytics para optimizar programación

#### Adaptación a Nuevas Tendencias
**Monitoreo de Tendencias:**
- Seguimiento de redes sociales y tendencias fitness
- Feedback continuo de participantes jóvenes
- Investigación de programas exitosos en otras ciudades
- Experimentación controlada con nuevos formatos

### Sostenibilidad del Programa

#### Financiera
**Estrategias de Financiamiento:**
- Diversificación de fuentes (gubernamental, privada, internacional)
- Actividades autofinanciables para subsidiar programas gratuitos
- Alianzas con empresas para patrocinio
- Aplicación a fondos nacionales e internacionales

#### Ambiental
**Prácticas Eco-Amigables:**
- Preferencia por materiales reutilizables
- Actividades que promuevan conciencia ambiental
- Uso eficiente de recursos (agua, electricidad)
- Conexión con la naturaleza en espacios verdes

#### Social
**Construcción de Comunidad:**
- Eventos especiales que integren diferentes actividades
- Reconocimiento público a participantes destacados
- Oportunidades de liderazgo para participantes avanzados
- Vínculos con organizaciones comunitarias locales
        `
      },
      {
        id: 'faq',
        title: 'Preguntas Frecuentes',
        level: 1,
        content: `
### Gestión General

**P: ¿Cómo accedo al módulo de Actividades?**
R: Inicie sesión en ParkSys, vaya al sidebar administrativo, expanda "Actividades" y seleccione el submenu requerido según sus permisos asignados.

**P: ¿Puedo gestionar actividades de múltiples parques simultáneamente?**
R: Sí, el sistema permite filtrar por múltiples parques o ver todas las actividades del sistema en una vista unificada.

**P: ¿Con qué frecuencia se actualizan los datos en el dashboard?**
R: Los datos se actualizan en tiempo real. Las métricas reflejan información hasta el último registro ingresado.

### Creación y Gestión de Actividades

**P: ¿Qué información es obligatoria para crear una nueva actividad?**
R: Nombre, descripción, categoría, instructor asignado, parque donde se realizará, horarios y capacidad máxima son campos obligatorios.

**P: ¿Puedo duplicar una actividad existente?**
R: Sí, use la función "Duplicar" para crear una copia y luego modifique las fechas, horarios o detalles específicos según sea necesario.

**P: ¿Cómo cambio el instructor de una actividad?**
R: Desde la edición de la actividad, seleccione un nuevo instructor del dropdown. El sistema verificará disponibilidad de horarios automáticamente.

**P: ¿Puedo subir múltiples imágenes por actividad?**
R: Sí, cada actividad puede tener una imagen principal y hasta 5 imágenes adicionales en la galería.

### Gestión de Instructores

**P: ¿Cómo invito a un nuevo instructor?**
R: En la sección Instructores, use "Nuevo Instructor", ingrese los datos básicos y el sistema enviará automáticamente un email de invitación con enlace de registro.

**P: ¿Qué hago si un instructor no recibe el email de invitación?**
R: Verifique que el email sea correcto, revise carpeta de spam, y puede reenviar la invitación desde el panel administrativo.

**P: ¿Cómo evalúan los ciudadanos a los instructores?**
R: Los participantes reciben automáticamente un enlace de evaluación al finalizar la actividad, donde pueden calificar diferentes aspectos del desempeño.

### Inscripciones y Participantes

**P: ¿Cómo manejo las listas de espera?**
R: El sistema maneja automáticamente las listas de espera. Cuando se libera un cupo, notifica automáticamente al siguiente en lista con 48 horas para confirmar.

**P: ¿Puedo modificar datos de un participante inscrito?**
R: Sí, desde el panel de inscripciones de cada actividad puede editar la información de contacto y otros datos relevantes.

**P: ¿Cómo proceso reembolsos para actividades canceladas?**
R: En el panel de gestión de pagos, seleccione las inscripciones afectadas y use la función "Procesar Reembolso" con la justificación correspondiente.

### Categorías y Organización

**P: ¿Puedo crear nuevas categorías de actividades?**
R: Sí, en la sección Categorías puede crear nuevos tipos con nombre, descripción, color identificativo e ícono representativo.

**P: ¿Cómo reorganizo las categorías existentes?**
R: Use la función "Reorganizar" para cambiar el orden de aparición tanto en el panel administrativo como en el portal público.

**P: ¿Puedo tener subcategorías?**
R: Actualmente el sistema maneja un nivel de categorización. Para mayor especificidad, use tags o palabras clave en la descripción.

### Horarios y Programación

**P: ¿Cómo evito conflictos de horarios entre actividades?**
R: El sistema detecta automáticamente conflictos cuando se programa una actividad. Recibirá alertas si hay solapamiento de instructores o espacios.

**P: ¿Puedo programar actividades irregulares (no semanales)?**
R: Sí, use el modo "Calendario Personalizado" para actividades con fechas específicas no regulares.

**P: ¿Qué hago si necesito cancelar una sesión por mal clima?**
R: Use la función "Cancelar Sesión" especificando el motivo. El sistema notificará automáticamente a todos los participantes y sugerirá fechas de reposición.

### Reportes y Análisis

**P: ¿Cómo genero un reporte de participación mensual?**
R: En la sección Reportes, seleccione el rango de fechas, filtre por parques o categorías según necesite, y exporte en el formato deseado (Excel/PDF).

**P: ¿Puedo ver qué actividades tienen mayor demanda?**
R: Sí, el dashboard muestra métricas de ocupación y hay reportes específicos de "Actividades Más Demandadas" con análisis de listas de espera.

**P: ¿Cómo mido la satisfacción de los participantes?**
R: El sistema recopila automáticamente evaluaciones post-actividad y las presenta en métricas consolidadas por instructor, actividad y período.

### Problemas Técnicos

**P: ¿Por qué no puedo editar cierta actividad?**
R: Verifique sus permisos de usuario. Es posible que solo tenga permisos de lectura o acceso limitado a ciertos parques o categorías.

**P: Las notificaciones por email no se están enviando, ¿qué reviso?**
R: Verifique la configuración del servidor de email en configuraciones del sistema y contacte al administrador técnico si persiste el problema.

**P: ¿Cómo restauro una actividad eliminada accidentalmente?**
R: Solo usuarios con permisos de Super Administrador pueden recuperar registros eliminados. Contacte inmediatamente al soporte técnico con los detalles específicos.
        `
      },
      {
        id: 'soporte',
        title: 'Soporte Técnico y Contacto',
        level: 1,
        content: `
### Canales de Comunicación

#### Soporte Inmediato
- **Chat en Vivo**: Disponible en horario de oficina (8:00 AM - 6:00 PM)
- **Teléfono**: +52 (33) 1234-5678 ext. 200
- **WhatsApp Business**: +52 (33) 9876-5432

#### Soporte por Email
- **Técnico**: soporte.actividades@guadalajara.gob.mx
- **Administrativo**: admin.actividades@guadalajara.gob.mx
- **Instructores**: instructores.parksys@guadalajara.gob.mx
- **Urgencias**: urgencias.parksys@guadalajara.gob.mx

### Procedimiento de Reporte de Problemas

#### Información Requerida para Tickets
1. **Usuario**: Nombre completo y rol en el sistema
2. **Módulo Afectado**: Actividades específicas o sección general
3. **Fecha/Hora**: Cuándo ocurrió el problema
4. **Acción Realizada**: Qué estaba intentando hacer específicamente
5. **Error Observado**: Mensaje exacto o comportamiento anormal
6. **Navegador/Dispositivo**: Especificaciones técnicas
7. **Screenshots**: Capturas que muestren el problema claramente

#### Categorías de Prioridad

**🔴 Crítica (Respuesta en 1 hora):**
- Sistema de actividades completamente inaccesible
- Pérdida confirmada de inscripciones o datos de participantes
- Problemas de seguridad en información de instructores
- Fallas en sistema de pagos que afecten ingresos

**🟠 Alta (Respuesta en 4 horas):**
- Funcionalidades principales no disponibles
- Errores en generación de reportes importantes
- Problemas con notificaciones automáticas
- Conflictos en programación de horarios

**🟡 Media (Respuesta en 24 horas):**
- Funcionalidades específicas con problemas menores
- Errores de interfaz que no impiden operación
- Solicitudes de mejoras en flujos existentes
- Problemas de rendimiento no críticos

**🟢 Baja (Respuesta en 72 horas):**
- Consultas sobre uso correcto del sistema
- Solicitudes de capacitación adicional
- Sugerencias de nuevas funcionalidades
- Reportes de errores cosméticos menores

### Recursos de Capacitación

#### Documentación Disponible
- **Manual Completo**: Este documento actualizado mensualmente
- **Videos Tutoriales**: Biblioteca en el portal interno
- **Casos de Uso**: Ejemplos prácticos paso a paso
- **FAQ Extendida**: Preguntas más frecuentes con respuestas detalladas

#### Capacitación Presencial
- **Sesiones Grupales**: Mensuales para nuevos usuarios
- **Capacitación Especializada**: Para administradores avanzados
- **Talleres Temáticos**: Según necesidades específicas identificadas
- **Soporte en Sitio**: Disponible para implementaciones complejas

### Acuerdos de Nivel de Servicio (SLA)

#### Disponibilidad del Sistema
- **Objetivo**: 99.5% de uptime mensual para módulo de Actividades
- **Horario Crítico**: 6:00 AM - 10:00 PM todos los días
- **Mantenimiento Programado**: Domingos 2:00 AM - 4:00 AM con aviso previo
- **Tiempo de Respuesta**: < 2 segundos para operaciones básicas

#### Soporte de Usuarios
- **Horario de Atención**: Lunes a viernes 8:00 AM - 6:00 PM
- **Emergencias**: 24/7 solo para problemas críticos
- **Resolución**: 90% de tickets resueltos dentro del SLA establecido
- **Satisfacción**: Meta de 95% de satisfacción en encuestas de servicio

### Contactos Especializados

#### Equipo de Actividades
- **Coordinador General**: coord.actividades@guadalajara.gob.mx
- **Responsable Técnico**: tech.actividades@guadalajara.gob.mx
- **Gestión de Instructores**: instructores.coord@guadalajara.gob.mx

#### Escalación de Problemas
**Nivel 1**: Soporte técnico general
**Nivel 2**: Especialistas en módulo de actividades
**Nivel 3**: Arquitectos de sistema y desarrollo
**Nivel 4**: Dirección técnica y toma de decisiones críticas

### Mejora Continua

#### Feedback del Usuario
- **Encuestas Trimestrales**: Evaluación de satisfacción y necesidades
- **Grupos Focales**: Sesiones con usuarios avanzados
- **Buzón de Sugerencias**: Canal permanente para ideas de mejora
- **Beta Testing**: Participación en pruebas de nuevas funcionalidades

#### Actualizaciones del Sistema
- **Versiones Menores**: Cada 2 semanas con correcciones y mejoras menores
- **Versiones Mayores**: Cada 3-4 meses con nuevas funcionalidades
- **Hotfixes**: Dentro de 24 horas para problemas críticos
- **Comunicación**: Notificación previa de todos los cambios importantes
        `
      }
    ]
  }
};

export function DocumentationViewer({ documentId, onBack }: DocumentationViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const [filteredSections, setFilteredSections] = useState<DocSection[]>([]);

  const doc = documentationContent[documentId];

  useEffect(() => {
    if (!doc) return;
    
    const filtered = doc.sections.filter(section =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSections(filtered);
    
    if (filtered.length > 0 && !activeSection) {
      setActiveSection(filtered[0].id);
    }
  }, [doc, searchTerm, activeSection]);

  if (!doc) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Documento no encontrado</h3>
          <p className="text-gray-600 mb-4">El documento solicitado no está disponible.</p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const currentSection = filteredSections.find(s => s.id === activeSection) || filteredSections[0];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
          {doc.icon}
          <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
        </div>
        
        {/* Búsqueda */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar en el documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Índice lateral */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <List className="h-4 w-4" />
                Índice
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-2">
                  {filteredSections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        {section.title}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {currentSection?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="prose prose-gray max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: renderMarkdown(currentSection?.content || '') 
                    }} 
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}