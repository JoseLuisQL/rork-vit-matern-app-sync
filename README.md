# VitMaterna

Plataforma digital de salud prenatal para gestantes de zonas rurales andinas (C.S. Talavera, Andahuaylas — 2 926 msnm). Ayuda a mejorar la asistencia a los controles prenatales y el seguimiento de la suplementación con hierro y ácido fólico, incluso en zonas con mala señal.

La plataforma tiene una app móvil muy fácil de usar para la gestante y paneles de trabajo para la obstetra y la administración, todos dentro de la misma app con acceso por rol.

## Arquitectura

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│   App móvil (carpeta expo/) │  HTTPS  │  Servidor (carpeta functions/)│
│   Expo · React Native       │ ──────► │  Cloudflare Worker            │
│   3 roles · offline-first   │ ◄────── │  └─ Durable Object            │
│   cola de sincronización    │ snapshot│     "VitmaternaStore"         │
└─────────────────────────────┘         │     · fuente de verdad        │
                                        │     · motor clínico           │
                                        └──────────────────────────────┘
```

- **Todos los cálculos clínicos se hacen del lado del servidor**, nunca en el teléfono: fecha probable de parto, edad gestacional, corrección de hemoglobina por altitud, clasificación de anemia y semáforo de riesgo.
- El servidor es la **fuente de verdad**: la app trabaja sobre el último snapshot recibido y sincroniza al reconectar.
- Hay **dos backends intercambiables con la misma API**:
  - `functions/` — nube de Rork (Cloudflare Worker + Durable Object), desplegado en `https://vit-matern-app-sync-backend.rork.app`. Es el que usa la vista previa.
  - `server/` — **autoalojado con PostgreSQL 17** (Bun + Hono + Docker), para tu propio VPS. El mismo `docker compose` incluye la **versión web de la app** servida con Nginx: una sola dirección con la web en `/` y la API en `/api`. Guía completa en [`server/README.md`](server/README.md).

## Estructura del repositorio

```
├── expo/                  # App móvil (Expo Router + React Native + TypeScript)
│   ├── app/               # Pantallas por rol: (gestante) · (obstetra) · (admin)
│   ├── components/        # Componentes de UI reutilizables
│   ├── constants/         # Tema de diseño, textos, contenido educativo offline
│   ├── lib/               # Cliente API, cola offline, notificaciones, formato
│   ├── providers/         # Estado global (sesión, snapshot, sincronización)
│   ├── types/             # Tipos compartidos del dominio
│   └── Dockerfile.web     # Versión web: export estático servido con Nginx
├── functions/             # Backend en la nube (Cloudflare Worker + Durable Object)
│   ├── index.ts           # Entrypoint del Worker (CORS y despacho a /api/*)
│   ├── store.ts           # Durable Object: rutas, sesiones y persistencia
│   ├── clinical.ts        # Motor clínico (cálculos del servidor)
│   ├── seed.ts            # Datos de demostración
│   └── types.ts           # Contratos de la API
├── server/                # Despliegue autoalojado (Bun + Hono + PostgreSQL 17)
│   ├── src/               # Misma API: esquema SQL, migraciones, rutas y seeds
│   ├── docker-compose.yml # Web + API + PostgreSQL 17 listos para tu VPS
│   └── README.md          # Guía de despliegue, versión web y conexión del APK
└── rork.json              # Manifiesto del workspace (apps y rutas)
```

## Roles y funcionalidades

### Gestante (diseñada para usuarias rurales, uso en 1–2 toques)

- Inicio con su semana de embarazo, su próxima cita y sus pastillas de hoy.
- Confirmación de cita con un botón grande ("Sí, iré") o solicitud de cambio de fecha.
- Registro diario de hierro y ácido fólico con casillas grandes de un toque.
- Recordatorios locales de pastillas y citas (notificaciones).
- Reporte de signos de alarma y **botón SOS con ubicación GPS**.
- Chat con su obstetra y consejos de salud disponibles sin conexión.

### Obstetra

- Panel con alertas abiertas, citas del día y solicitudes de reprogramación.
- Lista de gestantes con semáforo de riesgo y ficha clínica por paciente.
- **Agenda sin cruces de horario**: el servidor rechaza citas duplicadas y propone horarios libres (08:00–16:30, cada 30 min).
- Alertas tempranas automáticas (inasistencias, anemia, baja adherencia) y atención de emergencias.
- Chat en tiempo real con las pacientes y gestión de visitas domiciliarias.

### Administración

- Indicadores globales tipo MINSA: asistencia a controles, adherencia a suplementos, anemia y distribución del semáforo de riesgo.
- Gestión de usuarios: creación de cuentas, activación/desactivación y fotos de perfil.

## Motor clínico (servidor)

Implementado en `functions/clinical.ts`; el teléfono solo muestra resultados.

- **FPP (fecha probable de parto)**: regla de Naegele — FUM + 7 días − 3 meses + 1 año.
- **Edad gestacional**: semanas y días completos desde la FUM, con trimestre.
- **Hemoglobina corregida por altitud**: factor MINSA de −1,8 g/dL a 2 926 msnm.
- **Clasificación de anemia** (sobre la Hb corregida): ≥ 11 normal · 10–10,9 leve · 7–9,9 moderada · < 7 severa.
- **Semáforo de riesgo obstétrico**: puntaje por edad, IMC, anemia, presión arterial, cesáreas, abortos, óbito fetal, multiparidad, Rh sensibilizado y antecedentes — puntaje ≥ 4 rojo · ≥ 2 amarillo · resto verde.
- **Esquema MINSA de 8 controles**: semanas objetivo 12, 18, 23, 27, 31, 34, 37 y 39.
- Las fechas clínicas se manejan en hora local de Perú (UTC−5).

## Funcionamiento sin señal (offline-first)

- La app guarda el último snapshot del servidor y funciona con él sin conexión.
- Las acciones hechas sin señal (confirmar cita, registrar pastillas, mensajes, reportes de alarma, SOS, etc.) entran a una **cola local** y se aplican de forma optimista en pantalla.
- Al recuperar la conexión, la cola se envía al servidor en orden y el snapshot del servidor reemplaza la vista local.
- El inicio de sesión sí requiere conexión (el servidor valida DNI y contraseña y emite el token de sesión).

## API del servidor

Base: `https://vit-matern-app-sync-backend.rork.app` — sesión vía cabecera `X-VM-Token`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/ping` | Estado del servicio |
| POST | `/api/login` | Inicio de sesión (DNI + contraseña) |
| POST | `/api/sync` | Envía la cola de acciones y devuelve el snapshot completo |
| POST | `/api/schedule` | Programa una cita (valida cruces y propone horarios libres) |
| POST | `/api/user/avatar` | Sube la foto de perfil del usuario |
| GET | `/api/avatar/:dni` | Devuelve la foto de perfil |
| POST | `/api/admin/create-user` | Crea un usuario (solo admin) |
| POST | `/api/admin/set-active` | Activa/desactiva una cuenta (solo admin) |
| POST | `/api/admin/reset` | Restaura los datos de demostración (solo admin) |

## Puesta en marcha

Requisitos: [Node.js](https://nodejs.org) y [Bun](https://bun.sh).

```bash
# 1. Instalar dependencias de la app
cd expo
bun install

# 2. Iniciar la app (escanea el QR con Expo Go, o presiona "i" / "a")
bun run start

# 3. Vista previa en el navegador (opcional)
bun run start-web
```

El backend en la nube ya está desplegado, así que la app funciona sin configuración extra.

### Desplegar en tu propio servidor (VPS)

Un solo `docker compose` (carpeta `server/`) levanta **PostgreSQL 17 + API + versión web** de la app en una misma dirección: la web en `/` y la API en `/api`.

Para compilar un APK que use tu servidor, define en `expo/.env`:

```bash
EXPO_PUBLIC_API_URL=https://vitmaterna.tudominio.com
```

(sin definir `EXPO_PUBLIC_RORK_FUNCTIONS_URL`, que tiene prioridad y apunta a la nube). La versión web no necesita configuración: se conecta sola al mismo dominio desde el que se sirve. El paso a paso completo — despliegue con Docker, HTTPS, respaldos y compilación del APK — está en [`server/README.md`](server/README.md).

## Cuentas de demostración

Contraseña para todas: `Test@1234` (en la pantalla de inicio de sesión hay accesos de un toque).

| Rol | Nombre | DNI |
| --- | --- | --- |
| Gestante | Ana Quispe | 33333333 |
| Gestante | Lucía Huamán | 44444444 |
| Obstetra | Carmen Rojas | 11111111 |
| Administración | Patricia Salas | 22222222 |

## Stack tecnológico

- **App móvil**: Expo SDK 54 · React Native 0.81 · Expo Router 6 · TypeScript · React Query · Lucide Icons
- **Backend**: Cloudflare Workers + Durable Objects (TypeScript)
- **Diseño**: sistema minimalista clínico alineado a criterios de usabilidad ISO/IEC 25010 — tipografía Inter, acento de color por rol, botones y textos grandes para usuarias rurales

## Notas

- Los recordatorios usan notificaciones locales; en Expo Go (Android) el módulo se carga de forma diferida porque el SDK 53+ retiró su soporte en ese entorno. En builds de producción funcionan normal.
- Los datos incluidos son de demostración; el panel de administración permite restaurarlos en cualquier momento.
