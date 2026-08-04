/**
 * Campo de formulario del cuaderno: etiqueta a mano, entrada cálida que se
 * aviva al enfocar (borde de acento) y error visible en nota rosada.
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
import { gfonts, gwarm } from "@/constants/theme";

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
  /** Compatibilidad: toda la app ya usa letra manuscrita. */
  hand?: boolean;
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
  accent = gwarm.teal,
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
        placeholderTextColor={gwarm.inkFaint}
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
          focused && { borderColor: accent, backgroundColor: gwarm.surface },
          hasError && { borderColor: gwarm.rose, backgroundColor: gwarm.surface },
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
    fontFamily: gfonts.handBody,
    fontSize: 14,
    lineHeight: 19,
    color: gwarm.inkSoft,
  },
  input: {
    fontFamily: gfonts.handBody,
    fontSize: 16,
    color: gwarm.ink,
    backgroundColor: gwarm.surfaceSoft,
    borderWidth: 1.5,
    borderColor: gwarm.border,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 48,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: "top" as const,
  },
  error: {
    fontFamily: gfonts.handBody,
    fontSize: 13.5,
    lineHeight: 18,
    color: gwarm.rose,
  },
  hint: {
    fontFamily: gfonts.handBody,
    fontSize: 12.5,
    lineHeight: 17,
    color: gwarm.inkFaint,
  },
});
