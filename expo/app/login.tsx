/**
 * Pantalla de inicio de sesión ("cuaderno de cuidado").
 * En escritorio: layout dividido 50/50 centrado con hero visual a la izquierda
 * y formulario de acceso a la derecha.
 * En móvil: flujo vertical apilado con animaciones suaves.
 */
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
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
import { ROLE_LABEL } from "@/constants/labels";
import { brand, gfonts, gShadow, gwarm, warmAccent } from "@/constants/theme";
import { GICON, ILU } from "@/constants/illustrations";
import { api, ApiError } from "@/lib/api";
import { useApp } from "@/providers/AppProvider";
import { useResponsive } from "@/hooks/useResponsive";
import type { PublicConfig, Role } from "@/types";
import { AppButton } from "@/components/AppButton";
import { Illustration } from "@/components/gestante/Illustration";
import { PopIn } from "@/components/gestante/PopIn";
import { PressableScale } from "@/components/PressableScale";
import { WebContainer } from "@/components/web/WebContainer";

const DEMO_PASSWORD = "Test@1234";

const ROLE_ILU: Record<Role, string> = {
  gestante: GICON.gestantes,
  obstetra: ILU.obstetra,
  admin: ILU.centroSalud,
};

export default function LoginScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDesktop, isTablet } = useResponsive();
  const { login, authNotice, clearAuthNotice } = useApp();
  const [dni, setDni] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isWide = isDesktop || isTablet;

  /**
   * Configuración pública en tiempo real: entorno (demo/producción),
   * mantenimiento y cuentas de prueba.
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
    async (dniInput: string, passwordInput: string) => {
      const cleanDni = dniInput.trim();
      const cleanPassword = passwordInput.trim();
      if (!/^\d{8}$/.test(cleanDni)) {
        setError("Escribe tu DNI completo (8 dígitos).");
        return;
      }
      if (cleanPassword.length === 0) {
        setError("Escribe tu contraseña.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const u = await login(cleanDni, cleanPassword);
        clearAuthNotice();
        goHome(u.role);
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

  const renderHero = () => (
    <View style={[styles.heroBlock, isWide && styles.heroBlockWide]}>
      <Illustration source={ILU.bienvenida} width={isWide ? 380 : 310} height={isWide ? 240 : 196} />
      <View style={styles.brandRow}>
        <Image
          source={require("@/assets/images/vitmaterna_logo.png")}
          style={[styles.logo, isWide && { width: 54, height: 54 }]}
          contentFit="contain"
        />
        <Text style={[styles.title, isWide && { fontSize: 44, lineHeight: 52 }]}>
          <Text style={{ color: brand.plum }}>Vit</Text>
          <Text style={{ color: gwarm.ink }}>Materna</Text>
        </Text>
      </View>
      <Text style={[styles.subtitle, isWide && { fontSize: 17, lineHeight: 24 }]}>
        Cuidamos tu embarazo, cerquita de ti
      </Text>

      {isWide ? (
        <View style={styles.desktopClinicBadge}>
          <Text style={styles.desktopClinicText}>
            Centro de Salud Talavera · Red de Salud Andahuaylas
          </Text>
        </View>
      ) : null}

      {maintenanceOn ? (
        <View style={[styles.maintenanceBox, isWide && { marginTop: 16, width: "100%" }]}>
          <Illustration source={ILU.mantenimiento} width={64} height={64} />
          <View style={styles.maintenanceInfo}>
            <Text style={styles.maintenanceTitle}>Estamos en mantenimiento</Text>
            <Text style={styles.maintenanceText}>
              {publicConfig?.maintenanceMessage ??
                "Volvemos en un ratito. Gracias por tu paciencia."}
            </Text>
          </View>
        </View>
      ) : null}

      {authNotice ? (
        <View style={[styles.noticeBox, isWide && { marginTop: 16, width: "100%" }]}>
          <Info size={16} color={gwarm.tealDeep} />
          <Text style={styles.noticeText}>{authNotice}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      <PopIn delay={90}>
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>Iniciar sesión</Text>
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
              onSubmitEditing={() => void doLogin(dni, password)}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Tu contraseña</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Escríbela aquí"
                placeholderTextColor={gwarm.inkFaint}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={[styles.input, { paddingRight: 52 }]}
                testID="login-password"
                onSubmitEditing={() => void doLogin(dni, password)}
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
    </View>
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
          isWide
            ? { minHeight: "100%", justifyContent: "center", paddingVertical: 40 }
            : { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <WebContainer size="dashboard">
          {isWide ? (
            <View style={styles.desktopLayout}>
              <View style={styles.desktopLeftCol}>{renderHero()}</View>
              <View style={styles.desktopRightCol}>{renderForm()}</View>
            </View>
          ) : (
            <View style={styles.mobileStack}>
              <PopIn>{renderHero()}</PopIn>
              {renderForm()}
            </View>
          )}
        </WebContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: gwarm.bg },
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  desktopLayout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 64,
    paddingVertical: 24,
    width: "100%",
  },
  desktopLeftCol: {
    flex: 1,
    maxWidth: 480,
    alignItems: "center",
  },
  desktopRightCol: {
    flex: 1,
    maxWidth: 440,
  },
  mobileStack: {
    gap: 14,
  },
  heroBlock: {
    alignItems: "center",
  },
  heroBlockWide: {
    alignItems: "center",
    textAlign: "center",
  },
  desktopClinicBadge: {
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 14,
  },
  desktopClinicText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    color: gwarm.inkSoft,
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
    textAlign: "center",
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
  formContainer: {
    gap: 14,
  },
  formCard: {
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: gwarm.border,
    padding: 22,
    gap: 14,
    ...gShadow,
  },
  formCardTitle: {
    fontFamily: gfonts.hand,
    fontSize: 22,
    lineHeight: 28,
    color: gwarm.ink,
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
    marginBottom: 4,
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
