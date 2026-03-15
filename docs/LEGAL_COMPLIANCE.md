# Cumplimiento Legal — GPV Canarias

**Empresa:** Ucoip Canarias (nombre comercial: Grupo LMB)
**CIF:** B76525567
**Domicilio:** Calle La Tierra N11, 38205, San Cristóbal de La Laguna, Santa Cruz de Tenerife
**Teléfono:** +34 607 892 939
**Email:** info@ucoipcanarias.com
**DPD:** Salvador Muñoz Portillo — info@ucoipcanarias.com
**Última revisión:** 15 de marzo de 2025

---

## 1. Marco normativo aplicado

| Norma                                                 | Ámbito                                     | Aplicación en GPV Canarias                                 |
| ----------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| **RGPD** — Reglamento (UE) 2016/679                   | Protección de datos personales en la UE    | Tratamiento de datos de usuarios y contactos comerciales   |
| **LOPDGDD** — LO 3/2018, de 5 de diciembre            | Adaptación española del RGPD               | Derechos de los interesados, DPD, plazos de conservación   |
| **LSSICE** — Ley 34/2002, de 11 de julio              | Servicios de la sociedad de la información | Aviso legal, cookies, identificación del prestador         |
| **EU AI Act** — Reglamento (UE) 2024/1689             | Sistemas de IA en la UE                    | Clasificación de riesgo, transparencia, supervisión humana |
| **Directiva ePrivacy** — 2009/136/CE + LSSI Art. 22.2 | Cookies y almacenamiento local             | Consentimiento, tabla de almacenamiento, banner            |

---

## 2. Páginas legales implementadas

### 2.1 Aviso Legal

- **Ruta:** `/legal/aviso`
- **Archivo:** `src/pages/legal/AvisoLegal.tsx`
- **Norma:** LSSICE Ley 34/2002
- **Contenido:**
  - Datos identificativos del titular (razón social + nombre comercial)
  - Objeto y ámbito de la aplicación
  - Propiedad intelectual e industrial
  - Condiciones de uso
  - Limitación de responsabilidad
  - **Sección específica EU AI Act** — clasificación de riesgo bajo, sin decisiones automatizadas
  - Legislación aplicable y jurisdicción (Santa Cruz de Tenerife)
  - Política de modificaciones

### 2.2 Política de Privacidad

- **Ruta:** `/legal/privacidad`
- **Archivo:** `src/pages/legal/Privacidad.tsx`
- **Normas:** RGPD (UE) 2016/679 + LOPDGDD 3/2018 + EU AI Act 2024/1689
- **Contenido:**
  - Responsable del tratamiento con DPD designado
  - Categorías de datos tratados y base jurídica de cada tratamiento
  - Destinatarios e infraestructura (Supabase EU — Frankfurt)
  - Transferencias internacionales (ninguna fuera del EEE)
  - Plazos de conservación
  - Derechos del interesado (acceso, rectificación, supresión, oposición, limitación, portabilidad)
  - Enlace a la AEPD para reclamaciones
  - **Sección EU AI Act** — IA de riesgo bajo, sin decisiones automatizadas sobre personas físicas
  - Medidas de seguridad técnica (TLS 1.3, RLS, roles)

### 2.3 Política de Cookies

- **Ruta:** `/legal/cookies`
- **Archivo:** `src/pages/legal/Cookies.tsx`
- **Normas:** Directiva ePrivacy + LSSI Art. 22.2 + RGPD
- **Contenido:**
  - Explicación del almacenamiento local (localStorage vs cookies)
  - **Tabla completa** de todos los elementos almacenados con nombre, tipo, finalidad, duración y necesidad
  - Base jurídica por categoría (necesario vs funcional)
  - **Gestión interactiva** del consentimiento desde la propia página
  - Instrucciones para eliminar el almacenamiento manualmente

---

## 3. Banner de consentimiento de cookies

- **Archivo:** `src/components/legal/CookieBanner.tsx`
- **Integración:** Añadido en `src/Layout.tsx` (visible en todas las rutas autenticadas)
- **Comportamiento:**
  - Aparece en el primer acceso si no hay preferencia guardada
  - Botones: "Aceptar" / "Rechazar"
  - Persiste la elección en `localStorage` bajo la clave `gpv_cookie_consent`
  - Incluye enlace directo a Política de Cookies y Política de Privacidad
  - Accesible (`role="dialog"`, `aria-label`)
- **Modificar preferencia:** El usuario puede cambiarla en cualquier momento desde `/legal/cookies`

---

## 4. Integración en la aplicación

### Footer del Login

Archivo: `src/pages/Login.tsx`
Los tres enlaces legales son visibles **antes de autenticarse**:

```
Aviso Legal · Privacidad · Cookies
```

### Rutas públicas (sin autenticación)

Añadidas en `src/router.tsx`:

```
/legal/aviso       → AvisoLegal
/legal/privacidad  → Privacidad
/legal/cookies     → Cookies
```

---

## 5. Almacenamiento local documentado

| Clave                                                    | Tipo                   | Necesario                  |
| -------------------------------------------------------- | ---------------------- | -------------------------- |
| `sb-*-auth-token`                                        | Cookie sesión Supabase | Estrictamente necesario    |
| `gpv_cookie_consent`                                     | localStorage           | Estrictamente necesario    |
| `leads`, `distributors`, `candidates`, `visits`, `sales` | localStorage           | Funcional (offline)        |
| `syncQueue`                                              | localStorage           | Funcional (sincronización) |
| `theme`                                                  | localStorage           | Funcional (preferencias)   |
| `lastSync`                                               | localStorage           | Funcional                  |

> No se usan cookies de publicidad, rastreo ni analítica de terceros.

---

## 6. Clasificación EU AI Act

| Criterio                     | Valor                                                                |
| ---------------------------- | -------------------------------------------------------------------- |
| **Nivel de riesgo**          | Bajo                                                                 |
| **Funcionalidades IA**       | Extracción de leads desde Google Places, sugerencias comerciales     |
| **Decisiones automatizadas** | Ninguna (art. 22 RGPD)                                               |
| **Supervisión humana**       | Siempre requerida                                                    |
| **Datos procesados por IA**  | Datos de empresas, fuentes públicas (no datos personales sensibles)  |
| **Obligaciones aplicables**  | Transparencia informativa (documentadas en Aviso Legal y Privacidad) |

---

## 7. Pendiente / Recomendaciones futuras

- [ ] Registro de Actividades de Tratamiento (RAT) — obligatorio RGPD art. 30 para empresas
- [ ] Formulario de ejercicio de derechos in-app (actualmente por email)
- [ ] Funcionalidad de exportación de datos del usuario (RGPD derecho de portabilidad)
- [ ] Funcionalidad de solicitud de eliminación de cuenta (RGPD derecho de supresión)
- [ ] Renovación anual de la revisión legal (próxima: marzo 2026)
- [ ] Verificar con asesor jurídico si aplica notificación a AEPD como responsable de tratamiento
