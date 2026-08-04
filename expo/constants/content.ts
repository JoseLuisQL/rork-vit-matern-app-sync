/**
 * VITMATERNA — Contenido educativo y signos de alarma.
 * Vive en el teléfono para poder leerse siempre, incluso sin señal.
 */
import type { AlarmSign, Article } from "@/types";

export const ALARM_SIGNS: AlarmSign[] = [
  { id: "sangrado", label: "Sangrado vaginal", detail: "Aunque sea poquito, acude de inmediato." },
  { id: "cabeza", label: "Dolor de cabeza fuerte", detail: "Sobre todo si no calma con descanso." },
  { id: "vision", label: "Visión borrosa o lucecitas", detail: "Puede ser señal de presión alta." },
  { id: "fiebre", label: "Fiebre o escalofríos", detail: "Temperatura de 38 °C o más." },
  { id: "hinchazon", label: "Hinchazón de cara y manos", detail: "Diferente a la hinchazón normal de pies." },
  { id: "movimientos", label: "Tu bebé no se mueve", detail: "Menos movimientos de lo normal en el día." },
  { id: "contracciones", label: "Contracciones antes de tiempo", detail: "Dolores de parto antes de la semana 37." },
  { id: "liquido", label: "Pérdida de líquido", detail: "Salida de líquido claro o con olor." },
];

export const ARTICLES: Article[] = [
  {
    id: "a-alimentacion",
    category: "Nutrición",
    title: "Alimentación en el embarazo andino",
    minutes: 4,
    summary: "Quinua, habas, sangrecita: combate la anemia con lo que tienes en casa.",
    body: [
      "En la altura, tu cuerpo necesita más hierro que en la costa. La buena noticia: los alimentos de tu chacra son grandes aliados.",
      "Come cada semana: sangrecita, hígado, bazo, quinua, habas, lentejas y hojas verdes como la espinaca o el atago.",
      "Acompaña el hierro con vitamina C: un vaso de jugo de naranja, limonada o papaya ayuda a que tu cuerpo lo aproveche mejor.",
      "Evita tomar té, café o mates junto con las comidas principales y tus pastillas de hierro: cortan la absorción. Sepáralos por lo menos 2 horas.",
      "Toma de 6 a 8 vasos de agua hervida al día y usa siempre sal yodada.",
    ],
  },
  {
    id: "a-signos",
    category: "Urgencias",
    title: "Signos de alarma: cuándo acudir YA",
    minutes: 3,
    summary: "Reconoce las señales que no pueden esperar hasta tu próximo control.",
    body: [
      "Hay molestias normales del embarazo, pero otras son señales de peligro para ti y tu bebé.",
      "Acude de inmediato al centro de salud si tienes: sangrado, dolor de cabeza fuerte, visión borrosa, fiebre, hinchazón de cara y manos, o si tu bebé deja de moverse.",
      "No esperes a que pase. En la sierra las distancias son largas: ante la duda, sal temprano o pide apoyo a tu promotor de salud.",
      "Si no puedes movilizarte, usa el botón de emergencia de esta app: tu obstetra recibirá tu alerta con tu ubicación.",
      "Guarda los números de tu centro de salud y coordina con tu familia un plan de transporte desde ahora.",
    ],
  },
  {
    id: "a-suplementos",
    category: "Tratamiento",
    title: "Hierro y ácido fólico: por qué cada día cuenta",
    minutes: 3,
    summary: "La anemia en la altura se esconde. Tus pastillas son tu escudo.",
    body: [
      "A 2 900 metros de altura, un análisis de hemoglobina puede parecer normal y aún así haber anemia. Por eso tu obstetra corrige el resultado según la altitud.",
      "El sulfato ferroso previene la anemia, que causa cansancio, partos prematuros y bebés con bajo peso.",
      "Tómalo en ayunas con agua o jugo de naranja. Si te cae pesado, puedes tomarlo antes de dormir.",
      "Es normal que las heces se pongan oscuras. Si tienes náuseas o estreñimiento, cuéntale a tu obstetra: hay formas de aliviarlo sin dejar el tratamiento.",
      "Marca cada toma en la pestaña Tratamiento: tu obstetra ve tu avance y puede ayudarte a tiempo.",
    ],
  },
  {
    id: "a-plan-parto",
    category: "Preparación",
    title: "Tu plan de parto: decide con tiempo",
    minutes: 4,
    summary: "Dónde dar a luz, cómo llegar, quién te acompaña. Todo listo antes de la semana 37.",
    body: [
      "Un plan de parto es un acuerdo con tu familia y tu centro de salud para que el día del parto nada te tome por sorpresa.",
      "Decide dónde darás a luz: el parto institucional (en el centro de salud u hospital) es lo más seguro para ti y tu bebé.",
      "Coordina el transporte: ¿quién tiene carro o moto en tu comunidad? ¿Cuánto demora? Ten un plan B si es de noche o llueve.",
      "Prepara tu maletín desde la semana 34: DNI, tu carnet de controles, ropa abrigadora para ti y tu bebé, y frazadas.",
      "Elige a tu acompañante y avísale a tu obstetra. Tienes derecho a estar acompañada durante el parto.",
    ],
  },
  {
    id: "a-lactancia",
    category: "Posparto",
    title: "Lactancia: la primera hora de oro",
    minutes: 3,
    summary: "El calostro es la primera vacuna de tu bebé. Así te preparas desde ahora.",
    body: [
      "La leche materna es el mejor alimento: protege a tu bebé de infecciones y lo abriga por dentro en el frío de la sierra.",
      "La primera hora después del parto es de oro: pide que pongan a tu bebé en tu pecho apenas nazca.",
      "El calostro (la primera leche amarillita) es poquito pero poderoso: es la primera defensa de tu bebé. No lo deseches.",
      "Dale solo pecho hasta los 6 meses: ni agüitas ni mates. La leche materna tiene todo lo que necesita.",
      "Si te duele o sientes que no sale, pide ayuda en tu control: casi siempre se arregla mejorando la posición del bebé.",
    ],
  },
  {
    id: "a-bienestar",
    category: "Salud mental",
    title: "Cuidar tu ánimo también es cuidar tu embarazo",
    minutes: 3,
    summary: "Tristeza, preocupación o miedo: hablar a tiempo hace la diferencia.",
    body: [
      "El embarazo trae emociones fuertes: alegría, pero también miedo o preocupación. Todas son normales.",
      "Si la tristeza dura muchos días, no quieres levantarte o lloras sin razón, no estás sola: es más común de lo que crees y tiene solución.",
      "Busca compañía: camina con alguien de confianza, participa de las reuniones de tu comunidad, comparte cómo te sientes.",
      "En tu control te haremos unas preguntas sencillas sobre tu ánimo. Responde con confianza: nos ayuda a cuidarte mejor.",
      "Si sientes que te hacen daño en casa, cuéntale a tu obstetra. Te escucharemos sin juzgar y te acompañaremos.",
    ],
  },
];
