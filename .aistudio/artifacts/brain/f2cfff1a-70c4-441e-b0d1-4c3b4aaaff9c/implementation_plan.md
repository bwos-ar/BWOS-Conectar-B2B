# Verificación de Token de Sesión entre Pestañas y Protección Estricta del Dashboard Administrador

Este plan incorpora la validación continua en el ciclo de vida principal de la aplicación para detectar si un token de sesión de Link Mágico almacenado en `localStorage` ya fue consumido o reclamado por otra sesión activa, cerrando de inmediato la sesión y bloqueando el acceso en la pantalla de invitación. Asimismo, refactoriza la consola de administración para que todo su renderizado dependa tanto del flag `isAdmin` como del token de sesión verificado en el estado central, y nunca únicamente del correo electrónico.

## Revisión de Usuario y Decisiones Confirmadas

> [!IMPORTANT]
> Se aplicarán las siguientes decisiones confirmadas para garantizar que ningún token de Link Mágico pueda ser reutilizado ni compartido entre sesiones:

- **Decisión Confirmada 1 (Sincronización de Persistencia)**: La validación de uso único y titularidad de sesión se realizará mediante persistencia robusta en `localStorage` combinada con `sessionStorage` (ID único por pestaña/sesión) y sincronización en vivo entre pestañas (`storage` event + `BroadcastChannel`).
- **Decisión Confirmada 2 (Acción ante Reintento o Fallo de Validación)**: Si se detecta un reintento de uso del mismo token por otra sesión, o si `isAdmin` o el token de sesión verificado son inválidos, se cerrará la sesión inmediatamente y se redirigirá al usuario a la pantalla de bloqueo de invitación (`InvitationGateView`) con una notificación de seguridad.

---

## 1. Descripción General y Concepto Central

- **Qué hace**:
  1. Asigna un identificador único de instancia de pestaña (`sessionInstanceId` en `sessionStorage`) al consumir un Link Mágico por primera vez y vincula ese `sessionInstanceId` al registro del token `'usado'` en `localStorage`.
  2. Añade una verificación continua en el `useEffect` principal (al montar, al cambiar de vista, al escuchar eventos `storage` / `BroadcastChannel` y al recuperar el foco de la ventana) que comprueba si el token almacenado fue reclamado o reintentado desde otra sesión o si fue invalidado; de ser así, revoca la sesión de inmediato.
  3. Refactoriza la vista del Dashboard Administrador para exigir simultáneamente `isAdmin === true` y un `verifiedSessionToken` válido proveniente del estado de la aplicación principal antes de permitir el renderizado de la consola.
- **Audiencia Objetivo**: Administradores autorizados de BWOS Conectar B2B (`clientesbinweb@gmail.com` y `somosbwos@gmail.com`).
- **Valor Principal**: Impide que un Link Mágico interceptado o abierto nuevamente en otra ventana/sesión mantenga o duplique el acceso administrativo, protegiendo las aprobaciones de invitaciones y registros de EmailJS.

---

## 2. Experiencia de Usuario y Diseño Visual

- **Flujos Clave de Usuario**:
  1. **Consumo Inicial del Link Mágico**: Cuando el administrador abre el enlace único `?admin_action=magic_login&token=mlk_...`, el sistema verifica que el token esté en estado `'pendiente'`, lo marca como `'usado'` en `localStorage` vinculándolo al `sessionInstanceId` de la pestaña actual y guarda el token verificado en el estado de la aplicación.
  2. **Detección de Reintento o Uso en Otra Sesión**: Si otra pestaña o ventana intenta usar el mismo token `mlk_...` (o si se detecta una discrepancia de `sessionInstanceId` o marca de reintento `reusedAttemptAt` en `localStorage`), el `useEffect` principal dispara la revocación inmediata: limpia las credenciales de sesión, establece `isAdmin = false` y `hasInvitationAccess = false`, y devuelve la vista a la pantalla de solicitud de invitación mostrando una alerta clara.
  3. **Protección de Renderizado del Dashboard**: En el contenedor principal y dentro de la vista del Dashboard Administrador, una guarda de doble capa verifica `isAdmin === true` y `Boolean(verifiedSessionToken)` validado contra el registro de sesión activa antes de montar cualquier métrica, tabla de solicitudes o bitácora de EmailJS.
- **Identidad Visual y Tema**:
  - *Dirección Estética*: Consola ejecutiva B2B sobria y de alta densidad informativa, manteniendo la paleta institucional oscura (`#161f30`) en el cabezal administrativo y superficies neutras limpias (`#f8fafc` / `#ffffff`) con bordes de 1px.
  - *Tipografía y Jerarquía*: Encabezados claros con numerales tabulares (`tabular-nums`) y fuentes monoespaciadas (`font-mono`) para identificadores de token y marcas de tiempo de auditoría.
  - *Disciplina de Metadatos*: Los estados de verificación del token de sesión (`Token de sesión verificado · Estado: usado · Sesión única activa`) se presentan como texto limpio con separadores tipográficos (`·`).

---

## 3. Decisiones de Producto y Compromisos Técnicos

- **Decisión 1: Vinculación de Token a Instancia de Sesión (`sessionStorage` + `localStorage` + `BroadcastChannel`)**
  - *Enfoque Elegido*: Cada pestaña genera un `sessionInstanceId` en `sessionStorage` (que no se comparte cuando se abre un enlace en una nueva pestaña independiente). Al consumir un token mágico, el registro en `localStorage` guarda `consumedBySessionId: sessionInstanceId`. Si otra pestaña intenta consumir el mismo token o intenta leer el token almacenado con un `sessionInstanceId` distinto, se registra la colisión en `localStorage` y se emite un evento por `BroadcastChannel` y `storage` que cierra inmediatamente la vista administrativa.
  - *Por qué*: Permite distinguir con precisión entre una recarga legítima de la misma pestaña y un intento de reutilización o apertura del token en otra sesión del navegador sin depender de infraestructura externa.
- **Decisión 2: Guardia de Renderizado de Doble Capa (`App` + `AdminDashboardView`)**
  - *Enfoque Elegido*: En lugar de confiar únicamente en el correo almacenado (`sessionEmail`), tanto el componente raíz como la vista del Dashboard validan explícitamente `isAdmin && isSessionTokenActiveAndValid(verifiedSessionToken, sessionEmail)`. Si cualquiera de las condiciones falla, el componente no se renderiza y ejecuta el cierre de sesión hacia la pantalla de invitación.
  - *Por qué*: Garantiza defensa en profundidad frente a manipulaciones manuales de `localStorage` o cambios de estado parciales.

---

## 4. Arquitectura Técnica y Estrategia de Datos

### Diagrama de Arquitectura y Verificación de Sesión

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Persistencia Robusta & Sincronización                    │
│  • localStorage (Tokens emitidos/usados + consumedBySessionId + colisiones)│
│  • sessionStorage (sessionInstanceId único por pestaña/sesión)             │
│  • BroadcastChannel ('bwos_admin_token_guard') + Window 'storage' Event    │
└───────────────────┬────────────────────────────────────────┬───────────────┘
                    │                                        │
                    ▼                                        ▼
┌─────────────────────────────────────────┐  ┌───────────────────────────────┐
│     useEffect Principal (App.tsx)       │  │  Interceptor URL magic_login  │
│  • Valida verifiedSessionToken activo   │  │  • Consume token 1 sola vez   │
│  • Detecta si otra sesión usó el token  │  │  • Si ya está 'usado', marca  │
│  • Si detecta reintento o token inválido│  │    reintento y emite alerta   │
│    -> Cierra sesión y bloquea en Gate   │  │    a todas las pestañas       │
└───────────────────┬─────────────────────┘  └───────────────┬───────────────┘
                    │                                        │
                    └───────────────────┬────────────────────┘
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│           Guardia de Acceso en Estado Central (App.tsx)                    │
│   Condición: isAdmin === true && Boolean(verifiedSessionToken)             │
│   Si es falso -> Renderiza exclusivamente InvitationGateView               │
└───────────────────────────────────────┬────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                AdminDashboardView (Protección Refactorizada)               │
│   • Recibe isAdmin + verifiedSessionToken desde el estado de App.tsx       │
│   • Bloquea renderizado si !isAdmin || !verifiedSessionToken               │
│   • Dispara onInvalidSessionDetected() para cerrar vista de inmediato      │
└────────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Datos y Mapeo de Interacciones

- **Entidad de Sesión y Token (`UsedMagicTokenPersistenceEntry`)**:
  - `token`: Identificador único `mlk_...`
  - `status`: `'usado'`
  - `usedAt`: Marca de tiempo ISO del primer consumo
  - `email`: Correo administrador autenticado
  - `consumedBySessionId`: ID único de la sesión que consumió el token legítimamente
  - `reusedAttemptDetected`: Booleano que se activa si cualquier petición posterior intenta volver a usar el mismo token
  - `reusedAttemptAt`: Marca de tiempo del intento de reutilización
- **Flujo Reactivo ante Reintento**:
  - Cuando se intenta usar un token ya marcado como `'usado'` (ya sea por URL `?admin_action=magic_login&token=...` o mediante el verificador de bloqueo), el servicio marca `reusedAttemptDetected = true` en el registro del token y notifica por `BroadcastChannel` y `localStorage`.
  - El `useEffect` principal escucha este cambio en tiempo real, ejecuta la función de revocación de sesión (`handleLockToInvitationGate`), limpia el estado administrativo (`isAdmin = false`, `verifiedSessionToken = null`, `hasInvitationAccess = false`) y bloquea la aplicación en la pantalla de invitación.
