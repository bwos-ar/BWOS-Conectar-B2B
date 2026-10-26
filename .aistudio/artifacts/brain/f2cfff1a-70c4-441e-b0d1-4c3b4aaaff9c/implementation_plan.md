# Plan de Implementación: Autenticación de Administradores por Link Mágico de Único Uso y Privacidad en el Frontend Público

## 1. Objetivo
Garantizar que el acceso al **Dashboard de Administración** para las cuentas autorizadas (`clientesbinweb@gmail.com` y `somosbwos@gmail.com`) sea 100% privado y seguro:
1. **Privacidad total en el Frontend Público**: Eliminar cualquier botón de acceso rápido (*"Acceso Rápido Admin"*), placeholder, tarjeta informativa o mensaje de error que exponga los correos de los administradores en la pantalla pública de ingreso, mostrando únicamente referencias genéricas como **"Administración General BWOS"**.
2. **Autenticación por Link Mágico de Único Uso vía EmailJS**: Al completar **Nombre y Apellido, Empresa y Correo Electrónico** con cualquiera de los dos correos administradores en la pestaña de ingreso, **no** se abrirá la sesión directamente en el navegador; en su lugar, el sistema generará un **Token Mágico de único uso (`mlk_...`)** y enviará por **EmailJS** un enlace exclusivo al buzón de ese administrador para que solo el propietario real del correo pueda abrir el **Dashboard de Administración**.

---

## 2. Flujo de Experiencia de Usuario y Seguridad

### A. Limpieza y Privacidad en la Pantalla Pública (`InvitationGateView.tsx` y `MvpDevelopmentBanner.tsx`)
- **Eliminación de botones de autocompletado**: Se remueve por completo la barra `"Acceso Rápido Admin: Cargar somosbwos@gmail.com / Cargar clientesbinweb@gmail.com"`.
- **Ocultación de correos de administración**:
  - En las tarjetas superiores (*"OK Obligatorio"*), textos de ayuda, placeholders (`Ej. nombre@tuempresa.com`) y mensajes de estado o espera, se reemplaza cualquier mención a `clientesbinweb@gmail.com` o `somosbwos@gmail.com` por **"Administración General BWOS"**.
  - Los correos de administración tampoco se exponen en los textos enviados al solicitante externo cuando pide invitación.

### B. Generación y Envío del Link Mágico de Único Uso (`emailjsService.ts`)
- **Tokens Mágicos de único uso (`mlk_...`)**:
  - Se agregan funciones dedicadas en `emailjsService.ts`:
    - `generateAdminMagicLoginToken(email: string): string`
    - `isMagicLoginTokenUsed(token: string): boolean`
    - `markMagicLoginTokenUsed(token: string): void`
    - `buildAdminMagicLoginUrl(params: { email: string; name: string; company: string }): { magicUrl: string; token: string }`
  - El enlace generado tendrá el formato:
    `https://<app-url>/?admin_action=magic_login&token=mlk_...&email=...&name=...&company=...`
- **Envío por EmailJS compatible con la plantilla actual**:
  - Cuando `clientesbinweb@gmail.com` o `somosbwos@gmail.com` solicita ingresar indicando su **Nombre y Apellido, Empresa y Correo Electrónico**, se envía un correo mediante `sendB2BEmailNotification` exclusivamente a esa dirección de administrador.
  - El **Link Mágico de único uso** se inyecta en `{{Aceptar a quien solicitó invitación}}`, `{{approval_url}}`, `{{jitsi_url}}` y dentro del cuerpo `{{message}}` para que sea clicable de inmediato desde su bandeja de entrada.
  - En pantalla, el formulario muestra un aviso de seguridad: *"Por seguridad, hemos enviado un Link Mágico de acceso único a tu correo electrónico. Haz clic en el enlace recibido en tu bandeja de entrada para abrir el Dashboard de Administración."*

### C. Validación del Link Mágico al Abrir la URL (`App.tsx`)
- Al detectar `?admin_action=magic_login&token=mlk_...&email=...` en la URL:
  1. Verifica que el correo pertenezca a la lista de administradores autorizados (`isAdminEmail(email)`).
  2. Verifica que el `token` (`mlk_...`) sea válido y **no haya sido utilizado previamente** (`!isMagicLoginTokenUsed(token)`).
  3. Marca inmediatamente el token como consumido (`markMagicLoginTokenUsed(token)`) para que no pueda reutilizarse si alguien copia el enlace.
  4. Limpia los parámetros de la URL con `window.history.replaceState` para no dejar el token visible en la barra de direcciones.
  5. Inicia la sesión administrativa con el **Nombre y Apellido, Empresa y Correo Electrónico** recibidos, abre directamente la vista `admin-dashboard` y muestra el banner de confirmación de sesión iniciada mediante Link Mágico.
  6. Si el token ya fue usado o es inválido, bloquea el ingreso y muestra una alerta indicando que el Link Mágico expiró o ya fue utilizado.

---

## 3. Archivos a Modificar
1. **`/src/services/emailjsService.ts`**:
   - Implementar el registro de tokens mágicos de único uso (`bwos_used_magic_login_tokens_v1`), `buildAdminMagicLoginUrl`, y soporte para el tipo de notificación `admin_magic_link`.
2. **`/src/components/InvitationGateView.tsx`**:
   - Eliminar los botones de acceso rápido y todas las menciones públicas a `clientesbinweb@gmail.com` y `somosbwos@gmail.com`.
   - Reemplazar el ingreso directo de administradores por el disparo del **Link Mágico de único uso vía EmailJS** y la vista de confirmación de envío al correo.
3. **`/src/components/MvpDevelopmentBanner.tsx`**:
   - Verificar y ocultar cualquier referencia visible a los correos de administración en las vistas públicas.
4. **`/src/App.tsx`**:
   - Procesar `admin_action === 'magic_login'` validando el token de único uso, registrando los datos del administrador (**Nombre y Apellido, Empresa y Correo Electrónico**) y redirigiendo al **Dashboard de Administración**.
