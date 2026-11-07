import type { Degree } from './harmonicField.ts';

export type Progression = Readonly<{
  id: string;
  label: string;
  description: string;
  family: ProgressionFamily;
  degrees: readonly Degree[];
}>;

export type ProgressionFamily = 'foundations' | 'cadences' | 'loops' | 'exploration';

/** Presented in the order a player is most likely to reach for them. */
export const progressionFamilies: Readonly<Record<ProgressionFamily, string>> = {
  loops: 'Pop & Traditional Loops',
  cadences: 'Cadences and turnarounds',
  foundations: 'Foundations',
  exploration: 'Harmonic exploration',
};

const progression = (id: string, family: ProgressionFamily, label: string, description: string, degrees: readonly Degree[]): Progression => ({ id, family, label, description, degrees });

/** Moves the first chord to the end without changing the cycle's order. */
export const rotate = <Item>(items: readonly Item[]): readonly Item[] =>
  items.length > 1 ? [...items.slice(1), items[0]] : items;

export const rotateBy = <Item>(items: readonly Item[], count: number): readonly Item[] => {
  const positions = items.length ? (count % items.length + items.length) % items.length : 0;
  return Array.from({ length: positions }).reduce<readonly Item[]>(ordered => rotate(ordered), items);
};

/** A small, diatonic-major starting library for studying ordered harmonic motion. */
export const majorProgressions: readonly Progression[] = [
  progression('dominant', 'foundations', 'I–V–I · Dominant resolution', 'The simplest demonstration of dominant-to-tonic resolution. V creates tension through its leading tone, which resolves naturally to I.', ['I', 'V', 'I']),
  progression('plagal', 'foundations', 'I–IV–I · Plagal motion', 'Moves from tonic to subdominant and back, producing a gentler return than V–I. The IV–I motion is associated with the Amen cadence in hymns and church music.', ['I', 'IV', 'I']),
  progression('primary-triads', 'foundations', 'I–IV–V–I · Primary-chord cycle', 'Uses the three primary chords of a major key to establish, depart from, and return to the tonic. Together they contain all seven notes of the major scale.', ['I', 'IV', 'V', 'I']),
  progression('two-five-one', 'cadences', 'ii–V–I · Jazz cadence', 'The quintessential jazz progression: ii prepares the dominant V, which resolves to tonic I. Its roots move by descending fifths, creating strong harmonic direction.', ['ii', 'V', 'I']),
  progression('turnaround', 'cadences', 'I–vi–ii–V · Jazz turnaround', 'A classic turnaround that leaves the tonic and works back toward it through descending-fifth root motion. It is designed to lead naturally into the next repetition.', ['I', 'vi', 'ii', 'V']),
  progression('pop-axis', 'loops', 'I–V–vi–IV · Axis / Four-chord pop', 'One of the most recognizable progressions in modern popular music. Its cyclic rotations produce several other familiar pop progressions.', ['I', 'V', 'vi', 'IV']),
  progression('axis-rotation', 'loops', 'vi–IV–I–V · Axis rotation', 'A rotation of I–V–vi–IV that begins on the relative minor. It uses the same chords in the same cyclic order, but changes which chord receives the initial emphasis.', ['vi', 'IV', 'I', 'V']),
  progression('doo-wop', 'loops', "I–vi–IV–V · '50s / Doo-wop", 'The signature four-chord loop of 1950s doo-wop and early rock and roll. It moves from tonic to its relative minor, then through IV and V back to I.', ['I', 'vi', 'IV', 'V']),
  progression('pop-variation', 'loops', 'I–IV–vi–V · Pop variation', 'A four-chord loop that moves through subdominant and relative minor before reaching dominant. Ending on V creates a strong pull back to I on every repetition.', ['I', 'IV', 'vi', 'V']),
  progression('mediant', 'exploration', 'I–iii–IV–V · Mediant motion', 'Introduces iii, the mediant chord, which shares two notes with I. This creates a smooth harmonic transition before moving to IV and V.', ['I', 'iii', 'IV', 'V']),
  progression('extended-circle', 'exploration', 'iii–vi–ii–V–I · Extended circle progression', 'A longer chain of descending-fifth root movements that passes through several diatonic chords before resolving to I. It reveals a systematic harmonic pattern rather than an arbitrary sequence.', ['iii', 'vi', 'ii', 'V', 'I']),
  progression('leading-tone', 'exploration', 'vii°–I · Leading-tone resolution', 'The diminished triad on the seventh scale degree resolves to tonic. Its root rises by a semitone while its other notes can resolve smoothly into the tonic triad.', ['vii°', 'I']),
];

export const progressionNamed = (id: string): Progression => {
  const found = majorProgressions.find(progression => progression.id === id);
  if (!found) throw new Error(`${id} is not an available progression.`);
  return found;
};
