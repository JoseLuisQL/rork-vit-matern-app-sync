/** Confirmación y avisos multiplataforma (Alert nativo / window en web). */
import { Alert, Platform } from "react-native";

/** Aviso simple con botón OK que también funciona en web. */
export function showNotice(title: string, message: string): void {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  const {
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    destructive = false,
  } = options;

  if (Platform.OS === "web") {
    const ok =
      typeof window !== "undefined" &&
      window.confirm(`${title}\n\n${message}`);
    return Promise.resolve(!!ok);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}
