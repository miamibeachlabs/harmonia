import type { Degree } from './harmonicField.ts';

export type Progression = Readonly<{
  id: string;
  name: string;
  degrees: readonly Degree[];
}>;

const progression = (id: string, name: string, degrees: readonly Degree[]): Progression => ({ id, name, degrees });

/** A small, diatonic-major starting library for studying ordered harmonic motion. */
export const majorProgressions: readonly Progression[] = [
  progression('pop-axis', 'I–V–vi–IV', ['I', 'V', 'vi', 'IV']),
  progression('doo-wop', 'I–vi–IV–V', ['I', 'vi', 'IV', 'V']),
  progression('two-five-one', 'ii–V–I', ['ii', 'V', 'I']),
  progression('primary-triads', 'I–IV–V–I', ['I', 'IV', 'V', 'I']),
  progression('pop-rotation', 'vi–IV–I–V', ['vi', 'IV', 'I', 'V']),
  progression('turnaround', 'I–vi–ii–V', ['I', 'vi', 'ii', 'V']),
];

export const progressionNamed = (id: string): Progression => {
  const found = majorProgressions.find(progression => progression.id === id);
  if (!found) throw new Error(`${id} is not an available progression.`);
  return found;
};
