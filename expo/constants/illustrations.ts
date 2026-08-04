/**
 * Ilustraciones e iconos personalizados de VitMaterna, dibujados a medida
 * para la sección de la gestante (crayola y gouache con textura granulada,
 * paleta teal/terracota/ocre). Se descargan una vez y quedan guardados en el
 * teléfono (caché de disco), así que también se ven sin señal después de la
 * primera carga.
 */
const BASE = "https://rork.app/pa/ztb4shx7jxkj17tpuz62u";
const R2 = "https://r2-pub.rork.com/projects/ztb4shx7jxkj17tpuz62u/assets";

export const ILU = {
  /** Mamá andina esperando a su bebé (tarjeta "Mi embarazo"). */
  mama: `${BASE}/pregnant_woman_sun_motif`,
  /** Pastillas de hierro con vaso de agua (pestaña Pastillas). */
  pastillas: `${BASE}/supplement_bottle_pills_water`,
  /** Obstetra amable con su tablilla (citas). */
  obstetra: `${BASE}/midwife_with_clipboard`,
  /** Manos cuidando un corazón (pedir ayuda). */
  manos: `${BASE}/hands_cradling_heart`,
  /** Comida nutritiva andina (consejos de nutrición). */
  comida: `${BASE}/quinoa_bowl_egg`,
  /** Sol andino sonriente (celebraciones). */
  sol: `${BASE}/andean_sun_smiling`,
  /** Botiquín con cruz y corazón (consejos de urgencias). */
  botiquin: `${R2}/29ced61b-f52b-4b27-a96e-8386e42bdfbb.png`,
  /** Manta andina lista con ropita de bebé (plan de parto). */
  maletin: `${R2}/b48e5018-8e61-41ce-9a08-991c30468672.png`,
  /** Mamá cargando a su recién nacido (posparto y lactancia). */
  mamaBebe: `${R2}/c1b28f84-8bc0-4ab1-b164-1e206e435030.png`,
  /** Taza de mate calientito con cantutas (ánimo y salud mental). */
  taza: `${R2}/427d885e-7495-4d58-8141-5090196e36b3.png`,
  /** Teléfono con globitos y corazones (mensajes). */
  chat: `${R2}/9a22c423-9ac4-4c12-8d63-9ee951fe8289.png`,
  /** Ramita de cantutas, más ancha que alta (adorno). */
  flores: `${R2}/ca195496-ae36-4650-8e5e-f9f463e281cf.png`,
} as const;

/** Iconos dibujados a crayola para pestañas, bloques y recordatorios. */
export const GICON = {
  /** Casita andina con corazón (Inicio). */
  casa: `${R2}/2f99a164-c583-487f-8c92-2cd47c67628a.png`,
  /** Hoja de calendario con corazón (Citas). */
  citas: `${R2}/551ad9c4-847a-44d6-b7c0-14c9be6c121d.png`,
  /** Frasco con pastillas (Pastillas). */
  pastillas: `${R2}/d66d21a2-f05b-4082-a05c-20da14a41b56.png`,
  /** Globo de diálogo con corazón (Mensajes). */
  mensajes: `${R2}/d2c9f2e5-9377-44a4-804a-49e437cb4931.png`,
  /** Libro abierto con brote y sol (Consejos). */
  libro: `${R2}/0692ece2-7c1c-4407-8646-599f8d86aa69.png`,
  /** Campanita amable (recordatorios). */
  campana: `${R2}/162ad0a5-c906-477c-8dcc-6b8d38c416f9.png`,
} as const;

/** Dibujo de cada categoría de consejos (educación). */
export const CATEGORY_ILU: Record<string, string> = {
  "Nutrición": ILU.comida,
  "Urgencias": ILU.botiquin,
  "Tratamiento": ILU.pastillas,
  "Preparación": ILU.maletin,
  "Posparto": ILU.mamaBebe,
  "Salud mental": ILU.taza,
};
