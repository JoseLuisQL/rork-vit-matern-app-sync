/**
 * Generador del Manual de Pruebas Manuales para el Cliente (Issues #37 al #50) — VitMaterna.
 * Incrusta las CAPTURAS DE PANTALLA REALES del frontend (capturadas con Chromium/Playwright
 * directamente de la aplicación en vivo) con marcadores numerados (1), (2), (3),
 * tabla de credenciales reales de demostración, pasos detallados y resultados esperados.
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { REAL_ISSUE_SCREENSHOTS } from "./manualScreenshotsData";

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
  isMobileCapture?: boolean;
}

export const ISSUES_MANUAL_DATA: IssueManualEntry[] = [
  {
    number: 37,
    title: "Persistencia de sesion al cambiar de ventana o minimizar el navegador/app",
    role: "Todos (Admin / Obstetra / Gestante)",
    screenPath: "Inicio de sesion -> Gestantes / Agenda -> Recargar (F5) o minimizar",
    problemSummary:
      "Al minimizar el navegador o cambiar de ventana/aplicacion, la sesion se cerraba o redirigia inesperadamente al login.",
    solutionSummary:
      "Se implemento hidratacion sincrona en Web (localStorage vitmaterna:session:v3) y respaldo persistente en movil (AsyncStorage), manteniendo la sesion activa hasta pulsar 'Cerrar sesion'.",
    steps: [
      "1. Ingrese como Obstetra Carmen Rojas (DNI: 11111111, Clave: Test@1234).",
      "2. Entre a la pestana 'Gestantes' (marcador 1 en la captura real).",
      "3. Cambie de pestana del navegador, minimice la ventana o pulse F5.",
      "4. Verifique que la sesion y el padron de gestantes siguen abiertos (marcador 2).",
    ],
    expectedResult:
      "El usuario permanece autenticado en su sesion activa sin ser expulsado a la pantalla de login.",
    beforeCaption: "Antes: Al minimizar o cambiar de pestana se perdia la sesion activa.",
    afterCaption: "Captura Real Frontend: Sesion persistente activa tras recargar/minimizar",
  },
  {
    number: 38,
    title: "Relacion entre Obstetra y Gestante (Asignacion y transferencia de responsable)",
    role: "Administracion y Obstetra",
    screenPath: "Admin > Usuarios > Nuevo usuario / Obstetra > Actualizar datos",
    problemSummary:
      "No existia vinculo entre la gestante y su obstetra responsable, impidiendo asignar o transferir pacientes entre obstetras.",
    solutionSummary:
      "Se anadio el selector 'Obstetra responsable' (obstetraDni) al crear/editar usuarios y en la ficha clinica para asignar o transferir gestantes entre obstetras.",
    steps: [
      "1. Inicie sesion como Administradora Patricia Salas (DNI: 22222222, Clave: Test@1234).",
      "2. Vaya a 'Usuarios' -> '+ Nuevo usuario' (rol Gestante).",
      "3. En 'Obstetra responsable' (marcador 1), elija 'Carmen Rojas Paredes' o 'Marco Huaman Quispe'.",
      "4. En 'Usuarios' o 'Actualizar datos', cambie la obstetra asignada con un clic.",
    ],
    expectedResult:
      "La gestante queda vinculada al obstetra elegido y puede ser transferida en cualquier momento.",
    beforeCaption: "Antes: No existia selector para vincular una gestante con su obstetra.",
    afterCaption: "Captura Real Frontend: Selector 'Obstetra responsable' en Nuevo Usuario",
  },
  {
    number: 39,
    title: "Opcion para eliminar gestantes con confirmacion de seguridad",
    role: "Obstetra y Administracion",
    screenPath: "Obstetra > Gestantes > [Seleccionar gestante] > Eliminar gestante",
    problemSummary:
      "No existia una opcion en la ficha de la gestante para dar de baja o eliminar un registro creado por error o duplicado.",
    solutionSummary:
      "Se incorporo el boton rojo 'Eliminar gestante' en la ficha clinica y padron con un modal de confirmacion que elimina en cascada sus citas, alertas y registros.",
    steps: [
      "1. Inicie sesion como Obstetra Carmen Rojas (DNI: 11111111, Clave: Test@1234).",
      "2. Vaya a 'Gestantes' y abra la ficha de una gestante (ej. Ana Quispe).",
      "3. Deslice hacia abajo y pulse el boton rojo 'Eliminar gestante' (marcador 1).",
      "4. Confirme en el dialogo emergente pulsando 'Eliminar gestante' (marcador 2).",
    ],
    expectedResult:
      "Se elimina la gestante junto con sus registros asociados y desaparece inmediatamente del padron.",
    beforeCaption: "Antes: No habia boton de eliminacion en la ficha clinica de la gestante.",
    afterCaption: "Captura Real Frontend: Modal de confirmacion 'Eliminar gestante'",
  },
  {
    number: 40,
    title: "Calculo automatico del IMC a partir de Peso (kg) y Talla (m o cm)",
    role: "Obstetra y Administracion",
    screenPath: "Obstetra > Nueva Gestante / Actualizar datos clinicos",
    problemSummary:
      "El sistema pedia digitar el IMC manualmente sin campos de Peso ni Talla, obligando al personal a usar calculadora externa.",
    solutionSummary:
      "Se agregaron los campos 'Peso (kg)' y 'Talla (m o cm)' con soporte para metros (1.55) o centimetros (155), calculando en vivo IMC = Peso / Talla^2 y su clasificacion nutricional.",
    steps: [
      "1. Entre como Obstetra (DNI: 11111111) y pulse '+ Nueva gestante'.",
      "2. En 'Ficha clinica', digite Peso = 60 y Talla = 1.55 o 155 (marcador 1).",
      "3. Observe el indicador inferior 'IMC calculado automaticamente: 25.0 kg/m2 (Sobrepeso)' (marcador 2).",
      "4. Guarde y verifique el peso, talla e IMC en la ficha de la gestante.",
    ],
    expectedResult:
      "El sistema calcula instantaneamente '25.0 kg/m2 (Sobrepeso)' al escribir Peso y Talla.",
    beforeCaption: "Antes: Solo existia campo manual de IMC sin registrar Peso ni Talla.",
    afterCaption: "Captura Real Frontend: Peso (60) y Talla (1.55) calculando IMC 25.0 en vivo",
  },
  {
    number: 41,
    title: "Visibilidad de numeros en contadores de Gestaciones, Cesareas y Abortos en movil",
    role: "Obstetra y Administracion",
    screenPath: "Obstetra > Gestante > Actualizar datos -> Seccion 'Su historia' (Movil)",
    problemSummary:
      "En pantallas de celular, al colocar los 3 contadores en una fila estrecha, el numero central quedaba comprimido e invisible.",
    solutionSummary:
      "Se rediseno el componente Stepper con resumen superior claro, insignias numericas junto a cada etiqueta y numero central grande en negrita.",
    steps: [
      "1. Abra la app en vista movil e inicie sesion como Obstetra (DNI: 11111111).",
      "2. Entre a una gestante (Ana Quispe) y pulse 'Actualizar datos'.",
      "3. En 'Su historia' (marcador 3), observe los contadores de Gestaciones, Cesareas y Abortos.",
      "4. Pulse '-' y '+' y compruebe que los numeros se ven claros y completos.",
    ],
    expectedResult:
      "Los numeros de Gestaciones, Cesareas y Abortos se visualizan grandes, centrados y legibles en movil.",
    beforeCaption: "Antes: En movil el numero entre '-' y '+' quedaba truncado o oculto.",
    afterCaption: "Captura Real Movil: Contadores de Gestaciones, Cesareas y Abortos visibles",
    isMobileCapture: true,
  },
  {
    number: 42,
    title: "Cambio de etiqueta 'Comunidad' por 'Direccion' en formularios y fichas",
    role: "Todos (Obstetra / Administracion / Gestante)",
    screenPath: "Nueva gestante / Actualizar datos / Ficha de gestante / Nuevo usuario",
    problemSummary:
      "El campo de domicilio figuraba unicamente como 'Comunidad', causando confusion al registrar direcciones urbanas o jirones.",
    solutionSummary:
      "Se actualizo la etiqueta a 'Direccion' en todos los formularios de registro, actualizacion de datos, filtros de busqueda y fichas de paciente.",
    steps: [
      "1. Entre como Obstetra (DNI: 11111111) y pulse '+ Nueva gestante'.",
      "2. Verifique en 'Ficha clinica' que el campo junto a Edad diga 'Direccion' (marcador 1).",
      "3. Entre tambien a la ficha de una gestante y verifique la etiqueta 'Direccion' en 'Su salud'.",
    ],
    expectedResult:
      "Todos los formularios, buscadores y fichas muestran la etiqueta 'Direccion' en lugar de 'Comunidad'.",
    beforeCaption: "Antes: Los formularios mostraban 'Comunidad' en vez de 'Direccion'.",
    afterCaption: "Captura Real Frontend: Campo 'Direccion' en el formulario de gestante",
  },
  {
    number: 43,
    title: "Correccion de eliminacion de usuarios en Administracion ('Ruta no encontrada')",
    role: "Administracion",
    screenPath: "Admin > Usuarios > Boton de papelera (Eliminar)",
    problemSummary:
      "En el panel de Administrador, no se podia eliminar usuarios o aparecia el error 'Ruta no encontrada' al intentar borrarlos.",
    solutionSummary:
      "Se habilitaron las rutas POST /api/admin/delete-user y /api/admin/users/delete junto con el boton de papelera y modal de confirmacion en cada tarjeta de usuario.",
    steps: [
      "1. Inicie sesion como Administradora Patricia Salas (DNI: 22222222, Clave: Test@1234).",
      "2. Vaya a la pestana 'Usuarios' (marcadores 1 y 2 en la captura real).",
      "3. Cree un usuario de prueba con '+ Nuevo usuario' y pulse el icono rojo de papelera.",
      "4. Confirme la eliminacion en el modal y verifique que desaparece sin error 404.",
    ],
    expectedResult:
      "El usuario se elimina al instante sin errores de ruta y la lista se actualiza inmediatamente.",
    beforeCaption: "Antes: Al intentar borrar un usuario devolvia error HTTP 404 'Ruta no encontrada'.",
    afterCaption: "Captura Real Frontend: Panel de Usuarios con botones de papelera y reasignacion",
  },
  {
    number: 44,
    title: "Visualizacion destacada de la Fecha Probable de Parto (FPP) en el perfil",
    role: "Obstetra",
    screenPath: "Obstetra > Gestantes > [Seleccionar gestante]",
    problemSummary:
      "Al entrar al perfil de la gestante no se visualizaba de forma clara y directa su Fecha Probable de Parto (FPP) ni su FUM.",
    solutionSummary:
      "Se anadio una tarjeta superior destacada 'Fecha Probable de Parto (FPP)' en el perfil de la gestante mostrando la fecha completa, edad gestacional y FUM.",
    steps: [
      "1. Inicie sesion como Obstetra Carmen Rojas (DNI: 11111111, Clave: Test@1234).",
      "2. Vaya a 'Gestantes' y abra el perfil de 'Ana Quispe Mamani'.",
      "3. Observe la tarjeta azul destacada 'Fecha Probable de Parto (FPP)' arriba a la izquierda (marcador 1).",
    ],
    expectedResult:
      "Se visualiza en primer plano la Fecha Probable de Parto (FPP), las semanas + dias y la FUM.",
    beforeCaption: "Antes: La FPP no aparecia destacada al abrir el expediente de la gestante.",
    afterCaption: "Captura Real Frontend: Tarjeta destacada de Fecha Probable de Parto (FPP)",
  },
  {
    number: 45,
    title: "Integracion de WhatsApp (Open-WA) con resolucion automatica de sesion",
    role: "Administracion",
    screenPath: "Admin > Sistema > Notificaciones por WhatsApp (Open-WA)",
    problemSummary:
      "Al usar el nombre de sesion ('vitmaterna' o 'cliente1') en lugar del UUID interno de Open-WA, fallaba con error 404 Session not found.",
    solutionSummary:
      "El cliente Open-WA consulta automaticamente GET /api/sessions, resuelve el nombre de sesion a su UUID activo en https://openwa.qware.me y reintenta reconexion.",
    steps: [
      "1. Entre como Administradora (DNI: 22222222) y abra la pestana 'Sistema'.",
      "2. Ubique 'Notificaciones por WhatsApp (Open-WA)' (marcador 1 en la captura real).",
      "3. Verifique URL: https://openwa.qware.me e ID de Sesion: vitmaterna (o cliente1).",
      "4. Pulse 'Probar conexion' (marcador 2) y use 'Enviar Mensaje de Prueba'.",
    ],
    expectedResult:
      "El sistema resuelve automaticamente el UUID de la sesion en Open-WA y envia los mensajes reales.",
    beforeCaption: "Antes: Error 404 cuando se colocaba el nombre de sesion en vez del UUID.",
    afterCaption: "Captura Real Frontend: Modulo de WhatsApp (Open-WA) en Admin > Sistema",
  },
  {
    number: 46,
    title: "Filtrado exclusivo de Gestantes, Citas, Alertas y Chat por Obstetra asignado",
    role: "Obstetra",
    screenPath: "Obstetra > Inicio / Gestantes / Agenda / Alertas / Chat",
    problemSummary:
      "Todos los obstetras veian mezcladas a todas las gestantes del centro de salud, incluso las asignadas a otros colegas.",
    solutionSummary:
      "Tanto el backend como el frontend filtran el padron de gestantes, agenda, alertas y chat exclusivamente por el DNI del obstetra autenticado.",
    steps: [
      "1. Entre como Obstetra 1: Carmen Rojas (DNI: 11111111) y vea sus gestantes en seguimiento (marcadores 1 y 2).",
      "2. Transfiera una gestante a 'Marco Huaman Quispe' desde 'Actualizar datos' -> 'Obstetra responsable'.",
      "3. Cierre sesion e ingrese como Obstetra 2: Marco Huaman (DNI: 12121212, Clave: Test@1234).",
      "4. Compruebe que cada obstetra ve unicamente las gestantes asignadas a su cargo.",
    ],
    expectedResult:
      "Cada obstetra visualiza y gestiona exclusivamente su propia cartera de gestantes asignadas.",
    beforeCaption: "Antes: El padron mostraba pacientes de otros obstetras sin filtrar.",
    afterCaption: "Captura Real Frontend: Padron filtrado por la Obstetra autenticada",
  },
  {
    number: 47,
    title: "Ajuste automatico de pantalla cuando aparece el teclado en movil (Chat y Formularios)",
    role: "Gestante y Obstetra",
    screenPath: "Gestante > Mensajes (Chat) / Obstetra > Chat y Programar cita (Movil)",
    problemSummary:
      "En dispositivos moviles, al tocar la caja de texto para escribir un mensaje de chat, el teclado virtual tapaba el campo de escritura.",
    solutionSummary:
      "Se configuro KeyboardAvoidingView y desplazamiento automatico al enfocar el input en Chat y formularios para mantener la caja de texto siempre visible.",
    steps: [
      "1. Desde el celular, inicie sesion como Gestante Ana Quispe (DNI: 33333333, Clave: Test@1234).",
      "2. Entre a la pestana 'Mensajes' (Chat con tu obstetra).",
      "3. Toque la barra de mensaje inferior y escriba un texto (marcador 1 en la captura movil).",
      "4. Compruebe que la caja de texto y el boton de enviar permanecen visibles sobre el teclado.",
    ],
    expectedResult:
      "La barra de escritura de chat y el boton de enviar se mantienen siempre visibles al escribir en movil.",
    beforeCaption: "Antes: El teclado virtual de Android/iOS cubria la barra de chat.",
    afterCaption: "Captura Real Movil: Chat de Gestante con barra de escritura visible",
    isMobileCapture: true,
  },
  {
    number: 48,
    title: "Calendario mensual completo para programar citas en meses futuros",
    role: "Obstetra",
    screenPath: "Obstetra > Agenda > Programar cita > Elegir otra fecha en el calendario",
    problemSummary:
      "Al programar una cita solo se mostraban los proximos 14 dias en una tira horizontal, impidiendo agendar controles en meses futuros.",
    solutionSummary:
      "Se agrego el selector 'Elegir otra fecha en el calendario (cualquier mes)' que abre un calendario mensual interactivo completo con navegacion libre de meses.",
    steps: [
      "1. Inicie sesion como Obstetra (DNI: 11111111) y entre a 'Programar cita' (Nueva cita).",
      "2. En el paso 2 ('Elige el dia'), pulse 'Elegir otra fecha en el calendario (cualquier mes)'.",
      "3. En el calendario modal emergente (marcador 1), navegue con '<' y '>' a cualquier mes futuro.",
      "4. Seleccione el dia deseado y pulse 'Confirmar' (marcador 2).",
    ],
    expectedResult:
      "El calendario mensual permite elegir cualquier fecha futura y la incorpora inmediatamente a la cita.",
    beforeCaption: "Antes: Solo permitia elegir dentro de una tira fija de 14 dias.",
    afterCaption: "Captura Real Frontend: Modal de Calendario Mensual interactivo abierto",
  },
  {
    number: 49,
    title: "Asignacion de contenido educativo multimedia (Lectura, Video, PDF, Imagen)",
    role: "Obstetra y Administracion",
    screenPath: "Obstetra > Ficha de Gestante > Boton 'Educacion' (Asignar Contenidos)",
    problemSummary:
      "El modal de 'Asignar lecturas' aparecia vacio en movil y no permitia crear ni filtrar materiales multimedia (Videos, PDFs, Imagenes).",
    solutionSummary:
      "Se rediseño el modal 'Asignar Contenidos Educativos' con filtros por tipo (Lecturas, Videos, PDFs, Imagenes), boton '+ Agregar material' y switches de asignacion.",
    steps: [
      "1. Entre como Obstetra (DNI: 11111111) y abra la ficha de 'Ana Quispe Mamani'.",
      "2. Pulse el boton 'Educacion' debajo de la tarjeta de FPP.",
      "3. Observe las tarjetas con etiquetas PDF (marcador 1), VIDEO (marcador 2) e IMAGEN, y el boton '+ Agregar material'.",
      "4. Active los switches de los materiales deseados y pulse 'Listo'.",
    ],
    expectedResult:
      "El modal muestra todos los recursos multimedia (PDF, Video, Imagen, Lectura) y permite crear o asignar nuevos.",
    beforeCaption: "Antes: Lista vacia en movil y sin soporte para Videos, PDFs ni Imagenes.",
    afterCaption: "Captura Real Frontend: Modal 'Asignar Contenidos' Multimedia",
  },
  {
    number: 50,
    title: "Horario ampliado y hora personalizada (HH:MM) al programar citas",
    role: "Obstetra",
    screenPath: "Obstetra > Programar cita (Nueva cita) > Paso 3: Elige la hora",
    problemSummary:
      "Al programar una cita solo existian bloques fijos y no se podia registrar una hora especifica (por ejemplo, 07:45 o 17:15).",
    solutionSummary:
      "Se incorporo la grilla completa de horarios y la tarjeta '¿Prefieres ingresar otra hora personalizada?' que valida cualquier hora exacta en formato 24h (HH:MM).",
    steps: [
      "1. Inicie sesion como Obstetra (DNI: 11111111) y abra 'Nueva cita' (Programar cita).",
      "2. Deslice al Paso 3 ('Elige la hora') y ubique '¿Prefieres ingresar otra hora personalizada?' (marcador 1).",
      "3. Escriba una hora exacta como '07:45' y verifique la insignia azul de confirmacion '07:45' (marcador 2).",
      "4. Pulse 'Guardar cita · 07:45' en la parte inferior.",
    ],
    expectedResult:
      "La cita se agenda con la hora exacta personalizada (ej. 07:45) y se refleja en el resumen inferior.",
    beforeCaption: "Antes: Solo permitia elegir bloques cerrados sin hora personalizada.",
    afterCaption: "Captura Real Frontend: Hora personalizada '07:45' activa y lista para guardar",
  },
];

// ============================================================================
// PRIMITIVAS VECTORIALES NATIVAS PARA ICONOS Y ENCABEZADOS
// ============================================================================

function drawVectorCheckIcon(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  bg: [number, number, number] = [12, 129, 116],
): void {
  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.circle(cx, cy, r, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.45);
  doc.line(cx - r * 0.45, cy + r * 0.02, cx - r * 0.1, cy + r * 0.38);
  doc.line(cx - r * 0.1, cy + r * 0.38, cx + r * 0.48, cy - r * 0.35);
}

function drawVectorCrossIcon(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  bg: [number, number, number] = [214, 69, 69],
): void {
  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.circle(cx, cy, r, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.45);
  const d = r * 0.42;
  doc.line(cx - d, cy - d, cx + d, cy + d);
  doc.line(cx + d, cy - d, cx - d, cy + d);
}

function drawPageHeader(doc: jsPDF, subtitle: string): void {
  doc.setFillColor(91, 42, 94); // Ciruela institucional #5B2A5E
  doc.rect(0, 0, 210, 15, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.8);
  doc.setTextColor(255, 255, 255);
  doc.text("VITMATERNA - C.S. TALAVERA | MANUAL DE PRUEBAS CON CAPTURAS REALES", 12, 6.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(244, 236, 245);
  doc.text(subtitle, 12, 11.8);
}

function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  doc.setDrawColor(234, 220, 198);
  doc.setLineWidth(0.3);
  doc.line(12, 286, 198, 286);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(110, 101, 87);
  doc.text(
    "Repositorio: github.com/JoseLuisQL/vitmaterna - Guia Oficial con Capturas Reales del Frontend (#37 al #50)",
    12,
    290.5,
  );
  doc.setFont("helvetica", "bold");
  doc.text(`Pagina ${pageNum} de ${totalPages}`, 198, 290.5, { align: "right" });
}

/**
 * Construye el documento jsPDF completo con portada, tabla de credenciales reales,
 * matriz de issues y las 14 fichas con las CAPTURAS DE PANTALLA REALES del frontend.
 */
export function generateManualTestingPdfDoc(): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // =========================================================================
  // PAGINA 1: PORTADA EJECUTIVA, CREDENCIALES REALES Y MATRIZ (#37 AL #50)
  // =========================================================================
  drawPageHeader(
    doc,
    "Guia Paso a Paso para el Cliente con Capturas de Pantalla Reales del Frontend (Issues #37 al #50)",
  );

  // Bloque de Titulo Principal
  doc.setFillColor(250, 244, 234);
  doc.setDrawColor(234, 220, 198);
  doc.roundedRect(12, 19.5, 186, 26, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(91, 42, 94);
  doc.text("MANUAL DE PRUEBAS MANUALES - CORRECCION DE ISSUES #37 AL #50", 16, 27);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.4);
  doc.setTextColor(51, 48, 42);
  doc.text(
    "Este manual contiene los pasos detallados y las capturas de pantalla reales del frontend de VitMaterna para validar",
    16,
    33.2,
  );
  doc.text(
    "cada una de las 14 correcciones solicitadas en GitHub (github.com/JoseLuisQL/vitmaterna/issues). Cada captura real",
    16,
    37.8,
  );
  doc.text(
    "incluye recuadros rojos y marcadores numerados (1), (2) que indican exactamente que elemento probar en pantalla.",
    16,
    42.4,
  );

  // 1. Tabla de Credenciales Reales de Acceso
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.setTextColor(91, 42, 94);
  doc.text("1. CREDENCIALES REALES DE ACCESO PARA EJECUTAR LAS PRUEBAS", 12, 52);

  autoTable(doc, {
    startY: 54.2,
    margin: { left: 12, right: 12 },
    head: [
      ["Rol en el Sistema", "Nombre de Usuario", "DNI (Usuario)", "Contrasena", "Issues que permite validar"],
    ],
    body: [
      [
        "Administradora",
        "Patricia Salas Vega",
        "22222222",
        "Test@1234",
        "Issues #37, #38, #42, #43, #45, #49",
      ],
      [
        "Obstetra Principal",
        "Obst. Carmen Rojas Paredes",
        "11111111",
        "Test@1234",
        "Issues #37, #38, #39, #40, #41, #42, #44, #46, #48, #49, #50",
      ],
      [
        "Segundo Obstetra",
        "Obst. Marco Huaman Quispe",
        "12121212",
        "Test@1234",
        "Issues #38 y #46 (Transferencia y filtrado exclusivo por obstetra)",
      ],
      [
        "Gestante 1",
        "Ana Quispe Mamani",
        "33333333",
        "Test@1234",
        "Issues #37 (Persistencia), #47 (Teclado en Chat movil) y #49 (Educacion)",
      ],
      [
        "Gestante 2",
        "Lucia Huaman Ccorimanya",
        "44444444",
        "Test@1234",
        "Pruebas adicionales de perfil gestante, alertas y citas",
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [91, 42, 94],
      textColor: [255, 255, 255],
      fontSize: 7.8,
      fontStyle: "bold",
      cellPadding: 1.9,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 48, 42],
      cellPadding: 1.7,
    },
    alternateRowStyles: {
      fillColor: [250, 244, 234],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { fontStyle: "bold", halign: "center", cellWidth: 23 },
      3: { fontStyle: "bold", halign: "center", cellWidth: 23 },
      4: { cellWidth: 70 },
    },
  });

  const afterCredsY =
    ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 96) + 6;

  // 2. Matriz Resumen de los 14 Issues (#37 al #50)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.setTextColor(91, 42, 94);
  doc.text("2. MATRIZ DE TRAZABILIDAD DE ISSUES CORREGIDOS (#37 AL #50)", 12, afterCredsY);

  autoTable(doc, {
    startY: afterCredsY + 2.2,
    margin: { left: 12, right: 12 },
    head: [["Issue", "Requerimiento / Correccion Validada con Captura Real", "Rol", "Estado"]],
    body: ISSUES_MANUAL_DATA.map((item) => [
      `#${item.number}`,
      item.title,
      item.role,
      "VALIDADO [OK]",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [12, 129, 116],
      textColor: [255, 255, 255],
      fontSize: 7.8,
      fontStyle: "bold",
      cellPadding: 1.8,
    },
    bodyStyles: {
      fontSize: 7.3,
      textColor: [51, 48, 42],
      cellPadding: 1.6,
    },
    alternateRowStyles: {
      fillColor: [250, 244, 234],
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "center", cellWidth: 15 },
      1: { cellWidth: 107 },
      2: { cellWidth: 38 },
      3: { fontStyle: "bold", halign: "center", textColor: [10, 107, 96], cellWidth: 26 },
    },
  });

  // =========================================================================
  // PAGINAS 2 A 8: FICHAS CON CAPTURAS DE PANTALLA REALES DEL FRONTEND
  // =========================================================================
  for (let i = 0; i < ISSUES_MANUAL_DATA.length; i += 2) {
    doc.addPage();
    const firstIssue = ISSUES_MANUAL_DATA[i];
    const secondIssue = ISSUES_MANUAL_DATA[i + 1];
    const rangeLabel = secondIssue
      ? `Capturas Reales del Frontend y Pasos de Prueba: Issue #${firstIssue.number} e Issue #${secondIssue.number}`
      : `Captura Real del Frontend y Pasos de Prueba: Issue #${firstIssue.number}`;

    drawPageHeader(doc, rangeLabel);

    const drawSingleIssueBlock = (issue: IssueManualEntry, startY: number): void => {
      // Contenedor exterior de la ficha (186mm ancho x 129mm alto)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(223, 209, 184);
      doc.setLineWidth(0.4);
      doc.roundedRect(12, startY, 186, 129, 3, 3, "FD");

      // Cabecera de la ficha
      doc.setFillColor(91, 42, 94);
      doc.roundedRect(12, startY, 186, 8.0, 3, 3, "F");
      doc.rect(12, startY + 4.5, 186, 3.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`ISSUE #${issue.number}: ${issue.title.toUpperCase()}`, 15, startY + 5.4);

      // Sub-barra de metadatos (Rol + Ruta en la App)
      doc.setFillColor(244, 236, 245);
      doc.rect(12.2, startY + 8.0, 185.6, 5.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(91, 42, 94);
      doc.text(`Rol: ${issue.role}`, 15, startY + 11.7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 48, 42);
      doc.text(`Ubicacion: ${issue.screenPath}`, 82, startY + 11.7);

      // Problema y Solucion en la parte superior
      let curY = startY + 16.8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.9);
      doc.setTextColor(190, 40, 40);
      doc.text("Problema:", 15, curY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 48, 42);
      const probLines = doc.splitTextToSize(issue.problemSummary, 156);
      doc.text(probLines, 29, curY);
      curY += Math.max(probLines.length * 3.1, 3.4) + 0.6;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(10, 107, 96);
      doc.text("Solucion:", 15, curY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 48, 42);
      const solLines = doc.splitTextToSize(issue.solutionSummary, 156);
      doc.text(solLines, 29, curY);

      // =====================================================================
      // ZONA PRINCIPAL DIVIDIDA (startY + 30.5mm hasta startY + 126.5mm -> 96mm)
      // Izquierda (71mm): Antes + Pasos Numerados + Resultado Esperado
      // Derecha (108mm): CAPTURA DE PANTALLA REAL DEL FRONTEND EN ALTA RESOLUCION
      // =====================================================================
      const bodyTopY = startY + 30.5;
      const leftColX = 14.5;
      const leftColW = 70.5;
      const rightColX = 87.5;
      const rightColW = 108.0;

      // 1. Recuadro compacto "ANTES (Problema reportado)"
      doc.setFillColor(253, 244, 244);
      doc.setDrawColor(225, 165, 165);
      doc.setLineWidth(0.3);
      doc.roundedRect(leftColX, bodyTopY, leftColW, 13.5, 1.8, 1.8, "FD");
      drawVectorCrossIcon(doc, leftColX + 3.2, bodyTopY + 3.6, 1.4, [190, 40, 40]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.3);
      doc.setTextColor(185, 35, 35);
      doc.text("ANTES (PROBLEMA EN GITHUB):", leftColX + 5.8, bodyTopY + 4.3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.setTextColor(90, 40, 40);
      const befLines = doc.splitTextToSize(issue.beforeCaption, leftColW - 5);
      doc.text(befLines, leftColX + 2.5, bodyTopY + 8.2);

      // 2. Recuadro de "PASOS PARA PROBAR MANUALMENTE"
      const stepsBoxY = bodyTopY + 15.2;
      const stepsBoxH = 56.5;
      doc.setFillColor(250, 244, 234);
      doc.setDrawColor(234, 220, 198);
      doc.roundedRect(leftColX, stepsBoxY, leftColW, stepsBoxH, 1.8, 1.8, "FD");

      doc.setFillColor(91, 42, 94);
      doc.roundedRect(leftColX, stepsBoxY, leftColW, 5.5, 1.8, 1.8, "F");
      doc.rect(leftColX, stepsBoxY + 3, leftColW, 2.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.3);
      doc.setTextColor(255, 255, 255);
      doc.text("PASOS PARA PROBAR MANUALMENTE:", leftColX + 2.5, stepsBoxY + 3.8);

      let sY = stepsBoxY + 9.0;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.4);
      doc.setTextColor(51, 48, 42);
      for (const step of issue.steps) {
        const sLines = doc.splitTextToSize(step, leftColW - 5);
        doc.text(sLines, leftColX + 2.5, sY);
        sY += sLines.length * 3.15 + 1.4;
      }

      // 3. Recuadro de "RESULTADO ESPERADO"
      const expBoxY = stepsBoxY + stepsBoxH + 1.8;
      const expBoxH = 21.5;
      doc.setFillColor(227, 241, 238);
      doc.setDrawColor(12, 129, 116);
      doc.setLineWidth(0.35);
      doc.roundedRect(leftColX, expBoxY, leftColW, expBoxH, 1.8, 1.8, "FD");
      drawVectorCheckIcon(doc, leftColX + 3.5, expBoxY + 3.8, 1.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.3);
      doc.setTextColor(10, 107, 96);
      doc.text("RESULTADO ESPERADO:", leftColX + 6.2, expBoxY + 4.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.3);
      doc.setTextColor(35, 55, 50);
      const expLines = doc.splitTextToSize(issue.expectedResult, leftColW - 5);
      doc.text(expLines, leftColX + 2.5, expBoxY + 8.8);

      // =====================================================================
      // 4. PANEL DERECHO: CAPTURA DE PANTALLA REAL DEL FRONTEND (JPEG)
      // =====================================================================
      const totalRightH = 95.0;
      doc.setFillColor(244, 247, 246);
      doc.setDrawColor(12, 129, 116);
      doc.setLineWidth(0.45);
      doc.roundedRect(rightColX, bodyTopY, rightColW, totalRightH, 2.2, 2.2, "FD");

      // Barra superior verde de la captura real
      doc.setFillColor(12, 129, 116);
      doc.roundedRect(rightColX, bodyTopY, rightColW, 6.0, 2.2, 2.2, "F");
      doc.rect(rightColX, bodyTopY + 3, rightColW, 3.0, "F");
      drawVectorCheckIcon(doc, rightColX + 3.5, bodyTopY + 3.0, 1.5, [8, 92, 82]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.2);
      doc.setTextColor(255, 255, 255);
      doc.text(issue.afterCaption.toUpperCase(), rightColX + 6.5, bodyTopY + 4.0);

      const screenshotDataUri = REAL_ISSUE_SCREENSHOTS[issue.number];
      if (screenshotDataUri) {
        if (issue.isMobileCapture) {
          // Captura movil real (410 x 760 -> ratio 0.5395): alto 84mm -> ancho 45.3mm
          const imgH = 84.5;
          const imgW = 45.6;
          const imgX = rightColX + 6;
          const imgY = bodyTopY + 8.0;

          // Marco de dispositivo celular alrededor de la captura real
          doc.setFillColor(35, 33, 30);
          doc.roundedRect(imgX - 1.5, imgY - 1.5, imgW + 3, imgH + 3, 2.5, 2.5, "F");
          doc.addImage(screenshotDataUri, "JPEG", imgX, imgY, imgW, imgH);

          // Leyenda explicativa al costado derecho de la captura movil
          const sideX = imgX + imgW + 5;
          const sideW = rightColW - (imgW + 14);
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(210, 228, 224);
          doc.roundedRect(sideX, imgY + 4, sideW, 76, 2, 2, "FD");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.8);
          doc.setTextColor(10, 107, 96);
          doc.text("VISTA MOVIL REAL", sideX + 3, imgY + 11);
          doc.setFontSize(6.2);
          doc.setTextColor(91, 42, 94);
          doc.text("(410 x 760 px - APK / Web)", sideX + 3, imgY + 15.5);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.2);
          doc.setTextColor(51, 48, 42);
          const mobileNote =
            issue.number === 41
              ? "La captura real izquierda muestra la pantalla 'Actualizar datos' en resolucion movil. Los contadores de Gestaciones (2), Cesareas (0) y Abortos (0) muestran tanto el resumen superior como los botones '-' y '+' con el numero central claramente visible."
              : "La captura real izquierda muestra la pantalla de Chat de la Gestante en resolucion movil. Al tocar la caja de texto inferior, KeyboardAvoidingView mantiene el campo de mensaje y el boton de enviar por encima del borde inferior.";
          const noteLines = doc.splitTextToSize(mobileNote, sideW - 6);
          doc.text(noteLines, sideX + 3, imgY + 22);
        } else {
          // Captura escritorio real (1180 x 740 -> ratio 1.5946): ancho 104mm -> alto 65.2mm
          const imgW = 104.0;
          const imgH = 65.2;
          const imgX = rightColX + 2.0;
          const imgY = bodyTopY + 7.8;

          // Sombra/borde alrededor de la captura real
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(200, 215, 212);
          doc.setLineWidth(0.3);
          doc.rect(imgX - 0.5, imgY - 0.5, imgW + 1, imgH + 1, "FD");
          doc.addImage(screenshotDataUri, "JPEG", imgX, imgY, imgW, imgH);

          // Pie descriptivo de la captura real
          const capFootY = imgY + imgH + 2.2;
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(215, 230, 226);
          doc.roundedRect(imgX, capFootY, imgW, 17.5, 1.5, 1.5, "FD");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.2);
          doc.setTextColor(91, 42, 94);
          doc.text(
            `GUIA VISUAL DE LA CAPTURA REAL (ISSUE #${issue.number}):`,
            imgX + 2.5,
            capFootY + 4.5,
          );
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.0);
          doc.setTextColor(51, 48, 42);
          const footDesc = doc.splitTextToSize(
            `Los recuadros rojos con circulos numerados en la captura superior corresponden a la interfaz real de VitMaterna en '${issue.screenPath}'. Siga los pasos del panel izquierdo para reproducir la validacion.`,
            imgW - 5,
          );
          doc.text(footDesc, imgX + 2.5, capFootY + 8.8);
        }
      }
    };

    drawSingleIssueBlock(firstIssue, 19);
    if (secondIssue) {
      drawSingleIssueBlock(secondIssue, 152);
    }
  }

  // Numerar todas las paginas
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(doc, p, totalPages);
  }

  return doc;
}

/**
 * Descarga o comparte el PDF del Manual de Pruebas Manuales (Issues #37 al #50)
 * tanto en navegador Web como en dispositivos moviles (Expo / APK Android).
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
      dialogTitle: "Manual de Pruebas Manuales - Issues #37 al #50 (PDF)",
      UTI: "com.adobe.pdf",
    });
  }
}
