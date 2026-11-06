// Ejercicios de una microleccion. Las lecciones originales conservan sus cinco ejercicios
// generados, en el mismo orden, para no romper el progreso guardado.
import { buildExercise, prepareAuthored, seededRng } from './exercises.js';

export function lessonExercises(userId, lesson) {
  const rng = seededRng(`${userId}:${lesson.id}`);
  const types = ['listen_choose', 'complete', 'recall'];
  const fromVocab = lesson.vocab.slice(0, 3).map((id, i) => buildExercise(types[i % 3], id, rng));
  const authored = (lesson.exercises ?? []).map((ex) => prepareAuthored(ex, rng));
  if (authored.length) return [...fromVocab.slice(0, 2), ...authored];
  return [...fromVocab, buildExercise('respond', lesson.vocab[1], rng), buildExercise('repeat', lesson.vocab[0], rng)];
}
