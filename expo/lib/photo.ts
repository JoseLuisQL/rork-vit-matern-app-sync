/**
 * Selección y compresión de la foto de perfil: recorte cuadrado y
 * reducción a 320 px JPEG (liviana para zonas con poca señal, ~20 KB por foto).
 * Compatible con Web (HTML5 Canvas + File API) y Móvil (expo-image-picker / expo-image-manipulator).
 */
import { Platform } from "react-native";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

/** Selector y redimensionador optimizado para Web */
function pickAvatarWeb(): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/jpg";
    input.style.display = "none";
    document.body.appendChild(input);

    let resolved = false;
    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    input.onchange = () => {
      if (resolved) return;
      resolved = true;
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== "string") {
          resolve(null);
          return;
        }

        const img = new (window as any).Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const targetSize = 320;
            canvas.width = targetSize;
            canvas.height = targetSize;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(result);
              return;
            }

            // Recorte cuadrado centrado
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;

            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);
            const compressed = canvas.toDataURL("image/jpeg", 0.75);
            resolve(compressed);
          } catch (err) {
            console.log("[VitMaterna] Canvas resize error:", err);
            resolve(result);
          }
        };
        img.onerror = () => {
          resolve(null);
        };
        img.src = result;
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(file);
    };

    input.oncancel = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(null);
      }
    };

    window.addEventListener(
      "focus",
      () => {
        setTimeout(() => {
          if (!resolved && (!input.files || input.files.length === 0)) {
            resolved = true;
            cleanup();
            resolve(null);
          }
        }, 1200);
      },
      { once: true },
    );

    input.click();
  });
}

/** Selector y redimensionador para Native (Android / iOS) */
async function pickAvatarNative(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    exif: false,
  });
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset?.uri) return null;

  try {
    const context = ImageManipulator.manipulate(asset.uri);
    context.resize({ width: 320, height: null });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.72,
      base64: true,
    });
    return saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : asset.uri;
  } catch {
    return asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
  }
}

export async function pickAvatarDataUrl(): Promise<string | null> {
  if (Platform.OS === "web") {
    return pickAvatarWeb();
  }
  return pickAvatarNative();
}
