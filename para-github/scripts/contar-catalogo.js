// Recuento reproducible del catalogo. Uso: npm run contar
import { VOCAB } from '../content/vocab.js';
import { LESSONS, UNITS } from '../content/units.js';
import { SCENARIOS } from '../content/scenarios.js';
import { DIAGNOSTIC } from '../content/diagnostic.js';

import { lessonExercises } from '../server/lessons.js';
const exerciseCount = LESSONS.reduce((n, l) => n + lessonExercises(1, l).length, 0);
const counts = {
  unidades: UNITS.length,
  microlecciones: LESSONS.length,
  ejerciciosDeLeccion: exerciseCount,
  ejerciciosEscritosAMano: LESSONS.reduce((n, l) => n + (l.exercises?.length ?? 0), 0),
  preguntasDiagnostico: DIAGNOSTIC.length,
  simulaciones: SCENARIOS.length,
  momentosDeSimulacion: SCENARIOS.reduce((n, s) => n + s.beats.length, 0),
  vocabulario: VOCAB.length,
};
console.log(JSON.stringify(counts, null, 2));
