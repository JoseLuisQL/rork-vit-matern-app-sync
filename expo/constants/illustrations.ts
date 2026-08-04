/**
 * Ilustraciones e iconos personalizados de VitMaterna, dibujados a medida
 * (crayola y gouache con textura granulada, paleta teal/terracota/ocre/azul/
 * ciruela). Se descargan una vez y quedan guardados en el teléfono (caché de
 * disco), así que también se ven sin señal después de la primera carga.
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
  /** Obstetra recibiendo a una mamá frente al centro de salud (login). */
  bienvenida: `${R2}/d5793c89-45b7-4a97-9b56-fe6f7f0d0ed5.png`,
  /** Centro de salud andino con cruz y cantutas (administración). */
  centroSalud: `${R2}/b00f5587-b43d-4d84-b571-1aeb94b48bfe.png`,
  /** Libreta de citas abierta con lápiz y cantutas (agenda de la obstetra). */
  libreta: `${R2}/7763fb6e-3f8d-4081-b837-2dc13cd4314a.png`,
  /** Carnet prenatal con corazón y lápiz (actualizar datos de la ficha). */
  carnet: `${R2}/4a7249b9-89a8-487a-89f1-04223a4d83df.png`,
  /** Estetoscopio que forma un corazón (bloque "Su salud"). */
  estetoscopio: `${R2}/22019f07-b430-47b1-85c9-bc1716424966.png`,
  /** Dos telefonitos conversando con un corazón (chat en vivo). */
  chatVivo: `${R2}/69e0bf0c-cb86-470b-a1fa-4adc90fea5f4.png`,
  /** Botón rojo de ayuda con corazón y ondas (SOS / emergencia). */
  sos: `${R2}/0ee88932-8daa-4af9-9c7a-8b19fa4d673c.png`,
  /** Mano con globo de aviso ámbar (reporte de síntomas). */
  sintomas: `${R2}/77f2592e-ae32-43b1-b9ba-d794fcbe99ed.png`,
  /** Campanita dormida bajo la luna (sin alertas pendientes). */
  calma: `${R2}/8231e083-e646-4a2b-a512-812396724425.png`,
} as const;

/** Iconos dibujados a crayola para pestañas, bloques y recordatorios. */
export const GICON = {
  /** Casita andina con corazón (Inicio). */
  casa: `${R2}/2f99a164-c583-487f-8c92-2cd47c67628a.png`,
  /** Hoja de calendario con corazón (Citas / Agenda). */
  citas: `${R2}/551ad9c4-847a-44d6-b7c0-14c9be6c121d.png`,
  /** Frasco con pastillas (Pastillas). */
  pastillas: `${R2}/d66d21a2-f05b-4082-a05c-20da14a41b56.png`,
  /** Globo de diálogo con corazón (Mensajes / Chat). */
  mensajes: `${R2}/d2c9f2e5-9377-44a4-804a-49e437cb4931.png`,
  /** Libro abierto con brote y sol (Consejos). */
  libro: `${R2}/0692ece2-7c1c-4407-8646-599f8d86aa69.png`,
  /** Campanita amable (recordatorios / alertas). */
  campana: `${R2}/162ad0a5-c906-477c-8dcc-6b8d38c416f9.png`,
  /** Mamá gestante con corazoncito (pestaña Gestantes de la obstetra). */
  gestantes: `${R2}/a50d683c-fe6d-4cdd-a604-41af3349027b.png`,
  /** Barras que crecen con un brote (Reportes de administración). */
  reportes: `${R2}/62435b96-fe68-4a65-8162-1ca34378adde.png`,
  /** Dos personas de la comunidad con corazón (Usuarios). */
  usuarios: `${R2}/fb46aa66-331d-4a5c-93f8-d254030027c0.png`,
  /** Persona sonriente en círculo con solcito (Perfil). */
  perfil: `${R2}/0c2937d8-712b-4c8e-bd0c-caef5fdb39b6.png`,
} as const;

/**
 * Dibujo de cada tipo de medicamento (el tipo se detecta por el nombre en
 * lib/medIllustration): así cada pastilla se reconoce por su dibujo sin leer.
 */
export const MEDILU = {
  /** Pastillas de hierro (sulfato ferroso). */
  hierro: `${R2}/fcb07eec-c02d-4ff1-8f2d-34e38b576fc9.png`,
  /** Hoja con tableta de ácido fólico. */
  folico: `${R2}/65678694-5b81-418e-99be-cd6551fbb16f.png`,
  /** Vaso de leche con tabletas de calcio. */
  calcio: `${R2}/deb49cd1-3a96-4db1-af8f-255616a026a0.png`,
  /** Corazón con brazalete de presión. */
  presion: `${R2}/b05345cd-6ae5-4806-a8ff-9bd45a1d7d86.png`,
  /** Termómetro con tableta (dolor o fiebre). */
  alivio: `${R2}/aaf93d26-ace3-418d-802f-3e99ad698842.png`,
  /** Naranja con tableta de vitaminas. */
  vitamina: `${R2}/9551a89f-9974-4294-a5a1-e6461d6317b3.png`,
  /** Blíster de pastillas con vasito de agua (genérico). */
  generico: `${R2}/f61dd406-c97a-43d4-832e-a286a0734f04.png`,
} as const;

/** Dibujos de los avisos flotantes (toast): éxito, error y aviso. */
export const TOASTILU = {
  /** Corazón con check y confeti (todo salió bien). */
  exito: `${R2}/0c285158-ab76-4448-b925-4d0447d6229e.png`,
  /** Corazón con curita (algo salió mal, con cariño). */
  error: `${R2}/efb337c8-1b5e-449b-be47-9dea7cb114cc.png`,
  /** Campanita amable (aviso informativo). */
  aviso: `${R2}/1e7ad2b2-d912-4637-9991-133d4aa4a45a.png`,
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
