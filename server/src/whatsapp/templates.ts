/**
 * VITMATERNA — Plantillas de mensajes clínicos y notificaciones de WhatsApp.
 * Diseñadas con tono cálido, claro y empático, con formato enriquecido.
 */

export function templateAppointmentScheduled(params: {
  patientName: string;
  dateStr: string;
  time: string;
  reason: string;
  location: string;
  obstetricianName?: string;
}): string {
  const obstetraLine = params.obstetricianName
    ? `👩‍⚕️ *Obstetra a cargo:* ${params.obstetricianName}\n`
    : "";

  return (
    `🌸 *VitMaterna · Cita de Control Prenatal* 🌸\n\n` +
    `Hola *${params.patientName}*, tienes una cita programada:\n\n` +
    `📅 *Fecha:* ${params.dateStr}\n` +
    `⏰ *Hora:* ${params.time}\n` +
    `🏥 *Lugar:* ${params.location}\n` +
    `📋 *Motivo:* ${params.reason}\n` +
    obstetraLine +
    `\n💡 *Recuerda:* Asistir puntualmente a tus controles protege tu salud y la de tu bebé. Lleva tu carné de control perinatal.\n\n` +
    `_Mensaje automático de VitMaterna._`
  );
}

export function templateAppointmentRescheduled(params: {
  patientName: string;
  dateStr: string;
  time: string;
  reason: string;
  location: string;
}): string {
  return (
    `🔄 *VitMaterna · Cambio de Cita* 🔄\n\n` +
    `Hola *${params.patientName}*, te informamos que tu cita ha sido reprogramada:\n\n` +
    `📅 *Nueva Fecha:* ${params.dateStr}\n` +
    `⏰ *Nueva Hora:* ${params.time}\n` +
    `🏥 *Lugar:* ${params.location}\n` +
    `📋 *Motivo:* ${params.reason}\n\n` +
    `_Te esperamos puntualmente. Tu salud y la de tu bebé son primero._ 👶✨`
  );
}

export function templateSupplementAssigned(params: {
  patientName: string;
  supplementName: string;
  dose: string;
  schedule: string;
  timesPerDay: number;
}): string {
  const timesText =
    params.timesPerDay === 1
      ? "1 vez al día"
      : `${params.timesPerDay} veces al día`;

  const scheduleText = params.schedule
    ? `\n⏰ *Horario sugerido:* ${params.schedule}`
    : "";

  return (
    `💊 *VitMaterna · Nueva Indicación de Medicamentos* 💊\n\n` +
    `Hola *${params.patientName}*, tu obstetra te ha asignado un nuevo medicamento:\n\n` +
    `🔹 *Medicamento:* ${params.supplementName}\n` +
    `🔹 *Dosis:* ${params.dose}\n` +
    `🔹 *Frecuencia:* ${timesText}` +
    scheduleText +
    `\n\n📝 *Importante:* Recuerda tomar tu suplemento y registrar tu toma diaria en la aplicación VitMaterna para prevenir la anemia y mantener sano a tu bebé. 🥑🍊\n\n` +
    `_Mensaje emitido por el personal de salud de VitMaterna._`
  );
}

export function templateAppointmentReminder(params: {
  patientName: string;
  dateStr: string;
  time: string;
  reason: string;
  location: string;
  hoursNotice?: number;
}): string {
  const headerNotice =
    params.hoursNotice && params.hoursNotice <= 2
      ? `⏰ *¡Tu control prenatal es en las próximas horas!* ⏰`
      : `⏰ *Recordatorio de Control Prenatal para Mañana* ⏰`;

  return (
    `${headerNotice}\n\n` +
    `Hola *${params.patientName}*, te recordamos tu cita de control prenatal:\n\n` +
    `📅 *Fecha:* ${params.dateStr}\n` +
    `⏰ *Hora:* ${params.time}\n` +
    `🏥 *Lugar:* ${params.location}\n` +
    `📋 *Motivo:* ${params.reason}\n\n` +
    `👶 _No faltes a tu cita. Tu bebé y tú están en buenas manos._\n` +
    `_Si tienes algún inconveniente, avísale a tu obstetra por VitMaterna._`
  );
}

export function templateSupplementReminder(params: {
  patientName: string;
  supplementsList: string;
}): string {
  return (
    `💊 *VitMaterna · Recordatorio de Medicamentos de Hoy* 💊\n\n` +
    `Hola *${params.patientName}*, ¿ya tomaste tus suplementos de hoy?\n\n` +
    `📋 *Medicamentos indicados:*\n${params.supplementsList}\n\n` +
    `💡 *Consejo:* Tómalo con agua o jugo de frutas cítricas (naranja, camu camu) para una mejor absorción de hierro. Evita tomarlo con té, café o leche.\n\n` +
    `📲 _Abre tu app VitMaterna y marca tu pastilla en la pestaña Pastillas._ 🌟`
  );
}

export function templateChatFallback(params: {
  senderName: string;
  patientName: string;
  text: string;
}): string {
  return (
    `💬 *Mensaje de tu Obstetra (${params.senderName})* 💬\n\n` +
    `Hola *${params.patientName}*, te enviaron un mensaje por VitMaterna:\n\n` +
    `"${params.text}"\n\n` +
    `_Puedes responder ingresando a la app VitMaterna._`
  );
}

export function templateSosAlert(params: {
  patientName: string;
  patientDni: string;
  phone?: string;
  community: string;
  gestationalWeeks?: number;
  riskLevel?: string;
  lat?: number | null;
  lng?: number | null;
}): string {
  const weeksStr = params.gestationalWeeks
    ? `🤰 *Edad Gestacional:* ${params.gestationalWeeks} semanas\n`
    : "";
  const phoneStr = params.phone
    ? `📞 *Teléfono:* ${params.phone}\n`
    : "";
  const riskStr = params.riskLevel
    ? `⚠️ *Nivel de Riesgo:* ${params.riskLevel.toUpperCase()}\n`
    : "";

  const gpsLink =
    params.lat != null && params.lng != null
      ? `🗺️ *Ubicación GPS:* https://maps.google.com/?q=${params.lat},${params.lng}\n`
      : `🗺️ *Ubicación GPS:* No disponible en el momento del reporte.\n`;

  return (
    `🚨 *ALERTA DE EMERGENCIA SOS · VITMATERNA* 🚨\n\n` +
    `Se ha activado el *Botón de Emergencia SOS* de una gestante:\n\n` +
    `👤 *Paciente:* ${params.patientName} (DNI: ${params.patientDni})\n` +
    phoneStr +
    `📍 *Comunidad:* ${params.community}\n` +
    weeksStr +
    riskStr +
    `⚠️ *Situación:* Emergencia inmediata activada por la paciente.\n` +
    gpsLink +
    `\n🚨 *ACCIÓN REQUERIDA:* Comunicarse de inmediato con la paciente o activar el protocolo de traslado / brigada comunitaria.`
  );
}

export function templateAlarmAlert(params: {
  patientName: string;
  patientDni: string;
  phone?: string;
  community: string;
  signsText: string;
  note?: string;
  lat?: number | null;
  lng?: number | null;
}): string {
  const phoneStr = params.phone
    ? `📞 *Teléfono:* ${params.phone}\n`
    : "";
  const noteStr = params.note
    ? `📝 *Nota de la paciente:* ${params.note}\n`
    : "";

  const gpsLink =
    params.lat != null && params.lng != null
      ? `🗺️ *Ubicación GPS:* https://maps.google.com/?q=${params.lat},${params.lng}\n`
      : "";

  return (
    `⚠️ *REPORTE DE SIGNOS DE ALARMA · VITMATERNA* ⚠️\n\n` +
    `Una gestante ha reportado signos de alarma:\n\n` +
    `👤 *Paciente:* ${params.patientName} (DNI: ${params.patientDni})\n` +
    phoneStr +
    `📍 *Comunidad:* ${params.community}\n` +
    `🚩 *Signos reportados:* ${params.signsText}\n` +
    noteStr +
    gpsLink +
    `\n👉 *Revisar ficha en VitMaterna y ponerse en contacto con la paciente.*`
  );
}

export function templateTestMessage(params: {
  adminName: string;
  timestamp: string;
}): string {
  return (
    `🧪 *VitMaterna · Mensaje de Prueba de WhatsApp* 🧪\n\n` +
    `¡Hola! La integración con el servidor Open-WA (\`openwa.qware.me\`) está funcionando correctamente.\n\n` +
    `👤 *Enviado por:* Administrador(a) ${params.adminName}\n` +
    `⏰ *Fecha y hora:* ${params.timestamp}\n\n` +
    `_El sistema está listo para notificar citas, medicamentos, recordatorios y emergencias._ ✅`
  );
}
