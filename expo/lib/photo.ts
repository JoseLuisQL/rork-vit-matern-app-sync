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

export interface PickedMediaFile {
  dataUrl: string;
  fileName: string;
}

/** Selector de imagen para contenido educativo (preserva proporción hasta 960 px). */
function pickArticleImageWeb(): Promise<PickedMediaFile | null> {
  return new Promise<PickedMediaFile | null>((resolve) => {
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

      const fileName = file.name || "imagen-educativa.jpg";
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
            const maxDim = 960;
            let width = img.width || maxDim;
            let height = img.height || maxDim;
            if (width > maxDim || height > maxDim) {
              const ratio = Math.min(maxDim / width, maxDim / height);
              width = Math.max(1, Math.round(width * ratio));
              height = Math.max(1, Math.round(height * ratio));
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve({ dataUrl: result, fileName });
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.8);
            resolve({ dataUrl: compressed, fileName });
          } catch {
            resolve({ dataUrl: result, fileName });
          }
        };
        img.onerror = () => resolve(null);
        img.src = result;
      };
      reader.onerror = () => resolve(null);
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

async function pickArticleImageNative(): Promise<PickedMediaFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 0.85,
    exif: false,
  });
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset?.uri) return null;
  const fileName = asset.fileName || "imagen-educativa.jpg";

  try {
    const context = ImageManipulator.manipulate(asset.uri);
    const targetWidth = asset.width && asset.width > 960 ? 960 : asset.width || 960;
    context.resize({ width: targetWidth, height: null });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.78,
      base64: true,
    });
    const dataUrl = saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : asset.uri;
    return { dataUrl, fileName };
  } catch {
    const dataUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    return { dataUrl, fileName };
  }
}

export async function pickArticleImage(): Promise<PickedMediaFile | null> {
  if (Platform.OS === "web") {
    return pickArticleImageWeb();
  }
  return pickArticleImageNative();
}

/** Selector de archivo PDF para contenido educativo (Web y Android/iOS). */
function pickPdfWeb(): Promise<PickedMediaFile | null> {
  return new Promise<PickedMediaFile | null>((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,.pdf";
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

      const fileName = file.name || "documento-educativo.pdf";
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== "string") {
          resolve(null);
          return;
        }
        const normalized = result.startsWith("data:application/pdf")
          ? result
          : result.replace(/^data:[^;]+;/, "data:application/pdf;");
        resolve({ dataUrl: normalized, fileName });
      };
      reader.onerror = () => resolve(null);
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

async function pickPdfNative(): Promise<PickedMediaFile | null> {
  try {
    const { File } = await import("expo-file-system");
    const picked = await File.pickFileAsync(undefined, "application/pdf");
    const file = Array.isArray(picked) ? picked[0] : picked;
    if (!file) return null;
    const base64 = await file.base64();
    if (!base64) return null;
    return {
      dataUrl: `data:application/pdf;base64,${base64}`,
      fileName: file.name || "documento-educativo.pdf",
    };
  } catch (err) {
    console.log("[VitMaterna] pickPdfNative cancelado o no disponible:", err);
    return null;
  }
}

export async function pickPdfDocument(): Promise<PickedMediaFile | null> {
  if (Platform.OS === "web") {
    return pickPdfWeb();
  }
  return pickPdfNative();
}

/** Abre cualquier recurso educativo (PDF base64, imagen base64 o enlace externo) en Web y Móvil. */
export async function openArticleMedia(url: string, title?: string): Promise<void> {
  if (!url) return;
  const cleanTitle = (title || "recurso-educativo")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .slice(0, 48);

  if (url.startsWith("data:")) {
    const commaIdx = url.indexOf(",");
    const header = commaIdx >= 0 ? url.slice(0, commaIdx) : "";
    const base64 = commaIdx >= 0 ? url.slice(commaIdx + 1) : "";
    const isPdf = header.includes("application/pdf");
    const ext = isPdf ? "pdf" : header.includes("png") ? "png" : "jpg";
    const mimeType = isPdf ? "application/pdf" : header.includes("png") ? "image/png" : "image/jpeg";

    if (Platform.OS === "web" && typeof window !== "undefined" && typeof document !== "undefined") {
      try {
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        if (isPdf) {
          a.download = `${cleanTitle}.${ext}`;
        }
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        return;
      } catch (e) {
        console.log("[VitMaterna] Error abriendo recurso data URL en web:", e);
      }
    } else {
      try {
        const FileSystem = await import("expo-file-system/legacy");
        const Sharing = await import("expo-sharing");
        const cacheDir = FileSystem.cacheDirectory;
        if (cacheDir && base64) {
          const dest = `${cacheDir}${cleanTitle}.${ext}`;
          await FileSystem.writeAsStringAsync(dest, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(dest, {
              mimeType,
              dialogTitle: title || "Recurso educativo",
              ...(isPdf ? { UTI: "com.adobe.pdf" } : {}),
            });
            return;
          }
        }
      } catch (e) {
        console.log("[VitMaterna] Error abriendo recurso data URL en móvil:", e);
      }
    }
  }

  const { Linking } = await import("react-native");
  await Linking.openURL(url).catch(() => {});
}
