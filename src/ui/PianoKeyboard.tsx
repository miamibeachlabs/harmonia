type PianoKey = Readonly<{
  pitchClass: number;
  x: number;
  black: boolean;
}>;

export type KeyboardCollection = Readonly<{
  notes: readonly Readonly<{ name: string; pitchClass: number }>[];
  tonicPitchClass: number;
  label: string;
}>;

export type KeyboardNote = KeyboardCollection['notes'][number];

export type KeyboardChord = Readonly<{
  rootHue: string;
  pitchClasses: readonly number[];
}>;

type PianoKeyboardProps = Readonly<{
  collection: KeyboardCollection;
  chord?: KeyboardChord;
  progressionNotes?: readonly KeyboardNote[];
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

/** A fixed C2–C5 keyboard showing the active pitch collection and one chord lens. */
export const PianoKeyboard = ({ collection, chord, progressionNotes = [] }: PianoKeyboardProps) => {
  const noteAt = (key: PianoKey) => collection.notes.find(note => note.pitchClass === key.pitchClass);
  const progressionNoteAt = (key: PianoKey) => progressionNotes.find(note => note.pitchClass === key.pitchClass);
  const marker = (key: PianoKey) => {
    const scaleNote = noteAt(key);
    const progressionNote = progressionNoteAt(key);
    const note = scaleNote ?? progressionNote;
    if (!note) return null;
    const tonic = key.pitchClass === collection.tonicPitchClass;
    const className = `piano-scale-note ${tonic ? 'is-tonic' : ''} ${key.black ? 'piano-scale-note--on-black' : ''}`;
    const x = key.x + (key.black ? .34 : .5);
    const y = key.black ? 2.35 : 4.12;
    const labelY = key.black ? 1.75 : 3.7;
    return <>
      <text class={`piano-note-label ${key.black ? 'piano-note-label--on-black' : ''} ${tonic ? 'is-tonic' : ''} ${progressionNote && !scaleNote ? 'is-progression-only' : ''}`} x={x} y={labelY}>{note.name}</text>
      {progressionNote && <circle class={`piano-progression-ring ${key.black ? 'piano-progression-ring--on-black' : ''}`} cx={x} cy={y} r={tonic ? .31 : .23} />}
      <circle class={scaleNote ? className : `piano-progression-note ${key.black ? 'piano-progression-note--on-black' : ''}`} cx={x} cy={y} r={tonic ? .24 : .16} />
    </>;
  };
  const chordTone = (key: PianoKey) => {
    if (!chord?.pitchClasses.includes(key.pitchClass)) return null;
    return <rect class={`piano-chord-key ${chord.rootHue}`} x={key.x} y="0" width={key.black ? '.68' : '1'} height={key.black ? '3.15' : '5'} rx={key.black ? '.08' : undefined} />;
  };
  const chordToneSelected = (key: PianoKey) => Boolean(chord?.pitchClasses.includes(key.pitchClass));

  return (
    <svg class="piano" viewBox="0 0 22 5" role="img" aria-label={collection.label}>
      {keyboardKeys.filter(key => !key.black).map(key => (
        <g class={`piano-key piano-key--white ${chordToneSelected(key) ? 'is-chord-tone' : ''}`}>
          <rect x={key.x} y="0" width="1" height="5" />
          {chordTone(key)}
          {marker(key)}
        </g>
      ))}
      {keyboardKeys.filter(key => key.black).map(key => (
        <g class={`piano-key piano-key--black ${chordToneSelected(key) ? 'is-chord-tone' : ''}`}>
          <rect x={key.x} y="0" width=".68" height="3.15" rx=".08" />
          {chordTone(key)}
          {marker(key)}
        </g>
      ))}
    </svg>
  );
};
