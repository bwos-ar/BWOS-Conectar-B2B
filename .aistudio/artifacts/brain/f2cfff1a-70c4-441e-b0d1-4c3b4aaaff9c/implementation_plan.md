# BWOS Conectar B2B — Selector Multisectorial, Nuevo Pie de Página Institucional y Optimización del Paginador

Esta actualización incorpora un selector ampliado de sectores industriales (con selección de hasta 2 sectores y opción personalizada "Otro" separada por comas con límite de 20 caracteres por sector), rediseña el pie de página institucional con la estética oscura de 4 columnas en todas las vistas, y optimiza la paginación del directorio para garantizar actualizaciones determinísticas y desplazamiento suave.

## User Review & Critical Decisions

> [!IMPORTANT]
> Se han integrado las decisiones confirmadas para garantizar consistencia funcional y visual en toda la plataforma:

- **Alcance del Nuevo Selector de Sectores (Hasta 2 + "Otro")**: Se aplicará tanto en el formulario inicial **“Quiero ingresar, solicito invitación”**, como en el modal de **“Publicar Oferta / Demanda”** y en los **Filtros del Lobby**.
- **Regla de "Otro" con Comas y Límite de Caracteres**: Al activar "Otro", el usuario puede escribir un sector corto (máximo 20 caracteres por sector). Si escribe dos sectores separados por coma (ej. `Minería, Textil`), el sistema los interpreta automáticamente como 2 sectores independientes (máximo 20 caracteres cada uno) y valida que la suma total de sectores seleccionados (predefinidos + personalizados) nunca supere el máximo de **2 sectores**.
- **Pie de Página Institucional Oscuro (4 Columnas)**: Se mostrará en **todas las vistas**, incluyendo la pantalla inicial de solicitud de invitación. Cuando el visitante aún no ha ingresado a la plataforma, los enlaces de navegación de la columna *PLATAFORMA* mostrarán un aviso indicando que requieren invitación activa, mientras que los enlaces de *LEGAL* y *CONTACTO Y SOPORTE* estarán plenamente operativos.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Selector Multisectorial B2B (Hasta 2 Sectores + "Otro")**: Amplía el catálogo de sectores industriales a 10 rubros corporativos más la opción **“Otro (Especificar)”**, permitiendo elegir hasta 2 sectores combinados o separados por coma.
  2. **Pie de Página Oscuro de 4 Columnas (`BW2 · BWOS CONECTAR B2B`)**: Reemplaza el pie de página anterior por el diseño institucional oscuro (`#161f30`) con las 4 columnas exactas (*Identidad BW2*, *Plataforma*, *Legal* con etiquetas `borrador`/`pendiente` en rojo suave, y *Contacto y Soporte* con modal para *Denunciar una conducta*).
  3. **Paginador del Directorio Optimizado**: Sincroniza el estado `currentPage` / `safeCurrentPage` con el corte exacto de `paginatedCompanies`, añade claves de renderizado por página en el contenedor de la cuadrícula y ejecuta `scrollIntoView` de forma sincronizada tras el cambio de página.
- **Target Audience / Persona**: Ejecutivos B2B solicitando admisión, empresas publicando ofertas/demandas en múltiples giros industriales y el administrador (`clientesbinweb@gmail.com`).
- **Key Value**: Mayor precisión en la clasificación industrial de las empresas, cumplimiento visual exacto con el pie de página institucional y navegación fluida entre las páginas del catálogo.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Selección de hasta 2 Sectores + "Otro"**:
     - El usuario visualiza el catálogo ampliado de sectores (*SaaS & Tecnología*, *Logística & Fintech*, *Manufactura & Industria 4.0*, *Servicios Corporativos*, *Agroindustria & Alimentos*, *Energía & Sostenibilidad*, *Salud & Farma*, *Construcción & Infraestructura*, *Comercio Exterior & Retail*, *Minería & Metalurgia*, y *Otro*).
     - Puede marcar hasta 2 sectores de la lista, o marcar 1 sector + *Otro* (1 sector corto de hasta 20 caracteres), o marcar únicamente *Otro* e ingresar hasta 2 sectores cortos separados por coma (ej. `Textil, Plásticos`, máx. 20 caracteres cada uno).
     - Se muestran píldoras interactivas en vivo con el conteo `Sectores seleccionados: X / 2`.
  2. **Pie de Página Institucional (4 Columnas Oscuras)**:
     - **Columna 1**: Ícono cuadrado azul claro `BW2` + `BWOS CONECTAR B2B`, texto *"Directorio y rondas de negocios B2B con videollamadas 1 a 1. Solo para empresas invitadas a la ronda."* y nota *"La plataforma no graba las reuniones."*
     - **Columna 2 (`PLATAFORMA`)**: Enlaces a *Directorio BW2*, *Mis conexiones*, *Agenda B2B* y *Sala virtual*.
     - **Columna 3 (`LEGAL`)**: *Términos y Condiciones `borrador`*, *Política de Privacidad `borrador`*, *Reglas de conducta `borrador`*, y *Uso de WhatsApp y videollamadas `pendiente`* (todos conectados al modal de revisión legal en rojo para abogados).
     - **Columna 4 (`CONTACTO Y SOPORTE`)**: *Soporte técnico: [correo pendiente]*, botón interactivo *Denunciar una conducta* y *Horario: lunes a viernes, 9 a 18 h*.
     - **Barra Inferior**: `© 2026 BWOS Digital Partner · Razón social, CUIT y domicilio: [pendiente]` a la izquierda y `Video con Jitsi Meet · Prototipo v4.4 con datos de ejemplo` a la derecha.
- **Visual Identity & Theme**:
  - *Color Palette & Mood*: Superficie principal clara (`#faf8ff`), primario corporativo (`#003cb1`), pie de página en azul nocturno profundo (`#161f30`) con etiquetas de estado legal en rojo coral suave (`#f87171` / `#fca5a5`) y tipografía `Hanken Grotesk` con numerales tabulares (`tabular-nums`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Interpretación en Tiempo Real del Campo "Otro" con Comas**
  - *Chosen Approach*: Si el usuario selecciona 0 sectores predefinidos y activa "Otro", puede ingresar 1 sector (`<= 20` caracteres) o 2 sectores separados por `,` (cada uno `<= 20` caracteres, longitud total controlada). Si ya seleccionó 1 sector predefinido y activa "Otro", el campo "Otro" admite 1 sector adicional de hasta 20 caracteres (bloqueando la coma o informando que ya alcanzó el límite de 2 sectores).
  - *Why*: Cumple estrictamente la regla de negocio de máximo 2 sectores totales y máximo 20 caracteres por sector corto sin fricción para el usuario.
- **Decision 2: Sincronización de Paginación y Scroll**
  - *Chosen Approach*: Crear un manejador dedicado `handlePageChange(nextPage)` con `useRef` hacia el contenedor de la cuadrícula (`directoryGridRef`), actualizando `currentPage` a partir de `safeCurrentPage` y ejecutando `requestAnimationFrame(() => directoryGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))`.
  - *Why*: Garantiza que el DOM ya haya pintado las 8 tarjetas correspondientes a la nueva página antes de realizar el desplazamiento suave.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                               App (Root State)                            │
│  • hasInvitationAccess / isAdmin (clientesbinweb@gmail.com)               │
│  • companies (24 empresas B2B) -> filteredCompanies -> paginatedCompanies │
│  • currentPage / safeCurrentPage + directoryGridRef (scrollIntoView)      │
└───────────────┬───────────────────────────────────────────┬───────────────┘
                │                                           │
                ▼                                           ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────┐
│     Selector Multisectorial (Max 2)   │   │   InstitutionalFooter (Dark)  │
│  • 10 Sectores B2B + Opción "Otro"    │   │  • Col 1: BW2 + No graba      │
│  • Parser de coma (,) -> 2 sectores   │   │  • Col 2: Plataforma (4 links)│
│  • Límite 20 caracteres por sector    │   │  • Col 3: Legal (borrador/pen)│
│  • Usado en Invitación y Publicar     │   │  • Col 4: Soporte y Denuncias │
└───────────────────────────────────────┘   └───────────────────────────────┘
```

### Interactive Component & State Mapping
- **Componente Reutilizable de Selección de Sectores (`MultiSectorSelector`)**:
  - Gestiona `selectedPredefined: string[]` y `otherInput: string`.
  - Calcula `parsedOtherSectors = otherInput.split(',').map(s => s.trim().slice(0, 20)).filter(Boolean)`.
  - Impide seleccionar más elementos cuando `selectedPredefined.length + parsedOtherSectors.length >= 2`.
- **Componente Reutilizable de Pie de Página (`InstitutionalFooter`)**:
  - Recibe `hasAccess`, `onNavigate(view)`, `onOpenLegalNotice(section)` y `onReportConduct()`.
  - Renderiza el diseño exacto de la segunda imagen tanto en `InvitationGateView` como en el layout principal de `App`.
- **Paginador Determinístico**:
  - `startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE` (con `ITEMS_PER_PAGE = 8`).
  - Asigna `key={`page-${safeCurrentPage}-${selectedSector}-${sortBy}`}` a la cuadrícula para asegurar el reemplazo visual inmediato de las tarjetas al cambiar entre las páginas 1, 2 y 3.
