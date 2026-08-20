/**
 * Sistema (administración): estado del entorno en vivo, interruptor de modo
 * mantenimiento (con mensaje editable e ilustración), interruptor de modo
 * producción y módulo integral de integración con WhatsApp vía Open-WA.
 * Adaptado con arquitectura responsiva Web (2 columnas en escritorio).
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Globe,
  Key,
  MessageSquare,
  Pill,
  RefreshCw,
  Send,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react-native";
import { gfonts, gwarm, warmPlum } from "@/constants/theme";
import { ILU } from "@/constants/illustrations";
import { useResponsive } from "@/hooks/useResponsive";
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
import { WebCol, WebRow } from "@/components/web/WebGrid";
import { WebContainer } from "@/components/web/WebContainer";
import type { WhatsAppConfig } from "@/types";

const accent = warmPlum;

export default function SistemaScreen(): React.ReactElement {
  const {
    systemConfig,
    whatsappConfig,
    adminSetConfig,
    adminSetWhatsAppConfig,
    adminTestWhatsAppConnection,
    adminSendTestWhatsApp,
    adminReset,
    online,
  } = useApp();

  const { show } = useToast();
  const { isDesktop, isTablet } = useResponsive();
  const isWide = isDesktop || isTablet;

  const [busy, setBusy] = useState<"mantenimiento" | "entorno" | "mensaje" | "demo" | "wa-config" | "wa-test" | "wa-send" | null>(null);
  const [messageDraft, setMessageDraft] = useState<string>(
    systemConfig?.maintenanceMessage ?? "",
  );
  const [messageDirty, setMessageDirty] = useState<boolean>(false);

  // ---------- Estado de WhatsApp ----------
  const [waServerUrl, setWaServerUrl] = useState<string>(
    whatsappConfig?.serverUrl ?? "https://openwa.qware.me",
  );
  const [waApiKey, setWaApiKey] = useState<string>(whatsappConfig?.apiKey ?? "");
  const [waSessionId, setWaSessionId] = useState<string>(whatsappConfig?.sessionId ?? "vitmaterna");
  const [waCredentialsDirty, setWaCredentialsDirty] = useState<boolean>(false);

  const [waTestPhone, setWaTestPhone] = useState<string>("");
  const [waStatusInfo, setWaStatusInfo] = useState<{
    tested: boolean;
    ok: boolean;
    status: string;
    serverUrl?: string;
    details?: string;
    error?: string;
    battery?: number | null;
  } | null>(null);

  const maintenance = systemConfig?.maintenance === true;
  const isProduction = systemConfig?.environment === "produccion";

  // El mensaje del servidor rellena el borrador mientras no se esté editando.
  useEffect(() => {
    if (!messageDirty && systemConfig?.maintenanceMessage !== undefined) {
      setMessageDraft(systemConfig.maintenanceMessage);
    }
  }, [systemConfig?.maintenanceMessage, messageDirty]);

  // Sincronizar credenciales de WhatsApp cuando llegan del snapshot
  useEffect(() => {
    if (!waCredentialsDirty && whatsappConfig) {
      setWaServerUrl(whatsappConfig.serverUrl || "https://openwa.qware.me");
      setWaApiKey(whatsappConfig.apiKey || "");
      setWaSessionId(whatsappConfig.sessionId || "vitmaterna");
    }
  }, [whatsappConfig, waCredentialsDirty]);

  const messageChanged = useMemo(
    () =>
      messageDirty &&
      messageDraft.trim().length > 0 &&
      messageDraft.trim() !== (systemConfig?.maintenanceMessage ?? "").trim(),
    [messageDirty, messageDraft, systemConfig?.maintenanceMessage],
  );

  const waCredentialsChanged = useMemo(
    () =>
      waCredentialsDirty &&
      (waServerUrl.trim() !== (whatsappConfig?.serverUrl ?? "").trim() ||
        waApiKey.trim() !== (whatsappConfig?.apiKey ?? "").trim() ||
        waSessionId.trim() !== (whatsappConfig?.sessionId ?? "").trim()),
    [waCredentialsDirty, waServerUrl, waApiKey, waSessionId, whatsappConfig],
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

  // ---------- Control de WhatsApp ----------

  const toggleWhatsAppMaster = useCallback(
    async (enabled: boolean) => {
      if (!requireOnline()) return;
      setBusy("wa-config");
      try {
        await adminSetWhatsAppConfig({ enabled });
        show(
          enabled
            ? "Integración con WhatsApp activada"
            : "Integración con WhatsApp pausada",
          enabled ? "success" : "info",
        );
      } catch (e) {
        show(`No se pudo actualizar WhatsApp: ${errorText(e)}`, "error");
      } finally {
        setBusy(null);
      }
    },
    [adminSetWhatsAppConfig, requireOnline, show],
  );

  const saveWhatsAppCredentials = useCallback(async () => {
    if (!requireOnline()) return;
    setBusy("wa-config");
    try {
      await adminSetWhatsAppConfig({
        serverUrl: waServerUrl.trim(),
        apiKey: waApiKey.trim(),
        sessionId: waSessionId.trim(),
      });
      setWaCredentialsDirty(false);
      show("Credenciales de Open-WA guardadas", "success");
    } catch (e) {
      show(`No se pudo guardar: ${errorText(e)}`, "error");
    } finally {
      setBusy(null);
    }
  }, [adminSetWhatsAppConfig, waServerUrl, waApiKey, waSessionId, requireOnline, show]);

  const toggleWhatsAppFeature = useCallback(
    async (key: keyof WhatsAppConfig, value: boolean) => {
      if (!requireOnline()) return;
      try {
        await adminSetWhatsAppConfig({ [key]: value });
        show("Ajuste de WhatsApp actualizado", "success");
      } catch (e) {
        show(`No se pudo guardar: ${errorText(e)}`, "error");
      }
    },
    [adminSetWhatsAppConfig, requireOnline, show],
  );

  const testConnection = useCallback(async () => {
    if (!requireOnline()) return;
    setBusy("wa-test");
    try {
      const res = await adminTestWhatsAppConnection({
        serverUrl: waServerUrl.trim(),
        apiKey: waApiKey.trim(),
        sessionId: waSessionId.trim(),
      });
      setWaStatusInfo({
        tested: true,
        ok: res.ok,
        status: res.status,
        details: res.details,
        error: res.error,
        battery: res.battery,
      });
      if (res.ok) {
        show("Conexión exitosa con el servidor Open-WA", "success");
      } else {
        show(res.error || "No se pudo conectar con Open-WA", "error");
      }
    } catch (e) {
      setWaStatusInfo({
        tested: true,
        ok: false,
        status: "error",
        error: errorText(e),
      });
      show(`Error al probar conexión: ${errorText(e)}`, "error");
    } finally {
      setBusy(null);
    }
  }, [adminTestWhatsAppConnection, waServerUrl, waApiKey, waSessionId, requireOnline, show]);

  const sendTestMessage = useCallback(async () => {
    if (!requireOnline()) return;
    const phone = waTestPhone.trim();
    if (!phone) {
      show("Escribe un número celular para la prueba", "info");
      return;
    }
    setBusy("wa-send");
    try {
      const res = await adminSendTestWhatsApp(phone);
      if (res.ok) {
        show(`Mensaje de prueba entregado a ${phone}`, "success");
      } else {
        show(`Error: ${res.error || "No se pudo enviar"}`, "error");
      }
    } catch (e) {
      show(`Fallo al enviar prueba: ${errorText(e)}`, "error");
    } finally {
      setBusy(null);
    }
  }, [adminSendTestWhatsApp, waTestPhone, requireOnline, show]);

  if (!systemConfig) {
    return <View style={styles.container} />;
  }

  const isWaEnabled = whatsappConfig?.enabled === true;

  const renderStatusBanner = () => (
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
  );

  const renderEnvironmentSection = () => (
    <View style={styles.colSection}>
      {/* Mantenimiento */}
      <PopIn delay={80}>
        <SectionHeader title="Modo mantenimiento" />
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={[styles.iluCircle, { backgroundColor: gwarm.amberSoft }]}>
              <Illustration source={ILU.mantenimiento} width={38} height={38} />
            </View>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Poner en mantenimiento</Text>
              <Text style={styles.switchText}>
                Pausa la app de gestantes y obstetras con un aviso ilustrado.
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

      {/* Modo Producción */}
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
                Plataforma limpia para uso real: sin datos de ejemplo y sin cuentas de prueba en el login.
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
        <PopIn delay={160}>
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
    </View>
  );

  const renderWhatsAppSection = () => (
    <View style={styles.colSection}>
      <PopIn delay={40}>
        <SectionHeader title="Notificaciones por WhatsApp (Open-WA)" />
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={[styles.iluCircle, { backgroundColor: "#DCF8C6" }]}>
              <MessageSquare size={26} color="#075E54" />
            </View>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Servicio de WhatsApp</Text>
              <Text style={styles.switchText}>
                Envía avisos de citas, recordatorios y alertas SOS directo al WhatsApp de usuarias.
              </Text>
            </View>
            <Switch
              value={isWaEnabled}
              disabled={busy !== null}
              onValueChange={(v) => void toggleWhatsAppMaster(v)}
              trackColor={{ true: "#25D366", false: gwarm.borderStrong }}
              thumbColor="#FFFFFF"
              testID="switch-whatsapp-master"
            />
          </View>

          {/* Credenciales y Servidor */}
          <View style={styles.configBox}>
            <Text style={styles.boxTitle}>Configuración del Servidor</Text>
            <Field
              label="URL del Servidor Open-WA"
              value={waServerUrl}
              onChangeText={(t) => {
                setWaServerUrl(t);
                setWaCredentialsDirty(true);
              }}
              placeholder="https://openwa.qware.me"
              autoCapitalize="none"
              accent="#075E54"
            />
            <Field
              label="API Key / Secret Token"
              value={waApiKey}
              onChangeText={(t) => {
                setWaApiKey(t);
                setWaCredentialsDirty(true);
              }}
              placeholder="Ingresa tu API Key de Open-WA"
              autoCapitalize="none"
              accent="#075E54"
              secureTextEntry
            />
            <Field
              label="ID de Sesión"
              value={waSessionId}
              onChangeText={(t) => {
                setWaSessionId(t);
                setWaCredentialsDirty(true);
              }}
              placeholder="vitmaterna"
              autoCapitalize="none"
              accent="#075E54"
            />

            {waCredentialsChanged ? (
              <AppButton
                title="Guardar credenciales"
                onPress={() => void saveWhatsAppCredentials()}
                color="#075E54"
                variant="solid"
                small
                loading={busy === "wa-config"}
              />
            ) : null}
          </View>

          {/* Diagnóstico de Conexión */}
          <View style={styles.diagBox}>
            <View style={styles.diagHeader}>
              <Text style={styles.diagTitle}>Estado de Conexión</Text>
              <TouchableOpacity
                style={styles.testBtn}
                onPress={() => void testConnection()}
                disabled={busy === "wa-test"}
              >
                <RefreshCw size={14} color="#075E54" />
                <Text style={styles.testBtnText}>
                  {busy === "wa-test" ? "Verificando…" : "Probar conexión"}
                </Text>
              </TouchableOpacity>
            </View>

            {waStatusInfo?.tested ? (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: waStatusInfo.ok
                      ? "#DCF8C6"
                      : waStatusInfo.status === "unconfigured"
                        ? gwarm.amberSoft
                        : "#FFEBEE",
                  },
                ]}
              >
                {waStatusInfo.ok ? (
                  <CheckCircle2 size={16} color="#075E54" />
                ) : (
                  <AlertTriangle size={16} color="#C62828" />
                )}
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: waStatusInfo.ok ? "#075E54" : "#C62828" },
                  ]}
                >
                  {waStatusInfo.ok
                    ? `Conectado a ${waStatusInfo.serverUrl ?? "Open-WA"} · ${waStatusInfo.details ?? "Sesión activa"}${
                        typeof waStatusInfo.battery === "number"
                          ? ` (${waStatusInfo.battery}% batería)`
                          : ""
                      }`
                    : waStatusInfo.error || "No se pudo conectar"}
                </Text>
              </View>
            ) : (
              <Text style={styles.diagHint}>
                Presiona &quot;Probar conexión&quot; para validar la sesión de WhatsApp en openwa.qware.me.
              </Text>
            )}
          </View>

          {/* Interruptores Granulares */}
          <View style={styles.featuresSection}>
            <Text style={styles.boxTitle}>Eventos de Notificación</Text>

            <View style={styles.subSwitchRow}>
              <Calendar size={18} color={gwarm.ink} />
              <View style={styles.subSwitchInfo}>
                <Text style={styles.subSwitchTitle}>Citas asignadas y cambios</Text>
                <Text style={styles.subSwitchText}>
                  Avisa a la gestante al programar o reprogramar un control.
                </Text>
              </View>
              <Switch
                value={whatsappConfig?.notifyAppointments !== false}
                disabled={!isWaEnabled || busy !== null}
                onValueChange={(v) => void toggleWhatsAppFeature("notifyAppointments", v)}
                trackColor={{ true: "#25D366", false: gwarm.borderStrong }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.subSwitchRow}>
              <Pill size={18} color={gwarm.ink} />
              <View style={styles.subSwitchInfo}>
                <Text style={styles.subSwitchTitle}>Medicamentos prescritos</Text>
                <Text style={styles.subSwitchText}>
                  Avisa a la gestante cuando la obstetra indica o cambia suplementos.
                </Text>
              </View>
              <Switch
                value={whatsappConfig?.notifySupplements !== false}
                disabled={!isWaEnabled || busy !== null}
                onValueChange={(v) => void toggleWhatsAppFeature("notifySupplements", v)}
                trackColor={{ true: "#25D366", false: gwarm.borderStrong }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.subSwitchRow}>
              <Bell size={18} color={gwarm.ink} />
              <View style={styles.subSwitchInfo}>
                <Text style={styles.subSwitchTitle}>Recordatorios de citas (24h / 2h)</Text>
                <Text style={styles.subSwitchText}>
                  Recuerda automáticamente el día previo y horas antes del control.
                </Text>
              </View>
              <Switch
                value={whatsappConfig?.remindAppointments !== false}
                disabled={!isWaEnabled || busy !== null}
                onValueChange={(v) => void toggleWhatsAppFeature("remindAppointments", v)}
                trackColor={{ true: "#25D366", false: gwarm.borderStrong }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.subSwitchRow}>
              <Pill size={18} color={gwarm.ink} />
              <View style={styles.subSwitchInfo}>
                <Text style={styles.subSwitchTitle}>Recordatorios de medicamentos de hoy</Text>
                <Text style={styles.subSwitchText}>
                  Aviso matutino para gestantes que no registraron su toma diaria.
                </Text>
              </View>
              <Switch
                value={whatsappConfig?.remindSupplements !== false}
                disabled={!isWaEnabled || busy !== null}
                onValueChange={(v) => void toggleWhatsAppFeature("remindSupplements", v)}
                trackColor={{ true: "#25D366", false: gwarm.borderStrong }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.subSwitchRow}>
              <MessageSquare size={18} color={gwarm.ink} />
              <View style={styles.subSwitchInfo}>
                <Text style={styles.subSwitchTitle}>Desvío de chat offline</Text>
                <Text style={styles.subSwitchText}>
                  Reenvía mensajes de la obstetra si la gestante no está en la app.
                </Text>
              </View>
              <Switch
                value={whatsappConfig?.chatOfflineFallback !== false}
                disabled={!isWaEnabled || busy !== null}
                onValueChange={(v) => void toggleWhatsAppFeature("chatOfflineFallback", v)}
                trackColor={{ true: "#25D366", false: gwarm.borderStrong }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.subSwitchRow}>
              <ShieldAlert size={18} color="#C62828" />
              <View style={styles.subSwitchInfo}>
                <Text style={[styles.subSwitchTitle, { color: "#C62828" }]}>
                  Alertas de Emergencia SOS
                </Text>
                <Text style={styles.subSwitchText}>
                  Envía alerta urgente con GPS a las obstetras si están offline.
                </Text>
              </View>
              <Switch
                value={whatsappConfig?.sosOfflineAlerts !== false}
                disabled={!isWaEnabled || busy !== null}
                onValueChange={(v) => void toggleWhatsAppFeature("sosOfflineAlerts", v)}
                trackColor={{ true: "#C62828", false: gwarm.borderStrong }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Enviar Mensaje de Prueba */}
          <View style={styles.testSection}>
            <Text style={styles.boxTitle}>Envío de Prueba</Text>
            <View style={styles.testRow}>
              <Field
                label="Celular de prueba"
                value={waTestPhone}
                onChangeText={setWaTestPhone}
                placeholder="987 654 321"
                keyboardType="phone-pad"
                accent="#075E54"
                style={styles.flex}
              />
              <AppButton
                title="Enviar"
                onPress={() => void sendTestMessage()}
                color="#075E54"
                variant="soft"
                loading={busy === "wa-send"}
                style={styles.sendBtn}
              />
            </View>
          </View>
        </Card>
      </PopIn>
    </View>
  );

  return (
    <View style={styles.container}>
      <WebContainer size="dashboard">
        <ScreenHeader title="Sistema" subtitle="Mantenimiento, entorno y servicios" />
      </WebContainer>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <WebContainer size="dashboard">
          <View style={styles.gapStack}>
            {renderStatusBanner()}

            {isWide ? (
              <WebRow gap={20}>
                <WebCol flex={5}>{renderEnvironmentSection()}</WebCol>
                <WebCol flex={7}>{renderWhatsAppSection()}</WebCol>
              </WebRow>
            ) : (
              <View style={styles.mobileStack}>
                {renderWhatsAppSection()}
                {renderEnvironmentSection()}
              </View>
            )}

            <Text style={styles.footerNote}>
              Los cambios del sistema llegan a todos los teléfonos en segundos.
            </Text>
          </View>
        </WebContainer>
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
  },
  gapStack: {
    gap: 14,
  },
  mobileStack: {
    gap: 14,
  },
  colSection: {
    gap: 14,
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
  card: { gap: 14 },
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
  configBox: {
    backgroundColor: gwarm.bg,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  boxTitle: {
    fontFamily: gfonts.hand,
    fontSize: 16.5,
    lineHeight: 21,
    color: gwarm.ink,
  },
  diagBox: {
    backgroundColor: gwarm.bg,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  diagHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  diagTitle: {
    fontFamily: gfonts.hand,
    fontSize: 16,
    lineHeight: 20,
    color: gwarm.ink,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCF8C6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  testBtnText: {
    fontFamily: gfonts.hand,
    fontSize: 13.5,
    color: "#075E54",
  },
  diagHint: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
    flex: 1,
  },
  featuresSection: {
    gap: 10,
    paddingTop: 4,
  },
  subSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: gwarm.border,
  },
  subSwitchInfo: { flex: 1, minWidth: 0, gap: 1 },
  subSwitchTitle: {
    fontFamily: gfonts.hand,
    fontSize: 15.5,
    lineHeight: 20,
    color: gwarm.ink,
  },
  subSwitchText: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 16,
    color: gwarm.inkSoft,
  },
  testSection: {
    backgroundColor: gwarm.bg,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: gwarm.border,
  },
  testRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  sendBtn: {
    marginBottom: 4,
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
