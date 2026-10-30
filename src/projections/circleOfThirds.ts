import type { GeometrySlot } from '../domain/harmonicField.ts';

/**
 * A circle-of-thirds embedding. Major thirds receive a visibly larger arc than
 * minor thirds, so their differing sizes are carried by the geometry itself.
 *
 * The ratio is a legibility choice for this study, not a claimed measurement
 * of the source artwork. This remains a projection, separate from the key.
 */
export type Point = Readonly<{ x: number; y: number }>;
export type CircleOfThirdsLayout = Readonly<Record<GeometrySlot, Point>>;

const degreesAroundThirds: readonly [GeometrySlot, ...GeometrySlot[]] = [
  'I', 'iii', 'V', 'vii°', 'ii', 'IV', 'vi',
];

const majorThirdArc = 68;
const minorThirdArc = 39;
const outgoingArc: Readonly<Record<GeometrySlot, number>> = {
  I: majorThirdArc,
  ii: minorThirdArc,
  iii: minorThirdArc,
  IV: majorThirdArc,
  V: majorThirdArc,
  vi: minorThirdArc,
  'vii°': minorThirdArc,
};

const pointAt = (angle: number): Point => {
  const radius = 37;
  const radians = angle * Math.PI / 180;
  return {
    x: 50 + radius * Math.cos(radians),
    y: 50 + radius * Math.sin(radians),
  };
};

const layout = (): CircleOfThirdsLayout => {
  let angle = 90;
  const points = {} as Record<GeometrySlot, Point>;

  for (const degree of degreesAroundThirds) {
    points[degree] = pointAt(angle);
    angle -= outgoingArc[degree];
  }

  return points;
};

export const sourceCircleLayout = layout();
