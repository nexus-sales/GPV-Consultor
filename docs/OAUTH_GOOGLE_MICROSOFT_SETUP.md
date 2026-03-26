# Configuración OAuth: Google y Microsoft

Esta guía explica cómo dar de alta las credenciales OAuth de Google y Microsoft para GPV, qué valores debes copiar de cada portal y exactamente dónde ponerlos.

## Qué necesitas antes

1. Tener la pantalla de Integraciones visible en la app.
   Esto implica entrar con un usuario `admin`.

1. Haber ejecutado en Supabase estos scripts:

```sql
-- scripts/create_integration_settings.sql
-- scripts/create_oauth_connections.sql
```

1. Tener disponibles estas rutas en la app:

- `http://localhost:3000/auth/google/callback`
- `http://localhost:3000/auth/microsoft/callback`

En producción serán las mismas rutas sobre tu dominio real:

- `https://tu-dominio.com/auth/google/callback`
- `https://tu-dominio.com/auth/microsoft/callback`

## Dónde se pone cada valor

Hay dos sitios distintos donde se guardan valores.

### 1. Variables del frontend

Van en tu archivo `.env` local o en las variables de entorno del hosting del frontend.

Usa estas claves:

```env
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

VITE_MICROSOFT_CLIENT_ID=
VITE_MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/microsoft/callback
```

En producción, cambia las `REDIRECT_URI` al dominio real.

### 2. Secrets de Supabase Edge Functions

Van en Supabase, no en el frontend.

Necesitas estos valores:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
SUPABASE_SERVICE_ROLE_KEY
```

El `CLIENT_ID` se repite tanto en frontend como en Supabase.
Eso es correcto.
El `CLIENT_SECRET` solo debe vivir en Supabase.

## Parte A: Google Cloud

## 1. Crear el proyecto

1. Entra en Google Cloud Console.
2. Crea un proyecto nuevo o usa uno existente para GPV.
3. Selecciona ese proyecto arriba a la izquierda.

## 2. Configurar pantalla de consentimiento OAuth

1. Ve a `APIs & Services` > `OAuth consent screen`.
2. Elige `External` si vas a usar cuentas normales de Google.
3. Rellena al menos:
   - App name: `GPV Canarias`
   - User support email: tu email
   - Developer contact information: tu email
4. Guarda.

Si estás en modo Testing, añade como usuarios de prueba las cuentas que van a conectar Google.

## 3. Crear credenciales OAuth

1. Ve a `APIs & Services` > `Credentials`.
2. Pulsa `Create Credentials`.
3. Elige `OAuth client ID`.
4. Tipo de aplicación: `Web application`.
5. Pon un nombre, por ejemplo `GPV Local + Producción`.

## 4. Añadir los redirect URI de Google

En `Authorized redirect URIs` añade los que vayas a usar.

Para desarrollo local:

```text
http://localhost:3000/auth/google/callback
```

Para producción:

```text
https://tu-dominio.com/auth/google/callback
```

Puedes añadir ambos en la misma credencial.

## 5. Copiar los datos de Google

Cuando guardes, Google te mostrará:

- `Client ID`
- `Client Secret`

Guárdalos así:

### En `.env` del frontend para Google

```env
VITE_GOOGLE_CLIENT_ID=pega_aqui_el_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### En secrets de Supabase para Google

```text
GOOGLE_CLIENT_ID=pega_aqui_el_client_id
GOOGLE_CLIENT_SECRET=pega_aqui_el_client_secret
```

## 6. Verificar scopes de Google

La app pide permisos para:

- Google Calendar
- Google Tasks
- email/profile de la cuenta

No necesitas escribir scopes manualmente en Google Cloud. La app ya los envía desde el frontend.

## Parte B: Microsoft Azure

## 1. Entrar en Azure Portal

1. Entra en Azure Portal.
2. Ve a `Microsoft Entra ID`.
3. Entra en `App registrations`.
4. Pulsa `New registration`.

## 2. Registrar la aplicación

Usa una configuración similar a esta:

- Name: `GPV Canarias`
- Supported account types: `Accounts in any organizational directory and personal Microsoft accounts`

En `Redirect URI`:

- Platform: `Web`
- URI local:

```text
http://localhost:3000/auth/microsoft/callback
```

Luego podrás añadir también producción.

## 3. Añadir redirect URI de producción

Después de crear la app:

1. Ve a `Authentication`.
2. Añade también:

```text
https://tu-dominio.com/auth/microsoft/callback
```

## 4. Crear el client secret de Microsoft

1. Ve a `Certificates & secrets`.
2. Pulsa `New client secret`.
3. Pon una descripción, por ejemplo `GPV OAuth`.
4. Elige la expiración que prefieras.
5. Guarda.

Microsoft te mostrará:

- `Application (client) ID`
- `Client secret value`

El valor del secret solo se muestra una vez. Cópialo en ese momento.

## 5. Copiar los datos de Microsoft

### En `.env` del frontend para Microsoft

```env
VITE_MICROSOFT_CLIENT_ID=pega_aqui_el_application_client_id
VITE_MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/microsoft/callback
```

### En secrets de Supabase para Microsoft

```text
MICROSOFT_CLIENT_ID=pega_aqui_el_application_client_id
MICROSOFT_CLIENT_SECRET=pega_aqui_el_client_secret_value
```

## 6. Permisos API de Microsoft

En `API permissions` asegúrate de que la app tenga permisos delegados para:

- `User.Read`
- `Calendars.ReadWrite`
- `Tasks.ReadWrite`
- `offline_access`
- `openid`
- `email`

Si no están, añádelos en:

1. `API permissions`
2. `Add a permission`
3. `Microsoft Graph`
4. `Delegated permissions`

## Parte C: Supabase

## 1. Crear los secrets de Edge Functions

En Supabase, crea estos secrets:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
SUPABASE_SERVICE_ROLE_KEY
```

El `SUPABASE_SERVICE_ROLE_KEY` lo sacas de:

1. Supabase Dashboard
2. `Project Settings`
3. `API`
4. `service_role`

No lo pongas nunca en `.env` del frontend.

## 2. Desplegar las Edge Functions

Debes desplegar estas funciones:

```bash
supabase functions deploy oauth-google-token
supabase functions deploy oauth-google-refresh
supabase functions deploy oauth-microsoft-token
supabase functions deploy oauth-microsoft-refresh
supabase functions deploy oauth-disconnect
```

## 3. Ejecutar el SQL necesario

En el SQL Editor de Supabase ejecuta:

```sql
-- scripts/create_integration_settings.sql
-- scripts/create_oauth_connections.sql
```

## Parte D: Frontend

## 1. Configurar `.env`

Ejemplo mínimo para local:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=pega_aqui_la_anon_key

VITE_GOOGLE_CLIENT_ID=pega_aqui_el_client_id_google
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

VITE_MICROSOFT_CLIENT_ID=pega_aqui_el_client_id_microsoft
VITE_MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/microsoft/callback
```

## 2. Reiniciar la app

Después de tocar `.env`, reinicia Vite.

```bash
npm run dev
```

Si no reinicias, la app seguirá diciendo que Google o Microsoft no están configurados.

## Parte E: Cómo probar que funciona

## 1. Google

1. Entra en `Configuración` > `Integraciones`.
2. Pulsa `Conectar` en Google.
3. Se abrirá el consentimiento de Google.
4. Acepta permisos.
5. Debes volver a GPV y ver Google conectado.

Si falla y ves el aviso `Google OAuth no está configurado`, casi siempre significa una de estas dos cosas:

1. Falta `VITE_GOOGLE_CLIENT_ID` en el frontend.
2. No reiniciaste la app después de editar `.env`.

## 2. Microsoft

1. Entra en `Configuración` > `Integraciones`.
2. Pulsa `Conectar` en Microsoft.
3. Se abrirá el consentimiento de Microsoft.
4. Acepta permisos.
5. Debes volver a GPV y ver Microsoft conectado.

## 3. Qué debe quedar guardado

Cuando todo funciona:

1. El frontend solo guarda sesión temporal en `sessionStorage`.
2. El refresh token queda guardado en la tabla `integration_oauth_connectionsGPV` de Supabase.
3. La configuración funcional queda en `integration_settingsGPV`.

## Errores típicos

## `Google OAuth no está configurado. Contacta con el administrador.`

Causa:

- Falta `VITE_GOOGLE_CLIENT_ID`

Solución:

- Añadirlo al `.env`
- Reiniciar `npm run dev`

## `Microsoft OAuth no está configurado. Contacta con el administrador.`

Causa:

- Falta `VITE_MICROSOFT_CLIENT_ID`

Solución:

- Añadirlo al `.env`
- Reiniciar `npm run dev`

## Error de redirect URI

Causa:

- La URL configurada en Google o Azure no coincide exactamente con la URL real de callback.

Solución:

- Revisar que no cambie protocolo, dominio, puerto ni ruta.

## Error al volver del consentimiento

Causa habitual:

- Faltan secrets en Supabase
- No están desplegadas las Edge Functions
- Falta `SUPABASE_SERVICE_ROLE_KEY`

## Checklist final

1. Tu usuario existe como `admin` en `user_profilesGPV`.
2. Ejecutaste `create_integration_settings.sql`.
3. Ejecutaste `create_oauth_connections.sql`.
4. Tienes `VITE_GOOGLE_CLIENT_ID` y `VITE_MICROSOFT_CLIENT_ID` en frontend.
5. Tienes `GOOGLE_CLIENT_SECRET` y `MICROSOFT_CLIENT_SECRET` en Supabase.
6. Tienes `SUPABASE_SERVICE_ROLE_KEY` en Supabase.
7. Desplegaste las 5 Edge Functions.
8. Los redirect URI coinciden exactamente.
9. Reiniciaste la app tras tocar `.env`.
10. Ya puedes pulsar `Conectar` desde `Configuración > Integraciones`.
