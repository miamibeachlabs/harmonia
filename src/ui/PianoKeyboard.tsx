import type { TriadQuality } from '../domain/harmonicField.ts';

type PianoKey = Readonly<{
  pitchClass: number;
  x: number;
  black: boolean;
}>;

export type KeyboardChord = Readonly<{
  rootHue: string;
  quality: TriadQuality;
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

const dot = (chord: KeyboardChord, x: number, y: number, radius: number, onBlackKey: boolean) => {
  const className = `piano-dot ${chord.rootHue} ${onBlackKey ? 'piano-dot--on-black' : ''}`;

  if (chord.quality === 'major') {
    return <rect class={className} x={x - radius} y={y - radius} width={radius * 2} height={radius * 2} rx=".03" />;
  }

  if (chord.quality === 'diminished') {
    return <polygon class={className} points={`${x},${y - radius} ${x + radius},${y} ${x},${y + radius} ${x - radius},${y}`} />;
  }

  if (chord.quality === 'augmented') {
    const half = radius * .86;
    return <polygon class={className} points={`${x - half},${y - radius} ${x + half},${y - radius} ${x + radius},${y} ${x + half},${y + radius} ${x - half},${y + radius} ${x - radius},${y}`} />;
  }

  return <circle class={className} cx={x} cy={y} r={radius} />;
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
            dot(chord, key.x + .5, dotY(index, chords.length, false), .23, false)
          ))}
        </g>
      ))}
      {keyboardKeys.filter(key => key.black).map(key => (
        <g class="piano-key piano-key--black">
          <rect x={key.x} y="0" width=".68" height="3.15" rx=".08" />
          {chords.map((chord, index) => contains(key, chord) && (
            dot(chord, key.x + .34, dotY(index, chords.length, true), .2, true)
          ))}
        </g>
      ))}
    </svg>
  );
};
