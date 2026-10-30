import type { HarmonicFunction } from '../domain/harmonicField.ts';

type PianoKey = Readonly<{
  pitchClass: number;
  x: number;
  black: boolean;
}>;

export type KeyboardChord = Readonly<{
  function: HarmonicFunction;
  pitchClasses: readonly number[];
}>;

type PianoKeyboardProps = Readonly<{
  chords: readonly KeyboardChord[];
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

const dotY = (index: number, count: number, black: boolean) => {
  const top = black ? .55 : .75;
  const bottom = black ? 2.55 : 4.25;
  return top + (bottom - top) * (index + 1) / (count + 1);
};

/** One C2–C5 keyboard holds every selected chord in a stable dot lane. */
export const PianoKeyboard = ({ chords }: PianoKeyboardProps) => {
  const contains = (key: PianoKey, chord: KeyboardChord) => chord.pitchClasses.includes(key.pitchClass);

  return (
    <svg class="piano" viewBox="0 0 22 5" role="img" aria-label="Selected chord tones repeated from C2 through C5">
      {keyboardKeys.filter(key => !key.black).map(key => (
        <g class="piano-key piano-key--white">
          <rect x={key.x} y="0" width="1" height="5" />
          {chords.map((chord, index) => contains(key, chord) && (
            <circle class={`piano-dot piano-dot--${chord.function}`} cx={key.x + .5} cy={dotY(index, chords.length, false)} r=".23" />
          ))}
        </g>
      ))}
      {keyboardKeys.filter(key => key.black).map(key => (
        <g class="piano-key piano-key--black">
          <rect x={key.x} y="0" width=".68" height="3.15" rx=".08" />
          {chords.map((chord, index) => contains(key, chord) && (
            <circle class={`piano-dot piano-dot--${chord.function}`} cx={key.x + .34} cy={dotY(index, chords.length, true)} r=".2" />
          ))}
        </g>
      ))}
    </svg>
  );
};
