# VitMaterna — Despliegue autoalojado: Web + API + PostgreSQL 17

Todo el sistema listo para **tu propio VPS con Docker**, en un solo `docker compose`:

- **`web`** — la versión web de la app (la misma app móvil, en el navegador), servida con Nginx.
- **`api`** — la API HTTP (Bun + Hono), **exactamente la misma API** que el backend en la nube (`functions/`), por lo que el APK funciona sin ningún cambio de código.
- **`db`** — PostgreSQL 17 con volumen persistente.

```
                                   Tu VPS (docker compose) ─ puerto 8080
┌──────────────────────┐          ┌──────────────────────────────────────────────┐
│  Navegador (web)     │  "/"     │  ┌───────────┐   /api   ┌─────┐    ┌───────┐ │
│  Obstetra · Admin    │ ───────► │  │ web        │ ───────► │ api │───►│ db     │ │
├──────────────────────┤          │  │ Nginx      │          │ Bun │    │ Postgre│ │
│  APK (app móvil)     │  "/api"  │  │ + estáticos│          │ Hono│    │ SQL 17 │ │
│  Gestantes en campo  │ ───────► │  └───────────┘          └─────┘    └───────┘ │
└──────────────────────┘          └──────────────────────────────────────────────┘
```

Una sola puerta de entrada: **el navegador y el APK usan la misma dirección** (la web vive en `/` y la API en `/api`), sin problemas de CORS.

## Requisitos

- Un VPS con Linux (Ubuntu 22.04+ recomendado), **2 GB de RAM** (o 1 GB + swap, ver nota abajo) y **Docker + Docker Compose**:

```bash
curl -fsSL https://get.docker.com | sh
```

## Despliegue en 4 pasos

La compilación de la web necesita la carpeta `expo/`, así que sube **el proyecto completo** (no solo `server/`):

```bash
# 1. Sube el proyecto al VPS (o clona tu repositorio)
scp -r . usuario@TU_SERVIDOR:~/vitmaterna
ssh usuario@TU_SERVIDOR && cd ~/vitmaterna/server

# 2. Configura las variables
cp .env.example .env
nano .env        # define POSTGRES_PASSWORD (obligatoria) y SEED_MODE

# 3. Levanta todo (PostgreSQL 17 + API + Web)
docker compose up -d --build

# 4. Verifica
curl http://localhost:8080/ping     # → {"ok":true,...}   (API a través de nginx)
curl http://localhost:8080/health   # → {"ok":true,"db":true,...}
# y abre http://TU_SERVIDOR:8080 en el navegador → la app web con el login
```

Los datos viven en el volumen Docker `pgdata` y sobreviven reinicios y actualizaciones.

> **Nota (RAM):** compilar la web dentro de Docker usa ~2 GB de RAM una sola vez. Si tu VPS tiene 1 GB, crea swap antes del primer `--build`:
> `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`

## HTTPS con tu dominio (obligatorio para el APK)

Android exige HTTPS en producción, y en web el GPS/portapapeles también lo piden. Un solo dominio sirve para todo. Lo más simple es [Caddy](https://caddyserver.com), que saca el certificado solo:

```bash
# /etc/caddy/Caddyfile
vitmaterna.tudominio.com {
    reverse_proxy localhost:8080
}
```

```bash
sudo apt install caddy
sudo systemctl reload caddy
curl https://vitmaterna.tudominio.com/ping   # → {"ok":true,...}
# https://vitmaterna.tudominio.com  → app web
```

(Con Nginx + certbot también funciona; cualquier proxy inverso hacia `localhost:8080` sirve.)

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | Sí | Contraseña de PostgreSQL (elige una larga y única) |
| `POSTGRES_DB` / `POSTGRES_USER` | No | Nombre de base y usuario (por defecto `vitmaterna`) |
| `WEB_PORT` | No | Puerto público único: web en `/`, API en `/api` (por defecto `8080`) |
| `WEB_API_URL` | No | Solo si la web vivirá en un dominio distinto al de la API (caso raro) |
| `SEED_MODE` | No | Primer arranque: `demo` (por defecto) o `produccion` |
| `ADMIN_DNI`, `ADMIN_PASSWORD`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME` | Solo con `SEED_MODE=produccion` | Cuenta de administración inicial |
| `DATABASE_URL` | Auto | La arma el compose; solo cámbiala si usas un PostgreSQL externo |
| `DATABASE_SSL` | No | `true` si tu PostgreSQL externo exige TLS |

## Modos de datos

- **`SEED_MODE=demo`** (por defecto): crea las cuentas de demostración — Ana `33333333`, Lucía `44444444`, obstetra `11111111`, admin `22222222` (contraseña `Test@1234`) — con citas, tomas, mensajes y alertas coherentes con la fecha actual.
- **`SEED_MODE=produccion`**: plataforma limpia con una sola cuenta de administración (la de `ADMIN_*`). Desde la app, administración registra al personal real.
- El **interruptor de producción dentro de la app** (Administración → Sistema) funciona igual que en la nube: limpia los datos demo en tiempo real, conserva solo las cuentas de administración y oculta los accesos demo del login. En entorno de producción **nunca** se borran datos reales automáticamente.

## La versión web

- Es **la misma app** (mismo código de `expo/`): login por DNI, panel de la obstetra, administración con reportes (PDF se imprime desde el navegador y el Excel se descarga directo) y la vista de la gestante.
- Se conecta **al mismo dominio** desde el que se sirve — sin configurar nada.
- Lo único que no existe en el navegador son los recordatorios/notificaciones del teléfono (funciones del celular); todo lo demás funciona igual, incluido el chat en vivo.
- Para reconstruir solo la web después de un cambio: `docker compose up -d --build web`.

## Conectar tu APK a este servidor

La app decide a qué servidor conectarse al momento de **compilar**. Usa la misma dirección que la web:

```bash
# En tu computadora, dentro de la carpeta expo/ del proyecto:
cd expo

# 1. Define la URL de TU servidor (crea/edita el archivo .env):
#    (borra o no incluyas EXPO_PUBLIC_RORK_FUNCTIONS_URL, que apunta a la nube de Rork)
echo "EXPO_PUBLIC_API_URL=https://vitmaterna.tudominio.com" > .env

# 2. Genera el proyecto Android y compila el APK:
bun install
bunx expo prebuild -p android
cd android && ./gradlew assembleRelease

# 3. Tu APK queda en:
# android/app/build/outputs/apk/release/app-release.apk
```

Orden de conexión de la app (`expo/lib/api.ts`):

1. `EXPO_PUBLIC_RORK_FUNCTIONS_URL` — nube de Rork (así funciona la vista previa).
2. `EXPO_PUBLIC_API_URL` — **tu VPS** (para tu APK propio).
3. En web sin variables: **el mismo dominio de la página** (así funciona la web de este compose).
4. URL fija de respaldo (nube).

## Copias de seguridad

```bash
# Respaldo manual (archivo .sql comprimido)
docker compose exec db pg_dump -U vitmaterna vitmaterna | gzip > respaldo_$(date +%F).sql.gz

# Restaurar
gunzip -c respaldo_2026-08-04.sql.gz | docker compose exec -T db psql -U vitmaterna vitmaterna
```

Respaldo automático diario a las 2 a.m. (crontab -e):

```
0 2 * * * cd ~/vitmaterna/server && docker compose exec -T db pg_dump -U vitmaterna vitmaterna | gzip > ~/respaldos/vitmaterna_$(date +\%F).sql.gz
```

## Actualizar el servidor

```bash
# Sube el proyecto actualizado y luego:
docker compose up -d --build   # reconstruye API y web; migraciones automáticas; los datos se conservan
```

## Operación diaria

```bash
docker compose ps              # estado de los contenedores (web, api, db)
docker compose logs -f web     # accesos a la web / proxy
docker compose logs -f api     # logs de la API
docker compose logs -f db      # logs de PostgreSQL
docker compose exec db psql -U vitmaterna vitmaterna   # consola SQL
```

## Esquema de la base (resumen)

| Tabla | Contenido |
| --- | --- |
| `app_config` | Mantenimiento, mensaje, entorno (demo/producción) |
| `users` | Cuentas por DNI, rol y hash bcrypt de la contraseña |
| `patients` | Ficha clínica de cada gestante (FUM, Hb, presión, IMC…) |
| `appointments` | Controles MINSA y citas adicionales, con estado |
| `supplements` | Medicamentos asignados (tomas por día, inicio) |
| `intakes` | Tomas registradas por paciente, día y medicamento |
| `messages` | Chat clínico (con ubicación GPS en SOS/alarmas) |
| `alerts` | Emergencias, alarmas y alertas automáticas |
| `visits` | Visitas domiciliarias |
| `sessions` | Tokens de sesión (cabecera `X-VM-Token`) |
| `applied_actions` | Idempotencia de la cola offline |
| `avatars` | Fotos de perfil (binario + versión para caché) |

## Desarrollo local (sin Docker)

```bash
bun install
DATABASE_URL=postgres://usuario:clave@localhost:5432/vitmaterna bun run dev
bun run typecheck
```
