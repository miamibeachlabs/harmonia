import { pitchClassOf } from '../domain/harmonicField.ts';

/**
 * A stable Harmonia color order around the Circle of Fifths.
 * This is an interface convention, not a universal music-theory standard.
 */
const fifthsPosition: Readonly<Record<number, number>> = {
  0: 0,
  7: 1,
  2: 2,
  9: 3,
  4: 4,
  11: 5,
  6: 6,
  1: 7,
  8: 8,
  3: 9,
  10: 10,
  5: 11,
};

export const rootHueClass = (note: string) => `root-hue-${fifthsPosition[pitchClassOf(note)]}`;
