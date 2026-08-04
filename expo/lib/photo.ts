/**
 * Selección y compresión de la foto de perfil: recorte cuadrado con el
 * selector del sistema y reducción a 320 px JPEG (liviana para zonas con
 * poca señal, ~20 KB por foto).
 */
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export async function pickAvatarDataUrl(): Promise<string | null> {
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

  const context = ImageManipulator.manipulate(asset.uri);
  context.resize({ width: 320, height: null });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.72,
    base64: true,
  });
  return saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : null;
}
