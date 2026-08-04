/**
 * Filtro de avisos benignos de librerías (solo en web).
 *
 * React Navigation pasa la prop nativa `collapsable` a la vista de fondo de
 * cada pantalla; react-native-web 0.21 reenvía props desconocidas al DOM y
 * React lo reporta como "Received `false` for a non-boolean attribute
 * `collapsable`". No afecta en nada a la app (en el teléfono esa prop es
 * válida), pero la vista previa lo muestra como un error rojo. Aquí se
 * silencia ÚNICAMENTE ese mensaje; cualquier otro error sigue visible.
 */
import { Platform } from "react-native";

function isKnownLibraryNoise(args: unknown[]): boolean {
  const text = args.filter((a): a is string => typeof a === "string").join(" ");
  return text.includes("non-boolean attribute") && text.includes("collapsable");
}

if (Platform.OS === "web" && typeof console !== "undefined") {
  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (isKnownLibraryNoise(args)) return;
    originalError(...args);
  };
}

export {};
