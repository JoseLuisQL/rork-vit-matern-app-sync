# Reporte Completo de Issues Sincronizados y Resueltos (#38 – #50)

Repositorio origen de los issues: [`JoseLuisQL/vitmaterna`](https://github.com/JoseLuisQL/vitmaterna/issues)  
Repositorio de sincronización: `JoseLuisQL/rork-vit-matern-app-sync`

Para sincronizar, comentar la guía de pruebas y cerrar automáticamente los 13 issues en ambos repositorios de GitHub, ejecuta:

```bash
GITHUB_TOKEN=tu_token_de_github node scripts/resolve-github-issues.mjs
```

---

## Issue #38 — `Fix (modulo usuarios): Agregar la función de asignar obstetra responsable a los gestantes`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Captura original**:  
  ![Issue 38](https://github.com/user-attachments/assets/27f87628-3925-418d-9d35-ec942b6fc28a)
- **Solución implementada**:
  - Se agregó el campo `obstetraDni` al modelo `Patient` en PostgreSQL (`/server/src/schema.ts`), memoria (`/functions/store.ts`) y cliente (`/expo/types/index.ts`).
  - En **Admin → Usuarios → Nuevo usuario** y en las tarjetas de **Admin → Usuarios**, se añadió el selector de **Obstetra responsable** para asignar o reasignar cualquier gestante.
  - Cuando una obstetra registra una gestante en **Nueva gestante**, se asigna automáticamente su DNI como `obstetraDni`, y puede reasignarse desde **Actualizar datos**.
- **Cómo probar**:
  1. Inicia sesión como **Administrador** (`22222222` / `Admin@2026`) y ve a **Usuarios → Nuevo usuario** (rol **Gestante**) o toca una gestante en **Usuarios** para elegir o cambiar su **Obstetra responsable**.
  2. Inicia sesión como **Obstetra** (`11111111` / `Obstetra@2026`) y registra una **Nueva gestante**: queda asignada automáticamente a tu cuenta.

---

## Issue #39 — `Fix (usuarios): Crud de eliminar usuarios`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Captura original**:  
  ![Issue 39](https://github.com/user-attachments/assets/a8c98a2e-0a4f-414f-afbc-73b0c562c0c8)
- **Solución implementada**:
  - Se implementó la acción `delete_patient` y el botón de eliminación con diálogo de confirmación (`confirmAction`) tanto en el listado de **Gestantes** de la obstetra como dentro de la **Ficha de la gestante**, eliminando en cascada sus citas, suplementos, controles, alertas y mensajes.
- **Cómo probar**:
  1. Inicia sesión como **Obstetra** (`11111111` / `Obstetra@2026`) y entra a **Gestantes**.
  2. Pulsa el icono de papelera (**Eliminar**) en la tarjeta de una gestante o entra a su ficha y pulsa **"Eliminar gestante"**, luego confirma en el modal.

---

## Issue #40 — `Fix (gestante): Agregar la funcion de ingresar el peso y talla, obteniendo automaticamente el dato de IMC (peso/talla^2)`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Captura original**:  
  ![Issue 40](https://github.com/user-attachments/assets/5fc7cd05-086d-4991-9039-41e5ef432fdb)
- **Solución implementada**:
  - Se reemplazó el ingreso manual de IMC por los campos **Peso (kg)** y **Talla (cm o m)** en **Nueva gestante**, **Actualizar datos del control** y **Admin → Nuevo usuario**, calculando automáticamente `IMC = peso / talla²` en vivo con su clasificación nutricional (*Bajo peso*, *Normal*, *Sobrepeso*, *Obesidad*) y persistiendo `weightKg`, `heightCm` e `imc`.
- **Cómo probar**:
  1. Entra como **Obstetra** a **Nueva gestante** o **Actualizar datos del control**.
  2. Escribe **Peso (kg)** (ej. `64`) y **Talla** (ej. `160` o `1.60`) y observa el cálculo automático del **IMC** (`25.0 kg/m² · Sobrepeso`) en tiempo real.

---

## Issue #41 — `NO SE VISUALIZA EN LA APP EN LA FUNCION "SU HISTORIA", LOS NUMEROS DE GESTACIONES,CESAREAS,ABORTOS`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Captura original**:  
  ![Issue 41](https://github.com/user-attachments/assets/9a571ed0-bc39-4b7d-8463-843f689ba617)
- **Solución implementada**:
  - En `/expo/components/Stepper.tsx`, se optimizó el diseño compacto para filas de 3 columnas en pantallas móviles de 360px (`buttonCompact` de 26px, `valueBoxCompact` con `minWidth: 26`, `allowFontScaling={false}`, `includeFontPadding: false` y píldora de valor junto a la etiqueta) para que los dígitos nunca se recorten ni queden en blanco.
  - Además, se muestra una cinta de resumen en vivo (`Gestaciones: X · Cesáreas: Y · Abortos: Z`) en **Nueva gestante**, **Actualizar datos** y **Admin → Nuevo usuario**, y el desglose completo en la **Ficha de la gestante**.
- **Cómo probar**:
  1. Abre **Nueva gestante** o **Actualizar datos del control** en vista móvil.
  2. En la sección **Su historia**, pulsa `-` y `+` en **Gestaciones**, **Cesáreas** y **Abortos** y verifica que los números se ven nítidos y completos.

---

## Issue #42 — `CAMBIAR EL BOTON REGISTRAR "COMUNIDAD " CON DIRECCION`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Captura original**:  
  ![Issue 42](https://github.com/user-attachments/assets/693558b1-0207-4f66-8268-cbcb3fdd0f07)
- **Solución implementada**:
  - Se reemplazó la etiqueta `"Comunidad / barrio"` por **"Dirección"** en los formularios de **Nueva gestante**, **Actualizar datos del control**, **Admin → Nuevo usuario** y en la **Ficha de la gestante**.
- **Cómo probar**:
  1. Abre **Nueva gestante** o **Actualizar datos del control** y verifica que el campo aparece como **"Dirección"**.

---

## Issue #43 — `error en la funcion eliminar a los usuarios en modo administrador`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Captura original**:  
  ![Issue 43](https://github.com/user-attachments/assets/a06fcab0-4e2e-497d-8351-33bc06ac8fd9)
- **Solución implementada**:
  - Se implementó y blindó `POST /api/admin/delete-user` en `/server/src/handlers.ts` y `/functions/store.ts` para eliminar en cascada la ficha de paciente y todos sus registros dependientes antes de borrar el usuario, evitando errores de integridad referencial.
- **Cómo probar**:
  1. Inicia sesión como **Administrador** (`22222222` / `Admin@2026`), entra a **Usuarios**, pulsa el botón de papelera en cualquier usuario y confirma la eliminación.

---

## Issue #44 — `Incorporar la función de mostrar la Fecha Probable de Parto cuando la obstetra ingrese al perfil de cada una de sus gestantes.`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Captura original**:  
  ![Issue 44](https://github.com/user-attachments/assets/c90c7d7a-1103-465c-8934-72295ab58312)
- **Solución implementada**:
  - En la **Ficha de la gestante** (`/expo/app/(obstetra)/gestante/[id].tsx`), en las tarjetas de listado y en los formularios de FUM se incorporó un bloque destacado con la **Fecha Probable de Parto (FPP)** calculada con la Regla de Naegele (`FUM + 280 días`).
- **Cómo probar**:
  1. Inicia sesión como **Obstetra** y abre el perfil de cualquier gestante: verás el banner destacado **"Fecha Probable de Parto (FPP)"** con la fecha completa y la FUM.

---

## Issue #45 — `SESISION DESCONECTADA DEL WATSAP`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Capturas originales**:  
  ![Issue 45 - 1](https://github.com/user-attachments/assets/674cff19-89a2-48d6-8fbc-68dde115151e)  
  ![Issue 45 - 2](https://github.com/user-attachments/assets/645c8829-2ad0-44e7-8eb9-e61682a71258)
- **Solución implementada**:
  - En `/server/src/whatsapp/client.ts`, `testWhatsAppConnection` y `sendWhatsAppText` ahora detectan sesiones en estado `disconnected` / `stopped` / `closed` e invocan automáticamente los endpoints de recuperación (`/start`, `/restart`, `/connect`, `/init`) en Open-WA, además de utilizar los valores en vivo del formulario (`serverUrl`, `apiKey`, `sessionId`) al pulsar **"Probar conexión"** o **"Enviar"** en **Envío de Prueba**.
- **Cómo probar**:
  1. Entra como **Administrador** a **Sistema**.
  2. Verifica el estado **"Conectado a https://openwa.qware.me · Sesión activa"**, pulsa **"Probar conexión"** o envía un mensaje en **"Envío de Prueba"**.

---

## Issue #46 — `Las gestantes se muestran en todos los usuarios obstetra en lugar de filtrarse por asignación`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Captura original**:  
  ![Issue 46](https://github.com/user-attachments/assets/6729314b-630f-41d0-b503-f2b905b682ae)
- **Solución implementada**:
  - En `/server/src/domain.ts` (`snapshotFor`) y `/functions/store.ts`, cada usuario con rol `obstetra` recibe únicamente las gestantes cuyo `obstetraDni` coincide con el DNI de la obstetra autenticada (y filtra en cascada citas, alertas, visitas, suplementos, mensajes y asignaciones educativas).
- **Cómo probar**:
  1. Crea una segunda obstetra desde **Admin → Usuarios → Nuevo usuario**.
  2. Inicia sesión con cada obstetra y comprueba que cada una solo visualiza las gestantes asignadas a su cargo.

---

## Issue #47 — `El teclado en pantalla oculta el campo de texto e impide visualizar lo que se escribe en los módulos de Chat, Citas y Medicamentos`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Capturas originales**:  
  ![Issue 47 - Citas](https://github.com/user-attachments/assets/b922f2eb-feb5-486c-b4e1-c2553d8ca59b)  
  ![Issue 47 - Medicamentos](https://github.com/user-attachments/assets/16d7d275-cdaa-46cb-a1bd-9d2195341362)
- **Solución implementada**:
  - Se configuró `"softwareKeyboardLayoutMode": "resize"` en `/expo/app.json` y `tabBarHideOnKeyboard: true` en las pestañas móviles de Gestante y Obstetra.
  - En `ChatThread.tsx` y `GChatThread.tsx`, al abrirse el teclado se ajusta el `keyboardVerticalOffset` y la lista hace auto-scroll al mensaje más reciente.
  - En `programar.tsx` (**Nueva cita**) y `medicamento.tsx` (**Asignar medicamento**), se agregó detección de altura del teclado (`Keyboard.addListener`) y auto-scroll (`scrollToEnd`) al enfocar los campos inferiores (**Hora personalizada**, **Motivo** e **Indicación**).
- **Cómo probar**:
  1. En vista móvil, toca el campo de texto en **Chat**, **Nueva cita → Motivo (opcional)** y **Asignar medicamento → Indicación (opcional)** y verifica que el campo se desplaza por encima del teclado.

---

## Issue #48 — `Limitación en el rango de selección de fechas en el módulo "Nueva cita" Se requiere un calendario o más opciones de días.`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Captura original**:  
  ![Issue 48](https://github.com/user-attachments/assets/77a5aff1-0bf2-486e-addd-c8ebcf803090)
- **Solución implementada**:
  - En `/expo/app/(obstetra)/programar.tsx`, debajo de la tira rápida de 14 días se incorporó el componente `DatePickerField` (**"Elegir otra fecha en el calendario (cualquier mes)"**) que abre un calendario mensual/anual completo para elegir cualquier fecha futura.
- **Cómo probar**:
  1. En **Nueva cita**, toca **"Elegir otra fecha en el calendario (cualquier mes)"**, navega a cualquier mes futuro y selecciona el día deseado.

---

## Issue #49 — `La sección "Asignar Contenidos Educativos" no muestra las opciones para agregar o seleccionar materiales (videos, imágenes, PDFs, etc.)`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Captura original**:  
  ![Issue 49](https://github.com/user-attachments/assets/3d41a3e8-6d42-406f-9944-7585ed416782)
- **Solución implementada**:
  - Se garantizó que el catálogo base `DEFAULT_ARTICLES` (con recursos de **Lectura**, **Video**, **PDF** e **Imagen**) se inicialice siempre en PostgreSQL (`/server/src/seed.ts` y `handleAdminConfig`), en `/functions/store.ts` y como respaldo en `useArticles()` (`/expo/providers/AppProvider.tsx`).
  - Se corrigieron las dimensiones flex del modal `/expo/components/obstetra/AssignArticlesModal.tsx` (`minHeight: 420` en la tarjeta y `minHeight: 220, flexGrow: 1` en el `ScrollView`) para que la lista de materiales y el botón **"+ Agregar material (Video, PDF, Imagen)"** se muestren siempre en Android, iOS y Web.
- **Cómo probar**:
  1. Entra como **Obstetra** a la ficha de una gestante y toca **Educación**: verás la lista completa de materiales con filtros por formato (**Todos**, **Lecturas**, **Videos**, **PDFs**, **Imágenes**) y el botón para crear nuevos recursos multimedia.

---

## Issue #50 — `Limitación en los horarios disponibles para citas y necesidad de ingresar horas personalizadas (Módulo "Nueva cita")`
- **Estado**: ✅ Resuelto y cubierto con pruebas unitarias
- **Captura original**:  
  ![Issue 50](https://github.com/user-attachments/assets/88bacfd4-e23e-4595-82d5-d00b8c65aa70)
- **Solución implementada**:
  - Se amplió la cuadrícula de horarios (`AGENDA_SLOTS` de `07:00` a `19:00`) y se añadió el campo **"¿Prefieres ingresar otra hora personalizada?"** en `/expo/app/(obstetra)/programar.tsx` y en el validador del servidor (`/server/src/handlers.ts` y `/functions/store.ts`) aceptando cualquier hora válida en formato 24h `HH:MM`.
- **Cómo probar**:
  1. En **Nueva cita → Paso 3: Elige la hora**, escribe cualquier hora personalizada (ej. `07:30`, `13:45` o `17:15`) en el campo de hora personalizada y guarda la cita.
