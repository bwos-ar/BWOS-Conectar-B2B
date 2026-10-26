# BWOS Conectar B2B — Plataforma Oficial de Acreditación y Rondas de Negocios

Plataforma web B2B interactiva y adaptable (mobile-first y escritorio de alta densidad) que unifica la acreditación empresarial en tiempo real, el directorio de emparejamiento comercial (Ofertas y Demandas), la gestión de conexiones y agendas 1-a-1, y salas de videollamada integradas con **Jitsi Meet** gratuito.

### User Review & Critical Decisions

> [!IMPORTANT]
> Se han consolidado todas las respuestas y requerimientos adicionales para construir primero el MVP funcional completo:

- **Flujo Unificado + Selector de Vistas**: La aplicación conectará de forma natural el flujo desde **Acreditación Empresarial** hacia el **Lobby Virtual B2B** (con sus variantes de Directorio de Tarjetas e Interoperabilidad BW2), **Mis Conexiones**, **Agenda B2B** y **Sala Virtual 1-a-1**, incorporando además una barra de acceso rápido para saltar o previsualizar cualquiera de las pantallas o activar simulaciones como la videollamada entrante.
- **Videollamadas B2B Gratuitas con Jitsi Meet**: Al aceptar una videollamada entrante (*"Alguien quiere conectar con vos"*) o iniciar una sala 1-a-1 desde una conexión o agenda, se abrirá una sala en vivo embebida mediante **Jitsi Meet (`meet.jit.si`)** sin costo ni requerimiento de licencias externas, acompañada de la ficha de sincronización comercial de la contraparte.
- **Secciones Legales y Normativas en Blanco con Aviso en Rojo**: Todo texto, modal o bloque relacionado con consulta de abogados, términos legales, privacidad y tratamiento de datos B2B o validaciones notariales/compliance se dejará en blanco con un **aviso destacado en rojo** (*"PENDIENTE DE REVISIÓN LEGAL — ESPACIO RESERVADO PARA CONSULTA CON ABOGADOS"*) para su revisión final posterior al MVP.
- **Persistencia en el Navegador con Reinicio Rápido**: Los datos de acreditación del directivo, las nuevas ofertas/demandas publicadas, las empresas guardadas y las solicitudes de conexión/citas se guardarán automáticamente en `localStorage`, incluyendo un botón de reinicio de datos de demostración.

---

### 1. Overview & Core Concept

- **What It Does**: Permite a directivos y tomadores de decisión acreditarse con su matriz comercial (*Qué ofrezco* y *Qué demando*), explorar contrapartes validadas con puntajes de afinidad (*Match Score*), filtrar por sector o búsqueda instantánea, enviar propuestas de Speed-Pitch, gestionar su agenda de rondas 1-a-1 y conectarse en videollamadas en vivo vía Jitsi Meet.
- **Target Audience / Persona**: Directivos corporativos, gerentes de compras, fundadores SaaS/Tech, operadores logísticos e industriales participando en ruedas de negocios B2B en Latinoamérica y España.
- **Key Value**: Elimina la fricción comercial priorizando oportunidades concretas de oferta y demanda, contacto directo por WhatsApp corporativo y salas de negociación inmediata en un entorno limpio y accesible.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Acreditación Empresarial (Ingreso al Evento)**: Formulario paso 1 de 1 con validación en tiempo real (Nombre completo, Empresa, WhatsApp Empresarial con selector de código de país, y Matriz de Intercambio Comercial *Qué ofrezco* / *Qué demando* con contador de 0/300 caracteres y mínimo de 20 caracteres). Al enviar, sincroniza la credencial del usuario y redirige al Lobby Virtual.
  2. **Lobby Virtual B2B & Directorio de Interoperabilidad (BW2)**:
     - Buscador instantáneo por empresa, representante, insumo, oferta o demanda con botón para limpiar o restablecer filtros.
     - Filtros interactivos por sector (*Todos*, *SaaS & Tech / Tecnología*, *Logística & Fintech*, *Manufactura & Industria 4.0*, *Servicios Corporativos*, *Solo Match Inmediato*) y ordenamiento por porcentaje de Match o tiempo de respuesta.
     - Tarjetas empresariales estructuradas con imágenes y avatares originales de las pantallas proporcionadas, bloques diferenciados de **OFRECE** (verde esmeralda suave `#ECFDF5`) y **DEMANDA / BUSCA** (azul/pizarra `#F2F3FF`), e indicadores de afinidad.
     - Modal para **Publicar Oferta / Demanda** que agrega una nueva tarjeta al directorio en vivo, y modal de **Filtros Avanzados B2B**.
  3. **Vínculo Inmediato (Speed-Pitch Modal) y Videollamada B2B Entrante**:
     - Al pulsar *Conectar* en cualquier empresa, se abre el modal de *Iniciar Vínculo Inmediato* con mensaje de apertura personalizado y opción de enviar invitación o abrir directamente la Sala 1-a-1.
     - Modal superpuesto de **Videollamada B2B Entrante** (*"Alguien quiere conectar con vos" — Carlos Mendonça, CEO de InnovaTech B2B, 96% Match*) con opciones funcionales para **Aceptar y unirse** (abre la sala Jitsi Meet), **Rechazar**, o **Posponer 15 min y enviar mensaje predeterminado** (agenda automáticamente el encuentro en la pestaña Agenda B2B).
  4. **Sala Virtual 1-a-1 (Jitsi Meet) + Mis Conexiones + Agenda B2B**:
     - **Sala Virtual**: Interfaz de videoconferencia en tiempo real impulsada por el iframe/API gratuita de `meet.jit.si`, con panel lateral que muestra la oferta/demanda de la contraparte, notas rápidas del acuerdo y enlace directo a WhatsApp.
     - **Mis Conexiones**: Lista de contrapartes conectadas y guardadas con acceso directo a chat/WhatsApp o inicio de videollamada.
     - **Agenda B2B**: Cronograma de mesas de negociación 1-a-1 confirmadas y pospuestas.
  5. **Placeholders Legales en Rojo**: Todos los enlaces y bloques de *Privacidad y Tratamiento B2B*, *Términos del Encuentro* y *Validación Legal / Notarial* muestran un contenedor vacío con borde y aviso en rojo indicando que el contenido está reservado para la consulta con abogados.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Minimalismo empresarial B2B de alta claridad transaccional basado en el sistema de diseño **BWOS Conectar**.
  - *Color Palette & Mood*:
    - Superficie base luminosa (`#FAF8FF`) y tarjetas en blanco puro (`#FFFFFF`).
    - Primario Cobalto B2B (`#003CB1` / contenedor `#1052E0`) para acciones principales, navegación activa y enfoque.
    - Secundario Esmeralda (`#006D38` / contenedor `#6BFE9E` / fondo de oferta `#ECFDF5`) para el contexto *Ofrece* y confirmaciones.
    - Terciario Pizarra (`#3A485C`) y texto principal Azul Profundo (`#131B2E`).
    - Alerta/Legal en Rojo (`#BA1A1A` / fondo `#FFDAD6`) para rechazar llamadas y destacar los bloques pendientes de consulta con abogados.
  - *Typography & Hierarchy*: Fuente **Hanken Grotesk** en todos los niveles jerárquicos (`headline-lg` 30px 800, `headline-md` 22px 700, `title-md` 16px 700, `body-md` 14px 400, `label-sm` 11px 700) acompañada de cifras tabulares (`tabular-nums`) para métricas y contadores, e iconografía **Material Symbols Outlined**.
  - *Component Styling & Layout*: Diseño adaptable con barra superior institucional en escritorio (12 columnas, hasta 1400px–1920px) y navegación inferior ergonómica de 4 pestañas en móvil, respetando objetivos táctiles mínimos de 44px.

- **Interactive Feedback & Motion**:
  - Contadores de caracteres en vivo (`0/300`) con validación de mínimo 20 caracteres.
  - Transiciones suaves en botones (`active:scale-95` / `active:scale-[0.98]`), estados de carga al acreditar o conectar con sala Jitsi, y notificaciones tipo *Toast* al enviar invitaciones o posponer llamadas.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Integración de Videollamadas con Jitsi Meet Gratuito**
  - *Chosen Approach*: Incorporar Jitsi Meet (`https://meet.jit.si/<roomName>`) mediante contenedor interactivo con permisos de cámara y micrófono, generando nombres de sala únicos y deterministas por contraparte (ej. `BWOS-Summit2025-Sala14-InnovaTech`), más un botón de respaldo para abrir la sala en pestaña externa si el entorno restringe permisos de dispositivo.
  - *Why*: Permite videollamadas reales y gratuitas de inmediato en el MVP sin requerir servidores WebRTC propios ni claves de pago.
- **Decision 2: Secciones de Abogados en Blanco con Aviso en Rojo**
  - *Chosen Approach*: Reemplazar cualquier texto contractual, cláusula de privacidad, términos del encuentro o certificación legal por recuadros vacíos con alerta visual en rojo (`#BA1A1A`).
  - *Why*: Cumple estrictamente la instrucción del usuario de priorizar el MVP funcional y dejar todo el apartado jurídico visible pero en blanco para completarlo tras la consulta con los abogados.
- **Decision 3: Estado Persistente Unificado en `localStorage`**
  - *Chosen Approach*: Almacenar el perfil acreditado, las tarjetas B2B (incluyendo las empresas de las capturas con sus imágenes exactas más las creadas por el usuario), el estado de conexiones, marcadores y reuniones agendadas en el navegador, con un botón de "Reiniciar Demo" en la barra de herramientas.
  - *Why*: Garantiza que todo el flujo funcione de extremo a extremo sin perder cambios al recargar la página.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌──────────────────────────────────────────────────────────────────────────┐
│                     App State & LocalStorage Store                       │
│  • UserAccreditation (Nombre, Empresa, WhatsApp, Oferta, Demanda)        │
│  • B2BCompanies[] (Catálogo inicial con imágenes HTML + nuevas ofertas)  │
│  • Connections[] & Meetings[] (Vínculos enviados, favoritos, agenda 1:1) │
│  • ActiveView & ActiveModal (Navegación + Simulador de Llamada Entrante) │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
┌─────────────────────┐   ┌─────────────────────────┐   ┌───────────────────────┐
│  1. Acreditación    │   │  2. Lobby Virtual B2B   │   │  3. Sala Virtual 1:1  │
│     Empresarial     │   │  & Directorio BW2       │   │     (Jitsi Meet)      │
│ • Hero & Métricas   │   │ • Buscador + Chips      │   │ • Iframe meet.jit.si  │
│ • Formulario B2B    │   │ • Tarjetas Clásicas /   │   │ • Ficha de Sinergia   │
│   con validación    │   │   Tarjetas Tags BW2     │   │   (Oferta / Demanda)  │
│   20-300 chars      │   │ • Publicar Oferta Modal │   │ • Notas y WhatsApp    │
└─────────────────────┘   └────────────┬────────────┘   └──────────┬────────────┘
                                       │                           ▲
                          ┌────────────┴────────────┐              │
                          ▼                         ▼              │
               ┌─────────────────────┐   ┌─────────────────────────┴───┐
               │   Mis Conexiones    │   │ Modales de Interacción B2B  │
               │   & Agenda B2B      │   │ • Speed-Pitch Conectar      │
               │ • Lista de vínculos │   │ • Videollamada Entrante     │
               │ • Horarios y salas  │   │ • Aviso Rojo Legal Abogados │
               └─────────────────────┘   └─────────────────────────────┘
```

- **Data Model & State**:
  - `UserProfile`: `{ fullName, companyName, countryCode, phone, offering, demand, accreditedAt }`.
  - `CompanyCard`: `{ id, name, verified, location, countryFlag, category, sectorLabel, matchScore, responseTime, representative: { name, role, icon, avatar }, offer: { title, badge, description, tags[] }, demand: { title, badge, description, tags[] }, footerNote, footerIcon, logoUrl, isConnected, isBookmarked, immediateCallAvailable }`.
  - `MeetingItem`: `{ id, companyId, companyName, repName, repRole, repAvatar, matchScore, topic, status: 'scheduled' | 'postponed' | 'completed', timeSlot, roomCode }`.

- **Interactive Component & State Mapping**:
  - **Formulario de Acreditación**: Valida campos obligatorios y longitud mínima de 20 caracteres en *Qué ofrezco* y *Qué demando*; muestra estado de sincronización y actualiza `UserProfile`, añadiendo o actualizando también la tarjeta de la empresa del usuario en el Lobby.
  - **Buscador y Filtros del Lobby**: Filtra en tiempo real por texto libre, categoría industrial, modo *Solo Match Inmediato* y alterna entre el estilo de tarjeta detallada y el estilo compacto de etiquetas (BW2), manteniendo contadores exactos y estado vacío con botón de restablecimiento.
  - **Flujo de Conexión y Llamada Entrante**: Pulsar *Conectar* abre el modal de propuesta directa (*Speed-Pitch*) o cambia el estado a *Conectado* con notificación Toast; pulsar el disparador de *Videollamada Entrante* muestra el modal de Carlos Mendonça (InnovaTech B2B), donde *Aceptar y unirse* abre la vista de Sala Virtual con Jitsi Meet activo, *Posponer 15 min* registra el encuentro en `Agenda B2B`, y *Rechazar* cierra el modal.
  - **Bloques de Abogados**: Cualquier clic en enlaces legales (*Privacidad y Tratamiento B2B*, *Términos del Encuentro*, *Validación Legal*) despliega el aviso en rojo reservado para revisión jurídica.
