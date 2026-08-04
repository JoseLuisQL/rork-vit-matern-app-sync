/**
 * Ilustraciones personalizadas de VitMaterna, creadas a medida para la
 * sección de la gestante (estilo gouache cálido, paleta teal/terracota).
 * Se descargan una vez y quedan guardadas en el teléfono (caché de disco),
 * así que también se ven sin señal después de la primera carga.
 */
const BASE = "https://rork.app/pa/ztb4shx7jxkj17tpuz62u";

export const ILU = {
  /** Mamá andina esperando a su bebé (tarjeta "Mi embarazo"). */
  mama: `${BASE}/pregnant_woman_sun_motif`,
  /** Pastillas de hierro con vaso de agua (pestaña Pastillas). */
  pastillas: `${BASE}/supplement_bottle_pills_water`,
  /** Obstetra amable con su tablilla (citas). */
  obstetra: `${BASE}/midwife_with_clipboard`,
  /** Manos cuidando un corazón (pedir ayuda). */
  manos: `${BASE}/hands_cradling_heart`,
  /** Comida nutritiva andina (consejos). */
  comida: `${BASE}/quinoa_bowl_egg`,
  /** Sol andino sonriente (celebraciones). */
  sol: `${BASE}/andean_sun_smiling`,
} as const;
