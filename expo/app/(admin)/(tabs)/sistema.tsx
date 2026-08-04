/**
 * Sistema (administración): estado del entorno en vivo, interruptor de modo
 * mantenimiento (con mensaje editable e ilustración) e interruptor de modo
 * producción (activa los datos de producción y oculta las cuentas demo del
 * login). Todo se aplica en el servidor y llega a todos los teléfonos en
 * segundos, en tiempo real.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { gfonts, gwarm, warmPlum } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { ApiError } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { tiempoRelativo } from "@/lib/format";
import { useApp } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { useToast } from "@/components/Toast";

const accent = warmPlum;

export default function SistemaScreen(): React.ReactElement {
  const { systemConfig, adminSetConfig, adminReset, online } = useApp();
  const { show } = useToast();
  const [busy, setBusy] = useState<"mantenimiento" | "entorno" | "mensaje" | "demo" | null>(null);
  const [messageDraft, setMessageDraft] = useState<string>(
    systemConfig?.maintenanceMessage ?? "",
  );
  const [messageDirty, setMessageDirty] = useState<boolean>(false);

  const maintenance = systemConfig?.maintenance === true;
  const isProduction = systemConfig?.environment === "produccion";

  // El mensaje del servidor rellena el borrador mientras no se esté editando.
  useEffect(() => {
    if (!messageDirty && systemConfig?.maintenanceMessage !== undefined) {
      setMessageDraft(systemConfig.maintenanceMessage);
    }
  }, [systemConfig?.maintenanceMessage, messageDirty]);

  const messageChanged = useMemo(
    () =>
      messageDirty &&
      messageDraft.trim().length > 0 &&
      messageDraft.trim() !== (systemConfig?.maintenanceMessage ?? "").trim(),
    [messageDirty, messageDraft, systemConfig?.maintenanceMessage],
  );

  const errorText = (e: unknown): string =>
    e instanceof ApiError && e.status === 0
      ? "Sin conexión con el servidor."
      : e instanceof Error
        ? e.message
        : "Error desconocido";

  const requireOnline = useCallback((): boolean => {
    if (!online) {
      show("Necesitas conexión para cambiar el sistema", "error");
      return false;
    }
    return true;
  }, [online, show]);

  const toggleMaintenance = useCallback(
    async (value: boolean) => {
      if (!requireOnline()) return;
      const ok = await confirmAction({
        title: value ? "Activar mantenimiento" : "Desactivar mantenimiento",
        message: value
          ? "Gestantes y obstetras verán la pantalla de mantenimiento en tiempo real y no podrán usar la app hasta que lo desactives. Administración sigue entrando con normalidad."
          : "Todos los teléfonos volverán a funcionar con normalidad en segundos.",
        confirmText: value ? "Activar" : "Desactivar",
        destructive: value,
      });
      if (!ok) return;
      setBusy("mantenimiento");
      try {
        await adminSetConfig({ maintenance: value });
        show(
          value
            ? "Mantenimiento activado: la app quedó en pausa para todos"
            : "Mantenimiento desactivado: todo volvió a la normalidad",
          value ? "info" : "success",
        );
      } catch (e) {
        show(`No se pudo cambiar: ${errorText(e)}`, "error");
      } finally {
        setBusy(null);
      }
    },
    [adminSetConfig, requireOnline, show],
  );

  const saveMessage = useCallback(async () => {
    if (!requireOnline()) return;
    setBusy("mensaje");
    try {
      await adminSetConfig({ maintenanceMessage: messageDraft.trim() });
      setMessageDirty(false);
      show("Mensaje de mantenimiento guardado", "success");
    } catch (e) {
      show(`No se pudo guardar: ${errorText(e)}`, "error");
    } finally {
      setBusy(null);
    }
  }, [adminSetConfig, messageDraft, requireOnline, show]);

  const toggleEnvironment = useCallback(
    async (toProduction: boolean) => {
      if (!requireOnline()) return;
      const ok = await confirmAction({
        title: toProduction ? "Pasar a producción" : "Volver a demostración",
        message: toProduction
          ? "Se borrarán TODOS los datos de demostración (pacientes, citas, mensajes y alertas). Solo quedarán las cuentas de administración, y las cuentas de prueba desaparecerán del inicio de sesión en tiempo real. Desde ahí registras al personal y gestantes reales."
          : "Volverás al entorno de demostración con pacientes y citas de ejemplo. Los datos creados en producción se perderán y las cuentas de prueba volverán al inicio de sesión.",
        confirmText: toProduction ? "Pasar a producción" : "Volver a demo",
        destructive: true,
      });
      if (!ok) return;
      setBusy("entorno");
      try {
        await adminSetConfig({ environment: toProduction ? "produccion" : "demo" });
        show(
          toProduction
            ? "Modo producción activado: plataforma limpia y lista para uso real"
            : "Entorno de demostración restaurado",
          "success",
        );
      } catch (e) {
        show(`No se pudo cambiar el entorno: ${errorText(e)}`, "error");
      } finally {
        setBusy(null);
      }
    },
    [adminSetConfig, requireOnline, show],
  );

  const restoreDemo = useCallback(async () => {
    if (!requireOnline()) return;
    const ok = await confirmAction({
      title: "Restaurar demostración",
      message:
        "Se borrarán los cambios y el servidor volverá a los datos de ejemplo (pacientes, citas, alertas y mensajes).",
      confirmText: "Restaurar",
      destructive: true,
    });
    if (!ok) return;
    setBusy("demo");
    try {
      await adminReset();
      show("Datos de demostración restaurados", "success");
    } catch (e) {
      show(`No se pudo restaurar: ${errorText(e)}`, "error");
    } finally {
      setBusy(null);
    }
  }, [adminReset, requireOnline, show]);

  if (!systemConfig) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Sistema" subtitle="Mantenimiento y entorno de la plataforma" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PopIn>
          <Card style={[styles.statusCard, maintenance && styles.statusCardMaintenance]}>
            <Illustration
              source={maintenance ? ILU.mantenimiento : isProduction ? ILU.produccion : ILU.centroSalud}
              width={92}
              height={92}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {maintenance ? "En mantenimiento" : "Funcionando con normalidad"}
              </Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.envBadge,
                    { backgroundColor: isProduction ? gwarm.tealSoft : accent.soft },
                  ]}
                >
                  <View
                    style={[
                      styles.envDot,
                      { backgroundColor: isProduction ? gwarm.teal : accent.main },
                    ]}
                  />
                  <Text
                    style={[
                      styles.envBadgeText,
                      { color: isProduction ? gwarm.tealDeep : accent.deep },
                    ]}
                  >
                    {isProduction ? "Producción" : "Demostración"}
                  </Text>
                </View>
              </View>
              <Text style={styles.statusMeta}>
                Último cambio {tiempoRelativo(systemConfig.updatedAtISO)} · se aplica en tiempo
                real
              </Text>
            </View>
          </Card>
        </PopIn>

        <PopIn delay={60}>
          <SectionHeader title="Modo mantenimiento" />
          <Card style={styles.card}>
            <View style={styles.switchRow}>
              <View style={[styles.iluCircle, { backgroundColor: gwarm.amberSoft }]}>
                <Illustration source={ILU.mantenimiento} width={38} height={38} />
              </View>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>Poner en mantenimiento</Text>
                <Text style={styles.switchText}>
                  Pausa la app de gestantes y obstetras con un aviso bonito e ilustrado.
                </Text>
              </View>
              <Switch
                value={maintenance}
                disabled={busy !== null}
                onValueChange={(v) => void toggleMaintenance(v)}
                trackColor={{ true: gwarm.amber, false: gwarm.borderStrong }}
                thumbColor="#FFFFFF"
                testID="switch-mantenimiento"
              />
            </View>
            <Field
              label="Mensaje que verán las usuarias"
              value={messageDraft}
              onChangeText={(t) => {
                setMessageDraft(t);
                setMessageDirty(true);
              }}
              placeholder="Estamos mejorando VitMaterna…"
              multiline
              accent={gwarm.amber}
              maxLength={240}
            />
            {messageChanged ? (
              <AppButton
                title="Guardar mensaje"
                onPress={() => void saveMessage()}
                color={gwarm.amber}
                variant="soft"
                small
                loading={busy === "mensaje"}
              />
            ) : null}
            <Text style={styles.note}>
              Sus cambios quedan guardados en cada teléfono y se envían solos al volver la app.
            </Text>
          </Card>
        </PopIn>

        <PopIn delay={120}>
          <SectionHeader title="Modo producción" />
          <Card style={styles.card}>
            <View style={styles.switchRow}>
              <View style={[styles.iluCircle, { backgroundColor: gwarm.tealSoft }]}>
                <Illustration source={ILU.produccion} width={38} height={38} />
              </View>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>Usar datos de producción</Text>
                <Text style={styles.switchText}>
                  Plataforma limpia para uso real: sin datos de ejemplo y sin cuentas de prueba
                  en el inicio de sesión.
                </Text>
              </View>
              <Switch
                value={isProduction}
                disabled={busy !== null}
                onValueChange={(v) => void toggleEnvironment(v)}
                trackColor={{ true: gwarm.teal, false: gwarm.borderStrong }}
                thumbColor="#FFFFFF"
                testID="switch-produccion"
              />
            </View>
            <Text style={styles.note}>
              {isProduction
                ? "Estás en producción: el login solo acepta cuentas reales creadas por administración."
                : "Estás en demostración: el login muestra los accesos de prueba de un toque."}
            </Text>
          </Card>
        </PopIn>

        {!isProduction ? (
          <PopIn delay={180}>
            <SectionHeader title="Demostración" />
            <Card style={styles.card}>
              <Text style={styles.note}>
                Vuelve a los datos de ejemplo del servidor: pacientes con distintos niveles de
                riesgo, citas, alertas, mensajes y visitas.
              </Text>
              <AppButton
                title="Restaurar datos de demostración"
                onPress={() => void restoreDemo()}
                color={accent.main}
                variant="soft"
                loading={busy === "demo"}
                testID="btn-reset-demo"
              />
            </Card>
          </PopIn>
        ) : null}

        <Text style={styles.footerNote}>
          Los cambios del sistema llegan a todos los teléfonos en segundos.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: gwarm.bg },
  flex: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 12,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  statusCardMaintenance: {
    borderColor: gwarm.amberMid,
    borderWidth: 1.5,
    backgroundColor: gwarm.amberSoft,
  },
  statusInfo: { flex: 1, minWidth: 0, gap: 5 },
  statusTitle: {
    fontFamily: gfonts.hand,
    fontSize: 23,
    lineHeight: 29,
    color: gwarm.ink,
  },
  badgeRow: { flexDirection: "row" },
  envBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  envDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  envBadgeText: {
    fontFamily: gfonts.hand,
    fontSize: 14.5,
    lineHeight: 18,
  },
  statusMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkSoft,
  },
  card: { gap: 12 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iluCircle: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  switchInfo: { flex: 1, minWidth: 0, gap: 1 },
  switchTitle: {
    fontFamily: gfonts.hand,
    fontSize: 18.5,
    lineHeight: 24,
    color: gwarm.ink,
  },
  switchText: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 18,
    color: gwarm.inkSoft,
  },
  note: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  footerNote: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
    textAlign: "center",
    marginTop: 8,
  },
});
