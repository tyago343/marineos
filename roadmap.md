# MarineOS -- Roadmap del MVP

## Estado actual

- Auth completo (email/password + Google OAuth + callbacks)
- Tabla `profiles` con RLS y trigger de creación automática
- Dashboard placeholder con layout protegido
- Stack: Next.js 16, React 19, Supabase, shadcn (base-nova), Tailwind v4

Todo el dominio de barcos está por construir.

---

## Fase 1: Mis Barcos (fundación)

**Objetivo:** El usuario puede crear, ver, editar y eliminar embarcaciones. Esta es la entidad raíz de la que depende todo lo demás.

### Base de datos

- Tabla `boats` -- nombre, tipo (velero/lancha/catamarán), eslora, manga, calado, año, matrícula, bandera, zona de navegación, MMSI, foto
- FK a `profiles.id` (owner)
- RLS: cada usuario solo ve/edita sus barcos
- Tabla `boat_members` (futuro multi-crew, pero el schema se deja preparado)

### UI/UX

- Página `/boats` con listado de barcos del usuario (cards con foto, nombre, tipo)
- Formulario de creación/edición de barco (modal o página dedicada)
- Página `/boats/[id]` con datos generales del barco (vista detalle)
- Selector de barco activo en el header/nav (contexto global)
- Dashboard actualizado: en vez del placeholder, muestra los barcos del usuario o un CTA para crear el primero

### Lógica

- Server actions para CRUD de barcos
- Contexto de "barco activo" (cookie o query param) para que el resto de la app sepa sobre qué barco se opera

---

## Fase 2: Mantenimientos y Motores

**Objetivo:** El usuario puede registrar motores en su barco y gestionar mantenimientos periódicos con fechas que se reinician al completarlos.

### Base de datos

- Tabla `engines` -- modelo, marca, año, horas, tipo combustible, FK a `boats.id`
- Tabla `engine_catalog` -- catálogo de motores conocidos con especificaciones pre-cargadas (ej. Volvo Penta 2002)
- Tabla `maintenance_tasks` -- nombre, descripción, intervalo (días), categoría, FK a `boats.id`, opcionalmente FK a `engines.id`
- Tabla `maintenance_logs` -- fecha de realización, notas, FK a `maintenance_tasks.id`

### UI/UX

- Sección "Motor" dentro del detalle del barco (`/boats/[id]/engine`)
- Seleccionar motor del catálogo o agregar manualmente
- Al seleccionar del catálogo, se pre-cargan tareas de mantenimiento recomendadas (cambio aceite, filtros, refrigerante, etc.)
- Página/sección "Mantenimientos" (`/boats/[id]/maintenance`) con lista de tareas pendientes y realizadas
- Cada tarea muestra: última realización, próxima fecha estimada, estado (al día / vencido / próximo)
- Al marcar como realizado: se registra la fecha y se recalcula la próxima

### Dashboard (Home)

- Sección "Próximos mantenimientos" con los N más cercanos
- Timeline de últimos trabajos realizados

---

## Fase 3: Estiba e Inventario

**Objetivo:** El usuario puede definir ubicaciones de estiba en su barco y gestionar un inventario de elementos vinculados a esas ubicaciones.

### Base de datos

- Tabla `stowage_locations` -- nombre (ej. "Cofre de babor en salón"), descripción, FK a `boats.id`
- Tabla `inventory_items` -- nombre, descripción, categoría (electrónica, seguridad, herramientas...), fecha de compra, fecha de caducidad, FK a `boats.id`, FK opcional a `stowage_locations.id`

### UI/UX

- Página "Estiba" (`/boats/[id]/stowage`) con listado de ubicaciones
- Detalle de ubicación: muestra todos los items estibados ahí
- Página "Inventario" (`/boats/[id]/inventory`) con listado filtrable por categoría
- Detalle de item: info completa + ubicación de estiba + enlace a factura (futuro)
- Búsqueda: "¿dónde está X?" -- buscar un item y ver su ubicación

---

## Fase 4: Cabuyería

**Objetivo:** Seguimiento de cabos/drizas con estimaciones de vida útil y lavado.

### Base de datos

- Tabla `cordage` -- nombre (ej. "Driza de mayor"), material (poliéster, dyneema...), diámetro, largo, fecha de instalación, última lavada, intervalo de lavado (días), vida útil estimada (años), FK a `boats.id`

### UI/UX

- Página "Cabuyería" (`/boats/[id]/cordage`)
- Listado con estado visual: OK / necesita lavado / necesita reemplazo
- Formulario para agregar/editar cabos
- Fechas estimadas calculadas automáticamente (próxima lavada, fecha de cambio)

---

## Fase 5: Listas de tareas y Checklists

**Objetivo:** Todo lists categorizadas y checklists reutilizables con templates.

### Base de datos

- Tabla `todo_lists` -- título, categoría (motor, urgente, confort, electricidad...), FK a `boats.id`
- Tabla `todo_items` -- contenido, completado (bool), orden, FK a `todo_lists.id`
- Tabla `checklist_templates` -- nombre, tipo (pre-navegación, fondeo, etc.), items JSON, is_system (bool), FK a `boats.id` (null si es template global)
- Tabla `checklist_runs` -- FK a template, fecha, items con estado de check

### UI/UX

- Página "Tareas" (`/boats/[id]/todos`) con listas agrupadas por categoría
- CRUD de listas y items, drag & drop para reordenar
- Página "Checklists" (`/boats/[id]/checklists`) con templates disponibles
- Ejecutar un checklist: ir marcando items, guardar el resultado con fecha
- Templates del sistema editables por el usuario

---

## Fase 6: Documentos, Fotos y Notas

**Objetivo:** Subir facturas, fotos y notas, vinculables a cualquier entidad del sistema.

### Base de datos

- Tabla `documents` -- tipo (factura/foto/nota), URL (Supabase Storage), descripción, fecha, FK a `boats.id`
- Tabla `document_links` -- tabla polimórfica que vincula un documento a cualquier entidad (inventory_item, maintenance_log, engine, etc.)
- Supabase Storage bucket para archivos

### UI/UX

- Sección "Documentos" (`/boats/[id]/documents`) con galería/listado filtrable
- Desde cualquier entidad (item de inventario, log de mantenimiento, motor), poder adjuntar documentos existentes o subir nuevos
- Visor de fotos, preview de facturas
- Notas con texto libre vinculables a fotos y otros elementos

---

## Fase 7: Información miscelánea y Refinamientos

**Objetivo:** Datos complementarios y pulido general.

- Marcas de la cadena de fondeo (cada N metros)
- PIN de torreta eléctrica del pantalán
- MMSI en datos del barco y sección VHF
- Zona de navegación con productos de seguridad obligatorios pre-cargados
- Procesamiento de manuales PDF de motor para generar plan de service automático (AI)
- Multi-crew: invitar otros usuarios a un barco con roles

---

## Dependencias entre fases

```
Auth (ya hecho)
  └── Fase 1: Mis Barcos
        ├── Fase 2: Mantenimientos y Motores
        │     ├── Fase 6: Documentos y Fotos (parcial)
        │     └── Fase 7: Miscelánea y AI (parcial)
        ├── Fase 3: Estiba e Inventario
        │     └── Fase 6: Documentos y Fotos (parcial)
        ├── Fase 4: Cabuyería
        └── Fase 5: Tareas y Checklists
```

Las fases 2, 3, 4 y 5 son independientes entre sí (solo dependen de Fase 1), así que el orden puede ajustarse según prioridad. La Fase 6 se beneficia de tener inventario y mantenimientos ya hechos para poder vincularlos. La Fase 7 es la más avanzada y puede evolucionar post-MVP.

---

## Prioridad recomendada

**Fase 1 > Fase 2 > Fase 3 > Fase 5 > Fase 4 > Fase 6 > Fase 7**

Los mantenimientos son el pain point principal, seguido de saber dónde está cada cosa (estiba/inventario). Las tareas y checklists aportan valor operativo inmediato. La cabuyería es más nicho y puede esperar. Los documentos necesitan entidades previas para vincularlos. La fase 7 es refinamiento post-MVP.
