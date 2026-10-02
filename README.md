# IGSorteos

App web para crear **sorteos sobre historias y publicaciones de Instagram**, con reglas configurables y resultado verificable.

- Next.js 15 (App Router) + TypeScript + Tailwind v4
- PostgreSQL (Neon en producción) + Prisma 7
- Auth.js v5 con login de Instagram y modo demo
- Sorteo con semilla criptográfica y hash público

## Puesta en marcha

```bash
npm install

# 1. Levantar la base local embebida (no necesitás instalar PostgreSQL)
npm run db:up
# imprimirá una URL del estilo postgresql://postgres:postgres@localhost:PUERTO/template1

# 2. Crear la base de datos de la app y copiala a .env
npm run db:create
```

Después editá `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:PUERTO/igsorteos?sslmode=disable"
AUTH_SECRET="cualquier-cadena-larga"
AUTH_DEMO_MODE="true"
```

Y aplicá el schema:

```bash
npm run db:migrate      # aplica migraciones
npm run db:generate     # genera el cliente de Prisma
npm run dev
```

Abrí http://localhost:3000 y entrá con **"Entrar en modo demo"**.

> La URL que imprime `npm run db:up` cambia en cada arranque. Si el servidor se
> detiene, volvé a levantarlo y actualizá el puerto en `.env`.

### Datos de ejemplo

```bash
npx tsx prisma/seed.mts
```

Crea un usuario demo con contenido y un sorteo ya sorteado en `/sorteos/sorteo-remera-nueva`.

## Cómo funciona

### Modo demo vs. Instagram real

La app está preparada con un adaptador (`src/lib/instagram/`). Ambos cumplen la
misma interfaz:

| Provider | Cuándo se usa | Qué devuelve |
| --- | --- | --- |
| `demo-provider.ts` | `AUTH_DEMO_MODE=true` | Datos simulados deterministas |
| `meta-provider.ts` | `AUTH_DEMO_MODE=false` | Instagram Graph API real |

Para pasar a Instagram real necesitás:

1. Crear una app en <https://developers.facebook.com> con el producto **Instagram**.
2. Configurar Instagram Login (`AUTH_INSTAGRAM_ID`, `AUTH_INSTAGRAM_SECRET`).
3. Tener una cuenta de Instagram **Business** o **Creator** vinculada a una Facebook Page.
4. Someter la app a revisión de Meta para los permisos
   `instagram_basic` e `instagram_manage_insights`.

Después poné `AUTH_DEMO_MODE="false"` y reiniciá. No hay que cambiar código.

### Reglas del sorteo

| Regla | Qué valida |
| --- | --- |
| Sticker de preguntas | La respuesta coincide con la correcta (ignora mayúsculas y acentos) |
| Etiquetar cuentas | Etiquetó al menos N cuentas |
| Seguir la cuenta | Sigue la cuenta del organizador |
| Reaccionar | Reaccionó la historia |
| Guardar | Guardó la publicación |
| Comentar | Comentó con su usuario |

Un participante entra solo si cumple **todas** las reglas activas.

### Sorteo verificable

1. Se genera una semilla aleatoria de 256 bits (`crypto.randomBytes`).
2. Se publica `SHA-256(semilla)` como compromiso.
3. Cada candidato se ordena por `SHA-256(participante + semilla)` — sin sesgo,
   sin `Math.random()`.
4. Cuando se revela la semilla, cualquiera recalcula el hash y verifica que el
   resultado no fue alterado.

Código: `src/lib/draw.ts`.

## Estructura

```
prisma/
  schema.prisma        User, MediaItem, Giveaway, Rule, Participant, Winner
  seed.mts             Datos de ejemplo
src/
  app/
    login/             Ingreso con Instagram o demo
    dashboard/         Grilla de historias y publicaciones
    dashboard/nuevo/   Constructor de sorteo
    sorteos/[slug]/    Panel del sorteo (privado)
    s/[slug]/          Página pública para compartir
    actions/           Server actions
  auth.ts              Configuración de Auth.js
  lib/
    instagram/         Adaptadores demo y Meta
    draw.ts            Sorteo verificable
    rules.ts           Evaluación de reglas
    prisma.ts          Cliente de Prisma
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | Chequeo de tipos |
| `npm run lint` | ESLint |
| `npm run db:up` | Levanta Postgres local embebido |
| `npm run db:migrate` | Aplica migraciones |
| `npm run db:generate` | Genera el cliente |
| `npm run db:studio` | Visor de la base |

## Deploy en Vercel

1. Creá una base en <https://neon.tech> y copiá `DATABASE_URL`.
2. Generá el secreto: `npx auth secret`.
3. Importá el repo en Vercel y cargá las variables de `.env.example`.
   Para empezar: `AUTH_DEMO_MODE="true"`.
4. Corré las migraciones antes del primer deploy:
   ```bash
   DATABASE_URL="<tu-url>" npm run db:deploy
   ```
   O agregá `prisma migrate deploy` como build command.

En producción `AUTH_URL` no hace falta: Vercel lo define solo.

## Límites conocidos

- La regla **seguir la cuenta** no se puede validar con la Graph API pública.
  El código la contempla, pero ningún participante puede cumplirla hasta que
  se conecte un proveedor que resuelva ese dato.
- La Graph API no expone las reacciones de historias de forma completa;
  la respuesta al sticker sí llega vía `story_sticker_responses`.
- El token de Instagram es de larga duración (60 días) y no hay renovación
  automática todavía.
