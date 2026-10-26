# Reporte Semanal Programado de Métricas por EmailJS y Enlace Directo de Aprobación para el Administrador

Este plan incorpora en el **Dashboard de Administración** la programación automática y envío bajo demanda de un **Reporte Semanal de Métricas de la Plataforma** mediante el servicio EmailJS existente, y resuelve el flujo de aprobación desde la primera pantalla incluyendo un **enlace directo de aprobación (`One-Click Approval Link`)** dentro del correo que recibe el administrador (`clientesbinweb@gmail.com`).

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas por el usuario en la etapa de clarificación:**

- **Programación del Reporte Semanal en el Dashboard de Administración**: Configuración de día de la semana y hora con activación/desactivación del envío automático por EmailJS, indicador del próximo despacho y botón **"Enviar Resumen Semanal Ahora"** para disparo inmediato.
- **Métricas incluidas en el Reporte Semanal enviado a `clientesbinweb@gmail.com`**:
  1. Total de empresas registradas, reuniones agendadas (confirmadas, pendientes, pospuestas) y tasa de éxito de conexión B2B (%).
  2. Resumen de solicitudes de acceso (pendientes de OK, aprobadas y rechazadas).
  3. Total de correos despachados por EmailJS durante los últimos 7 días.
  4. Desglose de empresas e interacciones por sector industrial.
- **Enlace directo de aprobación en el correo enviado desde la primera pantalla**: Cada vez que un ejecutivo solicita invitación o intenta ingresar por *Ingreso Autorizado* desde la portada, el correo enviado vía EmailJS a `clientesbinweb@gmail.com` incluirá un **enlace directo de aprobación** (`?admin_action=approve_request&email=...&name=...&company=...&sector=...`). Al hacer clic en ese enlace desde el correo, la aplicación abrirá la sesión del administrador, aprobará automáticamente la solicitud (otorgando el "OK" obligatorio), notificará al solicitante por EmailJS de que su acceso ya está habilitado y llevará al administrador directamente al Dashboard de Administración con confirmación visual.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Programador de Reporte Semanal de Métricas (EmailJS)**: En la pestaña de **Métricas de Uso del Sistema** (con acceso rápido también desde el Historial de EmailJS), el administrador puede activar o pausar un cronograma semanal (eligiendo día de la semana, ej. Lunes a Viernes/Domingo, y hora de corte), visualizar cuándo se envió el último reporte y cuándo corresponde el próximo envío automático, previsualizar el contenido estructurado del informe y dispararlo manualmente en cualquier momento con un clic.
  2. **Enlace de Aprobación de 1 Clic en el Correo al Administrador**: En la primera pantalla (Portada de Invitación), cuando un usuario solicita acceso, el servicio EmailJS genera una URL firmada con los datos de la solicitud (`approval_url` e incluida también dentro del cuerpo `message`). Cuando `clientesbinweb@gmail.com` recibe el correo y hace clic en el enlace **"Aprobar Invitación / Dar OK Ahora"**, la plataforma procesa automáticamente el parámetro de la URL, registra el estado `approved` para ese correo, envía el email de confirmación al usuario invitado y muestra un aviso de confirmación en el Dashboard de Administración.
- **Target Audience / Persona**: Exclusivo para la cuenta administradora maestra (`clientesbinweb@gmail.com`) y los ejecutivos B2B que solicitan admisión desde la portada.
- **Key Value**: Elimina la fricción de tener que copiar el correo del solicitante y buscarlo manualmente para aprobarlo tras recibir el email, y automatiza el seguimiento ejecutivo semanal del ecosistema B2B directamente en la bandeja de entrada del administrador.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Flujo de Solicitud en Primera Pantalla con Link de Aprobación en el Email**:
     - Un usuario completa el formulario *"Quiero ingresar, solicito invitación"* o intenta entrar por *"Ingreso Autorizado"*.
     - Se construye dinámicamente el enlace de aprobación basado en `window.location.origin` con los parámetros codificados de la solicitud (`admin_action=approve_request`, `email`, `name`, `company`, `role`, `sector`, `contact`).
     - El correo enviado por EmailJS a `clientesbinweb@gmail.com` incluye el enlace clicable tanto en el cuerpo del mensaje (`message`) como en variables dedicadas de plantilla (`approval_url`, `reject_url`, `admin_dashboard_url`) para que funcione sin importar cómo esté configurada la plantilla en EmailJS.
     - Cuando el administrador abre su correo y hace clic en el enlace de aprobación, la aplicación detecta la acción al cargar, activa la sesión de `clientesbinweb@gmail.com`, aprueba inmediatamente la solicitud (dando el "OK"), envía el correo de bienvenida/aprobación al solicitante vía EmailJS, limpia los parámetros de la URL y abre el **Dashboard de Administración** mostrando una confirmación destacada.
  2. **Flujo de Programación y Envío del Reporte Semanal en el Dashboard Admin**:
     - Dentro del **Dashboard de Administración** (Pestaña 3: *Métricas de Uso del Sistema*), se incorpora el panel **"Programación de Reporte Semanal por EmailJS"**.
     - El administrador puede:
       - Activar/Desactivar el interruptor de **Envío Automático Semanal**.
       - Seleccionar el **Día de la semana** (Lunes a Domingo) y la **Hora programada** (formato 24h tabular).
       - Consultar la fecha/hora del **Último reporte enviado** y del **Próximo envío programado**.
       - Hacer clic en **"Previsualizar Resumen"** para inspeccionar el texto exacto con las 4 categorías de métricas seleccionadas.
       - Hacer clic en **"Enviar Resumen Ahora"** para despachar inmediatamente el correo a `clientesbinweb@gmail.com` mediante EmailJS y registrarlo en el Historial de EmailJS con la etiqueta `weekly_report`.
- **Visual Identity & Theme**:
  - Conserva la estética ejecutiva B2B en tonos pizarra profundos (`#161f30`), azul institucional (`#004ac6`), verde esmeralda de confirmación (`#047857`) y tipografía tabular (`tabular-nums`) para contadores, tasas porcentuales, fechas de programación y métricas semanales.
  - Superficies limpias de un solo nivel de elevación con bordes sutiles de 1px y controles en una sola línea (`whitespace-nowrap`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Enlace de Aprobación Auto-Contenido en el Correo de EmailJS**
  - *Chosen Approach*: Incluir en el enlace de aprobación tanto el identificador de la solicitud como los metadatos codificados en la URL (`?admin_action=approve_request&email=...&name=...&company=...&role=...&sector=...&contact=...`).
  - *Why*: Si el usuario envía la solicitud desde su propio navegador o dispositivo y el administrador abre el correo en su propio equipo o celular, el enlace auto-contenido permite que la aplicación en el navegador del administrador reconstruya y apruebe la solicitud de inmediato, además de disparar el correo de confirmación al usuario vía EmailJS.
- **Decision 2: Verificación Automática del Cronograma Semanal + Disparo Manual**
  - *Chosen Approach*: Persistir la configuración del programador semanal (`enabled`, `dayOfWeek`, `timeOfDay`, `lastSentAt`, `nextScheduledAt`) y verificar automáticamente cuando el administrador tiene abierta o inicia sesión en la consola si ya se cumplió la ventana semanal para disparar el resumen por EmailJS sin duplicados, complementado con el botón **"Enviar Resumen Ahora"**.
  - *Why*: Garantiza que el reporte semanal funcione en una arquitectura SPA con EmailJS sin requerir servidores externos adicionales y permite al administrador disparar o probar el informe en cualquier instante.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    Primera Pantalla (Portada de Invitación)                 │
│  • Genera Link de Aprobación (?admin_action=approve_request&email=...)     │
│  • Envía correo vía EmailJS a clientesbinweb@gmail.com con Link incluido   │
└───────────────────────────────────────┬────────────────────────────────────┘
                                        │ Clic del Admin en el Link del Email
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    Detector de Enlace de Aprobación (App)                  │
│  • Valida parámetros URL de aprobación o rechazo directo                   │
│  • Aprueba o actualiza la solicitud con estado 'approved'                  │
│  • Dispara EmailJS de confirmación ('access_approved') al solicitante      │
│  • Redirige al Dashboard Admin con notificación de aprobación exitosa      │
└───────────────────────────────────────┬────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│             Dashboard de Administración (clientesbinweb@gmail.com)         │
├───────────────────────┬──────────────────────────┬─────────────────────────┤
│ Pestaña 1:            │ Pestaña 2:               │ Pestaña 3:              │
│ Solicitudes Pendientes│ Historial de EmailJS     │ Métricas & Reporte      │
│ • Aprobar / Rechazar  │ • Bitácora con           │ Semanal EmailJS         │
│ • Pre-autorización    │   'weekly_report'        │ • Selector Día y Hora   │
│ • Copiar Link de OK   │ • Botón Limpiar Log      │ • Toggle Auto-Envío     │
│                       │ • Config VITE_EMAILJS_*  │ • Botón Enviar Ahora    │
└───────────────────────┴──────────────────────────┴─────────────────────────┘
```

- **Data Model & State**:
  - **Extensión de `EmailNotificationType`**: Se añade `'weekly_report'` junto a `'connection_invite' | 'meeting_request' | 'access_request' | 'access_approved'`.
  - **Parámetros adicionales en `EmailNotificationPayload`**: Se incorporan `approvalUrl?: string` y `rejectUrl?: string` que se inyectan tanto en `templateParams` (`approval_url`, `reject_url`, `action_url`) como de forma visible y clara al final de `message` para garantizar compatibilidad total con cualquier plantilla de EmailJS.
  - **Configuración `WeeklyReportSchedule`**:
    - `enabled: boolean`
    - `dayOfWeek: number` (`0` Domingo a `6` Sábado, por defecto `1` Lunes)
    - `hourMinute: string` (ej. `'09:00'`)
    - `recipientEmail: string` (`clientesbinweb@gmail.com`)
    - `lastSentAt: string | null`
    - `lastAutoPeriodKey: string | null` (evita envíos duplicados en la misma ventana semanal)
- **Interactive Component & State Mapping**:
  - **Enlace de Aprobación en Portada (`InvitationGateView`)**: Construye la URL de aprobación con todos los datos del solicitante y la incluye en el envío de EmailJS tanto para el formulario de invitación como para intentos de *Ingreso Autorizado*.
  - **Procesador de Aprobación por URL (`App`)**: Un efecto al iniciar la aplicación lee `window.location.search`; si detecta `admin_action=approve_request` (o `reject_request`), crea/actualiza la solicitud en estado `approved`, dispara el correo de bienvenida al usuario vía EmailJS, limpia la URL con `window.history.replaceState` y abre la vista `admin-dashboard` mostrando un banner y toast de confirmación.
  - **Programador de Reporte Semanal (`AdminDashboardView` + `App`)**: Permite guardar el día/hora preferidos, calcula el próximo envío, ejecuta el chequeo automático cuando vence el ciclo semanal y ofrece previsualización y envío inmediato del resumen con las 4 métricas requeridas.
