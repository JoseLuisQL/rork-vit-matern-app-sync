/**
 * Inicio de sesión "cuaderno de cuidado": ilustración de bienvenida hecha a
 * mano y campos cálidos con letra manuscrita. Los accesos de demostración
 * vienen del servidor en tiempo real: en modo producción desaparecen solos,
 * y si hay mantenimiento se muestra el aviso ilustrado. La verificación la
 * hace el servidor (DNI + clave).
 */
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronRight, Eye, EyeOff, Info } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { brand, gfonts, gShadow, gwarm, warmAccent } from "@/constants/theme";
import { ROLE_LABEL } from "@/constants/labels";
import { GICON, ILU } from "@/constants/illustrations";
import { api, ApiError } from "@/lib/api";
import { useApp } from "@/providers/AppProvider";
import type { PublicConfig, Role } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { PressableScale } from "@/components/PressableScale";

const DEMO_PASSWORD = "Test@1234";

/** Dibujo de cada rol para la lista de demostración. */
const ROLE_ILU: Record<Role, string> = {
  gestante: GICON.gestantes,
  obstetra: ILU.obstetra,
  admin: ILU.centroSalud,
};

export default function LoginScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, authNotice, clearAuthNotice } = useApp();
  const [dni, setDni] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Configuración pública en tiempo real: entorno (demo/producción),
   * mantenimiento y cuentas de prueba. Se consulta cada pocos segundos para
   * que los cambios de administración se reflejen sin recargar.
   */
  const { data: publicConfig } = useQuery<PublicConfig>({
    queryKey: ["public-config"],
    queryFn: () => api<PublicConfig>("/api/config", {}),
    refetchInterval: 5000,
    retry: false,
  });
  const demoAccounts = publicConfig?.environment === "demo" ? publicConfig.demoAccounts : [];
  const maintenanceOn = publicConfig?.maintenance === true;

  const goHome = useCallback(
    (role: Role) => {
      if (role === "gestante") router.replace("/(gestante)/(tabs)/inicio");
      else if (role === "obstetra") router.replace("/(obstetra)/(tabs)/inicio");
      else router.replace("/(admin)/(tabs)/inicio");
    },
    [router],
  );

  const doLogin = useCallback(
    async (d: string, p: string) => {
      if (!/^\d{8}$/.test(d)) {
        setError("El DNI debe tener 8 dígitos.");
        return;
      }
      if (p.length === 0) {
        setError("Escribe tu contraseña.");
        return;
      }
      setLoading(true);
      setError(null);
      clearAuthNotice();
      try {
        const user = await login(d, p);
        goHome(user.role);
      } catch (e) {
        if (e instanceof ApiError && e.status === 0) {
          setError(
            "No hay conexión. Para entrar necesitas señal; vuelve a intentarlo cuando tengas conexión.",
          );
        } else {
          setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
        }
      } finally {
        setLoading(false);
      }
    },
    [login, goHome, clearAuthNotice],
  );

  const fillAndLogin = useCallback(
    (account: { dni: string }) => {
      if (loading) return;
      setDni(account.dni);
      setPassword(DEMO_PASSWORD);
      void doLogin(account.dni, DEMO_PASSWORD);
    },
    [doLogin, loading],
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PopIn>
          <View style={styles.heroBlock}>
            <Illustration source={ILU.bienvenida} width={310} height={196} />
            <View style={styles.brandRow}>
              <Image
                source={require("@/assets/images/vitmaterna_logo.png")}
                style={styles.logo}
                contentFit="contain"
              />
              <Text style={styles.title}>
                <Text style={{ color: brand.plum }}>Vit</Text>
                <Text style={{ color: gwarm.ink }}>Materna</Text>
              </Text>
            </View>
            <Text style={styles.subtitle}>Cuidamos tu embarazo, cerquita de ti</Text>
          </View>
        </PopIn>

        {maintenanceOn ? (
          <PopIn>
            <View style={styles.maintenanceBox}>
              <Illustration source={ILU.mantenimiento} width={72} height={72} />
              <View style={styles.maintenanceInfo}>
                <Text style={styles.maintenanceTitle}>Estamos en mantenimiento</Text>
                <Text style={styles.maintenanceText}>
                  {publicConfig?.maintenanceMessage ??
                    "Volvemos en un ratito. Gracias por tu paciencia."}
                </Text>
              </View>
            </View>
          </PopIn>
        ) : null}

        {authNotice ? (
          <View style={styles.noticeBox}>
            <Info size={16} color={gwarm.tealDeep} />
            <Text style={styles.noticeText}>{authNotice}</Text>
          </View>
        ) : null}

        <PopIn delay={90}>
          <View style={styles.formCard}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Tu DNI</Text>
              <TextInput
                value={dni}
                onChangeText={(t) => setDni(t.replace(/[^0-9]/g, ""))}
                placeholder="8 dígitos"
                placeholderTextColor={gwarm.inkFaint}
                keyboardType="number-pad"
                maxLength={8}
                style={styles.input}
                testID="login-dni"
              />
            </View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Tu contraseña</Text>
              <View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Escríbela aquí"
                  placeholderTextColor={gwarm.inkFaint}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[styles.input, { paddingRight: 52 }]}
                  testID="login-password"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={gwarm.inkFaint} />
                  ) : (
                    <Eye size={20} color={gwarm.inkFaint} />
                  )}
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <AppButton
              title="Entrar"
              onPress={() => void doLogin(dni, password)}
              color={brand.plum}
              loading={loading}
              large
              testID="login-submit"
            />
          </View>
        </PopIn>

        {demoAccounts.length > 0 ? (
          <PopIn delay={180}>
            <Text style={styles.demoTitle}>¿Solo quieres mirar? Entra de prueba</Text>
            <View style={styles.demoList}>
              {demoAccounts.map((account, index) => {
                const accent = warmAccent(account.role);
                return (
                  <PressableScale
                    key={account.dni}
                    onPress={() => fillAndLogin(account)}
                    accessibilityLabel={`Entrar como ${account.name}`}
                    style={[styles.demoRow, index > 0 && styles.demoRowBorder]}
                    testID={`demo-${account.dni}`}
                  >
                    <View style={[styles.demoIlu, { backgroundColor: accent.soft }]}>
                      <Illustration source={ROLE_ILU[account.role]} width={30} height={30} />
                    </View>
                    <View style={styles.demoInfo}>
                      <Text style={styles.demoName}>{account.name}</Text>
                      <Text style={[styles.demoMeta, { color: accent.main }]}>
                        {ROLE_LABEL[account.role]}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={gwarm.inkFaint} />
                  </PressableScale>
                );
              })}
            </View>
          </PopIn>
        ) : null}

        <View style={styles.footer}>
          <Illustration source={ILU.flores} width={92} height={30} />
          <Text style={styles.footerText}>C.S. Talavera · Andahuaylas</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: gwarm.bg },
  content: {
    paddingHorizontal: 16,
    gap: 14,
  },
  heroBlock: {
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  logo: {
    width: 46,
    height: 46,
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 36,
    lineHeight: 44,
  },
  subtitle: {
    fontFamily: gfonts.handBody,
    fontSize: 15,
    lineHeight: 21,
    color: gwarm.inkSoft,
    marginTop: 1,
  },
  noticeBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: gwarm.tealSoft,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: gwarm.tealMid,
    padding: 12,
    alignItems: "center",
  },
  maintenanceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: gwarm.amberSoft,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: gwarm.amberMid,
    padding: 14,
  },
  maintenanceInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  maintenanceTitle: {
    fontFamily: gfonts.hand,
    fontSize: 19,
    lineHeight: 24,
    color: gwarm.amber,
  },
  maintenanceText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  noticeText: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 20,
    color: gwarm.tealDeep,
    flex: 1,
  },
  formCard: {
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: 18,
    gap: 14,
    ...gShadow,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: gfonts.hand,
    fontSize: 17,
    lineHeight: 22,
    color: gwarm.ink,
  },
  input: {
    fontFamily: gfonts.handBody,
    fontSize: 17,
    color: gwarm.ink,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 52,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  errorBox: {
    backgroundColor: gwarm.redSoft,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: gwarm.redMid,
    padding: 12,
  },
  errorText: {
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 20,
    color: gwarm.rose,
  },
  demoTitle: {
    fontFamily: gfonts.hand,
    fontSize: 20,
    lineHeight: 26,
    color: gwarm.ink,
    marginBottom: 8,
  },
  demoList: {
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: gwarm.border,
    paddingHorizontal: 14,
    ...gShadow,
  },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    minHeight: 62,
  },
  demoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: gwarm.border,
  },
  demoIlu: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  demoInfo: {
    flex: 1,
    minWidth: 0,
  },
  demoName: {
    fontFamily: gfonts.handBody,
    fontSize: 16,
    lineHeight: 22,
    color: gwarm.ink,
  },
  demoMeta: {
    fontFamily: gfonts.handBody,
    fontSize: 13,
    lineHeight: 17,
  },
  footer: {
    alignItems: "center",
    gap: 2,
    marginTop: 4,
  },
  footerText: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
  },
});
