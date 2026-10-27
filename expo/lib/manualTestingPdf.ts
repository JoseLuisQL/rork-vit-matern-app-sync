/**
 * Generador del Manual de Pruebas Manuales para el Cliente (Issues #37 al #50) — VitMaterna.
 * Incluye portada ejecutiva, credenciales de prueba, matriz de trazabilidad,
 * capturas visuales de interfaz ("Antes" vs "Después") y pasos numerados
 * detallados para validar manualmente cada corrección en Web y APK Android.
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface IssueManualEntry {
  number: number;
  title: string;
  role: string;
  screenPath: string;
  problemSummary: string;
  solutionSummary: string;
  steps: string[];
  expectedResult: string;
  beforeCaption: string;
  afterCaption: string;
}

export const ISSUES_MANUAL_DATA: IssueManualEntry[] = [
  {
    number: 37,
    title: "Persistencia de sesión al cambiar de ventana o minimizar el navegador/app",
    role: "Todos (Admin / Obstetra / Gestante)",
    screenPath: "Inicio de sesión -> Cualquier pantalla -> Cambiar de pestaña/ventana",
    problemSummary:
      "Al minimizar el navegador o cambiar de ventana/aplicación, la sesión se cerraba o redirigía inesperadamente al login.",
    solutionSummary:
      "Se implementó hidratación síncrona en Web (localStorage vitmaterna:session:v3) y respaldo persistente en móvil (AsyncStorage), ignorando desconexiones transitorias y manteniendo la sesión activa hasta que el usuario pulse 'Cerrar sesión'.",
    steps: [
      "1. Ingrese a la aplicación con la cuenta de Obstetra (DNI: 43000100, Contraseña: Test@1234).",
      "2. Navegue a la pestaña 'Gestantes' o 'Agenda'.",
      "3. Cambie a otra pestaña del navegador, minimice la ventana o recargue la página con F5.",
      "4. Regrese a la ventana de VitMaterna.",
    ],
    expectedResult:
      "El usuario permanece autenticado en su sesión sin ser expulsado a la pantalla de inicio de sesión.",
    beforeCaption: "Antes: Cambio de ventana perdía token en memoria",
    afterCaption: "Después: Sesión persistente en localStorage / AsyncStorage",
  },
  {
    number: 38,
    title: "Relación entre Obstetra y Gestante (Asignación y transferencia de responsable)",
    role: "Administración y Obstetra",
    screenPath: "Admin > Usuarios > Nuevo usuario / Obstetra > Ficha de Gestante",
    problemSummary:
      "No existía vínculo entre la gestante y su obstetra responsable, impidiendo asignar o transferir pacientes entre obstetras.",
    solutionSummary:
      "Se añadió el campo 'Obstetra responsable' (obstetraDni) al crear gestantes desde Administración, asignación automática al obstetra que registra una nueva gestante, y un botón 'Cambiar' en la ficha clínica para transferir la paciente a otro obstetra.",
    steps: [
      "1. Inicie sesión como Administrador (DNI: 41000200, Contraseña: Test@1234).",
      "2. Vaya a 'Usuarios' -> '+ Nuevo usuario' y seleccione el rol 'Gestante'.",
      "3. Verifique el selector 'Obstetra responsable' y elija a 'Rosa Quispe' (43000100) o 'Marco Huamán' (43000101).",
      "4. Luego inicie sesión como Obstetra (DNI: 43000100), abra cualquier gestante y pulse el botón 'Cambiar' en la tarjeta 'Obstetra responsable'.",
    ],
    expectedResult:
      "La gestante queda vinculada al obstetra elegido y puede ser reasignada en cualquier momento desde su ficha clínica.",
    beforeCaption: "Antes: Sin campo de obstetra asignado",
    afterCaption: "Después: Selector y modal de Obstetra Responsable",
  },
  {
    number: 39,
    title: "Opción para eliminar gestantes con confirmación de seguridad",
    role: "Obstetra y Administración",
    screenPath: "Obstetra > Gestantes > [Seleccionar gestante] > Eliminar gestante",
    problemSummary:
      "No existía una opción en la ficha de la gestante para dar de baja o eliminar un registro creado por error o duplicado.",
    solutionSummary:
      "Se incorporó el botón 'Eliminar gestante' al final de la ficha clínica de la gestante con un cuadro de diálogo de confirmación que elimina en cascada sus citas, alertas y mensajes.",
    steps: [
      "1. Inicie sesión como Obstetra (DNI: 43000100, Contraseña: Test@1234).",
      "2. Vaya a la pestaña 'Gestantes' y abra la ficha de una gestante de prueba.",
      "3. Deslice hasta el final de la pantalla y pulse el botón rojo 'Eliminar gestante'.",
      "4. Confirme la acción en el modal pulsando 'Sí, eliminar'.",
    ],
    expectedResult:
      "Se muestra el mensaje 'Gestante eliminada correctamente' y la paciente desaparece de inmediato del padrón.",
    beforeCaption: "Antes: Ficha sin botón de eliminación",
    afterCaption: "Después: Botón 'Eliminar gestante' con modal de confirmación",
  },
  {
    number: 40,
    title: "Cálculo automático del IMC a partir de Peso (kg) y Talla (m o cm)",
    role: "Obstetra y Administración",
    screenPath: "Obstetra > Nueva Gestante / Actualizar datos clínicos",
    problemSummary:
      "El sistema pedía digitar el IMC manualmente sin campos de Peso ni Talla, obligando al personal a calcularlo con calculadora externa.",
    solutionSummary:
      "Se agregaron los campos 'Peso pregestacional (kg)' y 'Talla (m o cm)' con soporte automático para metros (ej. 1.55) o centímetros (ej. 155), calculando en vivo IMC = Peso / Talla² y su clasificación nutricional (Bajo peso, Normal, Sobrepeso, Obesidad).",
    steps: [
      "1. Entre como Obstetra (DNI: 43000100) y pulse '+ Nueva gestante' (o en una gestante pulse 'Actualizar datos').",
      "2. En la sección antropométrica, escriba Peso = 60 y Talla = 1.55 (o 155).",
      "3. Observe el recuadro inferior 'IMC pregestacional (calculado automáticamente)'.",
      "4. Guarde el formulario y verifique el IMC en la ficha de la gestante.",
    ],
    expectedResult:
      "El sistema muestra instantáneamente '25.0 kg/m² · Sobrepeso' sin necesidad de escribir el IMC a mano.",
    beforeCaption: "Antes: Campo manual de IMC sin Peso ni Talla",
    afterCaption: "Después: Peso + Talla calculan IMC = 25.0 kg/m² en vivo",
  },
  {
    number: 41,
    title: "Visibilidad de números en contadores de Gestas, Cesáreas y Abortos en móvil",
    role: "Obstetra y Administración",
    screenPath: "Obstetra > Actualizar datos clínicos / Nueva gestante (Vista móvil)",
    problemSummary:
      "En pantallas de celular, al colocar 3 contadores en una sola fila horizontal, el número central quedaba comprimido e invisible.",
    solutionSummary:
      "Se rediseñó el componente Stepper con una insignia central amplia (minWidth: 42px, fuente de 22px en negrita) y se dispusieron los contadores de Gestas, Cesáreas y Abortos en tarjetas de ancho completo apiladas verticalmente.",
    steps: [
      "1. Abra la aplicación desde el celular (o reduzca el ancho del navegador a vista móvil).",
      "2. Entre como Obstetra (DNI: 43000100) -> abra una gestante -> pulse 'Actualizar datos'.",
      "3. Ubique la sección 'Antecedentes obstétricos' (Gestas, Cesáreas previas, Abortos).",
      "4. Pulse los botones '+' y '−' en cada fila.",
    ],
    expectedResult:
      "Los números (0, 1, 2, 3...) se visualizan grandes, centrados y perfectamente legibles en cualquier tamaño de pantalla.",
    beforeCaption: "Antes: 3 columnas estrechas ocultaban el número",
    afterCaption: "Después: Filas amplias con marcador numérico de 22px",
  },
  {
    number: 42,
    title: "Cambio de etiqueta 'Comunidad' por 'Dirección' en formularios y fichas",
    role: "Todos (Obstetra / Administración / Gestante)",
    screenPath: "Nueva gestante / Actualizar datos / Ficha de gestante / Nuevo usuario",
    problemSummary:
      "El campo de domicilio figuraba únicamente como 'Comunidad', causando confusión al registrar direcciones urbanas o jirones/avenidas.",
    solutionSummary:
      "Se actualizó la etiqueta a 'Dirección' (con ejemplo 'Ej. Jr. Apurímac 245 / Ccaccacha') en todos los formularios de registro, edición y tarjetas de perfil.",
    steps: [
      "1. Entre como Obstetra (DNI: 43000100) y pulse '+ Nueva gestante'.",
      "2. Verifique que el campo de ubicación diga 'Dirección' en lugar de 'Comunidad'.",
      "3. Abra la ficha de cualquier gestante y pulse 'Actualizar datos' para verificar también allí la etiqueta 'Dirección'.",
    ],
    expectedResult:
      "Todos los formularios y vistas de paciente muestran claramente la etiqueta 'Dirección'.",
    beforeCaption: "Antes: Etiqueta decía 'Comunidad'",
    afterCaption: "Después: Etiqueta actualizada a 'Dirección'",
  },
  {
    number: 43,
    title: "Corrección de eliminación de usuarios en Administración ('Ruta no encontrada')",
    role: "Administración",
    screenPath: "Admin > Usuarios > Icono de papelera (Eliminar)",
    problemSummary:
      "En el panel de Administrador, no se podía eliminar usuarios o aparecía el error 'Ruta no encontrada' al intentar borrarlos.",
    solutionSummary:
      "Se habilitaron las rutas POST /api/admin/users/delete y POST /api/obstetra/patients/delete además del respaldo directo en POST /api/action (delete_user / delete_patient), junto con el botón de papelera y diálogo de confirmación en la lista de usuarios.",
    steps: [
      "1. Inicie sesión como Administrador (DNI: 41000200, Contraseña: Test@1234).",
      "2. Vaya a la pestaña 'Usuarios' y cree un usuario de prueba con '+ Nuevo usuario'.",
      "3. En la tarjeta del usuario recién creado, pulse el botón rojo con el icono de papelera (Eliminar).",
      "4. En el modal de confirmación, pulse 'Eliminar'.",
    ],
    expectedResult:
      "El usuario se elimina inmediatamente sin errores de ruta y aparece la confirmación 'Usuario eliminado correctamente'.",
    beforeCaption: "Antes: Error 404 'Ruta no encontrada'",
    afterCaption: "Después: Eliminación instantánea con confirmación",
  },
  {
    number: 44,
    title: "Visualización destacada de la Fecha Probable de Parto (FPP) en el perfil",
    role: "Obstetra",
    screenPath: "Obstetra > Gestantes > [Seleccionar gestante]",
    problemSummary:
      "Al entrar al perfil de la gestante no se visualizaba de forma clara y directa su Fecha Probable de Parto (FPP) ni su FUM de referencia.",
    solutionSummary:
      "Se añadió una tarjeta destacada 'Fecha Probable de Parto (FPP)' en la parte superior del expediente de la gestante, mostrando la fecha completa calculada por Regla de Naegele (FUM + 280 días), la FUM registrada y las semanas actuales.",
    steps: [
      "1. Inicie sesión como Obstetra (DNI: 43000100, Contraseña: Test@1234).",
      "2. Vaya a 'Gestantes' y seleccione a 'Luzmila Ayquipa' (o cualquier gestante).",
      "3. Observe la tarjeta superior con icono de calendario debajo de los datos principales.",
    ],
    expectedResult:
      "Se muestra de forma prominente la 'Fecha Probable de Parto (FPP)', la FUM de origen y las semanas de gestación.",
    beforeCaption: "Antes: FPP oculta o difícil de ubicar",
    afterCaption: "Después: Tarjeta destacada con FPP, FUM y Semanas",
  },
  {
    number: 45,
    title: "Integración de WhatsApp (Open-WA) con resolución automática de sesión",
    role: "Administración",
    screenPath: "Admin > Sistema > Notificaciones por WhatsApp (Open-WA)",
    problemSummary:
      "Al colocar el ID de sesión como nombre ('vitmaterna' o 'cliente1') en lugar del UUID interno de Open-WA, el envío de prueba fallaba con error 404 Session not found.",
    solutionSummary:
      "El cliente Open-WA ahora consulta automáticamente GET /api/sessions, resuelve el nombre amigable ('cliente1'/'vitmaterna') al UUID activo de la sesión en https://openwa.qware.me, reinicia la sesión si está detenida y persiste las credenciales al probar conexión o enviar mensaje.",
    steps: [
      "1. Inicie sesión como Administrador (DNI: 41000200, Contraseña: Test@1234) y vaya a 'Sistema'.",
      "2. En 'Notificaciones por WhatsApp (Open-WA)', verifique URL: https://openwa.qware.me y sesión: cliente1 (o vitmaterna).",
      "3. Pulse 'Probar conexión' y verifique el estado 'Conectado a https://openwa.qware.me'.",
      "4. Ingrese un número de celular de 9 dígitos en 'Enviar Mensaje de Prueba' y pulse 'Enviar prueba'.",
    ],
    expectedResult:
      "La conexión reporta estado 'working' con nivel de batería y el mensaje de WhatsApp llega al teléfono indicado.",
    beforeCaption: "Antes: Error 404 al usar nombre de sesión",
    afterCaption: "Después: Resolución automática de UUID y envío real",
  },
  {
    number: 46,
    title: "Filtrado exclusivo de Gestantes, Citas, Alertas y Chat por Obstetra asignado",
    role: "Obstetra",
    screenPath: "Obstetra > Inicio / Gestantes / Agenda / Alertas / Chat",
    problemSummary:
      "Todos los obstetras veían mezcladas a todas las gestantes del centro de salud, incluso las asignadas a otros colegas.",
    solutionSummary:
      "Tanto el backend como el frontend filtran el padrón de gestantes, agenda de citas, alertas y conversaciones de chat según el DNI del obstetra autenticado (mientras que el Administrador conserva vista global).",
    steps: [
      "1. Inicie sesión con la Obstetra 1: Rosa Quispe (DNI: 43000100, Contraseña: Test@1234) y observe su lista de gestantes.",
      "2. Abra una gestante, pulse 'Cambiar' en 'Obstetra responsable' y asígnela a 'Marco Huamán' (DNI: 43000101).",
      "3. Verifique que esa gestante ya no aparece en la lista de Rosa Quispe.",
      "4. Cierre sesión e ingrese como Obstetra 2: Marco Huamán (DNI: 43000101, Contraseña: Test@1234) y compruebe que la gestante aparece en su padrón.",
    ],
    expectedResult:
      "Cada obstetra visualiza y gestiona únicamente las gestantes que tiene asignadas bajo su responsabilidad.",
    beforeCaption: "Antes: Lista global sin separar por obstetra",
    afterCaption: "Después: Bandeja exclusiva para cada obstetra",
  },
  {
    number: 47,
    title: "Ajuste automático de pantalla cuando aparece el teclado en móvil (Chat y Formularios)",
    role: "Gestante y Obstetra",
    screenPath: "Chat de Gestante / Chat de Obstetra / Programar cita (Móvil)",
    problemSummary:
      "En dispositivos móviles, al tocar la caja de texto para escribir un mensaje de chat o una nota de cita, el teclado virtual tapaba el campo de escritura.",
    solutionSummary:
      "Se corrigió KeyboardAvoidingView usando behavior='padding' en Android/iOS, se configuró softwareKeyboardLayoutMode='resize' en app.json y se añadió desplazamiento automático al abrir el teclado.",
    steps: [
      "1. Desde el celular, inicie sesión como Gestante (DNI: 45100001) o como Obstetra (DNI: 43000100).",
      "2. Entre a la pestaña 'Chat' (o 'Conversar') y toque el campo 'Escribe tu mensaje…'.",
      "3. Verifique que la barra de escritura sube por encima del teclado virtual.",
      "4. Entre también a 'Programar cita' como Obstetra y toque el campo 'Nota o indicación'.",
    ],
    expectedResult:
      "El campo de texto y el botón de enviar permanecen siempre visibles sobre el teclado del celular.",
    beforeCaption: "Antes: El teclado ocultaba la barra de chat",
    afterCaption: "Después: La barra de chat se eleva sobre el teclado",
  },
  {
    number: 48,
    title: "Calendario mensual completo para programar citas en meses futuros",
    role: "Obstetra",
    screenPath: "Obstetra > Agenda > Programar cita > Botón 'Calendario'",
    problemSummary:
      "Al programar una cita solo se mostraban los próximos 14 días en una tira horizontal, impidiendo agendar controles para el mes siguiente o trimestres futuros.",
    solutionSummary:
      "Se añadió el botón 'Calendario' junto al selector de fecha que abre un calendario mensual interactivo completo, permitiendo navegar mes a mes hasta 9 meses hacia adelante.",
    steps: [
      "1. Inicie sesión como Obstetra (DNI: 43000100, Contraseña: Test@1234).",
      "2. Vaya a 'Agenda' -> pulse '+ Programar cita' (o desde la ficha de una gestante pulse 'Cita').",
      "3. En la sección '¿Qué día?', pulse el botón 'Calendario' (esquina superior derecha de la tira de días).",
      "4. Use las flechas '<' y '>' del calendario modal para avanzar al próximo mes y toque cualquier día.",
    ],
    expectedResult:
      "La fecha futura seleccionada se incorpora a la tira de días y permite guardar la cita en cualquier mes del embarazo.",
    beforeCaption: "Antes: Limitado a solo 14 días próximos",
    afterCaption: "Después: Modal de Calendario mensual hasta +9 meses",
  },
  {
    number: 49,
    title: "Asignación de contenido educativo multimedia (Lectura, Video, PDF, Imagen)",
    role: "Obstetra y Administración",
    screenPath: "Obstetra > Ficha de Gestante > Asignar lecturas / Admin > Educación",
    problemSummary:
      "El modal de 'Asignar lecturas' aparecía vacío en móvil por un colapso de altura de FlatList y no permitía crear ni asignar materiales multimedia (videos, PDFs o infografías).",
    solutionSummary:
      "Se reemplazó el contenedor por ScrollView con altura garantizada, se añadió soporte para 4 formatos ('lectura', 'video', 'pdf', 'imagen') con enlaces externos y se integró el botón '+ Crear nuevo contenido educativo' directamente para el obstetra.",
    steps: [
      "1. Inicie sesión como Obstetra (DNI: 43000100) y abra la ficha de una gestante.",
      "2. En la sección 'Educación asignada', pulse 'Asignar o quitar lecturas'.",
      "3. Marque o desmarque las tarjetas educativas y pulse '+ Crear nuevo contenido educativo' para agregar un Video o PDF.",
      "4. Pulse 'Guardar cambios' y verifique en la cuenta de la Gestante (DNI: 45100001) sus lecturas personalizadas.",
    ],
    expectedResult:
      "El modal muestra todos los contenidos con sus etiquetas (Lectura/Video/PDF/Imagen) y guarda la selección al instante.",
    beforeCaption: "Antes: Modal vacío y sin soporte multimedia",
    afterCaption: "Después: Lista completa + creador de Video/PDF/Imagen",
  },
  {
    number: 50,
    title: "Horario ampliado (07:00 a 20:00) y hora personalizada (HH:MM) en citas",
    role: "Obstetra",
    screenPath: "Obstetra > Programar cita > ¿A qué hora?",
    problemSummary:
      "Al programar una cita solo existían 7 horarios fijos y no se podía registrar una hora específica (por ejemplo, 07:45 o 18:15).",
    solutionSummary:
      "Se amplió la cuadrícula de horarios desde las 07:00 hasta las 20:00 y se incorporó el botón '+ Otra hora (HH:MM)' para digitar cualquier hora exacta en formato 24h.",
    steps: [
      "1. Inicie sesión como Obstetra (DNI: 43000100) y entre a 'Programar cita'.",
      "2. En la sección '¿A qué hora?', observe los horarios rápidos desde 07:00 hasta 20:00.",
      "3. Pulse el botón '+ Otra hora (HH:MM)' debajo de la cuadrícula.",
      "4. Escriba una hora específica como '07:45' o '18:15', pulse 'Usar 07:45' y guarde la cita.",
    ],
    expectedResult:
      "La cita queda programada exactamente con la hora personalizada elegida y se muestra en la agenda y ficha de la gestante.",
    beforeCaption: "Antes: Solo 7 horas fijas sin opción manual",
    afterCaption: "Después: Grilla 07:00-20:00 + campo '+ Otra hora (HH:MM)'",
  },
];

function drawPageHeader(doc: jsPDF, subtitle: string): void {
  // Franja institucional superior
  doc.setFillColor(91, 42, 94); // Ciruela #5B2A5E
  doc.rect(0, 0, 210, 16, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("VITMATERNA · C.S. TALAVERA — MANUAL DE PRUEBAS PARA EL CLIENTE", 12, 7.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(244, 236, 245);
  doc.text(subtitle, 12, 12.5);
}

function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  doc.setDrawColor(234, 220, 198);
  doc.setLineWidth(0.3);
  doc.line(12, 285, 198, 285);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(110, 101, 87);
  doc.text(
    "Repositorio: github.com/JoseLuisQL/vitmaterna · Guía de Validación Manual de Issues (#37 – #50)",
    12,
    290,
  );
  doc.setFont("helvetica", "bold");
  doc.text(`Página ${pageNum} de ${totalPages}`, 198, 290, { align: "right" });
}

/**
 * Dibuja las capturas comparativas ("ANTES" a la izquierda, "DESPUÉS" a la derecha)
 * simulando fielmente la interfaz real de VitMaterna para cada Issue (#37 al #50).
 */
function drawIssueVisualCapture(
  doc: jsPDF,
  issue: IssueManualEntry,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const halfW = (w - 6) / 2;
  const leftX = x;
  const rightX = x + halfW + 6;

  // --- Marco ANTES (Izquierda) ---
  doc.setFillColor(253, 245, 245);
  doc.setDrawColor(232, 180, 180);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftX, y, halfW, h, 3, 3, "FD");

  // Barra superior Antes
  doc.setFillColor(198, 56, 56);
  doc.roundedRect(leftX, y, halfW, 7, 3, 3, "F");
  doc.rect(leftX, y + 4, halfW, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(`ANTES (PROBLEMA REPORTADO — ISSUE #${issue.number})`, leftX + 3, y + 4.8);

  // --- Marco DESPUÉS (Derecha) ---
  doc.setFillColor(250, 244, 234); // gwarm.bg (#FAF4EA)
  doc.setDrawColor(12, 129, 116); // gwarm.teal (#0C8174)
  doc.setLineWidth(0.5);
  doc.roundedRect(rightX, y, halfW, h, 3, 3, "FD");

  // Barra superior Después
  doc.setFillColor(12, 129, 116);
  doc.roundedRect(rightX, y, halfW, 7, 3, 3, "F");
  doc.rect(rightX, y + 4, halfW, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(`DESPUÉS (SOLUCIÓN EN VITMATERNA — ISSUE #${issue.number})`, rightX + 3, y + 4.8);

  const innerY = y + 9.5;
  const innerH = h - 16.5;

  // Dibujar ventana simulada en ANTES
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 200, 200);
  doc.roundedRect(leftX + 3, innerY, halfW - 6, innerH, 2, 2, "FD");

  // Dibujar ventana simulada en DESPUÉS
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(234, 220, 198);
  doc.roundedRect(rightX + 3, innerY, halfW - 6, innerH, 2, 2, "FD");

  // Contenido específico por Issue para que el cliente identifique exactamente qué mirar en pantalla
  const lx = leftX + 6;
  const rx = rightX + 6;
  const cw = halfW - 12;

  switch (issue.number) {
    case 37: {
      // Antes: Al cambiar ventana vuelve a Login
      doc.setFillColor(251, 237, 237);
      doc.roundedRect(lx, innerY + 3, cw, 11, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(180, 40, 40);
      doc.text("Sesión expirada al minimizar ventana", lx + 3, innerY + 7.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("Redirigido a /login (Token perdido)", lx + 3, innerY + 11.8);

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(lx, innerY + 17, cw, 14, 2, 2, "F");
      doc.setTextColor(100, 100, 100);
      doc.text("Iniciar sesión — Ingresa tu DNI Nuevamente", lx + 3, innerY + 25);

      // Después: Sesión persistente
      doc.setFillColor(227, 241, 238);
      doc.roundedRect(rx, innerY + 3, cw, 12, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(10, 107, 96);
      doc.text("Sesión Activa: Obst. Rosa Quispe (43000100)", rx + 3, innerY + 7.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("localStorage + AsyncStorage (vitmaterna:session:v3)", rx + 3, innerY + 12);

      doc.setFillColor(244, 236, 245);
      doc.roundedRect(rx, innerY + 18, cw, 13, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(91, 42, 94);
      doc.text("Padrón de Gestantes permanece abierto al volver", rx + 3, innerY + 25.5);
      break;
    }
    case 38: {
      // Antes: Formulario sin Obstetra responsable
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(90, 90, 90);
      doc.text("Nuevo usuario (Rol: Gestante)", lx, innerY + 6);
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(lx, innerY + 8, cw, 9, 1.5, 1.5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("DNI: 45109988  |  Nombres: María Flores", lx + 2, innerY + 13.5);
      doc.setFillColor(251, 237, 237);
      doc.roundedRect(lx, innerY + 19, cw, 11, 1.5, 1.5, "F");
      doc.setTextColor(180, 40, 40);
      doc.text("× Sin opción para elegir Obstetra responsable", lx + 2, innerY + 25.5);

      // Después: Selector de Obstetra responsable + botón Cambiar
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(51, 48, 42);
      doc.text("Obstetra responsable (Selector Activo):", rx, innerY + 6);
      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.roundedRect(rx, innerY + 8, cw, 10, 1.5, 1.5, "FD");
      doc.setTextColor(10, 107, 96);
      doc.text("✓ Rosa Quispe · DNI 43000100 (Seleccionada)", rx + 2, innerY + 14.2);

      doc.setFillColor(250, 244, 234);
      doc.setDrawColor(234, 220, 198);
      doc.roundedRect(rx, innerY + 20, cw, 10, 1.5, 1.5, "FD");
      doc.setTextColor(110, 101, 87);
      doc.text("○ Marco Huamán · DNI 43000101   [Cambiar]", rx + 2, innerY + 26.2);
      break;
    }
    case 39: {
      // Antes: Ficha de gestante sin botón eliminar
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(90, 90, 90);
      doc.text("Ficha de Gestante: Luzmila Ayquipa", lx, innerY + 6);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(lx, innerY + 9, cw, 9, 1.5, 1.5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("[ Actualizar datos ]   [ Programar cita ]", lx + 3, innerY + 14.8);
      doc.setTextColor(180, 40, 40);
      doc.text("× No existía botón para eliminar gestante", lx + 2, innerY + 25);

      // Después: Botón Eliminar gestante + Modal de confirmación
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(51, 48, 42);
      doc.text("Ficha de Gestante -> Zona inferior:", rx, innerY + 6);
      doc.setFillColor(251, 237, 237);
      doc.setDrawColor(214, 69, 69);
      doc.roundedRect(rx, innerY + 8.5, cw, 9.5, 2, 2, "FD");
      doc.setTextColor(198, 40, 40);
      doc.text("🗑  Eliminar gestante", rx + cw / 2 - 14, innerY + 14.5);

      doc.setFillColor(255, 253, 247);
      doc.setDrawColor(223, 209, 184);
      doc.roundedRect(rx, innerY + 20, cw, 11, 2, 2, "FD");
      doc.setFontSize(6.3);
      doc.setTextColor(51, 48, 42);
      doc.text("¿Eliminar a esta gestante?  [Cancelar]  [Sí, eliminar]", rx + 2, innerY + 26.8);
      break;
    }
    case 40: {
      // Antes: IMC manual
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(90, 90, 90);
      doc.text("Datos Clínicos (Antes):", lx, innerY + 6);
      doc.setFillColor(251, 237, 237);
      doc.roundedRect(lx, innerY + 9, cw, 12, 1.5, 1.5, "F");
      doc.setTextColor(180, 40, 40);
      doc.setFontSize(6.5);
      doc.text("IMC pregestacional: [ 24.1 ] (Digitación manual)", lx + 2, innerY + 14.5);
      doc.text("× Faltaban campos de Peso (kg) y Talla (m)", lx + 2, innerY + 19);

      // Después: Peso + Talla -> IMC Automático
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(51, 48, 42);
      doc.text("Peso (kg): [ 60 ]    Talla (m o cm): [ 1.55 ]", rx, innerY + 6.5);

      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.roundedRect(rx, innerY + 9.5, cw, 20, 2, 2, "FD");
      doc.setFontSize(6.5);
      doc.setTextColor(10, 107, 96);
      doc.text("IMC PREGESTACIONAL (AUTOMÁTICO)", rx + 3, innerY + 14.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("25.0 kg/m²  ·  Sobrepeso", rx + 3, innerY + 21.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text("Fórmula: 60 kg / (1.55 m × 1.55 m) = 24.97 -> 25.0", rx + 3, innerY + 26.8);
      break;
    }
    case 41: {
      // Antes: 3 columnas estrechas sin verse el número
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(180, 40, 40);
      doc.text("Móvil Antes: 3 columnas comprimidas", lx, innerY + 6);
      const colW = (cw - 4) / 3;
      ["Gestas", "Cesáreas", "Abortos"].forEach((lbl, idx) => {
        const cx = lx + idx * (colW + 2);
        doc.setFillColor(251, 237, 237);
        doc.roundedRect(cx, innerY + 9, colW, 18, 1.5, 1.5, "F");
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text(lbl, cx + 2, innerY + 14);
        doc.setTextColor(190, 40, 40);
        doc.text("[-][?][+]", cx + 2, innerY + 22);
      });

      // Después: Filas apiladas con número grande de 22px
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(10, 107, 96);
      doc.text("Móvil Después: Filas amplias con número claro", rx, innerY + 5.5);
      const rows = [
        { label: "Gestas", val: "2" },
        { label: "Cesáreas previas", val: "1" },
        { label: "Abortos", val: "0" },
      ];
      rows.forEach((r, idx) => {
        const ry = innerY + 7.5 + idx * 8;
        doc.setFillColor(250, 244, 234);
        doc.setDrawColor(234, 220, 198);
        doc.roundedRect(rx, ry, cw, 6.8, 1.5, 1.5, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(51, 48, 42);
        doc.text(r.label, rx + 2.5, ry + 4.6);
        doc.setTextColor(12, 129, 116);
        doc.text(`[ − ]    ${r.val}    [ + ]`, rx + cw - 24, ry + 4.6);
      });
      break;
    }
    case 42: {
      // Antes: Comunidad
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(180, 40, 40);
      doc.text("Etiqueta Anterior:", lx, innerY + 7);
      doc.setFillColor(251, 237, 237);
      doc.roundedRect(lx, innerY + 10, cw, 16, 2, 2, "F");
      doc.setTextColor(120, 40, 40);
      doc.text("Comunidad *", lx + 3, innerY + 16);
      doc.setFont("helvetica", "normal");
      doc.text("[ Ccaccacha / Pampamarca ]", lx + 3, innerY + 22);

      // Después: Dirección
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(10, 107, 96);
      doc.text("Etiqueta Actualizada en todos los formularios:", rx, innerY + 7);
      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.roundedRect(rx, innerY + 10, cw, 16, 2, 2, "FD");
      doc.setTextColor(10, 107, 96);
      doc.text("Dirección *", rx + 3, innerY + 16);
      doc.setFont("helvetica", "normal");
      doc.text("[ Jr. Apurímac 245 · C.S. Talavera ]", rx + 3, innerY + 22);
      break;
    }
    case 43: {
      // Antes: Error Ruta no encontrada
      doc.setFillColor(251, 237, 237);
      doc.roundedRect(lx, innerY + 4, cw, 24, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(198, 40, 40);
      doc.text("Error al eliminar usuario en Admin:", lx + 3, innerY + 11);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("× 'Ruta no encontrada' (HTTP 404)", lx + 3, innerY + 17);
      doc.text("× El usuario permanecía en la lista", lx + 3, innerY + 23);

      // Después: Papelera funcional + Toast de éxito
      doc.setFillColor(250, 244, 234);
      doc.setDrawColor(234, 220, 198);
      doc.roundedRect(rx, innerY + 3, cw, 13, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(51, 48, 42);
      doc.text("Juan Pérez · DNI 44556677 (Obstetra)", rx + 3, innerY + 8.5);
      doc.setTextColor(198, 40, 40);
      doc.text("[ 🗑 Eliminar ]", rx + cw - 21, innerY + 8.5);

      doc.setFillColor(227, 241, 238);
      doc.roundedRect(rx, innerY + 18.5, cw, 10, 2, 2, "F");
      doc.setTextColor(10, 107, 96);
      doc.text("✓ Usuario eliminado correctamente", rx + 3, innerY + 24.8);
      break;
    }
    case 44: {
      // Antes: Sin FPP destacada
      doc.setFillColor(251, 237, 237);
      doc.roundedRect(lx, innerY + 4, cw, 23, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(180, 40, 40);
      doc.text("Perfil de Gestante (Antes):", lx + 3, innerY + 11);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("Solo mostraba semanas (32 sem), sin tarjeta", lx + 3, innerY + 17);
      doc.text("visible de Fecha Probable de Parto (FPP).", lx + 3, innerY + 22);

      // Después: Tarjeta FPP prominente
      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.roundedRect(rx, innerY + 3, cw, 25, 2.5, 2.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(10, 107, 96);
      doc.text("📅  FECHA PROBABLE DE PARTO (FPP)", rx + 3, innerY + 9);
      doc.setFontSize(9.5);
      doc.setTextColor(51, 48, 42);
      doc.text("15 de junio de 2025", rx + 3, innerY + 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.setTextColor(110, 101, 87);
      doc.text("Calculada por FUM (08 sep 2024) · 32 semanas", rx + 3, innerY + 22.5);
      break;
    }
    case 45: {
      // Antes: Error Open-WA 404
      doc.setFillColor(251, 237, 237);
      doc.roundedRect(lx, innerY + 4, cw, 24, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(198, 40, 40);
      doc.text("Open-WA Antes (ID: vitmaterna):", lx + 3, innerY + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.3);
      doc.text("× HTTP 404: Session 'vitmaterna' not found", lx + 3, innerY + 16);
      doc.text("× No resolvía el UUID real de la sesión", lx + 3, innerY + 22);

      // Después: Open-WA conectado con UUID resuelto
      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.roundedRect(rx, innerY + 3, cw, 25, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(10, 107, 96);
      doc.text("✓ Conectado a https://openwa.qware.me", rx + 3, innerY + 9);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.setTextColor(51, 48, 42);
      doc.text("Sesión: cliente1 -> UUID 19024686-72a5... (working)", rx + 3, innerY + 15);
      doc.text("Teléfono: +51 900 206 738 · Envío de prueba EXITOSO", rx + 3, innerY + 21.5);
      break;
    }
    case 46: {
      // Antes: Todos ven todas las gestantes
      doc.setFillColor(251, 237, 237);
      doc.roundedRect(lx, innerY + 4, cw, 24, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(198, 40, 40);
      doc.text("Padrón sin filtro por Obstetra:", lx + 3, innerY + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.3);
      doc.text("× Rosa Quispe veía gestantes de Marco Huamán", lx + 3, innerY + 16);
      doc.text("× Alertas y chats mezclados entre obstetras", lx + 3, innerY + 22);

      // Después: Filtrado estricto por obstetraDni
      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.roundedRect(rx, innerY + 3, cw, 25, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(10, 107, 96);
      doc.text("✓ Bandeja exclusiva por Obstetra autenticada", rx + 3, innerY + 9);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.setTextColor(51, 48, 42);
      doc.text("• Obst. Rosa Quispe (43000100) -> Sus gestantes", rx + 3, innerY + 15.5);
      doc.text("• Obst. Marco Huamán (43000101) -> Sus gestantes", rx + 3, innerY + 21.5);
      break;
    }
    case 47: {
      // Antes: Teclado cubre el input
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(lx, innerY + 3, cw, 12, 1.5, 1.5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.3);
      doc.setTextColor(80, 80, 80);
      doc.text("Chat: Hola obstetra Rosa, tengo una consulta...", lx + 2, innerY + 10);
      doc.setFillColor(70, 75, 85);
      doc.roundedRect(lx, innerY + 14, cw, 15, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 180, 180);
      doc.text("[ TECLADO MÓVIL CUBRÍA CAJA DE TEXTO ]", lx + 2, innerY + 23);

      // Después: Caja de texto elevada sobre el teclado
      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.roundedRect(rx, innerY + 3, cw, 11, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(10, 107, 96);
      doc.text("[ Escribe tu mensaje aquí... ]        [Enviar ➤]", rx + 2, innerY + 9.8);
      doc.setFillColor(90, 96, 108);
      doc.roundedRect(rx, innerY + 15.5, cw, 13.5, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.2);
      doc.text("Q  W  E  R  T  Y  U  I  O  P  (Teclado debajo)", rx + 3, innerY + 23.5);
      break;
    }
    case 48: {
      // Antes: Solo 14 días
      doc.setFillColor(251, 237, 237);
      doc.roundedRect(lx, innerY + 4, cw, 24, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(198, 40, 40);
      doc.text("Selector de Fecha (Antes):", lx + 3, innerY + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.text("[Hoy] [Mañ] [Jue] ... (Máximo 14 días)", lx + 3, innerY + 16);
      doc.text("× Imposible elegir fechas del próximo mes", lx + 3, innerY + 22);

      // Después: Botón Calendario + Modal Mensual
      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.roundedRect(rx, innerY + 3, cw, 25, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(10, 107, 96);
      doc.text("¿Qué día?                 [ 📅 Calendario ]", rx + 3, innerY + 8.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.setTextColor(51, 48, 42);
      doc.text("◀   Mayo / Junio 2025   ▶   (Hasta +9 meses)", rx + 3, innerY + 15);
      doc.text("L  M  X  J  V  S  D  -> Selección libre de día", rx + 3, innerY + 21.5);
      break;
    }
    case 49: {
      // Antes: Modal vacío
      doc.setFillColor(251, 237, 237);
      doc.roundedRect(lx, innerY + 4, cw, 24, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(198, 40, 40);
      doc.text("Modal Asignar Lecturas (Antes):", lx + 3, innerY + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.text("× Lista en blanco en celular (FlatList height 0)", lx + 3, innerY + 16);
      doc.text("× Sin soporte para Videos, PDFs o Imágenes", lx + 3, innerY + 22);

      // Después: Lista visible + Multimedia
      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.roundedRect(rx, innerY + 3, cw, 25, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(10, 107, 96);
      doc.text("[ + Crear nuevo contenido educativo (Video/PDF) ]", rx + 2.5, innerY + 8.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.1);
      doc.setTextColor(51, 48, 42);
      doc.text("☑ Hierro y alimentación rica en sangre (Lectura)", rx + 2.5, innerY + 15);
      doc.text("☑ Señales de peligro en el embarazo (Video/PDF)", rx + 2.5, innerY + 21);
      break;
    }
    case 50: {
      // Antes: 7 horarios fijos
      doc.setFillColor(251, 237, 237);
      doc.roundedRect(lx, innerY + 4, cw, 24, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(198, 40, 40);
      doc.text("¿A qué hora? (Antes):", lx + 3, innerY + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.text("Solo 08:00 a 16:00 en bloques fijos", lx + 3, innerY + 16);
      doc.text("× Sin opción para escribir hora exacta (HH:MM)", lx + 3, innerY + 22);

      // Después: Grilla 07:00-20:00 + Otra hora (HH:MM)
      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.roundedRect(rx, innerY + 3, cw, 25, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(10, 107, 96);
      doc.text("[07:00] [08:00] ... [18:00] [19:00] [20:00]", rx + 2.5, innerY + 9);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.setTextColor(51, 48, 42);
      doc.text("[ + Otra hora (HH:MM) ] -> [ 07:45 ] [Usar 07:45]", rx + 2.5, innerY + 16);
      doc.text("✓ Permite agendar cualquier hora del día (00:00-23:59)", rx + 2.5, innerY + 22.5);
      break;
    }
  }
}

/**
 * Construye el documento jsPDF completo con portada, tabla de credenciales,
 * matriz de issues y fichas ilustradas de prueba manual para los Issues #37 al #50.
 */
export function generateManualTestingPdfDoc(): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // =========================================================================
  // PÁGINA 1: PORTADA EJECUTIVA, CREDENCIALES Y MATRIZ DE ISSUES (#37 AL #50)
  // =========================================================================
  drawPageHeader(doc, "Guía Oficial de Validación Manual con Capturas de Interfaz (Issues #37 al #50)");

  // Bloque de Título Principal
  doc.setFillColor(250, 244, 234); // Crema VitMaterna
  doc.setDrawColor(234, 220, 198);
  doc.roundedRect(12, 21, 186, 28, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(91, 42, 94);
  doc.text("MANUAL DE PRUEBAS MANUALES — CORRECCIÓN DE ISSUES #37 AL #50", 16, 29.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  doc.setTextColor(51, 48, 42);
  doc.text(
    "Este documento detalla paso a paso cómo validar manualmente en la aplicación Web y móvil (APK) cada una de las 14",
    16,
    36,
  );
  doc.text(
    "correcciones solicitadas en el repositorio oficial (github.com/JoseLuisQL/vitmaterna/issues), incluyendo capturas",
    16,
    40.8,
  );
  doc.text(
    "comparativas (Antes vs. Después), credenciales de prueba por rol y resultados esperados.",
    16,
    45.6,
  );

  // 1. Tabla de Credenciales de Acceso para el Cliente
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(91, 42, 94);
  doc.text("1. CREDENCIALES DE ACCESO PARA EJECUTAR LAS PRUEBAS", 12, 56);

  autoTable(doc, {
    startY: 58.5,
    margin: { left: 12, right: 12 },
    head: [["Rol en el Sistema", "Nombre de Usuario", "DNI (Usuario)", "Contraseña", "Uso en las Pruebas"]],
    body: [
      [
        "Administrador(a)",
        "Carmen Flores (Admin)",
        "41000200",
        "Test@1234",
        "Probar Issues #38, #40, #42, #43, #45, #49",
      ],
      [
        "Obstetra Principal",
        "Obst. Rosa Quispe",
        "43000100",
        "Test@1234",
        "Probar Issues #37, #38, #39, #40, #41, #42, #44, #46, #47, #48, #49, #50",
      ],
      [
        "Segundo Obstetra",
        "Obst. Marco Huamán",
        "43000101",
        "Test@1234",
        "Probar transferencia y filtrado exclusivo de gestantes (#38 y #46)",
      ],
      [
        "Gestante",
        "Luzmila Ayquipa",
        "45100001",
        "Test@1234",
        "Probar persistencia (#37), teclado en chat (#47) y educación (#49)",
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [91, 42, 94],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 7.8,
      textColor: [51, 48, 42],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [250, 244, 234],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 32 },
      1: { cellWidth: 36 },
      2: { fontStyle: "bold", halign: "center", cellWidth: 24 },
      3: { fontStyle: "bold", halign: "center", cellWidth: 24 },
      4: { cellWidth: 70 },
    },
  });

  const afterCredsY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 95) + 7;

  // 2. Matriz Resumen de los 14 Issues (#37 al #50)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(91, 42, 94);
  doc.text("2. MATRIZ RESUMEN DE CORRECCIONES VALIDADAS (ISSUES #37 AL #50)", 12, afterCredsY);

  autoTable(doc, {
    startY: afterCredsY + 2.5,
    margin: { left: 12, right: 12 },
    head: [["Issue", " requerimiento / Corrección Implementada", "Rol", "Estado"]],
    body: ISSUES_MANUAL_DATA.map((item) => [
      `#${item.number}`,
      item.title,
      item.role,
      "RESUELTO ✓",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [12, 129, 116],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 48, 42],
      cellPadding: 1.8,
    },
    alternateRowStyles: {
      fillColor: [250, 244, 234],
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "center", cellWidth: 16 },
      1: { cellWidth: 108 },
      2: { cellWidth: 38 },
      3: { fontStyle: "bold", halign: "center", textColor: [10, 107, 96], cellWidth: 24 },
    },
  });

  // =========================================================================
  // PÁGINAS 2 A 8: FICHAS DETALLADAS CON CAPTURAS Y PASOS (2 ISSUES POR PÁGINA)
  // =========================================================================
  for (let i = 0; i < ISSUES_MANUAL_DATA.length; i += 2) {
    doc.addPage();
    const firstIssue = ISSUES_MANUAL_DATA[i];
    const secondIssue = ISSUES_MANUAL_DATA[i + 1];
    const rangeLabel = secondIssue
      ? `Fichas de Prueba Manual y Capturas: Issue #${firstIssue.number} e Issue #${secondIssue.number}`
      : `Ficha de Prueba Manual y Captura: Issue #${firstIssue.number}`;

    drawPageHeader(doc, rangeLabel);

    const drawSingleIssueBlock = (issue: IssueManualEntry, startY: number): void => {
      // Contenedor exterior de la ficha
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(223, 209, 184);
      doc.setLineWidth(0.4);
      doc.roundedRect(12, startY, 186, 127, 3, 3, "FD");

      // Cabecera de la ficha
      doc.setFillColor(91, 42, 94);
      doc.roundedRect(12, startY, 186, 9, 3, 3, "F");
      doc.rect(12, startY + 5, 186, 4, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`ISSUE #${issue.number}: ${issue.title.toUpperCase()}`, 15, startY + 6);

      // Sub-barra de metadatos (Rol + Ruta en la App)
      doc.setFillColor(244, 236, 245);
      doc.rect(12.2, startY + 9, 185.6, 6.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(91, 42, 94);
      doc.text(`Rol de prueba: ${issue.role}`, 15, startY + 13.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 48, 42);
      doc.text(`Ubicación en la App: ${issue.screenPath}`, 88, startY + 13.5);

      // Problema y Solución
      let curY = startY + 19.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(198, 40, 40);
      doc.text("Problema reportado:", 15, curY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 48, 42);
      const probLines = doc.splitTextToSize(issue.problemSummary, 148);
      doc.text(probLines, 43, curY);
      curY += Math.max(probLines.length * 3.6, 4.2) + 1;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(10, 107, 96);
      doc.text("Solución aplicada:", 15, curY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 48, 42);
      const solLines = doc.splitTextToSize(issue.solutionSummary, 148);
      doc.text(solLines, 43, curY);
      curY += Math.max(solLines.length * 3.6, 4.2) + 2;

      // Captura visual comparativa (Antes vs Después)
      const capY = startY + 37.5;
      drawIssueVisualCapture(doc, issue, 15, capY, 180, 40);

      // Pasos numerados para probar manualmente
      let stepsY = capY + 43.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.8);
      doc.setTextColor(91, 42, 94);
      doc.text("PASOS PARA PROBAR MANUALMENTE:", 15, stepsY);
      stepsY += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.3);
      doc.setTextColor(51, 48, 42);
      for (const step of issue.steps) {
        const lines = doc.splitTextToSize(step, 178);
        doc.text(lines, 16, stepsY);
        stepsY += lines.length * 3.5 + 0.8;
      }

      // Resultado esperado
      const resY = startY + 114.5;
      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.roundedRect(15, resY, 180, 9.5, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(10, 107, 96);
      doc.text("RESULTADO ESPERADO:", 18, resY + 4.2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 48, 42);
      const expLines = doc.splitTextToSize(issue.expectedResult, 142);
      doc.text(expLines, 50, resY + 4.2);
    };

    drawSingleIssueBlock(firstIssue, 20);
    if (secondIssue) {
      drawSingleIssueBlock(secondIssue, 152);
    }
  }

  // Numerar todas las páginas
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(doc, p, totalPages);
  }

  return doc;
}

/**
 * Descarga o comparte el PDF del Manual de Pruebas Manuales (Issues #37 al #50)
 * tanto en navegador Web como en dispositivos móviles (Expo / APK Android).
 */
export async function exportManualTestingPdf(): Promise<void> {
  const fileName = "Manual_Pruebas_Issues_37_al_50_VitMaterna.pdf";
  const isWeb = typeof window !== "undefined" && typeof document !== "undefined";
  const doc = generateManualTestingPdfDoc();

  if (isWeb) {
    doc.save(fileName);
    return;
  }

  const FileSystem = await import("expo-file-system/legacy");
  const Sharing = await import("expo-sharing");

  const base64 = doc.output("datauristring").split(",")[1];
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) throw new Error("No hay carpeta temporal disponible");
  const dest = `${cacheDir}${fileName}`;
  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dest, {
      mimeType: "application/pdf",
      dialogTitle: "Manual de Pruebas Manuales — Issues #37 al #50 (PDF)",
      UTI: "com.adobe.pdf",
    });
  }
}
