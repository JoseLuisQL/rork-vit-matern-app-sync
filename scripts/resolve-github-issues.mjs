#!/usr/bin/env node
/**
 * Script para comentar cómo probar cada issue resuelto (#38 al #50)
 * y cambiar el estado de cada issue a cerrado (closed) en GitHub.
 *
 * Uso:
 *   GITHUB_TOKEN=ghp_xxx node scripts/resolve-github-issues.mjs
 */

const REPO = "JoseLuisQL/vitmaterna";

const ISSUES_TESTING_GUIDE = [
  {
    number: 38,
    title: "Relación de Obstetra con la Gestante",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** (\`11111111\` / \`Obstetra@2026\`) y registra una **Nueva gestante**: la gestante queda vinculada automáticamente a la obstetra que la registró (\`obstetraDni\`).
2. Entra a **Ficha de gestante → Actualizar datos** o como **Admin → Usuarios / Nuevo usuario**: verás el selector **"Obstetra responsable"** para asignar o reasignar la obstetra encargada de la gestante.
3. Inicia sesión como **Gestante**: en su pantalla de **Inicio** y **Chat** aparece directamente la obstetra asignada a su seguimiento.`,
  },
  {
    number: 39,
    title: "Agregar eliminar Gestante en Obstetra",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** (\`11111111\` / \`Obstetra@2026\`) y ve a la pestaña **Gestantes**.
2. Puedes eliminar una gestante directamente con el botón de papelera (**Eliminar**) en la tarjeta de la lista o entrando a la **Ficha de la gestante → botón "Eliminar gestante"** al final de la sección *Su salud*.
3. Confirma en el diálogo de seguridad: la gestante, su cuenta y sus registros asociados se darán de baja de inmediato.`,
  },
  {
    number: 40,
    title: "Reemplazar en el registro de Gestante el IMC por Peso y Talla",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** (\`11111111\` / \`Obstetra@2026\`) y ve a **Gestantes → Nueva gestante** (o abre una gestante y toca **Actualizar datos del control**).
2. En la sección de salud ingresa **Peso (kg)** (ej. \`60\`) y **Talla (m o cm)** (ej. \`1.60\` o \`160\`).
3. Observa cómo el **IMC** se calcula automáticamente en vivo con la fórmula \`Peso / (Talla * Talla)\` mostrando su clasificación nutricional (*Bajo peso*, *Normal*, *Sobrepeso*, *Obesidad*) y se guarda en la ficha clínica.`,
  },
  {
    number: 41,
    title: "No se muestra los números cuando se agrega cesáreas, abortos y gestaciones",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** y entra a **Nueva gestante** o a **Ficha de gestante → Actualizar datos del control**.
2. En la sección **Su historia**, usa los botones \`-\` y \`+\` de **Gestaciones**, **Cesáreas previas** y **Abortos previos**.
3. Ahora el número seleccionado se muestra claramente tanto en la insignia junto al título (\`Gestaciones: 2 · Cesáreas: 1 · Abortos: 0\`), como en la píldora junto a cada etiqueta y en el recuadro central del control, además de reflejarse desglosado en la **Ficha de la gestante**.`,
  },
  {
    number: 42,
    title: "Cambiar Comunidad / barrio por Dirección",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** y abre **Nueva gestante**, **Actualizar datos del control** o la **Ficha de la gestante** (y también en **Admin → Nuevo usuario**).
2. Verifica que el campo anteriormente llamado *"Comunidad / barrio"* ahora se muestra como **"Dirección"** con soporte para direcciones completas (ej. \`Jr. Apurímac 345, Talavera\`).`,
  },
  {
    number: 43,
    title: "Agregar eliminar usuario en el administrador",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Administrador** (\`22222222\` / \`Admin@2026\`) y entra a la pestaña **Usuarios**.
2. En cada tarjeta de usuario (excepto tu propia cuenta activa), pulsa el botón rojo de papelera (**Eliminar**).
3. Confirma la acción en el modal: el endpoint \`POST /api/admin/delete-user\` elimina la cuenta y limpia en cascada sus citas, controles y registros asociados.`,
  },
  {
    number: 44,
    title: "Agregar fecha de posible parto cuando se ingresa fecha de última menstruación",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Entra como **Obstetra** a **Nueva gestante** o **Actualizar datos del control** y selecciona cualquier **Fecha de Última Menstruación (FUM)** en el calendario.
2. Debajo del selector verás de inmediato el cálculo en vivo de la **Fecha Probable de Parto (FPP)** (Regla de Naegele: FUM + 280 días) junto con las semanas de gestación.
3. En la lista de **Gestantes** y en la parte superior de la **Ficha de la gestante**, verás el banner destacado con la **Fecha Probable de Parto (FPP)** completa.`,
  },
  {
    number: 45,
    title: "Error de conexión de WhatsApp",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Administrador** (\`22222222\` / \`Admin@2026\`) y entra a la pestaña **Sistema**.
2. En la tarjeta **Notificaciones por WhatsApp (Open-WA)**, el estado se verifica automáticamente al abrir la pantalla y muestra **"Conectado a https://openwa.qware.me · Sesión activa"**.
3. También puedes pulsar **"Probar conexión"** o ingresar un número en **"Envío de Prueba"** y pulsar **"Enviar"** para comprobar la entrega sin errores de sesión desconectada.`,
  },
  {
    number: 46,
    title: "El obstetra ve las gestantes que registraron otros obstetras",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Como **Administrador**, crea una segunda cuenta con rol **Obstetra** en **Usuarios → Nuevo usuario**.
2. Inicia sesión con la nueva obstetra y registra una gestante desde **Gestantes → Nueva gestante**.
3. Cambia de sesión entre la primera obstetra (\`11111111\`) y la nueva obstetra: cada obstetra ve únicamente sus propias gestantes asignadas, sus citas, alertas y chats.`,
  },
  {
    number: 47,
    title: "En el celular el teclado tapa los campos de texto al escribir",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Abre la aplicación desde un teléfono móvil (o vista móvil responsiva) e ingresa a **Chat** (Gestante u Obstetra), **Nueva gestante**, **Actualizar datos**, **Programar cita/visita** o **Medicamento**.
2. Toca los campos de texto inferiores: el contenedor \`KeyboardAvoidingView\` con desplazamiento automático y margen inferior ajustable mantiene los campos y el botón de guardar visibles por encima del teclado.`,
  },
  {
    number: 48,
    title: "Programar cita solo permite elegir entre los próximos 14 días",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra**, entra a **Agenda → Programar** (o desde la ficha de una gestante toca **Cita**).
2. Debajo de la tira rápida de días verás el selector **"Elegir otra fecha en el calendario"**.
3. Tócalo para abrir el calendario mensual completo y selecciona cualquier fecha futura (a 1, 3 o 6 meses de distancia) para programar el control prenatal.`,
  },
  {
    number: 49,
    title: "En educación el obstetra no tiene opción para seleccionar materiales (videos, imágenes, documentos)",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra**, abre la ficha de una gestante y toca el botón **Educación**.
2. En el modal **Asignar Contenidos Educativos**, filtra por formato (**Todos**, **Lecturas**, **Videos**, **PDFs**, **Imágenes**) y observa las insignias de tipo (\`VIDEO\`, \`PDF\`, \`IMAGEN\`, \`LECTURA\`).
3. Pulsa **"+ Agregar material (Video, PDF, Imagen)"** para crear un nuevo recurso multimedia indicando su formato y URL, y asígnalo con un toque a la gestante.`,
  },
  {
    number: 50,
    title: "En citas programadas no hay opción para elegir la hora",
    comment: `✅ **Resuelto y verificado con pruebas unitarias.**

### Cómo probar en la app:
1. Inicia sesión como **Obstetra** y ve a **Programar cita**.
2. En la sección **Hora**, además de los bloques rápidos de 30 minutos, usa el campo **"O escribe una hora personalizada (formato 24h HH:MM)"** (por ejemplo \`07:45\` o \`17:15\`).
3. Guarda la cita y verifica que queda programada exactamente a la hora personalizada elegida.`,
  },
];

async function run() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.log(
      "ℹ️ GITHUB_TOKEN no encontrado en el entorno. Ejecuta con GITHUB_TOKEN=ghp_... node scripts/resolve-github-issues.mjs para comentar y cerrar automáticamente en GitHub.",
    );
    process.exit(0);
  }

  for (const item of ISSUES_TESTING_GUIDE) {
    const commentUrl = `https://api.github.com/repos/${REPO}/issues/${item.number}/comments`;
    const issueUrl = `https://api.github.com/repos/${REPO}/issues/${item.number}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "vitmaterna-issue-resolver",
    };

    const cRes = await fetch(commentUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ body: item.comment }),
    });
    if (!cRes.ok) {
      console.error(`Error comentando issue #${item.number}: ${cRes.status}`);
      continue;
    }

    const sRes = await fetch(issueUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ state: "closed", state_reason: "completed" }),
    });
    if (sRes.ok) {
      console.log(`✅ Issue #${item.number} (${item.title}) comentado y cerrado.`);
    } else {
      console.error(`Error cerrando issue #${item.number}: ${sRes.status}`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
