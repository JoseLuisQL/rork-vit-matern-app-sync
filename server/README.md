# VitMaterna — Backend autoalojado (PostgreSQL 17)

API HTTP de VitMaterna lista para desplegar en **tu propio VPS con Docker**. Expone **exactamente la misma API** que el backend en la nube (`functions/`), por lo que la app móvil funciona sin ningún cambio de código: solo apuntas el APK a tu servidor.

```
┌─────────────────────────────┐         ┌───────────────────────────────────┐
│   App móvil (carpeta expo/) │  HTTPS  │  Tu VPS (docker compose)          │
│   Expo · React Native       │ ──────► │  ┌─────────┐    ┌──────────────┐  │
│   EXPO_PUBLIC_API_URL       │ ◄────── │  │ api      │───►│ PostgreSQL 17│  │
│                             │ snapshot│  │ Bun+Hono │    │ (datos)      │  │
└─────────────────────────────┘         │  └─────────┘    └──────────────┘  │
                                        └───────────────────────────────────┘
```

## Qué incluye

- **PostgreSQL 17** como base de datos real y relacional: usuarios, pacientes, citas, medicamentos, tomas, mensajes, alertas, visitas, sesiones y fotos de perfil en tablas con claves foráneas, índices y borrado en cascada.
- **Contraseñas con hash bcrypt** (nunca en texto plano).
- **Migraciones automáticas**: al arrancar, el esquema se crea/actualiza solo.
- **Seeds configurables**: demostración completa o producción limpia.
- **Motor clínico idéntico** al de la nube: FPP, edad gestacional, corrección de hemoglobina por altitud, semáforo de riesgo, alertas automáticas, agenda sin cruces, reportes MINSA.
- **Transacciones**: la cola offline se aplica de forma atómica e idempotente.
- Presencia del chat (en línea / escribiendo…) en memoria, igual que en la nube (es información efímera por diseño).

## Requisitos

- Un VPS con Linux (Ubuntu 22.04+ recomendado) y **Docker + Docker Compose** instalados:

```bash
curl -fsSL https://get.docker.com | sh
```

## Despliegue en 4 pasos

```bash
# 1. Sube la carpeta server/ a tu VPS (o clona tu repositorio)
scp -r server usuario@TU_SERVIDOR:~/vitmaterna-server
ssh usuario@TU_SERVIDOR && cd ~/vitmaterna-server

# 2. Configura las variables
cp .env.example .env
nano .env        # define POSTGRES_PASSWORD (obligatoria) y SEED_MODE

# 3. Levanta todo (PostgreSQL 17 + API)
docker compose up -d --build

# 4. Verifica
curl http://localhost:8080/ping     # → {"ok":true,...}
curl http://localhost:8080/health   # → {"ok":true,"db":true,...}
```

Los datos viven en el volumen Docker `pgdata` y sobreviven reinicios y actualizaciones.

## HTTPS con tu dominio (obligatorio para el APK)

Android exige HTTPS en producción. Lo más simple es [Caddy](https://caddyserver.com), que saca el certificado solo:

```bash
# /etc/caddy/Caddyfile
api.tudominio.com {
    reverse_proxy localhost:8080
}
```

```bash
sudo apt install caddy
sudo systemctl reload caddy
curl https://api.tudominio.com/ping   # → {"ok":true,...}
```

(Con Nginx + certbot también funciona; cualquier proxy inverso hacia `localhost:8080` sirve.)

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | Sí | Contraseña de PostgreSQL (elige una larga y única) |
| `POSTGRES_DB` / `POSTGRES_USER` | No | Nombre de base y usuario (por defecto `vitmaterna`) |
| `API_PORT` | No | Puerto público de la API (por defecto `8080`) |
| `SEED_MODE` | No | Primer arranque: `demo` (por defecto) o `produccion` |
| `ADMIN_DNI`, `ADMIN_PASSWORD`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME` | Solo con `SEED_MODE=produccion` | Cuenta de administración inicial |
| `DATABASE_URL` | Auto | La arma el compose; solo cámbiala si usas un PostgreSQL externo |
| `DATABASE_SSL` | No | `true` si tu PostgreSQL externo exige TLS |

## Modos de datos

- **`SEED_MODE=demo`** (por defecto): crea las cuentas de demostración — Ana `33333333`, Lucía `44444444`, obstetra `11111111`, admin `22222222` (contraseña `Test@1234`) — con citas, tomas, mensajes y alertas coherentes con la fecha actual.
- **`SEED_MODE=produccion`**: plataforma limpia con una sola cuenta de administración (la de `ADMIN_*`). Desde la app, administración registra al personal real.
- El **interruptor de producción dentro de la app** (Administración → Sistema) funciona igual que en la nube: limpia los datos demo en tiempo real, conserva solo las cuentas de administración y oculta los accesos demo del login. En entorno de producción **nunca** se borran datos reales automáticamente.

## Conectar tu APK a este servidor

La app decide a qué servidor conectarse al momento de **compilar**:

```bash
# En tu computadora, dentro de la carpeta expo/ del proyecto:
cd expo

# 1. Define la URL de TU servidor (crea/edita el archivo .env):
#    (borra o no incluyas EXPO_PUBLIC_RORK_FUNCTIONS_URL, que apunta a la nube de Rork)
echo "EXPO_PUBLIC_API_URL=https://api.tudominio.com" > .env

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
3. URL fija de respaldo (nube).

## Copias de seguridad

```bash
# Respaldo manual (archivo .sql comprimido)
docker compose exec db pg_dump -U vitmaterna vitmaterna | gzip > respaldo_$(date +%F).sql.gz

# Restaurar
gunzip -c respaldo_2026-08-04.sql.gz | docker compose exec -T db psql -U vitmaterna vitmaterna
```

Respaldo automático diario a las 2 a.m. (crontab -e):

```
0 2 * * * cd ~/vitmaterna-server && docker compose exec -T db pg_dump -U vitmaterna vitmaterna | gzip > ~/respaldos/vitmaterna_$(date +\%F).sql.gz
```

## Actualizar el servidor

```bash
# Sube la carpeta server/ actualizada y luego:
docker compose up -d --build   # migraciones automáticas; los datos se conservan
```

## Operación diaria

```bash
docker compose logs -f api     # logs de la API
docker compose logs -f db      # logs de PostgreSQL
docker compose ps              # estado de los contenedores
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
