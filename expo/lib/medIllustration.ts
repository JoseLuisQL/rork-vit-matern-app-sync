/**
 * Ilustración de cada medicamento según su nombre: hierro, ácido fólico,
 * calcio, presión, alivio (dolor/fiebre), vitaminas o genérico. Permite que
 * la gestante reconozca cada pastilla por su dibujo sin necesidad de leer.
 */
import { MEDILU } from "@/constants/illustrations";

/** Minúsculas y sin tildes, para comparar aunque haya errores de escritura. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const RULES: { source: string; keywords: string[] }[] = [
  { source: MEDILU.hierro, keywords: ["ferroso", "hierro", "ferrico", "polimaltosado"] },
  { source: MEDILU.folico, keywords: ["folico", "folato"] },
  { source: MEDILU.calcio, keywords: ["calcio"] },
  {
    source: MEDILU.presion,
    keywords: ["metildopa", "nifedipino", "labetalol", "aspirina", "presion"],
  },
  {
    source: MEDILU.alivio,
    keywords: ["paracetamol", "acetaminofen", "ibuprofeno", "dolor", "fiebre"],
  },
  { source: MEDILU.vitamina, keywords: ["vitamina", "prenatal", "multivitamin", "complejo b"] },
];

/** Dibujo que representa al medicamento (blíster genérico si no se reconoce). */
export function medIllustration(name: string): string {
  const clean = normalize(name);
  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => clean.includes(keyword))) return rule.source;
  }
  return MEDILU.generico;
}
