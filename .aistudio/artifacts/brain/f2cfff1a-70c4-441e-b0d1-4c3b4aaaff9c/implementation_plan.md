# Notificaciones por EmailJS y Control de Admisión con OK Obligatorio del Administrador

Este plan incorpora el servicio de notificaciones por correo electrónico mediante **EmailJS** desde el frontend para alertas de conexiones B2B, solicitudes de reunión 1-a-1 y admisión de nuevos ejecutivos, junto con un **sistema de bloqueo y aprobación obligatoria por parte del administrador (`clientesbinweb@gmail.com`)** tanto para el formulario de invitación como para la pestaña de Ingreso Autorizado.

## User Review & Critical Decisions

> [!IMPORTANT]
> Se han consolidado las decisiones confirmadas para garantizar que ningún usuario externo pueda acceder al directorio sin el "OK" explícito del administrador y que todas las interacciones clave disparen notificaciones vía EmailJS:

- **Eventos que Disparan Notificación por EmailJS**:
  1. **Invitación de Conexión B2B (`Speed-Pitch`)**: Envía correo a la contraparte comercial (con copia/respaldo a `clientesbinweb@gmail.com`) incluyendo un formulario simple de confirmación/personalización de envío.
  2. **Solicitud de Reunión 1-a-1 (Sala Jitsi Meet / Agenda B2B)**: Notifica por email el enlace de la sala Jitsi, horario o reprogramación (+15 min).
  3. **Solicitud de Invitación / Solicitud de Ingreso Autorizado**: Envía un correo inmediato a `clientesbinweb@gmail.com` alertando que una empresa espera el "OK" de admisión.
  4. **Resolución de Admisión (OK del Administrador)**: Cuando el administrador aprueba una cuenta, se dispara un email de bienvenida indicando que su correo ya tiene el "OK" para entrar en *Ingreso Autorizado*.
- **Regla Estricta de Admisión ("Sin el OK del administrador no puede ingresar")**:
  - Ningún visitante puede ingresar automáticamente al enviar el formulario ni al escribir un correo no aprobado en *Ingreso Autorizado*.
  - Únicamente la cuenta maestra `clientesbinweb@gmail.com` posee acceso administrativo directo para gestionar y aprobar solicitudes.
  - Cualquier otro correo debe figurar en la lista de **Cuentas Aprobadas por el Administrador (`status: 'approved'`)** para poder superar la pantalla de *Ingreso Autorizado*.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Integra un módulo cliente de **EmailJS** (`@emailjs/browser` / REST API oficial de EmailJS) con soporte para variables de entorno (`VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`), formulario de envío rápido y bandeja de historial de correos enviados.
  - Establece un flujo de **Control de Acceso por Aprobación Administrativa (`clientesbinweb@gmail.com`)**, donde tanto las solicitudes del formulario inicial como los intentos en *Ingreso Autorizado* requieren el "OK" explícito del administrador antes de desbloquear el Lobby Virtual.
- **Target Audience / Persona**:
  - **Administrador General (`clientesbinweb@gmail.com`)**: Recibe por email cada solicitud de acceso o conexión, revisa la cola de admisión desde el panel superior y otorga o revoca el "OK" de ingreso.
  - **Directivos y Empresas Invitadas**: Solicitan admisión, reciben confirmación por correo cuando el administrador les da el "OK", e ingresan por *Ingreso Autorizado* con su correo corporativo aprobado.
- **Key Value**:
  - Control total sobre quién accede a los datos confidenciales del directorio en producción piloto y trazabilidad por correo electrónico de cada vínculo B2B.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Flujo de Solicitud e Ingreso Autorizado con OK Obligatorio**:
     - **En "Quiero ingresar, solicito invitación"**: El ejecutivo completa sus datos y hasta 2 sectores. Al enviar, la solicitud queda registrada en estado `PENDIENTE DE OK DEL ADMINISTRADOR` y dispara una notificación por EmailJS a `clientesbinweb@gmail.com`. No se desbloquea el directorio.
     - **En "Ingreso Autorizado"**:
       - Si ingresa `clientesbinweb@gmail.com`: Entra directamente con privilegios de Administrador y acceso al **Panel de Admisión y Aprobaciones**.
       - Si ingresa un correo corporativo que **aún NO tiene el OK del administrador**: El sistema impide el acceso, muestra un aviso claro (*"Acceso retenido: Tu cuenta requiere la respuesta y aprobación obligatoria del administrador clientesbinweb@gmail.com"*), y ofrece un botón para enviar un recordatorio de autorización por EmailJS al administrador.
       - Si ingresa un correo corporativo que **YA recibió el OK del administrador**: El sistema valida la aprobación y desbloquea el Lobby Virtual con los datos acreditados de su empresa.
  2. **Flujo del Administrador (`clientesbinweb@gmail.com`) — Panel "Dar OK de Ingreso"**:
     - En la barra superior del administrador aparece el botón **"Admisión B2B (Pendientes)"** con contador numérico en tiempo real.
     - Al abrir el modal de Admisión, el administrador visualiza todas las solicitudes (provenientes tanto del formulario como de intentos de Ingreso Autorizado) y también puede **pre-autorizar un correo manualmente**.
     - Al pulsar **"Dar OK / Aprobar Ingreso"**, el correo pasa a estado `Aprobado` y se envía automáticamente la notificación por EmailJS al usuario confirmando que ya puede ingresar.
  3. **Flujo de Notificación EmailJS en Conexiones y Reuniones**:
     - En el modal de **Speed-Pitch (Conectar)** y al **Agendar / Posponer Reunión 1-a-1**, se incorpora la sección de **Notificación por EmailJS** (con destinatario corporativo, copia a `clientesbinweb@gmail.com`, asunto y mensaje editable) que dispara el envío al confirmar la acción.
     - Un botón en el Header permite consultar la **Bandeja de Notificaciones EmailJS** (registro de correos disparados, estado de entrega y configuración de credenciales EmailJS).
- **Visual Identity & Theme**:
  - Mantiene la estética institucional ejecutiva (`#161f30`, azul corporativo `#004ac6`, esmeralda `#047857` para estados aprobados y ámbar `#d97706` para solicitudes que aguardan el OK del administrador).
  - Numerales tabulares (`tabular-nums`) en contadores de solicitudes pendientes y registros de auditoría de correos.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Integración Dual de EmailJS (Variables de Entorno + Configuración Dinámica en App)**
  - *Chosen Approach*: Conectar el SDK oficial de EmailJS leyendo `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID` y `VITE_EMAILJS_PUBLIC_KEY` desde `.env`, permitiendo además que el administrador (`clientesbinweb@gmail.com`) configure o pruebe sus IDs de EmailJS directamente desde el modal de notificaciones sin necesidad de recompilar si desea cambiar de plantilla en Netlify.
  - *Why*: Garantiza que el envío funcione de inmediato en producción y que nunca falle silenciosamente si las llaves aún se están configurando, registrando cada correo en el historial auditable.
- **Decision 2: Verificación Estricta de Lista Blanca Aprobada por el Administrador**
  - *Chosen Approach*: Persistir un registro estructurado de solicitudes y cuentas autorizadas (`pending`, `approved`, `rejected`). Solo los correos con `status === 'approved'` (más la cuenta maestra `clientesbinweb@gmail.com`) pueden superar la barrera de bienvenida.
  - *Why*: Cumple de forma absoluta con la regla de negocio: sin la respuesta afirmativa ("OK") del administrador, ningún visitante puede ingresar ni por formulario ni por ingreso autorizado.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        App.tsx (Estado Global B2B)                         │
│  • hasInvitationAccess / isAdmin (Solo clientesbinweb@gmail.com)           │
│  • accessRequests[] (status: 'pending' | 'approved' | 'rejected')          │
│  • emailLogs[] (Historial de envíos EmailJS en tiempo real)                │
└───────────────┬───────────────────────────────┬────────────────────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────────┐
│       InvitationGateView.tsx          │ │   Servicio EmailJS Frontend      │
│  1. Tab "Solicito Invitación":        │ │  • sendEmailNotification()       │
│     Registra estado 'pending' +       │ │  • Plantillas para:              │
│     Dispara EmailJS al Admin.         │ │    - Nueva Conexión B2B          │
│  2. Tab "Ingreso Autorizado":         │ │    - Solicitud Reunión 1-a-1     │
│     Verifica si email === ADMIN o     │ │    - Solicitud de Admisión       │
│     si tiene OK ('approved') del      │ │    - Confirmación de OK Admin    │
│     Admin. Si no, bloquea ingreso.    │ └─────────────────┬────────────────┘
└───────────────────────────────────────┘                   │
                                                            ▼
                                          ┌──────────────────────────────────┐
                                          │  AdminApprovalAndEmailModal.tsx  │
                                          │  • Cola de Solicitudes de Acceso │
                                          │  • Botón "Dar OK / Aprobar"      │
                                          │  • Formulario Simple EmailJS &   │
                                          │    Bandeja de Correos Enviados   │
                                          └──────────────────────────────────┘
```

### Data Model & State

- **`AccessRequestItem`**:
  - `id`, `fullName`, `companyName`, `email`, `corporateContact`, `role`, `sector`, `sectorsList`, `requestedAt`, `source` (`'form'` | `'authorized_attempt'`), `status` (`'pending'` | `'approved'` | `'rejected'`), `approvedAt?`, `approvedBy?`.
- **`EmailNotificationPayload & Log`**:
  - `id`, `type` (`'connection_invite'` | `'meeting_request'` | `'access_request'` | `'access_approved'`), `toEmail`, `ccAdmin` (`clientesbinweb@gmail.com`), `toName`, `fromName`, `companyName`, `subject`, `message`, `jitsiUrl?`, `sentAt`, `deliveryStatus` (`'sent_emailjs'` | `'queued_preview'`).

### Interactive Component & State Mapping

- **Formulario de Solicitud / Ingreso Autorizado**:
  - Al enviar solicitud en la portada, se guarda en `accessRequests` con `status: 'pending'` y se invoca `sendB2BEmailNotification({ type: 'access_request', toEmail: 'clientesbinweb@gmail.com', ... })`.
  - Al intentar ingresar por *Ingreso Autorizado*, se busca el correo en `accessRequests`:
    - Si `status === 'approved'`, se concede el acceso (`onGrantAccess`).
    - Si `status === 'pending'`, se muestra la alerta de que el ingreso aguarda el OK obligatorio de `clientesbinweb@gmail.com` con opción de enviar recordatorio por EmailJS.
    - Si no existe, se permite registrarlo como solicitud de autorización pendiente para `clientesbinweb@gmail.com`.
- **Modal de Conexión (`Speed-Pitch`) y Reuniones 1-a-1**:
  - Incorpora el formulario simple de notificación por EmailJS prellenado con los datos de la empresa destino, permitiendo confirmar el correo destinatario (con copia a `clientesbinweb@gmail.com`) y enviando la alerta al pulsar *Solo Enviar Invitación* o *Enviar & Abrir Sala Jitsi 1-a-1*.
