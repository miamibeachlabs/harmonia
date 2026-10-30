import type { HarmonicFunction } from '../domain/harmonicField.ts';

type PianoKey = Readonly<{
  pitchClass: number;
  x: number;
  black: boolean;
}>;

type PianoKeyboardProps = Readonly<{
  function: HarmonicFunction;
  pitchClasses: readonly number[];
  labels: ReadonlyMap<number, string>;
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

const keys = (): readonly PianoKey[] =>
  Array.from({ length: 37 }, (_, semitone) => {
    const octave = Math.floor(semitone / 12);
    const pitchClass = semitone % 12;
    const black = pitchClass in blackKeyX;
    const x = octave * 7 + (black ? blackKeyX[pitchClass] : whiteKeyX[pitchClass]);
    return { pitchClass, x, black };
  });

const keyboardKeys = keys();

/** A fixed C2–C5 keyboard makes chord pitch classes comparable across selections. */
export const PianoKeyboard = ({ function: harmonicFunction, pitchClasses, labels }: PianoKeyboardProps) => {
  const selected = new Set(pitchClasses);

  return (
    <svg class={`piano piano--${harmonicFunction}`} viewBox="0 0 22 5" role="img" aria-label="Chord tones repeated from C2 through C5">
      {keyboardKeys.filter(key => !key.black).map(key => (
        <g class={`piano-key piano-key--white ${selected.has(key.pitchClass) ? 'is-selected' : ''}`}>
          <rect x={key.x} y="0" width="1" height="5" />
          {selected.has(key.pitchClass) && <text x={key.x + .5} y="3.8">{labels.get(key.pitchClass)}</text>}
        </g>
      ))}
      {keyboardKeys.filter(key => key.black).map(key => (
        <g class={`piano-key piano-key--black ${selected.has(key.pitchClass) ? 'is-selected' : ''}`}>
          <rect x={key.x} y="0" width=".68" height="3.15" rx=".08" />
          {selected.has(key.pitchClass) && <text x={key.x + .34} y="2.2">{labels.get(key.pitchClass)}</text>}
        </g>
      ))}
    </svg>
  );
};
