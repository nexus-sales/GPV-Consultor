# Patrones de búsqueda por lenguaje

Usa estos patrones con `grep -rn` (o `-rni` para insensible a mayúsculas) como punto de partida. Ajusta extensiones según el proyecto.

> **Estos patrones son la segunda mano, no la primera.** Primero corre las herramientas del
> lenguaje (linter, type-checker, build, tests — ver SKILL.md "Las herramientas del lenguaje"):
> ellas detectan imports rotos, errores de tipo y tests que fallan mejor que cualquier grep.
> Estos patrones cubren lo que las herramientas NO ven: placebos, logs olvidados, placeholders
> y hardcoding sospechoso.

> Nota: patrones de secretos/credenciales (API keys, passwords, tokens) NO van aquí — eso
> es territorio del skill Auditor. Si un grep tuyo los encuentra de paso, deriva, no audites.

## JavaScript / TypeScript / React

- Logs: `console\.(log|debug|warn|info)|debugger`
- Placeholders: `TODO|FIXME|HACK|XXX|lorem ipsum`
- Async sin manejo de errores: buscar `await ` y revisar manualmente si está dentro de un try/catch (o si la promesa tiene `.catch`)
- Imports rotos: el type-checker (`tsc --noEmit`) los caza mejor; con grep, revisar cada `import .* from ['"]\./` y verificar que el archivo destino exista
- Placebos/mocks olvidados: `mock|fake|dummy|placeholder|stub` en nombres de función usados fuera de tests
- Handlers vacíos (placebo clásico): `onClick=\{?\(\) =>\s*\{\s*\}|return null;?\s*//\s*TODO` — un botón cuyo handler no hace nada
- Promesas sin await (fallo silencioso): llamadas a funciones `async` sin `await` ni `.then`

## Python

- Logs: `print\(|pdb\.set_trace|breakpoint\(\)`
- Placeholders: `TODO|FIXME|XXX|pass  #`
- Excepciones silenciosas: `except:\s*pass|except Exception:\s*pass` (traga el error sin avisar — placebo de manejo de errores)
- Funciones placebo: `def .*:\s*pass` o `def .*:\s*\.\.\.` fuera de clases base abstractas o stubs declarados
- `NotImplementedError` en código que se llama en producción

## Go

- Errores ignorados (el placebo de Go): `_ = ` antes de una llamada que devuelve error, o `if err != nil` seguido de bloque vacío
- Logs de debug: `fmt\.Print|log\.Print` dejados en rutas de producción

## General (cualquier lenguaje)

- Comentarios de borrar: `borrar esto|remove this|delete me|temporal|temp fix|no tocar`
- Código comentado en bloque (posible código muerto dejado "por si acaso")
- Archivos de configuración con valores de ejemplo sin cambiar: `localhost|example\.com|changeme|123456|your-.*-here`
- Números mágicos repetidos que deberían ser constantes con nombre

## Para detectar archivos huérfanos

1. Lista todos los archivos de código del proyecto.
2. Para cada uno, busca su nombre de archivo (sin extensión) en todo el repo con grep.
3. Si el único resultado es el propio archivo, es candidato a huérfano — verifica que no se cargue dinámicamente (rutas, lazy imports, convención de carga automática) antes de confirmarlo.

## Para detectar código muerto

- El linter a menudo marca variables/imports sin usar; parte de ahí.
- Para funciones/componentes: grep del nombre exacto en todo el repo. Un solo resultado (la definición) = candidato. Confirma que no se cargue dinámicamente.

## Para detectar duplicados

- Busca funciones con nombres similares o bloques de 5+ líneas que se repiten casi idénticos en distintos archivos.
- Herramientas dedicadas si están disponibles: `jscpd` (JS/TS, multi-lenguaje) o `pylint --duplicate-code` (Python). Si no, inspección dirigida a los archivos más grandes.

## Para detectar dependencias circulares

- JS/TS: `madge --circular .` si está disponible.
- Python: `pycycle` o revisión manual de imports cruzados entre módulos del mismo paquete.

## Para la cuarta superficie — huecos (docs, setup, uso inusual)

Esto no es tanto grep como verificación activa — pero estos patrones ayudan a arrancar:

- **Puertos y comandos en docs vs. código real:** busca en el README los puertos, comandos (`npm run`, `python -m`) y nombres de scripts mencionados; compáralos contra `package.json`/`Makefile`/el código de arranque real. Un desajuste aquí es hallazgo directo.
- **Variables de entorno mencionadas pero no declaradas:** grep de `process.env.` / `os.getenv(` / `os.environ` en el código, y compara la lista contra lo que hay en `.env.example` (si existe) o en el README. Las que faltan en el ejemplo son fricción para cualquiera que clone el repo.
- **Ausencia de `.env.example`** cuando el código sí usa variables de entorno: hallazgo directo de la superficie de huecos.
- **Timeouts y cancelación:** busca llamadas a red o a procesos largos (`fetch`, `axios`, `requests.`, `subprocess`, colas, websockets) y revisa si tienen algún timeout o forma de cancelar. Su ausencia total en operaciones largas es candidato a hallazgo — no acuses en operaciones triviales o rápidas.
- **Validación de entrada ausente en el punto de entrada**, no solo en capas internas: revisa si los parámetros de un endpoint/función pública se usan directamente sin comprobar tipo, rango o presencia antes de actuar sobre ellos.
- **Operaciones que no limpian tras fallo:** busca aperturas de recursos (archivos, conexiones, transacciones) y confirma que el cierre/rollback ocurre también en la rama de error, no solo en la de éxito.
