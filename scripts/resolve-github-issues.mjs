#!/usr/bin/env node
/**
 * Script para sincronizar, documentar con capturas originales, dejar comentario
 * de cómo probar la app y cerrar (state: "closed") los 13 issues (#38 al #50)
 * tanto en `JoseLuisQL/vitmaterna` como en `JoseLuisQL/rork-vit-matern-app-sync`.
 *
 * Uso:
 *   GITHUB_TOKEN=ghp_xxx node scripts/resolve-github-issues.mjs
 */

const SOURCE_REPO = "JoseLuisQL/vitmaterna";
const TARGET_REPO = process.env.TARGET_REPO || "JoseLuisQL/rork-vit-matern-app-sync";

export const ISSUES_DATA = [
  {
    number: 38,
    title: "Fix (modulo usuarios): Agregar la función de asignar obstetra responsable a los gestantes",
    images: [
      "https://github.com/user-attachments/assets/27f87628-3925-418d-9d35-ec942b6fc28a",
    ],
    originalBody: `En el módulo de usuarios / gestantes se requiere agregar la función de asignar la obstetra responsable a cada gestante.\n\n![Issue 38](https://github.com/user-attachments/assets/27f87628-3925-418d-9d35-ec942b6fc28a)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Administrador** (\`22222222\` / \`Admin@2026\`) y entra a **Usuarios → Nuevo usuario** (rol **Gestante**) o edita/reasigna desde la tarjeta de una gestante en **Usuarios**: verás el selector **"Obstetra responsable"** con todas las obstetras activas.
2. Inicia sesión como **Obstetra** (\`11111111\` / \`Obstetra@2026\`) y registra una **Nueva gestante**: queda asignada automáticamente a tu cuenta (\`obstetraDni\`), o puedes reasignarla desde **Ficha de gestante → Actualizar datos → Obstetra responsable**.
3. Inicia sesión como **Gestante**: en **Inicio** y **Mensajes** aparece directamente su obstetra responsable asignada.`,
  },
  {
    number: 39,
    title: "Fix (usuarios): Crud de eliminar usuarios",
    images: [
      "https://github.com/user-attachments/assets/a8c98a2e-0a4f-414f-afbc-73b0c562c0c8",
    ],
    originalBody: `Implementar la opción de eliminar gestantes / usuarios con confirmación de seguridad.\n\n![Issue 39](https://github.com/user-attachments/assets/a8c98a2e-0a4f-414f-afbc-73b0c562c0c8)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** (\`11111111\` / \`Obstetra@2026\`) y ve a la pestaña **Gestantes**.
2. Pulsa el icono de papelera (**Eliminar**) en la tarjeta de la gestante o entra a **Ficha de la gestante → botón "Eliminar gestante"**.
3. Confirma en el diálogo de seguridad: la gestante y todos sus registros asociados (citas, controles, suplementos, alertas y mensajes) se eliminan en cascada.`,
  },
  {
    number: 40,
    title: "Fix (gestante): Agregar la funcion de ingresar el peso y talla, obteniendo automaticamente el dato de IMC (peso/talla^2)",
    images: [
      "https://github.com/user-attachments/assets/5fc7cd05-086d-4991-9039-41e5ef432fdb",
    ],
    originalBody: `Agregar los campos de Peso (kg) y Talla (cm o m) en el registro y actualización de la gestante para calcular automáticamente el IMC (\`peso / talla^2\`).\n\n![Issue 40](https://github.com/user-attachments/assets/5fc7cd05-086d-4991-9039-41e5ef432fdb)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** (\`11111111\` / \`Obstetra@2026\`) y abre **Gestantes → Nueva gestante** o **Ficha de gestante → Actualizar datos del control** (también disponible en **Admin → Nuevo usuario**).
2. Ingresa **Peso (kg)** (ej. \`64\`) y **Talla (cm o m)** (ej. \`160\` o \`1.60\`).
3. Verifica que el **IMC** se calcula automáticamente en tiempo real (\`25.0 kg/m²\`) mostrando su clasificación clínica (*Bajo peso*, *Normal*, *Sobrepeso* u *Obesidad*) y queda guardado en la ficha de la gestante.`,
  },
  {
    number: 41,
    title: 'NO SE VISUALIZA EN LA APP  EN LA FUNCION "SU HISTORIA", LOS NUMEROS DE GESTACIONES,CESAREAS,ABORTOS',
    images: [
      "https://github.com/user-attachments/assets/9a571ed0-bc39-4b7d-8463-843f689ba617",
    ],
    originalBody: `En la sección "Su historia" no se visualizan los números de Gestaciones, Cesáreas y Abortos en pantallas móviles.\n\n![Issue 41](https://github.com/user-attachments/assets/9a571ed0-bc39-4b7d-8463-843f689ba617)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** y entra a **Nueva gestante** o **Ficha de gestante → Actualizar datos del control** (o como **Admin → Nuevo usuario**).
2. En la sección **Su historia**, usa los botones \`-\` y \`+\` de **Gestaciones**, **Cesáreas** y **Abortos**.
3. El número seleccionado se visualiza claramente en tres lugares: en el resumen superior (\`Gestaciones: X · Cesáreas: Y · Abortos: Z\`), en la insignia junto a cada etiqueta y en el contador central sin recortes en pantallas móviles pequeñas, además de mostrarse desglosado en la **Ficha de la gestante**.`,
  },
  {
    number: 42,
    title: 'CAMBIAR EL BOTON REGISTRAR "COMUNIDAD " CON DIRECCION',
    images: [
      "https://github.com/user-attachments/assets/693558b1-0207-4f66-8268-cbcb3fdd0f07",
    ],
    originalBody: `Cambiar la etiqueta "Comunidad / barrio" por "Dirección" en el registro y ficha de la gestante.\n\n![Issue 42](https://github.com/user-attachments/assets/693558b1-0207-4f66-8268-cbcb3fdd0f07)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** y entra a **Nueva gestante**, **Actualizar datos del control** o la **Ficha de la gestante** (y en **Admin → Nuevo usuario**).
2. Verifica que el campo ahora lleva la etiqueta **"Dirección"** con soporte para calles, jirones y referencias completas.`,
  },
  {
    number: 43,
    title: "error en la funcion eliminar a los usuarios en modo administrador",
    images: [
      "https://github.com/user-attachments/assets/a06fcab0-4e2e-497d-8351-33bc06ac8fd9",
    ],
    originalBody: `Corregir error al eliminar usuarios desde el panel de Administrador.\n\n![Issue 43](https://github.com/user-attachments/assets/a06fcab0-4e2e-497d-8351-33bc06ac8fd9)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Administrador** (\`22222222\` / \`Admin@2026\`) y ve a la pestaña **Usuarios**.
2. En cualquier usuario (Gestante, Obstetra o Admin distinto de tu sesión actual), pulsa el botón rojo de papelera (**Eliminar**) y confirma en el diálogo.
3. El usuario y todos sus datos vinculados se eliminan limpiamente en el servidor sin errores de llave foránea ni fallos de red.`,
  },
  {
    number: 44,
    title: "Incorporar la función de mostrar la Fecha Probable de Parto  cuando la obstetra ingrese al perfil de cada una de sus gestantes.",
    images: [
      "https://github.com/user-attachments/assets/c90c7d7a-1103-465c-8934-72295ab58312",
    ],
    originalBody: `Mostrar claramente la Fecha Probable de Parto (FPP) cuando la obstetra ingrese al perfil de cada una de sus gestantes y al seleccionar la FUM.\n\n![Issue 44](https://github.com/user-attachments/assets/c90c7d7a-1103-465c-8934-72295ab58312)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** (\`11111111\` / \`Obstetra@2026\`) y entra a la pestaña **Gestantes**.
2. Toca cualquier gestante para abrir su **Ficha de gestante**: debajo de sus datos principales verás el banner destacado **"Fecha Probable de Parto (FPP)"** con la fecha exacta calculada por la Regla de Naegele (FUM + 280 días) y su fecha de última menstruación (FUM).
3. También puedes verificar el cálculo automático en vivo al cambiar la FUM en **Nueva gestante** o **Actualizar datos del control**.`,
  },
  {
    number: 45,
    title: "SESISION DESCONECTADA DEL WATSAP",
    images: [
      "https://github.com/user-attachments/assets/674cff19-89a2-48d6-8fbc-68dde115151e",
      "https://github.com/user-attachments/assets/645c8829-2ad0-44e7-8eb9-e61682a71258",
    ],
    originalBody: `Al probar la conexión o enviar mensaje de prueba en el módulo Sistema (WhatsApp Open-WA) aparece "La sesión cliente1 está desconectada en Open-WA" o "HTTP 404: Cannot POST /api/sendText".\n\n![Issue 45 - 1](https://github.com/user-attachments/assets/674cff19-89a2-48d6-8fbc-68dde115151e)\n![Issue 45 - 2](https://github.com/user-attachments/assets/645c8829-2ad0-44e7-8eb9-e61682a71258)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Administrador** (\`22222222\` / \`Admin@2026\`) y ve a la pestaña **Sistema**.
2. En la tarjeta **Notificaciones por WhatsApp (Open-WA)**, pulsa **"Probar conexión"**: el cliente ahora reconecta/inicia automáticamente sesiones en estado \`disconnected\` (\`/start\`, \`/restart\`, \`/connect\`) y verifica disponibilidad del servidor mostrando **"Conectado a https://openwa.qware.me · Sesión activa"**.
3. En **"Envío de Prueba"**, ingresa un número de 9 dígitos y pulsa **"Enviar"**: usa en vivo los datos ingresados en el formulario y entrega el mensaje con fallback resiliente.`,
  },
  {
    number: 46,
    title: "Las gestantes se muestran en todos los usuarios obstetra en lugar de filtrarse por asignación",
    images: [
      "https://github.com/user-attachments/assets/6729314b-630f-41d0-b503-f2b905b682ae",
    ],
    originalBody: `Las gestantes registradas se muestran en todos los usuarios obstetra en lugar de filtrarse estrictamente por la obstetra asignada.\n\n![Issue 46](https://github.com/user-attachments/assets/6729314b-630f-41d0-b503-f2b905b682ae)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Administrador** (\`22222222\` / \`Admin@2026\`) y crea una segunda cuenta con rol **Obstetra** en **Usuarios → Nuevo usuario**.
2. Inicia sesión con la nueva obstetra: verás que su bandeja de **Gestantes**, **Agenda**, **Alertas** y **Chat** inicia limpia y solo muestra las gestantes asignadas a su propio DNI (\`obstetraDni\`).
3. Registra una nueva gestante desde esa obstetra o reasigna una desde el panel de **Administrador → Usuarios** y comprueba que cada obstetra visualiza exclusivamente su propia cartera de gestantes.`,
  },
  {
    number: 47,
    title: "El teclado en pantalla oculta el campo de texto e impide visualizar lo que se escribe en los módulos de Chat, Citas y Medicamentos",
    images: [
      "https://github.com/user-attachments/assets/b922f2eb-feb5-486c-b4e1-c2553d8ca59b",
      "https://github.com/user-attachments/assets/16d7d275-cdaa-46cb-a1bd-9d2195341362",
    ],
    originalBody: `En dispositivos móviles el teclado en pantalla oculta el campo de texto inferior en Chat, Nueva Cita (Motivo) y Asignar Medicamento (Indicación).\n\n![Issue 47 - Citas](https://github.com/user-attachments/assets/b922f2eb-feb5-486c-b4e1-c2553d8ca59b)\n![Issue 47 - Medicamentos](https://github.com/user-attachments/assets/16d7d275-cdaa-46cb-a1bd-9d2195341362)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. En un teléfono móvil, abre **Chat** (como Gestante u Obstetra) y toca **"Escribe un mensaje…"**: la barra de pestañas se oculta automáticamente y la caja de texto sube sobre el teclado junto con el último mensaje.
2. Abre **Nueva cita** (\`/(obstetra)/programar\`) y toca el campo **Hora personalizada** o **Motivo (opcional)** al final del formulario: la pantalla hace auto-scroll suave hacia abajo dejando el campo completamente visible sobre el teclado.
3. Abre **Asignar medicamento** (\`/(obstetra)/medicamento\`) y toca **Indicación (opcional)**: el formulario añade espacio dinámico y desplaza automáticamente el campo por encima del teclado.`,
  },
  {
    number: 48,
    title: 'Limitación en el rango de selección de fechas en el módulo "Nueva cita" Se requiere un calendario o más opciones de días.',
    images: [
      "https://github.com/user-attachments/assets/77a5aff1-0bf2-486e-addd-c8ebcf803090",
    ],
    originalBody: `En el módulo "Nueva cita" solo aparecen 14 días rápidos y se requiere un calendario completo para elegir fechas en cualquier mes.\n\n![Issue 48](https://github.com/user-attachments/assets/77a5aff1-0bf2-486e-addd-c8ebcf803090)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** y entra a **Agenda → Programar** (o desde la ficha de una gestante toca **Cita**).
2. En el **Paso 2: Elige el día**, debajo de los días rápidos verás el botón **"Elegir otra fecha en el calendario (cualquier mes)"**.
3. Tócalo para abrir el calendario interactivo mensual/anual, navega a cualquier mes futuro y selecciona el día deseado: se agregará y seleccionará automáticamente para la cita.`,
  },
  {
    number: 49,
    title: 'La sección "Asignar Contenidos Educativos" no muestra las opciones para agregar o seleccionar materiales (videos, imágenes, PDFs, etc.)',
    images: [
      "https://github.com/user-attachments/assets/3d41a3e8-6d42-406f-9944-7585ed416782",
    ],
    originalBody: `Al abrir "Asignar Contenidos Educativos" desde la ficha de la gestante, aparece vacío ("No hay contenidos en este formato") y no muestra opciones para seleccionar o agregar materiales multimedia.\n\n![Issue 49](https://github.com/user-attachments/assets/3d41a3e8-6d42-406f-9944-7585ed416782)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** (\`11111111\` / \`Obstetra@2026\`), entra a la ficha de cualquier gestante y toca el botón **Educación**.
2. En el modal **Asignar Contenidos Educativos** verás de inmediato el catálogo precargado de materiales con insignias de formato (**LECTURA**, **VIDEO**, **PDF**, **IMAGEN**) y filtros rápidos por tipo.
3. También puedes tocar el botón **"+ Agregar material (Video, PDF, Imagen)"** arriba del listado para registrar un nuevo recurso multimedia y asignarlo directamente a la gestante.`,
  },
  {
    number: 50,
    title: 'Limitación en los horarios disponibles para citas y necesidad de ingresar horas personalizadas (Módulo "Nueva cita")',
    images: [
      "https://github.com/user-attachments/assets/88bacfd4-e23e-4595-82d5-d00b8c65aa70",
    ],
    originalBody: `En el módulo "Nueva cita" los horarios están limitados a bloques fijos y se necesita poder ingresar horas personalizadas.\n\n![Issue 50](https://github.com/user-attachments/assets/88bacfd4-e23e-4595-82d5-d00b8c65aa70)`,
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** y abre **Nueva cita** (\`/(obstetra)/programar\`).
2. En el **Paso 3: Elige la hora**, debajo de la cuadrícula de horarios rápidos verás la tarjeta **"¿Prefieres ingresar otra hora personalizada?"**.
3. Escribe cualquier hora en formato 24h \`HH:MM\` (ej. \`07:30\`, \`13:45\` o \`17:15\`): se valida automáticamente que no esté ocupada, muestra la insignia de confirmación y habilita el botón **Guardar cita**.`,
  },
];

async function commentAndCloseInRepo(repo, issueNumber, comment, title, headers) {
  const commentUrl = `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`;
  const issueUrl = `https://api.github.com/repos/${repo}/issues/${issueNumber}`;

  const cRes = await fetch(commentUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ body: comment }),
  });
  if (!cRes.ok) {
    console.error(`[${repo}] Error comentando issue #${issueNumber}: ${cRes.status}`);
    return false;
  }

  const sRes = await fetch(issueUrl, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ state: "closed", state_reason: "completed" }),
  });
  if (sRes.ok) {
    console.log(`✅ [${repo}] Issue #${issueNumber} (${title}) comentado y cerrado.`);
    return true;
  }
  console.error(`[${repo}] Error cerrando issue #${issueNumber}: ${sRes.status}`);
  return false;
}

async function syncAndCloseInTargetRepo(repo, item, headers) {
  // Buscar si ya existe un issue con el mismo título en el repositorio destino
  const listRes = await fetch(
    `https://api.github.com/repos/${repo}/issues?state=all&per_page=100`,
    { headers },
  );
  let targetIssueNumber = null;
  if (listRes.ok) {
    const existing = await listRes.json();
    const match = existing.find(
      (iss) =>
        iss.title?.trim().toLowerCase() === item.title.trim().toLowerCase() ||
        iss.body?.includes(`Issue original #${item.number}`),
    );
    if (match) {
      targetIssueNumber = match.number;
    }
  }

  if (!targetIssueNumber) {
    const createRes = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: item.title,
        body: `> Sincronizado desde \`${SOURCE_REPO}#${item.number}\` (Issue original #${item.number})\n\n${item.originalBody}`,
      }),
    });
    if (!createRes.ok) {
      console.error(`[${repo}] No se pudo crear el issue #${item.number}: ${createRes.status}`);
      return;
    }
    const created = await createRes.json();
    targetIssueNumber = created.number;
    console.log(`📌 [${repo}] Creado issue #${targetIssueNumber}: ${item.title}`);
  }

  await commentAndCloseInRepo(repo, targetIssueNumber, item.comment, item.title, headers);
}

async function run() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.log(
      "ℹ️ GITHUB_TOKEN no encontrado en el entorno. Ejecuta con GITHUB_TOKEN=ghp_... node scripts/resolve-github-issues.mjs para sincronizar, comentar y cerrar automáticamente en GitHub.",
    );
    process.exit(0);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "vitmaterna-issue-resolver",
  };

  for (const item of ISSUES_DATA) {
    await commentAndCloseInRepo(SOURCE_REPO, item.number, item.comment, item.title, headers);
    if (TARGET_REPO && TARGET_REPO !== SOURCE_REPO) {
      await syncAndCloseInTargetRepo(TARGET_REPO, item, headers);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
