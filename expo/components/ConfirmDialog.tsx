/**
 * Sistema global de diálogos de confirmación y avisos de VitMaterna.
 * Diseño clínico cálido ("cuaderno de cuidado") totalmente consistente
 * con el frontend: tarjetas suaves, acentos de color semánticos,
 * micro-animaciones, soporte de teclado (Escape/Enter) y vibración háptica.
 */
import * as Haptics from "expo-haptics";
import {
  AlertCircle,
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Info,
  Lock,
  LogOut,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  WifiOff,
  X,
} from "lucide-react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { gfonts, gwarm, semantic } from "@/constants/theme";
import {
  ConfirmOptions,
  ConfirmVariant,
  registerConfirmHandler,
} from "@/lib/confirm";
import { PressableScale } from "@/components/PressableScale";

interface ActiveDialogState extends ConfirmOptions {
  id: number;
  resolve: (result: boolean) => void;
}

interface ConfirmContextValue {
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  activeDialog: ActiveDialogState | null;
  closeDialog: (result: boolean) => void;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirmContext(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirmContext must be used within ConfirmProvider");
  }
  return ctx;
}

export function ConfirmProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [activeDialog, setActiveDialog] = useState<ActiveDialogState | null>(
    null
  );
  const counter = useRef<number>(0);

  const closeDialog = useCallback((result: boolean) => {
    setActiveDialog((current) => {
      if (current) {
        current.resolve(result);
      }
      return null;
    });
  }, []);

  const showConfirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        counter.current += 1;
        const dialogItem: ActiveDialogState = {
          ...options,
          id: counter.current,
          resolve,
        };
        setActiveDialog(dialogItem);
      });
    },
    []
  );

  useEffect(() => {
    registerConfirmHandler(showConfirm);
    return () => {
      registerConfirmHandler(null);
    };
  }, [showConfirm]);

  const value = useMemo(
    () => ({
      showConfirm,
      activeDialog,
      closeDialog,
    }),
    [showConfirm, activeDialog, closeDialog]
  );

  return (
    <ConfirmContext.Provider value={value}>
      {children}
    </ConfirmContext.Provider>
  );
}

/** Configuración visual de cada variante del diálogo */
function getVariantMeta(
  variant: ConfirmVariant | undefined,
  destructive: boolean | undefined,
  title: string
) {
  const isDestructive = destructive || variant === "danger";
  const lowerTitle = title.toLowerCase();

  if (isDestructive) {
    let IconComponent = AlertTriangle;
    let badgeText = "Atención";

    if (lowerTitle.includes("cerrar sesión") || lowerTitle.includes("salir")) {
      IconComponent = LogOut;
      badgeText = "Cerrar sesión";
    } else if (
      lowerTitle.includes("eliminar") ||
      lowerTitle.includes("quitar") ||
      lowerTitle.includes("borrar")
    ) {
      IconComponent = Trash2;
      badgeText = "Eliminar";
    } else if (lowerTitle.includes("desactivar")) {
      IconComponent = UserX;
      badgeText = "Desactivar";
    } else if (
      lowerTitle.includes("sos") ||
      lowerTitle.includes("emergencia") ||
      lowerTitle.includes("urgente")
    ) {
      IconComponent = ShieldAlert;
      badgeText = "Emergencia";
    } else if (
      lowerTitle.includes("producción") ||
      lowerTitle.includes("restaurar") ||
      lowerTitle.includes("demostración")
    ) {
      IconComponent = AlertTriangle;
      badgeText = "Crítico";
    }

    return {
      bgSoft: semantic.dangerLight,
      borderSoft: semantic.dangerMid,
      color: semantic.danger,
      badgeText,
      Icon: IconComponent,
    };
  }

  if (
    variant === "warning" ||
    lowerTitle.includes("reprogramar") ||
    lowerTitle.includes("pedir otra") ||
    lowerTitle.includes("mantenimiento")
  ) {
    let IconComponent = AlertCircle;
    let badgeText = "Aviso";
    if (lowerTitle.includes("fecha") || lowerTitle.includes("cita")) {
      IconComponent = CalendarClock;
      badgeText = "Reprogramación";
    }
    return {
      bgSoft: semantic.warningLight,
      borderSoft: semantic.warningMid,
      color: semantic.warning,
      badgeText,
      Icon: IconComponent,
    };
  }

  if (
    variant === "success" ||
    lowerTitle.includes("confirmar cita") ||
    lowerTitle.includes("asistencia") ||
    lowerTitle.includes("activar cuenta") ||
    lowerTitle.includes("cread") ||
    lowerTitle.includes("registrad")
  ) {
    let IconComponent = CheckCircle2;
    let badgeText = "Confirmación";
    if (lowerTitle.includes("cita") || lowerTitle.includes("asistencia")) {
      IconComponent = CalendarCheck;
      badgeText = "Control Prenatal";
    } else if (lowerTitle.includes("activar")) {
      IconComponent = UserCheck;
      badgeText = "Cuenta";
    }
    return {
      bgSoft: semantic.successLight,
      borderSoft: semantic.successMid,
      color: semantic.success,
      badgeText,
      Icon: IconComponent,
    };
  }

  // Info / default / notice
  let IconComponent = Info;
  let badgeText = "Información";
  if (lowerTitle.includes("conexión") || lowerTitle.includes("señal")) {
    IconComponent = WifiOff;
    badgeText = "Conectividad";
  } else if (lowerTitle.includes("permiso")) {
    IconComponent = Lock;
    badgeText = "Permisos";
  }

  return {
    bgSoft: semantic.infoLight,
    borderSoft: semantic.infoMid,
    color: semantic.info,
    badgeText,
    Icon: IconComponent,
  };
}

function renderIconElement(
  IconComponent: any,
  color: string,
  size: number = 26
): React.ReactElement | null {
  if (!IconComponent) return null;
  if (React.isValidElement(IconComponent)) {
    return IconComponent;
  }
  const Comp = IconComponent;
  return <Comp size={size} color={color} strokeWidth={2.2} />;
}

export function ConfirmHost(): React.ReactElement | null {
  const ctx = useContext(ConfirmContext);
  const activeDialog = ctx?.activeDialog ?? null;
  const closeDialog = ctx?.closeDialog;

  const anim = useRef(new Animated.Value(0)).current;
  const [renderedDialog, setRenderedDialog] = useState<ActiveDialogState | null>(
    null
  );

  useEffect(() => {
    if (activeDialog) {
      setRenderedDialog(activeDialog);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        friction: 8,
        tension: 85,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    } else if (renderedDialog) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== "web",
      }).start(({ finished }) => {
        if (finished) {
          setRenderedDialog(null);
        }
      });
    }
  }, [activeDialog, renderedDialog, anim]);

  // Atajos de teclado en Web (Escape para cancelar, Enter para confirmar)
  useEffect(() => {
    if (Platform.OS !== "web" || !renderedDialog || !closeDialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog(false);
      } else if (e.key === "Enter" && !renderedDialog.singleButton) {
        e.preventDefault();
        closeDialog(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [renderedDialog, closeDialog]);

  if (!renderedDialog) return null;

  const {
    title,
    message,
    confirmText,
    cancelText,
    destructive,
    variant,
    badge,
    accentColor,
    singleButton,
    icon: CustomIcon,
  } = renderedDialog;

  const meta = getVariantMeta(variant, destructive, title);
  const IconToRender = CustomIcon || meta.Icon;

  const handleCancel = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    closeDialog?.(false);
  };

  const handleConfirm = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    closeDialog?.(true);
  };

  const isDestructive = destructive || variant === "danger";
  const primaryBg = accentColor
    ? accentColor
    : isDestructive
    ? semantic.danger
    : variant === "warning"
    ? semantic.warning
    : variant === "success"
    ? semantic.success
    : gwarm.teal;

  const defaultConfirmText = singleButton
    ? "Entendido"
    : isDestructive
    ? "Confirmar"
    : "Aceptar";
  const finalConfirmText = confirmText || defaultConfirmText;
  const finalCancelText = cancelText || "Cancelar";

  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalRoot}
      >
        {/* Fondo oscurecido animado con blur en Web */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: anim,
            },
          ]}
        >
          <Pressable
            style={styles.backdropPress}
            onPress={handleCancel}
            accessibilityLabel="Cerrar diálogo"
          />
        </Animated.View>

        {/* Tarjeta del diálogo centrada */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.card}>
            {/* Botón de cerrar superior derecho */}
            <Pressable
              onPress={handleCancel}
              style={styles.closeIconBtn}
              hitSlop={10}
              accessibilityLabel="Cerrar"
            >
              <X size={18} color={gwarm.inkFaint} />
            </Pressable>

            {/* Cabecera del diálogo con Icono hero */}
            <View style={styles.heroSection}>
              <View
                style={[
                  styles.outerIconRing,
                  {
                    backgroundColor: meta.bgSoft,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: meta.bgSoft,
                      borderColor: meta.borderSoft,
                    },
                  ]}
                >
                  {renderIconElement(IconToRender, meta.color, 26)}
                </View>
              </View>

              {/* Insignia / Badge contextual */}
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: meta.bgSoft,
                    borderColor: meta.borderSoft,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: meta.color }]}>
                  {badge || meta.badgeText}
                </Text>
              </View>
            </View>

            {/* Contenido textual */}
            <View style={styles.bodySection}>
              <Text style={styles.title} testID="dialog-title">
                {title}
              </Text>
              {message ? (
                <Text style={styles.message} testID="dialog-message">
                  {message}
                </Text>
              ) : null}
            </View>

            {/* Botones de acción */}
            <View
              style={[
                styles.buttonRow,
                singleButton && styles.buttonRowSingle,
              ]}
            >
              {!singleButton && (
                <PressableScale
                  onPress={handleCancel}
                  accessibilityLabel={finalCancelText}
                  style={styles.cancelButton}
                  testID="dialog-btn-cancel"
                >
                  <Text style={styles.cancelButtonText}>
                    {finalCancelText}
                  </Text>
                </PressableScale>
              )}

              <PressableScale
                onPress={handleConfirm}
                accessibilityLabel={finalConfirmText}
                style={[
                  styles.confirmButton,
                  { backgroundColor: primaryBg },
                  singleButton && styles.confirmButtonFull,
                ]}
                testID="dialog-btn-confirm"
              >
                <Text style={styles.confirmButtonText}>
                  {finalConfirmText}
                </Text>
              </PressableScale>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 19, 16, 0.62)",
    ...Platform.select({
      web: {
        backdropFilter: "blur(5px)",
      },
    }),
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 420,
    zIndex: 10000,
  },
  card: {
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: "center",
    position: "relative",
    ...Platform.select({
      web: {
        boxShadow:
          "0 24px 48px -12px rgba(50, 40, 26, 0.28), 0 8px 16px -4px rgba(50, 40, 26, 0.12)",
      },
      default: {
        shadowColor: "#3D2E1E",
        shadowOpacity: 0.26,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 14,
      },
    }),
  },
  closeIconBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: gwarm.surfaceSoft,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  outerIconRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 99,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: gfonts.hand,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  bodySection: {
    alignItems: "center",
    marginBottom: 22,
    width: "100%",
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 22,
    lineHeight: 27,
    color: gwarm.ink,
    textAlign: "center",
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  message: {
    fontFamily: gfonts.handBody,
    fontSize: 15,
    lineHeight: 22,
    color: gwarm.inkSoft,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  buttonRowSingle: {
    flexDirection: "column",
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontFamily: gfonts.hand,
    fontSize: 16.5,
    color: gwarm.inkSoft,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.14,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      },
    }),
  },
  confirmButtonFull: {
    flex: 0,
    width: "100%",
  },
  confirmButtonText: {
    fontFamily: gfonts.hand,
    fontSize: 16.5,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
