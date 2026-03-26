# Modo Técnico y Futuro Modo Administrable

## Estado actual acordado

Hasta completar la ronda de pruebas funcionales, técnicas y operativas, el proyecto GPV sigue en **modo técnico**.

Esto significa que:

- La configuración principal sigue dependiendo de variables de entorno.
- El despliegue sigue pensado para un entorno controlado por un perfil técnico.
- No se considera todavía cerrada la transición a un modelo 100% administrable desde la propia aplicación.

La decisión es deliberada: primero se valida el comportamiento completo del sistema y después se endurece la arquitectura de configuración para cliente final.

## Qué implica el modo técnico

En el estado actual, la aplicación asume que existe un responsable técnico capaz de:

- preparar el archivo .env
- configurar Supabase
- registrar integraciones OAuth en Google y Microsoft
- definir claves de API y URIs de callback
- revisar incidencias de despliegue o conexión

Este enfoque sirve para desarrollo, validación y pruebas controladas, pero **no es el modelo objetivo para producto comercial**.

## Limitaciones detectadas del enfoque actual

### 1. Dependencia de variables de entorno en frontend

La aplicación sigue leyendo configuración de build desde Vite, por ejemplo:

- Supabase URL
- Supabase anon key
- Google Places key

Eso ocurre actualmente en la capa de configuración central.

### 2. Mensaje de configuración orientado a perfil técnico

La pantalla de ajustes todavía comunica que ciertas integraciones deben habilitarse mediante variables de entorno en .env.

Esto no encaja con un escenario donde el cliente compra el producto y espera administrarlo desde la UI.

### 3. Flujo OAuth con secretos referenciados en cliente

Se confirmó que el flujo OAuth original referenciaba `client_secret` desde frontend para Google y Microsoft. Ese riesgo inmediato ya se ha mitigado migrando la SPA a PKCE, pero el modelo objetivo sigue siendo mover callbacks y refresco de tokens a backend.

Eso no debe considerarse arquitectura final de producto.

Aunque pueda servir en validaciones o entornos controlados, un secreto OAuth no debe vivir en el navegador ni depender del bundle del cliente.

## Decisión de arquitectura

### Decisión inmediata

Se mantiene temporalmente el **modo técnico** mientras continúan las pruebas.

### Decisión objetivo

Una vez cerrada la validación, la aplicación debe evolucionar a un **modo administrable** con estas reglas:

- El cliente final no debe tocar GitHub.
- El cliente final no debe editar .env.
- El cliente final no debe entrar en la consola de Supabase para operar el día a día.
- Solo el administrador autorizado de la aplicación debe poder configurar integraciones desde la UI.
- Los secretos reales deben almacenarse y procesarse del lado servidor.

## Separación correcta de configuración

Para pasar de modo técnico a modo administrable, hay que distinguir dos tipos de configuración.

### Configuración administrable desde la app

Puede vivir en base de datos o en una capa de configuración runtime controlada por permisos de administrador:

- proveedor activo
- flags de funcionalidad
- opciones de sincronización
- identificadores públicos no sensibles
- textos, branding y preferencias operativas
- parámetros funcionales que no expongan secretos

### Configuración sensible que no debe ir al frontend

Debe mantenerse en backend, edge functions o un almacén seguro no accesible al cliente:

- client_secret de Google
- client_secret de Microsoft
- refresh tokens sensibles
- claves privadas
- credenciales de servicio
- cualquier secreto necesario para intercambio de tokens o acceso privilegiado

## Qué puede quedarse en cliente y qué no

### Puede permanecer en cliente con control adecuado

- Supabase URL
- Supabase anon key

Esto es aceptable siempre que las políticas RLS y los permisos estén correctamente diseñados.

### Puede quedarse temporalmente en cliente, pero conviene revisarlo

- Google Places key

Si permanece en frontend, debe restringirse por dominio, cuota y APIs permitidas. Si se busca mayor control comercial y operativo, conviene mover su consumo a backend.

### Debe salir del frontend

- Google OAuth client secret
- Microsoft OAuth client secret
- cualquier intercambio OAuth que dependa de secretos

## Modelo objetivo recomendado

## 1. Panel de administración interno

La app debe incorporar una sección visible solo para usuarios con rol administrador, desde la que se pueda:

- activar o desactivar integraciones
- ver estado de conexión
- iniciar autorizaciones
- definir configuración funcional no sensible
- auditar cambios de configuración

## 2. Capa runtime de configuración

La configuración operativa no sensible debe almacenarse fuera del build, por ejemplo mediante:

- tabla `app_settings`
- tabla `integration_settings`
- vistas filtradas por permisos
- lectura controlada por RLS para admins

El frontend debe consumir esta configuración en tiempo de ejecución, no solo en compile time.

## 3. OAuth movido a backend o edge functions

El flujo correcto es:

1. el usuario administrador inicia la conexión desde la app
2. el backend redirige al proveedor
3. el proveedor devuelve el `code` a un callback controlado por backend
4. el backend intercambia `code` por tokens usando el `client_secret`
5. el backend almacena tokens de forma segura
6. la UI solo recibe estado de conexión y datos necesarios de sesión

## 4. Roles y permisos

La configuración de integraciones debe quedar reservada a perfiles admin.

El resto de usuarios solo debería:

- usar integraciones ya habilitadas
- consultar estados permitidos
- ejecutar acciones funcionales según permisos

## Modo comercial recomendado

Hay dos modelos posibles.

### Modelo A. Integraciones gestionadas por el proveedor del producto

Es el modelo más simple para cliente final.

- el proveedor del software controla las apps OAuth
- el cliente no crea credenciales en Google o Microsoft
- el administrador solo conecta y usa

Este modelo ofrece mejor experiencia de producto.

### Modelo B. Cada cliente aporta sus propias credenciales

Es un modelo más enterprise.

- el cliente debe crear su app en Google o Microsoft
- después carga esos datos desde una UI admin
- sigue existiendo dependencia de configuración externa

Este modelo reduce dependencia del proveedor, pero aumenta la fricción operativa.

## Recomendación para GPV

Para un producto comercial más fácil de implantar, la recomendación actual es:

- seguir temporalmente en modo técnico mientras continúan las pruebas
- no consolidar como solución final ningún flujo basado en secretos en frontend
- mover OAuth de Google y Microsoft a backend en la siguiente fase
- introducir una capa de configuración runtime administrable solo por admin
- dejar para una segunda decisión si Google Places se mantiene en cliente o pasa a backend

## Criterio de salida del modo técnico

Se considerará razonable iniciar la transición al modo administrable cuando se cumpla lo siguiente:

- validación funcional cerrada
- validación técnica cerrada
- pruebas de integración cerradas
- revisión mínima de seguridad completada
- definición clara de qué configuración es pública y cuál es secreta

## Próxima fase propuesta

### Fase 1. Endurecimiento mínimo

- eliminar `client_secret` del frontend
- preparar y desplegar edge functions para exchange y refresh OAuth
- mantener temporalmente el resto de la configuración técnica

### Fase 2. Configuración administrable

- crear tablas de configuración runtime
- añadir UI solo para admin
- persistir estado de integraciones fuera del build
- sustituir mensajes de tipo “configura esto en .env” por flujos internos de administración

Estado actual de la fase 2:

- la UI de integraciones ya está restringida a admins
- la tabla objetivo `integration_settingsGPV` ya está definida a nivel de script SQL
- el frontend ya intenta persistir esa configuración en Supabase y cae a `localStorage` si la tabla o el entorno aún no están listos

### Fase 3. Producto comercial completo

- auditoría de cambios de configuración
- gestión de secretos con backend seguro
- revisión de cuotas, dominios y límites de APIs externas
- documentación operativa para implantación en cliente final

## Resumen ejecutivo

La decisión actual es correcta:

- **por ahora** se sigue en modo técnico
- **a futuro** la app debe pasar a un modelo administrable desde la propia interfaz
- **los secretos no deben formar parte de esa administración en frontend**

El objetivo no es que el cliente aprenda a tocar .env, sino que el producto deje de depender de ello.
