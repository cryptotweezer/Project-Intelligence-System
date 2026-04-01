# Next Steps — Project Intelligence System

---

## 1. AI Chat Agent con acceso total a la base de datos

### Descripción
Un chat integrado en el dashboard conectado a la API de OpenAI. El agente tiene acceso completo a Supabase: puede leer y escribir projects, steps y logs. El usuario puede conversar en lenguaje natural para consultar el estado de sus proyectos, crear tareas, cambiar status, agregar logs, y más.

### Capacidades del agente
- Listar y buscar proyectos (filtrar por status, prioridad, agente)
- Ver detalle de un proyecto con sus steps y logs
- Crear un proyecto nuevo
- Cambiar el status de un proyecto (`active`, `paused`, `done`, `archived`)
- Cambiar la prioridad de un proyecto
- Editar descripción y expected result
- Agregar un step a un proyecto
- Cambiar el status de un step (`pending`, `in_progress`, `done`, `error`)
- Eliminar un step
- Reordenar steps
- Agregar un log de sesión (summary, problems, solutions, agent, date)
- Eliminar un log
- Eliminar un proyecto

---

### Plan de implementación paso a paso

#### Paso 1 — Instalar dependencias
```bash
npm install ai openai
```
- `ai` → Vercel AI SDK (streaming de respuestas en Next.js)
- `openai` → cliente oficial de OpenAI

---

#### Paso 2 — Crear la API Route `/app/api/chat/route.ts`

Esta ruta recibe el historial de mensajes del cliente y ejecuta el loop de tool calling con OpenAI.

**Flujo:**
1. Recibe `{ messages }` del cliente vía POST
2. Llama a `openai.chat.completions.create` con el modelo `gpt-4o`, el historial, y las herramientas definidas
3. Si el modelo devuelve `tool_calls`, ejecuta cada tool contra Supabase (server-side, con service role key para permisos completos)
4. Añade los resultados al historial y vuelve a llamar al modelo
5. Devuelve el texto final en streaming al cliente con `StreamingTextResponse`

**Modelo recomendado:** `gpt-4o` (mejor razonamiento para tool calling)

---

#### Paso 3 — Definir las herramientas (OpenAI function calling)

Cada tool tiene un `name`, `description`, y `parameters` (JSON Schema). El modelo decide cuándo llamar cada una.

| Tool | Acción en Supabase |
|------|--------------------|
| `list_projects` | SELECT projects (filtros opcionales: status, priority) |
| `get_project` | SELECT project + steps + logs by id o name |
| `create_project` | INSERT into projects |
| `update_project` | UPDATE projects (status, priority, description, expected_result) |
| `delete_project` | DELETE project + steps + logs |
| `create_step` | INSERT into project_steps |
| `update_step_status` | UPDATE project_steps.status |
| `reorder_steps` | UPDATE step_number en dos steps |
| `delete_step` | DELETE from project_steps |
| `create_log` | INSERT into project_logs |
| `delete_log` | DELETE from project_logs |

---

#### Paso 4 — Variable de entorno para Supabase service role

Las tools necesitan permisos de escritura sin restricciones de RLS. Agregar a `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Crear un cliente Supabase admin en `lib/supabase/admin.ts`:
```ts
import { createClient } from "@supabase/supabase-js";
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

#### Paso 5 — Crear la página `/dashboard/chat/page.tsx`

Página client-side que usa el hook `useChat` del Vercel AI SDK.

**UI:**
- Panel de chat full-height con scroll
- Mensajes del usuario (derecha) y del agente (izquierda)
- Input fijo en la parte inferior con botón de enviar
- Indicador de "thinking..." mientras el agente procesa
- Estética consistente con el resto del dashboard (dark/OLED, mismos tokens de color)
- Mensajes del agente en `font-light text-sm` con soporte para markdown básico (listas, negrita)

---

#### Paso 6 — Agregar Chat a la sidebar

En `app/dashboard/layout.tsx`, agregar al array `NAV_ITEMS`:
```ts
{ href: "/dashboard/chat", label: "AGENT CHAT", icon: "◎" }
```

---

#### Paso 7 — System prompt del agente

Definir un system prompt que:
- Le da contexto del sistema (Project Intelligence System, tipos de datos, campos disponibles)
- Le instruye a ser conciso y usar lenguaje técnico
- Le indica que siempre confirme operaciones destructivas (delete) antes de ejecutar
- Le da el schema de la base de datos para que pueda construir queries correctas
- Define el tono: directo, sin relleno, orientado a productividad

---

#### Paso 8 — Verificación final

- [ ] `npm run build` sin errores
- [ ] El chat carga y responde preguntas de lectura ("¿cuántos proyectos activos tengo?")
- [ ] El agente puede crear un step y aparece en la página del proyecto tras refresh
- [ ] El agente puede cambiar el status de un proyecto
- [ ] El agente puede agregar un log de sesión
- [ ] Streaming funciona correctamente (texto aparece progresivamente)
- [ ] `npm run lint` pasa

---

### Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `app/api/chat/route.ts` | Crear — API route con tool calling loop |
| `lib/supabase/admin.ts` | Crear — cliente Supabase con service role |
| `lib/chat/tools.ts` | Crear — definición de todas las tools + ejecutores |
| `app/dashboard/chat/page.tsx` | Crear — UI del chat |
| `app/dashboard/layout.tsx` | Modificar — agregar AGENT CHAT al nav |
| `.env.local` | Modificar — agregar `SUPABASE_SERVICE_ROLE_KEY` |

---
