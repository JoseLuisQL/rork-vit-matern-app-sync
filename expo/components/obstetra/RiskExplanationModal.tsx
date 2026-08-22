/**
 * Modal Educativo y de Desglose Clínico de Riesgo Obstétrico — VitMaterna.
 * Explica con transparencia cómo y por qué se calculó el nivel de riesgo de la
 * gestante, detallando el puntaje acumulado de cada factor según la Norma
 * Técnica de Salud del MINSA (Semáforo de Riesgo Obstétrico).
 */
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  Scale,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react-native";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { gfonts, gwarm, risk, warmPlum } from "@/constants/theme";
import { useResponsive } from "@/hooks/useResponsive";
import type { PatientView } from "@/types";
import { AppButton } from "@/components/AppButton";
import { PressableScale } from "@/components/PressableScale";

interface RiskFactorBreakdown {
  label: string;
  value: string;
  points: number;
  isRisk: boolean;
  explanation: string;
}

interface RiskExplanationModalProps {
  visible: boolean;
  onClose: () => void;
  patient: PatientView | null;
}

export function RiskExplanationModal({
  visible,
  onClose,
  patient,
}: RiskExplanationModalProps): React.ReactElement | null {
  const { isDesktop, isTablet } = useResponsive();
  const isWide = isDesktop || isTablet;

  if (!visible || !patient) return null;

  const riskPalette = risk[patient.riskLevel];

  // Cálculo y desglose detallado de todos los factores clínicos
  const breakdown: RiskFactorBreakdown[] = [];

  // 1. Edad
  if (patient.age < 15 || patient.age > 40) {
    breakdown.push({
      label: "Edad materna",
      value: `${patient.age} años`,
      points: 3,
      isRisk: true,
      explanation: "Edad de alto riesgo (menor de 15 o mayor de 40 años)",
    });
  } else if (patient.age < 18 || patient.age > 35) {
    breakdown.push({
      label: "Edad materna",
      value: `${patient.age} años`,
      points: 2,
      isRisk: true,
      explanation: "Edad de riesgo (adolescente < 18 o gestante añosa > 35 años)",
    });
  } else {
    breakdown.push({
      label: "Edad materna",
      value: `${patient.age} años`,
      points: 0,
      isRisk: false,
      explanation: "Rango de edad reproductiva habitual (18 a 35 años)",
    });
  }

  // 2. Cesáreas previas
  if (patient.cesareas >= 2) {
    breakdown.push({
      label: "Cesáreas previas",
      value: `${patient.cesareas} cesáreas`,
      points: 3,
      isRisk: true,
      explanation: "Cicatriz uterina múltiple (2 o más cesáreas previas)",
    });
  } else if (patient.cesareas === 1) {
    breakdown.push({
      label: "Cesáreas previas",
      value: "1 cesárea",
      points: 1,
      isRisk: true,
      explanation: "Cicatriz uterina previa (1 cesárea)",
    });
  } else {
    breakdown.push({
      label: "Cesáreas previas",
      value: "0 cesáreas",
      points: 0,
      isRisk: false,
      explanation: "Sin antecedentes de cirugías uterinas o cesáreas",
    });
  }

  // 3. Paridad / Gestaciones
  if (patient.gestas > 5) {
    breakdown.push({
      label: "Fórmula obstétrica",
      value: `G${patient.gestas} (Gran multigesta)`,
      points: 2,
      isRisk: true,
      explanation: "Gran multiparidad (más de 5 embarazos previos)",
    });
  } else if (patient.gestas === 1) {
    breakdown.push({
      label: "Fórmula obstétrica",
      value: "G1 (Primigesta)",
      points: 0,
      isRisk: false,
      explanation: "Primer embarazo",
    });
  } else {
    breakdown.push({
      label: "Fórmula obstétrica",
      value: `G${patient.gestas} (Multigesta)`,
      points: 0,
      isRisk: false,
      explanation: "Paridad habitual (entre 2 y 5 gestaciones)",
    });
  }

  // 4. Presión Arterial
  if (patient.bpSys >= 160 || patient.bpDia >= 110) {
    breakdown.push({
      label: "Presión arterial",
      value: `${patient.bpSys}/${patient.bpDia} mmHg`,
      points: 4,
      isRisk: true,
      explanation: "Crisis hipertensiva severa (PAS ≥ 160 o PAD ≥ 110)",
    });
  } else if (patient.bpSys >= 140 || patient.bpDia >= 90) {
    breakdown.push({
      label: "Presión arterial",
      value: `${patient.bpSys}/${patient.bpDia} mmHg`,
      points: 3,
      isRisk: true,
      explanation: "Hipertensión gestacional / sospecha de preeclampsia (PAS ≥ 140 o PAD ≥ 90)",
    });
  } else {
    breakdown.push({
      label: "Presión arterial",
      value: `${patient.bpSys}/${patient.bpDia} mmHg`,
      points: 0,
      isRisk: false,
      explanation: "Normotensa (< 140/90 mmHg)",
    });
  }

  // 5. Hemoglobina y Anemia
  if (patient.anemia === "severa") {
    breakdown.push({
      label: "Hemoglobina corregida",
      value: `${patient.hbCorrected} g/dL (Severa)`,
      points: 4,
      isRisk: true,
      explanation: "Anemia severa corregida por altitud (< 7.0 g/dL)",
    });
  } else if (patient.anemia === "moderada") {
    breakdown.push({
      label: "Hemoglobina corregida",
      value: `${patient.hbCorrected} g/dL (Moderada)`,
      points: 2,
      isRisk: true,
      explanation: "Anemia moderada corregida por altitud (7.0 - 9.9 g/dL)",
    });
  } else if (patient.anemia === "leve") {
    breakdown.push({
      label: "Hemoglobina corregida",
      value: `${patient.hbCorrected} g/dL (Leve)`,
      points: 1,
      isRisk: true,
      explanation: "Anemia leve corregida por altitud (10.0 - 10.9 g/dL)",
    });
  } else {
    breakdown.push({
      label: "Hemoglobina corregida",
      value: `${patient.hbCorrected} g/dL (Normal)`,
      points: 0,
      isRisk: false,
      explanation: "Sin anemia (≥ 11.0 g/dL corregida a 2,926 msnm)",
    });
  }

  // 6. Estado Nutricional (IMC)
  if (patient.imc >= 35) {
    breakdown.push({
      label: "Estado nutricional",
      value: `IMC ${patient.imc} (Obesidad II)`,
      points: 3,
      isRisk: true,
      explanation: "Obesidad mórbida o grado II (IMC ≥ 35)",
    });
  } else if (patient.imc >= 30) {
    breakdown.push({
      label: "Estado nutricional",
      value: `IMC ${patient.imc} (Obesidad)`,
      points: 2,
      isRisk: true,
      explanation: "Obesidad pregestacional / gestacional (IMC ≥ 30)",
    });
  } else if (patient.imc < 18.5) {
    breakdown.push({
      label: "Estado nutricional",
      value: `IMC ${patient.imc} (Bajo peso)`,
      points: 2,
      isRisk: true,
      explanation: "Bajo peso materno (IMC < 18.5)",
    });
  } else {
    breakdown.push({
      label: "Estado nutricional",
      value: `IMC ${patient.imc} (Normal)`,
      points: 0,
      isRisk: false,
      explanation: "Peso dentro de los parámetros esperados (18.5 - 29.9)",
    });
  }

  // 7. Antecedentes obstétricos especiales
  if (patient.abortos >= 3) {
    breakdown.push({
      label: "Pérdidas previas",
      value: `${patient.abortos} abortos`,
      points: 3,
      isRisk: true,
      explanation: "Aborto habitual o recurrente (3 o más pérdidas)",
    });
  }
  if (patient.obitoFetal) {
    breakdown.push({
      label: "Muerte fetal",
      value: "Óbito fetal previo",
      points: 3,
      isRisk: true,
      explanation: "Antecedente de óbito o muerte intrauterina en gestación previa",
    });
  }
  if (patient.rhSensibilizado) {
    breakdown.push({
      label: "Factor Rh",
      value: "Rh Sensibilizado",
      points: 3,
      isRisk: true,
      explanation: "Incompatibilidad Rh con anticuerpos maternos positivos",
    });
  }

  // 8. Antecedentes patológicos adicionales
  patient.antecedentes.forEach((ant) => {
    breakdown.push({
      label: "Comorbilidad / Antecedente",
      value: ant,
      points: 3,
      isRisk: true,
      explanation: `Patología médica o antecedente de riesgo registrado: ${ant}`,
    });
  });

  const activeRiskFactors = breakdown.filter((b) => b.isRisk);
  const normalFactors = breakdown.filter((b) => !b.isRisk);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, isWide && styles.modalCardWide]}>
          {/* Cabecera */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <HelpCircle size={20} color={warmPlum.main} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Evaluación del Riesgo Obstétrico</Text>
                <Text style={styles.headerSubtitle}>
                  Norma Técnica de Salud MINSA · Semáforo de Riesgo
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Cerrar ventana"
              style={styles.closeBtn}
            >
              <X size={18} color={gwarm.inkFaint} />
            </Pressable>
          </View>

          {/* Cuerpo con desplazamiento */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Tarjeta Resumen del Paciente */}
            <View
              style={[
                styles.summaryCard,
                { borderLeftColor: riskPalette.solid, backgroundColor: riskPalette.light },
              ]}
            >
              <View style={styles.summaryTop}>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>
                    {patient.firstName} {patient.lastName}
                  </Text>
                  <Text style={styles.patientDni}>
                    DNI: {patient.dni} · {patient.age} años · {patient.weeks} semanas
                  </Text>
                </View>
                <View
                  style={[
                    styles.scorePill,
                    { backgroundColor: riskPalette.solid },
                  ]}
                >
                  <Text style={styles.scorePillText}>
                    {patient.riskScore} {patient.riskScore === 1 ? "punto" : "puntos"}
                  </Text>
                </View>
              </View>

              <View style={styles.levelStatusRow}>
                <ShieldAlert size={16} color={riskPalette.solid} />
                <Text style={[styles.levelStatusText, { color: riskPalette.solid }]}>
                  Clasificación:{" "}
                  {patient.riskLevel === "rojo"
                    ? "ALTO RIESGO (Puntaje ≥ 4)"
                    : patient.riskLevel === "amarillo"
                    ? "RIESGO MEDIO (Puntaje 2 - 3)"
                    : "BAJO RIESGO (Puntaje 0 - 1)"}
                </Text>
              </View>
            </View>

            {/* Factores que suman riesgo en esta gestante */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <AlertTriangle size={16} color={riskPalette.solid} />
                <Text style={styles.sectionHeading}>
                  Factores identificados en esta gestante ({activeRiskFactors.length})
                </Text>
              </View>

              {activeRiskFactors.length === 0 ? (
                <View style={styles.emptyRiskBox}>
                  <ShieldCheck size={20} color={gwarm.teal} />
                  <Text style={styles.emptyRiskText}>
                    No se identificaron factores de riesgo críticos. Gestación clasificada como Bajo Riesgo (Verde).
                  </Text>
                </View>
              ) : (
                activeRiskFactors.map((item, idx) => (
                  <View key={idx} style={styles.riskItemCard}>
                    <View style={styles.itemTop}>
                      <View style={styles.itemLabelWrap}>
                        <View style={[styles.dotAlert, { backgroundColor: riskPalette.solid }]} />
                        <Text style={styles.itemTitle}>{item.label}:</Text>
                        <Text style={styles.itemVal}>{item.value}</Text>
                      </View>
                      <View style={[styles.pointsBadge, { backgroundColor: riskPalette.light, borderColor: riskPalette.mid }]}>
                        <Text style={[styles.pointsText, { color: riskPalette.solid }]}>
                          +{item.points} {item.points === 1 ? "pto" : "pts"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemExplanation}>{item.explanation}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Parámetros normales evaluados */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <CheckCircle2 size={16} color={gwarm.teal} />
                <Text style={styles.sectionHeading}>
                  Parámetros evaluados dentro del rango normal ({normalFactors.length})
                </Text>
              </View>

              <View style={styles.normalGrid}>
                {normalFactors.map((item, idx) => (
                  <View key={idx} style={styles.normalCard}>
                    <View style={styles.normalTop}>
                      <Text style={styles.normalLabel}>{item.label}</Text>
                      <Text style={styles.normalPts}>0 pts</Text>
                    </View>
                    <Text style={styles.normalVal}>{item.value}</Text>
                    <Text style={styles.normalExp}>{item.explanation}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Criterios del Semáforo MINSA */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Scale size={16} color={warmPlum.main} />
                <Text style={styles.sectionHeading}>
                  ¿Cómo funciona el Semáforo de Riesgo (MINSA)?
                </Text>
              </View>

              <View style={styles.rulesCard}>
                <View style={[styles.ruleRow, { borderLeftColor: gwarm.teal }]}>
                  <View style={styles.ruleHeader}>
                    <View style={[styles.ruleDot, { backgroundColor: gwarm.teal }]} />
                    <Text style={[styles.ruleName, { color: gwarm.tealDeep }]}>
                      Bajo Riesgo (Verde) · 0 a 1 punto
                    </Text>
                  </View>
                  <Text style={styles.ruleDesc}>
                    Gestante sin comorbilidades ni factores de alarma. Atención prenatal integral en el Centro de Salud Talavera (I-4).
                  </Text>
                </View>

                <View style={[styles.ruleRow, { borderLeftColor: gwarm.amber }]}>
                  <View style={styles.ruleHeader}>
                    <View style={[styles.ruleDot, { backgroundColor: gwarm.amber }]} />
                    <Text style={[styles.ruleName, { color: gwarm.amber }]}>
                      Riesgo Medio (Amarillo) · 2 a 3 puntos
                    </Text>
                  </View>
                  <Text style={styles.ruleDesc}>
                    Presencia de factores sociodemográficos, edad límite o anemia leve/moderada. Requiere vigilancia activa y controles más frecuentes.
                  </Text>
                </View>

                <View style={[styles.ruleRow, { borderLeftColor: gwarm.rose }]}>
                  <View style={styles.ruleHeader}>
                    <View style={[styles.ruleDot, { backgroundColor: gwarm.rose }]} />
                    <Text style={[styles.ruleName, { color: gwarm.rose }]}>
                      Alto Riesgo (Rojo) · 4 o más puntos
                    </Text>
                  </View>
                  <Text style={styles.ruleDesc}>
                    Acumulación de antecedentes críticos, patologías activas o cicatrices uterinas múltiples. Requiere atención prioritaria y eventual referencia hospitalaria.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Pie de modal */}
          <View style={styles.footer}>
            <AppButton
              title="Entendido"
              color={warmPlum.main}
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(45, 36, 30, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6px)",
      },
    }),
  },
  modalCard: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: gwarm.bg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    ...Platform.select({
      web: {
        boxShadow: "0 25px 50px -12px rgba(45, 36, 30, 0.35)",
      },
      default: {
        elevation: 12,
      },
    }),
  },
  modalCardWide: {
    maxWidth: 640,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: warmPlum.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: gfonts.hand,
    fontSize: 18,
    lineHeight: 22,
    color: gwarm.ink,
  },
  headerSubtitle: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    color: gwarm.inkSoft,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: gwarm.surface,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: gwarm.border,
    borderLeftWidth: 4.5,
    gap: 10,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  patientInfo: {
    flex: 1,
    gap: 2,
  },
  patientName: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    color: gwarm.ink,
  },
  patientDni: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    color: gwarm.inkSoft,
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  scorePillText: {
    fontFamily: gfonts.hand,
    fontSize: 12.5,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  levelStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  levelStatusText: {
    fontFamily: gfonts.hand,
    fontSize: 14,
    fontWeight: "700",
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeading: {
    fontFamily: gfonts.hand,
    fontSize: 15.5,
    color: gwarm.ink,
  },
  emptyRiskBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: gwarm.tealSoft,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gwarm.tealMid,
  },
  emptyRiskText: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    color: gwarm.tealDeep,
    flex: 1,
  },
  riskItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: gwarm.border,
    gap: 4,
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  dotAlert: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemTitle: {
    fontFamily: gfonts.hand,
    fontSize: 14,
    color: gwarm.ink,
  },
  itemVal: {
    fontFamily: gfonts.hand,
    fontSize: 14,
    color: gwarm.inkSoft,
    fontWeight: "700",
  },
  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  pointsText: {
    fontFamily: gfonts.hand,
    fontSize: 12,
    fontWeight: "700",
  },
  itemExplanation: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    color: gwarm.inkSoft,
    paddingLeft: 14,
  },
  normalGrid: {
    gap: 8,
  },
  normalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: gwarm.border,
    gap: 2,
  },
  normalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  normalLabel: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    color: gwarm.ink,
  },
  normalPts: {
    fontFamily: gfonts.hand,
    fontSize: 11.5,
    color: gwarm.teal,
    fontWeight: "700",
  },
  normalVal: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    color: gwarm.tealDeep,
    fontWeight: "600",
  },
  normalExp: {
    fontFamily: gfonts.handBody,
    fontSize: 11,
    color: gwarm.inkFaint,
  },
  rulesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: gwarm.border,
    gap: 10,
  },
  ruleRow: {
    borderLeftWidth: 3.5,
    paddingLeft: 10,
    gap: 2,
  },
  ruleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ruleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ruleName: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    fontWeight: "700",
  },
  ruleDesc: {
    fontFamily: gfonts.handBody,
    fontSize: 12,
    color: gwarm.inkSoft,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
  },
});
