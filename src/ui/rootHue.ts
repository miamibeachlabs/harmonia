/**
 * Hue follows the written root letter, not sounding pitch.
 * D♯ therefore shares D's hue; E♭ shares E's hue.
 */
const rootLetterHue: Readonly<Record<string, number>> = {
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
  F: 11,
};

export const rootHueClass = (note: string) => `root-hue-${rootLetterHue[note[0]?.toUpperCase() ?? ''] ?? 0}`;
