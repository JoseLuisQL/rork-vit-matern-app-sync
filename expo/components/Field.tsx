/**
 * Campo de formulario profesional: etiqueta pequeña, entrada rellena que se
 * aviva al enfocar (borde de acento sobre fondo blanco) y error visible.
 */
import React, { useState } from "react";
import {
  KeyboardTypeOptions,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { common, radius, semantic, spacing, type } from "@/constants/theme";

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  error?: string | null;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words";
  multiline?: boolean;
  accent?: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  error,
  maxLength,
  autoCapitalize = "sentences",
  multiline = false,
  accent = "#0C8174",
  hint,
  style,
  testID,
}: FieldProps): React.ReactElement {
  const [focused, setFocused] = useState<boolean>(false);
  const hasError = error != null && error.length > 0;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={common.textTertiary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && { borderColor: accent, backgroundColor: common.surface },
          hasError && { borderColor: semantic.danger, backgroundColor: common.surface },
        ]}
        testID={testID}
      />
      {hasError ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 5,
  },
  label: {
    ...type.label,
    color: common.textSecondary,
  },
  input: {
    ...type.body,
    color: common.text,
    backgroundColor: common.surfaceAlt,
    borderWidth: 1,
    borderColor: common.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm2,
    paddingVertical: 11,
    minHeight: 46,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: "top" as const,
  },
  error: {
    ...type.bodySm,
    color: semantic.danger,
  },
  hint: {
    ...type.caption,
    color: common.textTertiary,
  },
});
