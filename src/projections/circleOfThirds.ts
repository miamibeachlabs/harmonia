import type { Degree } from '../domain/majorKey.ts';

/**
 * The source's asymmetric, circle-of-fifths embedding. This is a projection
 * of a key, deliberately kept outside the musical model.
 */
export type Point = Readonly<{ x: number; y: number }>;
export type CircleOfThirdsLayout = Readonly<Record<Degree, Point>>;

export const sourceCircleLayout: CircleOfThirdsLayout = {
  I: { x: 50, y: 78 },
  ii: { x: 35, y: 16 },
  iii: { x: 88, y: 82 },
  IV: { x: 25, y: 43 },
  V: { x: 78, y: 54 },
  vi: { x: 19, y: 76 },
  'vii°': { x: 64, y: 22 },
};
