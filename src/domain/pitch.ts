export type DetectedPitch = Readonly<{
  frequency: number;
  midi: number;
  nearestMidi: number;
  cents: number;
  clarity: number;
}>;

/** Expresses a measured frequency in the equal-tempered musical coordinate system. */
export const pitchAt = (frequency: number, clarity: number): DetectedPitch => {
  const midi = 69 + 12 * Math.log2(frequency / 440);
  const nearestMidi = Math.round(midi);

  return {
    frequency,
    midi,
    nearestMidi,
    cents: (midi - nearestMidi) * 100,
    clarity,
  };
};
