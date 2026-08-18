import { describe, expect, it } from "bun:test";
import {
  templateAlarmAlert,
  templateAppointmentReminder,
  templateAppointmentRescheduled,
  templateAppointmentScheduled,
  templateChatFallback,
  templateSosAlert,
  templateSupplementAssigned,
  templateSupplementReminder,
  templateTestMessage,
} from "./templates";

describe("WhatsApp Templates — Message Construction", () => {
  it("builds appointment scheduled message with warm Andean tone", () => {
    const msg = templateAppointmentScheduled({
      patientName: "María",
      dateStr: "Miércoles, 20 de agosto de 2026",
      time: "09:00 AM",
      reason: "Control prenatal 2 de 8",
      location: "C.S. Talavera",
      obstetricianName: "Obst. Carmen Rojas",
    });

    expect(msg).toContain("María");
    expect(msg).toContain("Control prenatal 2 de 8");
    expect(msg).toContain("09:00 AM");
    expect(msg).toContain("C.S. Talavera");
    expect(msg).toContain("Carmen Rojas");
    expect(msg).toContain("VitMaterna");
  });

  it("builds appointment rescheduled message", () => {
    const msg = templateAppointmentRescheduled({
      patientName: "Rosa",
      dateStr: "Jueves, 21 de agosto de 2026",
      time: "10:30 AM",
      reason: "Consulta médica",
      location: "C.S. Talavera",
    });

    expect(msg).toContain("Rosa");
    expect(msg).toContain("reprogramada");
    expect(msg).toContain("Jueves, 21 de agosto de 2026");
  });

  it("builds supplement assigned message", () => {
    const msg = templateSupplementAssigned({
      patientName: "Lucía",
      supplementName: "Sulfato Ferroso + Ácido Fólico",
      dose: "1 tableta",
      schedule: "En las mañanas con jugo de naranja",
      timesPerDay: 1,
    });

    expect(msg).toContain("Lucía");
    expect(msg).toContain("Sulfato Ferroso + Ácido Fólico");
    expect(msg).toContain("1 tableta");
    expect(msg).toContain("1 vez al día");
    expect(msg).toContain("jugo de naranja");
  });

  it("builds appointment reminder for tomorrow vs in a few hours", () => {
    const msg24h = templateAppointmentReminder({
      patientName: "Ana",
      dateStr: "Mañana",
      time: "09:00 AM",
      reason: "Control prenatal 4 de 8",
      location: "C.S. Talavera",
      hoursNotice: 24,
    });
    expect(msg24h).toContain("Recordatorio de Control Prenatal para Mañana");

    const msg2h = templateAppointmentReminder({
      patientName: "Ana",
      dateStr: "Hoy",
      time: "09:00 AM",
      reason: "Control prenatal 4 de 8",
      location: "C.S. Talavera",
      hoursNotice: 2,
    });
    expect(msg2h).toContain("próximas horas");
  });

  it("builds daily supplement reminder message", () => {
    const msg = templateSupplementReminder({
      patientName: "Carmen",
      supplementsList: "• Sulfato Ferroso (1 tableta)",
    });

    expect(msg).toContain("Carmen");
    expect(msg).toContain("Sulfato Ferroso");
    expect(msg).toContain("Pastillas");
  });

  it("builds offline chat fallback message", () => {
    const msg = templateChatFallback({
      senderName: "Obst. Carmen Rojas",
      patientName: "María",
      text: "Hola María, no olvides traer tus resultados de laboratorio.",
    });

    expect(msg).toContain("Obst. Carmen Rojas");
    expect(msg).toContain("María");
    expect(msg).toContain("no olvides traer tus resultados");
  });

  it("builds emergency SOS alert message with GPS map link", () => {
    const msg = templateSosAlert({
      patientName: "Rosa Huamán",
      patientDni: "71234567",
      phone: "987654321",
      community: "Talavera",
      gestationalWeeks: 34,
      riskLevel: "rojo",
      lat: -13.6543,
      lng: -73.3512,
    });

    expect(msg).toContain("ALERTA DE EMERGENCIA SOS");
    expect(msg).toContain("Rosa Huamán");
    expect(msg).toContain("71234567");
    expect(msg).toContain("34 semanas");
    expect(msg).toContain("ROJO");
    expect(msg).toContain("https://maps.google.com/?q=-13.6543,-73.3512");
  });

  it("builds warning signs alarm alert message", () => {
    const msg = templateAlarmAlert({
      patientName: "Elena Condori",
      patientDni: "70987654",
      phone: "983111222",
      community: "Huaracco",
      signsText: "Cefalea intensa, visión borrosa",
      note: "Dolor fuerte de cabeza desde ayer",
    });

    expect(msg).toContain("REPORTE DE SIGNOS DE ALARMA");
    expect(msg).toContain("Elena Condori");
    expect(msg).toContain("Cefalea intensa, visión borrosa");
    expect(msg).toContain("Dolor fuerte de cabeza");
  });

  it("builds admin test message", () => {
    const msg = templateTestMessage({
      adminName: "Dr. Admin",
      timestamp: "17/08/2026 10:30:00",
    });

    expect(msg).toContain("Mensaje de Prueba");
    expect(msg).toContain("Dr. Admin");
    expect(msg).toContain("openwa.qware.me");
  });
});
