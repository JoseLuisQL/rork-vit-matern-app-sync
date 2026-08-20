/**
 * Modal para editar datos personales del usuario conectado:
 * Nombres, apellidos, teléfono y cambio opcional de contraseña.
 * Totalmente responsivo en móvil y escritorio web.
 */
import { Eye, EyeOff, Lock, User, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { gShadow, gfonts, gwarm, semantic, spacing, withAlpha } from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { useApp } from "@/providers/AppProvider";
import { AppButton } from "@/components/AppButton";
import { useToast } from "@/components/Toast";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  accentColor?: string;
}

export function EditProfileModal({
  visible,
  onClose,
  accentColor = gwarm.teal,
}: EditProfileModalProps): React.ReactElement | null {
  const { user, online, updateProfile } = useApp();
  const { show: showToast } = useToast();

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setPassword("");
      setShowPassword(false);
      setError(null);
    }
  }, [visible, user]);

  const handleSave = useCallback(async () => {
    if (!online) {
      setError("Necesitas conexión a internet para actualizar tus datos.");
      return;
    }
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanPhone = phone.trim();
    const cleanPass = password.trim();

    if (cleanFirst.length === 0) {
      setError("Por favor ingresa tus nombres.");
      return;
    }
    if (cleanLast.length === 0) {
      setError("Por favor ingresa tus apellidos.");
      return;
    }
    if (cleanPass.length > 0 && cleanPass.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await updateProfile({
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: cleanPhone,
        password: cleanPass.length >= 6 ? cleanPass : undefined,
      });
      showToast("Tus datos han sido actualizados correctamente", "success");
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) {
        setError("Sin conexión con el servidor. Inténtalo cuando tengas señal.");
      } else {
        setError(e instanceof Error ? e.message : "No se pudo actualizar el perfil.");
      }
    } finally {
      setLoading(false);
    }
  }, [online, firstName, lastName, phone, password, updateProfile, showToast, onClose]);

  if (!visible || !user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.headerIconWrap, { backgroundColor: withAlpha(accentColor, 0.12) }]}>
                <User size={20} color={accentColor} />
              </View>
              <Text style={styles.title}>Editar mis datos</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal"
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <X size={20} color={gwarm.inkSoft} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* DNI fijo */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>DNI (identificador de cuenta)</Text>
              <View style={styles.readonlyInput}>
                <Lock size={15} color={gwarm.inkFaint} />
                <Text style={styles.readonlyText}>{user.dni}</Text>
              </View>
            </View>

            {/* Nombres */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Nombres</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ej. Ana María"
                placeholderTextColor={gwarm.inkFaint}
                style={styles.input}
                testID="input-perfil-nombres"
              />
            </View>

            {/* Apellidos */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Apellidos</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Ej. Quispe Flores"
                placeholderTextColor={gwarm.inkFaint}
                style={styles.input}
                testID="input-perfil-apellidos"
              />
            </View>

            {/* Celular / Teléfono */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Teléfono o celular</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Ej. 987654321"
                placeholderTextColor={gwarm.inkFaint}
                keyboardType="phone-pad"
                style={styles.input}
                testID="input-perfil-telefono"
              />
            </View>

            {/* Nueva Contraseña */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Nueva contraseña (opcional)</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Dejar en blanco para mantener la actual"
                  placeholderTextColor={gwarm.inkFaint}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[styles.input, { paddingRight: 48 }]}
                  testID="input-perfil-password"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={gwarm.inkFaint} />
                  ) : (
                    <Eye size={18} color={gwarm.inkFaint} />
                  )}
                </Pressable>
              </View>
              <Text style={styles.hint}>Mínimo 6 caracteres si deseas cambiarla.</Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              <View style={styles.actionBtn}>
                <AppButton
                  title="Cancelar"
                  variant="outline"
                  onPress={onClose}
                  disabled={loading}
                />
              </View>
              <View style={styles.actionBtn}>
                <AppButton
                  title="Guardar cambios"
                  color={accentColor}
                  onPress={() => void handleSave()}
                  loading={loading}
                  testID="btn-guardar-perfil"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 25, 23, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
    backgroundColor: gwarm.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: gwarm.border,
    overflow: "hidden",
    ...gShadow,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: gwarm.border,
    backgroundColor: gwarm.surfaceSoft,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: gfonts.hand,
    fontSize: 21,
    lineHeight: 26,
    color: gwarm.ink,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  fieldBlock: {
    gap: 6,
  },
  label: {
    fontFamily: gfonts.hand,
    fontSize: 14.5,
    lineHeight: 18,
    color: gwarm.ink,
  },
  input: {
    backgroundColor: gwarm.surface,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    color: gwarm.ink,
  },
  readonlyInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1,
    borderColor: gwarm.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  readonlyText: {
    fontFamily: gfonts.handBody,
    fontSize: 15.5,
    color: gwarm.inkSoft,
  },
  passwordWrapper: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  hint: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 16,
    color: gwarm.inkFaint,
  },
  errorBox: {
    backgroundColor: semantic.dangerLight,
    borderWidth: 1,
    borderColor: withAlpha(semantic.danger, 0.3),
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: semantic.danger,
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});
