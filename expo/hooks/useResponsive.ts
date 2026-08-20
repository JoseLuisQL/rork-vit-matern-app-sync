/**
 * Hook de responsividad adaptativo para VitMaterna.
 * Permite detectar si la pantalla actual es Móvil (<768px), Tablet (768-1023px) o Escritorio (>=1024px).
 * En plataformas móviles nativas (iOS / Android) siempre prioriza la experiencia móvil táctil.
 */
import { Platform, useWindowDimensions } from "react-native";

export interface ResponsiveInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  isWeb: boolean;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === "web";

  const isDesktop = isWeb && width >= 1024;
  const isTablet = isWeb && width >= 768 && width < 1024;
  const isMobile = !isWeb || width < 768;
  const isWide = isWeb && width >= 1280;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isWeb,
  };
}
