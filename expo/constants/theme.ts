/**
 * VITMATERNA — Sistema de diseño "Clínico minimalista".
 * Fondos casi blancos, superficies blancas con borde fino (sin degradados),
 * un acento de salud por rol y semáforo clínico siempre acompañado de texto.
 */
import { Platform, ViewStyle } from "react-native";
import type { Role } from "@/types";

export const common = {
  background: "#F7F9F9",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F4F5",
  surfaceHover: "#E9EEEF",
  text: "#17242B",
  textSecondary: "#57696F",
  textTertiary: "#8395A0",
  border: "#E5EAEC",
  borderStrong: "#D3DCDF",
  disabled: "#C4CFD3",
  overlay: "rgba(16,36,43,0.45)",
  white: "#FFFFFF",
} as const;

/** Acento del rol gestante — teal esmeralda de salud. */
export const gestanteTheme = {
  primary: "#0C8174",
  primaryDark: "#0A6B60",
  primaryLight: "#E9F5F3",
  primaryMid: "#C9E8E3",
  onPrimary: "#FFFFFF",
} as const;

/** Acento del rol obstetra — azul clínico sereno. */
export const obstetraTheme = {
  primary: "#2C6EA8",
  primaryDark: "#245988",
  primaryLight: "#EAF2F9",
  primaryMid: "#CBE0F0",
  onPrimary: "#FFFFFF",
} as const;

/** Acento del rol administración — ciruela institucional (marca). */
export const adminTheme = {
  primary: "#5B2A5E",
  primaryDark: "#48214B",
  primaryLight: "#F4ECF5",
  primaryMid: "#E2CFE4",
  onPrimary: "#FFFFFF",
} as const;

export interface RoleAccent {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMid: string;
  onPrimary: string;
}

export function roleAccent(role: Role | undefined): RoleAccent {
  if (role === "obstetra") return obstetraTheme;
  if (role === "admin") return adminTheme;
  return gestanteTheme;
}

/**
 * Paleta cálida exclusiva de la sección gestante — "cuaderno de cuidado".
 * Papel crema, tinta cálida y acentos teal/terracota/ocre. Diseñada para
 * usuarias rurales: alto contraste, superficies suaves, cero look clínico.
 */
export const gwarm = {
  bg: "#FAF4EA",
  surface: "#FFFFFF",
  surfaceSoft: "#FFFDF7",
  border: "#F0E6D4",
  borderStrong: "#DFD1B8",
  ink: "#33302A",
  inkSoft: "#6E6557",
  inkFaint: "#9C9078",
  teal: "#0C8174",
  tealDeep: "#0A6B60",
  tealSoft: "#E3F1EE",
  tealMid: "#BFE0DA",
  terracotta: "#C05F33",
  terracottaSoft: "#FAEDE4",
  amber: "#A97613",
  amberSoft: "#FBF1DC",
  amberMid: "#F0DFB6",
  rose: "#C25B6A",
  roseSoft: "#FAECEA",
  redSoft: "#FCEDE8",
  redMid: "#F2CDBF",
} as const;

/** Sombra suave y cálida para las tarjetas de la gestante. */
export const gShadow: ViewStyle = Platform.select<ViewStyle>({
  web: { boxShadow: "0 10px 26px rgba(148,124,90,0.10)" } as ViewStyle,
  default: {
    shadowColor: "#947C5A",
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
}) as ViewStyle;

/**
 * Acentos cálidos por rol sobre el papel crema del "cuaderno de cuidado":
 * teal (gestante), azul petróleo (obstetra) y ciruela (administración).
 * Toda la app comparte el mismo fondo cálido para sentirse hecha a mano.
 */
export interface WarmAccent {
  main: string;
  deep: string;
  soft: string;
  mid: string;
}

export const warmTeal: WarmAccent = {
  main: "#0C8174",
  deep: "#0A6B60",
  soft: "#E3F1EE",
  mid: "#BFE0DA",
};

export const warmBlue: WarmAccent = {
  main: "#2E6C96",
  deep: "#245778",
  soft: "#E6EFF3",
  mid: "#C5DBE6",
};

export const warmPlum: WarmAccent = {
  main: "#5B2A5E",
  deep: "#4A2250",
  soft: "#F2EAF3",
  mid: "#DFC9E2",
};

export function warmAccent(role: Role | undefined): WarmAccent {
  if (role === "obstetra") return warmBlue;
  if (role === "admin") return warmPlum;
  return warmTeal;
}

/** Marca (logo): ciruela + rosa. */
export const brand = {
  plum: "#5B2A5E",
  rosa: "#DFA0A8",
  rosaLight: "#F8ECEE",
} as const;

export const semantic = {
  success: "#1F9D6B",
  successMid: "#BBEAD3",
  successLight: "#EAF7F0",
  warning: "#A97613",
  warningMid: "#F3E0B4",
  warningLight: "#FBF4E3",
  danger: "#D64545",
  dangerMid: "#F2C4C4",
  dangerLight: "#FBEDED",
  info: "#2C6EA8",
  infoMid: "#CBE0F0",
  infoLight: "#EAF2F9",
} as const;

/** Semáforo de riesgo gestacional. Siempre acompañado de etiqueta de texto. */
export const risk = {
  verde: { solid: "#1F9D6B", mid: "#BBEAD3", light: "#EAF7F0" },
  amarillo: { solid: "#A97613", mid: "#F3E0B4", light: "#FBF4E3" },
  rojo: { solid: "#D64545", mid: "#F2C4C4", light: "#FBEDED" },
} as const;

export const chatColors = {
  readReceipt: "#9BE7FF",
  tickOnBubble: "rgba(255,255,255,0.65)",
  timeOnBubble: "rgba(255,255,255,0.78)",
} as const;

/** Familias Inter cargadas en el layout raíz. */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

/**
 * Fuentes manuscritas de la sección gestante ("cuaderno de cuidado"):
 * Patrick Hand para títulos, números y botones (trazo de plumón a mano) y
 * Delius para el cuerpo (letra a mano redonda, muy legible incluso para
 * quien lee poco). Cargadas en el layout raíz.
 */
export const gfonts = {
  hand: "PatrickHand_400Regular",
  handBody: "Delius_400Regular",
} as const;

interface TypeToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

const make = (
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  letterSpacing = 0,
): TypeToken => ({ fontFamily, fontSize, lineHeight, letterSpacing });

/** Escala tipográfica (cuerpo mínimo 15px, claridad ante todo). */
export const type = {
  displayXl: make(fonts.bold, 32, 40, -0.5),
  display: make(fonts.bold, 28, 36, -0.4),
  h1: make(fonts.bold, 24, 32, -0.3),
  h2: make(fonts.semibold, 20, 28, -0.2),
  h3: make(fonts.semibold, 17, 24, -0.1),
  h4: make(fonts.semibold, 15, 22, 0),
  bodyXl: make(fonts.regular, 17, 26),
  bodyXlMd: make(fonts.medium, 17, 26),
  bodyLg: make(fonts.regular, 16, 26),
  body: make(fonts.regular, 15, 24),
  bodyMd: make(fonts.medium, 15, 24),
  bodySm: make(fonts.regular, 13, 20),
  label: make(fonts.medium, 13, 18, 0.1),
  caption: make(fonts.regular, 12, 16, 0.1),
  overline: make(fonts.semibold, 11, 15, 0.8),
  button: make(fonts.semibold, 15, 22, 0.2),
  buttonSm: make(fonts.semibold, 13, 18, 0.2),
  numeric: make(fonts.bold, 32, 38, -0.5),
  numericMd: make(fonts.bold, 24, 30, -0.3),
  numericSm: make(fonts.semibold, 18, 24, -0.2),
} as const;

/** Grid de 8pt. */
export const spacing = {
  xs2: 2,
  xs: 4,
  sm: 8,
  sm2: 12,
  md: 16,
  md2: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Jerarquía por borde fino; sombras solo para elementos flotantes. */
export const cardBorder: ViewStyle = {
  borderWidth: 1,
  borderColor: common.border,
};

export const shadows: Record<"raised" | "bar", ViewStyle> = {
  raised: Platform.select<ViewStyle>({
    web: { boxShadow: "0 6px 22px rgba(22,36,43,0.14)" } as ViewStyle,
    default: {
      shadowColor: "#16242B",
      shadowOpacity: 0.14,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
  }) as ViewStyle,
  bar: Platform.select<ViewStyle>({
    web: { boxShadow: "0 -2px 12px rgba(22,36,43,0.06)" } as ViewStyle,
    default: {
      shadowColor: "#16242B",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -2 },
      elevation: 8,
    },
  }) as ViewStyle,
};

/** Aplica opacidad a un hex de 3 o 6 dígitos → rgba(). */
export function withAlpha(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
}
