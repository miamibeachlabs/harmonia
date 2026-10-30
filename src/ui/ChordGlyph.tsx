type ChordGlyphProps = Readonly<{
  rootHue: string;
  pitchClasses: readonly number[];
  label: string;
}>;

const blackKeyX: Readonly<Record<number, number>> = {
  1: .66,
  3: 1.66,
  6: 3.66,
  8: 4.66,
  10: 5.66,
};

const whiteKeyX: Readonly<Record<number, number>> = {
  0: 0,
  2: 1,
  4: 2,
  5: 3,
  7: 4,
  9: 5,
  11: 6,
};

/** A one-octave chord voicing: a compact companion to the full keyboard lens. */
export const ChordGlyph = ({ rootHue, pitchClasses, label }: ChordGlyphProps) => {
  const selected = (pitchClass: number) => pitchClasses.includes(pitchClass);

  return (
    <svg class={`chord-glyph ${rootHue}`} viewBox="0 0 7 3.2" role="img" aria-label={label}>
      {Object.entries(whiteKeyX).map(([pitchClass, x]) => (
        <rect class={`chord-glyph__white ${selected(Number(pitchClass)) ? 'is-selected' : ''}`} x={x} y="0" width="1" height="3.2" />
      ))}
      {Object.entries(blackKeyX).map(([pitchClass, x]) => (
        <rect class={`chord-glyph__black ${selected(Number(pitchClass)) ? 'is-selected' : ''}`} x={x} y="0" width=".68" height="2" rx=".05" />
      ))}
    </svg>
  );
};
