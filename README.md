# Servicios web con React: Axios, CORS y los tres estados

Entrega del **laboratorio extra de la semana 12** de Desarrollo de Aplicaciones Empresariales (DAE), Tecsup, sección 4-C24-A.

La pantalla de **cuestionarios** de React consume una API con Axios: lista, crea y elimina. Todo corre en local con una red simulada, sin Django. Este repositorio contiene:

1. El **módulo cliente** de la API, la **política de CORS** y el **hook del listado** (`src/client/`), escritos contra pruebas.
2. La **revisión del cliente escrito por una IA** (`src/ai/`): clasificación de sus cinco fallos y arreglo de cada uno.
3. Un **cliente sin pantalla** (`cli/examctl.mjs`) que usa la misma API desde la terminal, con códigos de salida pensados para scripts y agentes.

## Resultado

| Comando | Resultado |
|---|---|
| `npm test` (código propio, `src/client/`) | 67 de 67 pruebas pasan |
| `npm run test:ai` (cliente de la IA, `src/ai/`) | 67 de 67 pruebas pasan, después de arreglar los cinco fallos |

Vitest informa un «1 error» en `npm test` y en `npm run test:ai`. Corresponde a la prueba «listExams entrega la señal a Axios: al abortar, la petición se cancela»: la promesa se rechaza (`ERR_CANCELED`) antes de que la prueba la atienda. Todas las pruebas pasan.

## Puesta en marcha

Necesitas Node 20.19 o superior (o 22.12 o superior).

```bash
npm install
npm run dev          # http://localhost:5173 (déjalo corriendo)
```

En otra terminal:

```bash
npm test             # pruebas del código propio
npm run test:ai      # pruebas del cliente de la IA
```

## Decisiones del equipo

Estas decisiones las tomó la persona, no el agente, y están escritas en el código y en los prompts:

- **Orígenes de CORS:** solo `http://localhost:5173` (`src/client/cors.js`). Sin comodín (`*`), porque con él cualquier sitio web puede leer las respuestas de la API.
- **Lista tras borrar:** se filtra en local el cuestionario borrado, sin volver a pedir la lista al servidor. El servidor ya confirmó el borrado con un 204.
- **Doble envío:** `create` ignora una segunda llamada mientras la primera sigue en vuelo. La guarda va en un `useRef`, porque un estado llega tarde.
- **Errores visibles:** todo error pasa por `describeError` y llega a la pantalla (`error` o `actionError`). Nada se queda solo en la consola.

## Cómo se resolvió `src/ai/`

Cada arreglo se hizo por separado y se comprobó con `npm run test:ai`:

| # | Fallo | Arreglo | Pruebas pasan (antes → después) |
|---|---|---|---|
| 1 | CORS con comodín (`cors.js`) | Origen exacto `http://localhost:5173` | 42 → 47 |
| 2 | La lista no se actualiza tras borrar (`remove`) | Filtro por id en local | 47 → 49 |
| 3 | Doble envío en `create` | Guarda con `useRef`, `saving` real y `finally` | 49 → 52 |
| 4 | Errores tragados (`catch` con solo `console.error`) | `describeError` y estado `error` | 52 → 62 |
| 5a | `listExams` no recibe la señal | Firma `{ signal } = {}` y se pasa a Axios | 62 → 63 |
| 5b | Sin cancelación ni control de carrera en el efecto | `AbortController`, bandera `cancelled` y función de limpieza | 63 → 67 |

El arreglo 4 se intentó con OpenCode y se **rechazó**: movió el `finally` de `create` al `catch` y rompió la guarda del doble envío (7 fallos en lugar de 5). Se corrigió a mano.

## El cliente sin pantalla (`examctl`)

Necesita la API simulada corriendo en otra terminal:

```bash
npm run api                                              # http://127.0.0.1:8800/api
npm run examctl -- list --json                           # JSON en stdout
npm run examctl -- create "Examen final" --json
npm run examctl -- delete 3 --yes                        # sin --yes no borra
npm run examctl -- cors-check --origin http://localhost:5173
npm run examctl -- cors-check --origin https://sitio-malo.example
```

Los datos van a **stdout** (JSON, para encadenar con otros programas). Los mensajes para personas van a **stderr**.

| Código | Significa |
|---|---|
| 0 | Bien |
| 2 | Uso incorrecto (comando u opción desconocidos) |
| 3 | Sin conexión o tiempo agotado |
| 4 | Datos no válidos (la API respondió 400) |
| 5 | No existe (404) |
| 6 | Error del servidor (5xx) |
| 7 | CORS rechaza el origen |
| 8 | Falta `--yes` en un comando que borra |
| 9 | CORS acepta cualquier origen (comodín): demasiado permisivo |

Con la API en modo comodín (`npm run api -- --wildcard`), `cors-check` sale con 9 para cualquier origen.

## Qué hay en cada carpeta

| Ruta | Contenido |
|---|---|
| `src/client/` | Módulo cliente (`api.js`), política de CORS (`cors.js`) y hook del listado (`useExams.js`) |
| `src/ai/` | El mismo cliente escrito por una IA, con los cinco arreglos |
| `src/components/` | `ExamList` y el panel de la red simulada |
| `src/lib/` | Red simulada: `fakeNetwork.js` (adaptador de Axios), `fakeApi.js` (contrato de la API) y `cors.js` (decisión del navegador) |
| `src/test/` | Pruebas: `api`, `cors`, `useExams`, `ExamList`, `App` y `cli` |
| `cli/` | `examctl.mjs` (cliente sin pantalla) y `fake-api.mjs` (API simulada por HTTP) |
| `AGENTS.md` | Contrato del agente: qué puede editar, qué no, y las cuatro preguntas de revisión del diff |

## Uso de IA

El uso de un asistente está documentado fila por fila en el entregable: qué se pidió, qué respondió, si se aceptó o se rechazó, la pregunta de `AGENTS.md` o la prueba que lo decidió, y la evidencia. Las conclusiones principales son dos: el código del caso feliz pasó, pero la bitácora del agente no era fiable, y lo que decidió qué se aceptaba fueron las pruebas y la revisión del diff.

