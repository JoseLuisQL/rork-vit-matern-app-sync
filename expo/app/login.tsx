/**
 * Inicio de sesión verificado por el servidor (DNI + contraseña).
 * Incluye accesos de demostración de un toque para los 3 roles.
 */
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronRight, Eye, EyeOff, Info, ShieldCheck } from "lucide-react-native";
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
import {
  brand,
  cardBorder,
  common,
  radius,
  roleAccent,
  semantic,
  spacing,
  type,
} from "@/constants/theme";
import { ROLE_LABEL } from "@/constants/labels";
import { ApiError } from "@/lib/api";
import { useApp } from "@/providers/AppProvider";
import type { Role } from "@/types";
import { AppButton } from "@/components/AppButton";
import { PressableScale } from "@/components/PressableScale";

const DEMO_PASSWORD = "Test@1234";

const DEMO_ACCOUNTS: { dni: string; name: string; role: Role }[] = [
  { dni: "33333333", name: "Ana Quispe", role: "gestante" },
  { dni: "44444444", name: "Lucía Huamán", role: "gestante" },
  { dni: "11111111", name: "Carmen Rojas", role: "obstetra" },
  { dni: "22222222", name: "Patricia Salas", role: "admin" },
];

export default function LoginScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, authNotice, clearAuthNotice } = useApp();
  const [dni, setDni] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
            "No hay conexión con el servidor. Para iniciar sesión necesitas señal; vuelve a intentarlo cuando tengas conexión.",
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
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandBlock}>
          <Image
            source={require("@/assets/images/vitmaterna_logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>
            <Text style={{ color: brand.plum }}>Vit</Text>
            <Text style={{ color: common.text }}>Materna</Text>
          </Text>
          <Text style={styles.subtitle}>Salud prenatal · C.S. Talavera, Andahuaylas</Text>
        </View>

        {authNotice ? (
          <View style={styles.noticeBox}>
            <Info size={16} color={semantic.info} />
            <Text style={styles.noticeText}>{authNotice}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>DNI</Text>
            <TextInput
              value={dni}
              onChangeText={(t) => setDni(t.replace(/[^0-9]/g, ""))}
              placeholder="8 dígitos"
              placeholderTextColor={common.textTertiary}
              keyboardType="number-pad"
              maxLength={8}
              style={styles.input}
              testID="login-dni"
            />
          </View>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Contraseña</Text>
            <View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Tu contraseña"
                placeholderTextColor={common.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={[styles.input, { paddingRight: 48 }]}
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
                  <EyeOff size={19} color={common.textTertiary} />
                ) : (
                  <Eye size={19} color={common.textTertiary} />
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
            title="Ingresar"
            onPress={() => void doLogin(dni, password)}
            color={brand.plum}
            loading={loading}
            testID="login-submit"
          />
        </View>

        <Text style={styles.demoTitle}>CUENTAS DE DEMOSTRACIÓN</Text>
        <View style={styles.demoList}>
          {DEMO_ACCOUNTS.map((account) => {
            const accent = roleAccent(account.role);
            return (
              <PressableScale
                key={account.dni}
                onPress={() => fillAndLogin(account)}
                accessibilityLabel={`Entrar como ${account.name}`}
                style={styles.demoRow}
                testID={`demo-${account.dni}`}
              >
                <View style={[styles.demoDot, { backgroundColor: accent.primary }]} />
                <View style={styles.demoInfo}>
                  <Text style={styles.demoName}>{account.name}</Text>
                  <Text style={styles.demoMeta}>
                    {ROLE_LABEL[account.role]} · DNI {account.dni}
                  </Text>
                </View>
                <ChevronRight size={18} color={common.textTertiary} />
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.footer}>
          <ShieldCheck size={14} color={common.textTertiary} />
          <Text style={styles.footerText}>
            Cálculos clínicos en el servidor · Hb corregida a 2 926 msnm
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: common.background },
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  logo: {
    width: 96,
    height: 96,
  },
  title: {
    ...type.h1,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...type.bodySm,
    color: common.textSecondary,
    marginTop: 2,
  },
  noticeBox: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: semantic.infoLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.infoMid,
    padding: spacing.sm2,
    alignItems: "center",
  },
  noticeText: {
    ...type.bodySm,
    color: semantic.info,
    flex: 1,
  },
  formCard: {
    backgroundColor: common.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...cardBorder,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    ...type.label,
    color: common.textSecondary,
  },
  input: {
    ...type.body,
    color: common.text,
    backgroundColor: common.surface,
    borderWidth: 1.5,
    borderColor: common.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm2,
    paddingVertical: 12,
    minHeight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: spacing.sm2,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  errorBox: {
    backgroundColor: semantic.dangerLight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: semantic.dangerMid,
    padding: spacing.sm2,
  },
  errorText: {
    ...type.bodySm,
    color: semantic.danger,
  },
  demoTitle: {
    ...type.overline,
    color: common.textTertiary,
    marginTop: spacing.xs,
  },
  demoList: {
    backgroundColor: common.surface,
    borderRadius: radius.lg,
    ...cardBorder,
    overflow: "hidden" as const,
  },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm2,
    borderBottomWidth: 1,
    borderBottomColor: common.border,
    minHeight: 56,
  },
  demoDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  demoInfo: {
    flex: 1,
  },
  demoName: {
    ...type.bodyMd,
    color: common.text,
  },
  demoMeta: {
    ...type.caption,
    color: common.textTertiary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.xs,
  },
  footerText: {
    ...type.caption,
    color: common.textTertiary,
  },
});
