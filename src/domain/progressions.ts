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
  cadences: 'Cadences & turnarounds',
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
  progression('authentic', 'foundations', 'Authentic resolution · I–V–I', ['I', 'V', 'I']),
  progression('plagal', 'foundations', 'Plagal motion · I–IV–I', ['I', 'IV', 'I']),
  progression('primary-triads', 'foundations', 'Primary-chord cycle · I–IV–V–I', ['I', 'IV', 'V', 'I']),
  progression('two-five-one', 'cadences', 'Jazz cadence · ii–V–I', ['ii', 'V', 'I']),
  progression('turnaround', 'cadences', 'Turnaround · I–vi–ii–V', ['I', 'vi', 'ii', 'V']),
  progression('doo-wop', 'cadences', "'50s / doo-wop · I–vi–IV–V", ['I', 'vi', 'IV', 'V']),
  progression('pop-axis', 'loops', 'Axis / four-chord pop · I–V–vi–IV', ['I', 'V', 'vi', 'IV']),
  progression('pop-variation', 'loops', 'Pop variation · I–IV–vi–V', ['I', 'IV', 'vi', 'V']),
  progression('mediant', 'exploration', 'Mediant motion · I–iii–IV–V', ['I', 'iii', 'IV', 'V']),
  progression('descending-fifths', 'exploration', 'Descending fifths · I–vi–ii–V', ['I', 'vi', 'ii', 'V']),
  progression('extended-circle', 'exploration', 'Extended circle · iii–vi–ii–V–I', ['iii', 'vi', 'ii', 'V', 'I']),
  progression('leading-tone', 'exploration', 'Leading-tone resolution · vii°–I', ['vii°', 'I']),
];

export const progressionNamed = (id: string): Progression => {
  const found = majorProgressions.find(progression => progression.id === id);
  if (!found) throw new Error(`${id} is not an available progression.`);
  return found;
};
