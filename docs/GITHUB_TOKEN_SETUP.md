# Configurar Token de GitHub en Windows

## ¿Por qué necesitas un token?

GitHub eliminó el acceso con contraseña por HTTPS. Ahora se usa un **Personal Access Token (PAT)** como contraseña al hacer `git push`.

---

## PASO 1 — Crear el token en GitHub

1. Inicia sesión en [github.com](https://github.com)
2. Ve a **Settings** (icono de perfil arriba a la derecha)
3. Baja hasta **Developer settings** (último enlace del menú lateral)
4. Haz clic en **Personal access tokens → Tokens (classic)**
5. Clic en **Generate new token → Generate new token (classic)**
6. Rellena:
   - **Note:** un nombre descriptivo, por ejemplo `GPV-Consultor`
   - **Expiration:** selecciona **No expiration** (sin expiración) para no tener que renovarlo
   - **Scopes** — marca obligatoriamente estas dos secciones:

     ☑ **`repo`** — marca la casilla principal (se marcan todas las subcasillas automáticamente):
     - `repo:status`
     - `repo_deployment`
     - `public_repo`
     - `repo:invite`
     - `security_events`

     ☑ **`workflow`** — necesario para subir archivos de GitHub Actions (`.github/workflows/`)

7. Clic en **Generate token**
8. **Copia el token inmediatamente** — solo se muestra una vez

---

## PASO 2 — Guardar el token en Windows Credential Manager

1. Abre **Panel de Control → Administrador de credenciales**
2. Haz clic en **Credenciales de Windows**
3. Busca una entrada que empiece por `git:https://`
   - Si existe `git:https://github.com` o `git:https://nexus-sales@github.com` → haz clic en **Editar**
   - Si no existe → haz clic en **Agregar una credencial de Windows**
4. Rellena los campos:
   - **Dirección:** `git:https://github.com`
   - **Nombre de usuario:** tu usuario de GitHub (ej. `nexus-sales`)
   - **Contraseña:** pega el token copiado en el paso anterior
5. Clic en **Guardar**

---

## PASO 3 — Verificar que funciona

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
git push origin main
```

Si el push se completa sin pedir contraseña → todo correcto.

---

## Notas importantes

- **Nunca compartas el token** en chats, emails ni archivos del proyecto
- Si sospechas que un token fue expuesto, **revócalo inmediatamente** en GitHub (Settings → Developer settings → Personal access tokens → Delete)
- Puedes tener varios tokens con distintos permisos y nombres
- Si el token expira, repite este proceso generando uno nuevo

---

---

## PASO 4 — Conectar dominio en Vercel

Cada vez que crees un nuevo proyecto en Vercel, necesitas conectarle un subdominio. Solo son dos pasos: uno en Vercel y otro en Arsys.

### 4.1 — Añadir el dominio en Vercel

1. Entra en tu proyecto en Vercel
2. Ve a **Settings → Domains**
3. Clic en **Add Domain**
4. Escribe el subdominio en **minúsculas**: `gpv.nexus-sales.eu`
   > ⚠️ **Siempre en minúsculas** — los dominios y subdominios deben ir siempre en minúsculas. Nunca uses mayúsculas ni espacios.
5. Selecciona **Connect to an environment → Production**
6. Clic en **Save**
7. Vercel te mostrará el valor CNAME que necesitas — cópialo (tiene este formato: `xxxxxxxxxxxxxxxx.vercel-dns-017.com`)

### 4.2 — Añadir el CNAME en Arsys

1. Entra en [Arsys](https://pdc.arsys.es) → **Mis Productos → nexus-sales.eu → DNS**
2. Clic en **Añadir entrada DNS**
3. Rellena:
   - **Tipo:** CNAME
   - **Entrada:** `gpv` (solo el subdominio, sin el dominio, en minúsculas)
   - **Valor:** el CNAME que te dio Vercel (ej. `c87df0b8dc1a8803.vercel-dns-017.com`)
4. Guarda
5. Vuelve a Vercel y pulsa **Refresh** — cuando el DNS propague aparecerá como válido (puede tardar unos minutos)

### Resumen por proyecto

| Acción            | Dónde                       | Una vez            |
| ----------------- | --------------------------- | ------------------ |
| Añadir subdominio | Vercel → Settings → Domains | Por proyecto       |
| Añadir CNAME      | Arsys → DNS                 | Por proyecto       |
| Configurar token  | Windows Credential Manager  | Una vez para todos |

---

## Errores comunes

| Error                                         | Causa                                          | Solución                                      |
| --------------------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| `refusing to allow... without workflow scope` | El token no tiene el scope `workflow`          | Genera un nuevo token marcando `workflow`     |
| `Authentication failed`                       | Token incorrecto o expirado                    | Actualiza la contraseña en Credential Manager |
| `Repository not found`                        | El remote URL es incorrecto o no tienes acceso | Verifica con `git remote -v`                  |
