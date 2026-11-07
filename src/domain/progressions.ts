import type { Degree } from './harmonicField.ts';

export type Progression = Readonly<{
  id: string;
  label: string;
  family: ProgressionFamily;
  degrees: readonly Degree[];
}>;

export type ProgressionFamily = 'foundations' | 'cadences' | 'loops' | 'exploration';

export const progressionFamilies: Readonly<Record<ProgressionFamily, string>> = {
  foundations: 'Foundations',
  cadences: 'Cadences and turnarounds',
  loops: 'Modern repeating loops',
  exploration: 'Harmonic exploration',
};

const progression = (id: string, family: ProgressionFamily, label: string, degrees: readonly Degree[]): Progression => ({ id, family, label, degrees });

/** Moves the first chord to the end without changing the cycle's order. */
export const rotate = <Item>(items: readonly Item[]): readonly Item[] =>
  items.length > 1 ? [...items.slice(1), items[0]] : items;

export const rotateBy = <Item>(items: readonly Item[], count: number): readonly Item[] =>
  Array.from({ length: items.length ? count % items.length : 0 }).reduce<readonly Item[]>(ordered => rotate(ordered), items);

/** A small, diatonic-major starting library for studying ordered harmonic motion. */
export const majorProgressions: readonly Progression[] = [
  progression('authentic', 'foundations', 'I–V–I · Authentic resolution', ['I', 'V', 'I']),
  progression('plagal', 'foundations', 'I–IV–I · Plagal motion', ['I', 'IV', 'I']),
  progression('primary-triads', 'foundations', 'I–IV–V–I · Primary-chord cycle', ['I', 'IV', 'V', 'I']),
  progression('two-five-one', 'cadences', 'ii–V–I · Jazz cadence', ['ii', 'V', 'I']),
  progression('turnaround', 'cadences', 'I–vi–ii–V · Jazz turnaround', ['I', 'vi', 'ii', 'V']),
  progression('doo-wop', 'cadences', "I–vi–IV–V · '50s / doo-wop", ['I', 'vi', 'IV', 'V']),
  progression('pop-axis', 'loops', 'I–V–vi–IV · Axis / four-chord pop', ['I', 'V', 'vi', 'IV']),
  progression('axis-rotation', 'loops', 'vi–IV–I–V · Axis rotation', ['vi', 'IV', 'I', 'V']),
  progression('doo-wop-loop', 'loops', 'I–vi–IV–V · Doo-wop loop', ['I', 'vi', 'IV', 'V']),
  progression('pop-variation', 'loops', 'I–IV–vi–V · Pop variation', ['I', 'IV', 'vi', 'V']),
  progression('mediant', 'exploration', 'I–iii–IV–V · Mediant motion', ['I', 'iii', 'IV', 'V']),
  progression('descending-fifths', 'exploration', 'I–vi–ii–V · Descending-fifths roots', ['I', 'vi', 'ii', 'V']),
  progression('extended-circle', 'exploration', 'iii–vi–ii–V–I · Extended circle progression', ['iii', 'vi', 'ii', 'V', 'I']),
  progression('leading-tone', 'exploration', 'vii°–I · Leading-tone resolution', ['vii°', 'I']),
];

export const progressionNamed = (id: string): Progression => {
  const found = majorProgressions.find(progression => progression.id === id);
  if (!found) throw new Error(`${id} is not an available progression.`);
  return found;
};
