import { pitchClassOf } from './harmonicField.ts';

export type StaffNote = Readonly<{
  midi: number;
  name: string;
  accidental: string;
  stepFromMiddleC: number;
}>;

const chromaticSpellings = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

/**
 * The chromatic search window is slightly wider than the visible staff.
 * C♯6, for example, belongs on the upper C ledger line, even though its MIDI
 * number lies above C6. The visible boundary remains diatonic below.
 */
export const grandStaffRegister = { midiStart: 34, midiEnd: 86 } as const;
export const grandStaffSteps = { lowest: -14, highest: 14 } as const;

export type KeySignature = Readonly<{
  accidental: '♯' | '♭';
  count: number;
}>;

const letterSteps: Readonly<Record<string, number>> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

const naturalPitchClasses: Readonly<Record<string, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const accidentalOffsets: Readonly<Record<string, number>> = {
  '♯': 1,
  '♭': -1,
  '𝄪': 2,
  '𝄫': -2,
  '♮': 0,
};

const accidentalOffset = (accidental: string) =>
  [...accidental].reduce((offset, symbol) => {
    const value = accidentalOffsets[symbol];
    if (value === undefined) throw new Error(`${symbol} is not a supported accidental.`);
    return offset + value;
  }, 0);

const pitchClassFor = (midi: number) => (midi % 12 + 12) % 12;

/**
 * Conventional key signatures contain one accidental kind, ordered by the
 * staff rather than by scale degree. Harmonic-minor's raised leading tone is
 * deliberately not included here: it belongs beside its individual notes.
 */
export const keySignatureFor = (keyNotes: readonly string[]): KeySignature | undefined => {
  const sharps = keyNotes.filter(note => note.includes('♯')).length;
  const flats = keyNotes.filter(note => note.includes('♭')).length;
  if (sharps && flats) throw new Error('A conventional key signature cannot mix sharps and flats.');
  if (sharps) return { accidental: '♯', count: sharps };
  if (flats) return { accidental: '♭', count: flats };
  return undefined;
};

const octaveFor = (midi: number, letter: string, accidental: string) => {
  const natural = naturalPitchClasses[letter];
  if (natural === undefined) throw new Error(`${letter} is not a supported staff letter.`);
  return (midi - natural - accidentalOffset(accidental)) / 12 - 1;
};

/** Expresses spelled MIDI notes as diatonic positions relative to C4. */
export const staffNotesFor = (midiNotes: readonly number[], spellings: readonly string[]): readonly StaffNote[] =>
  midiNotes.map(midi => {
    const name = spellings.find(spelling => pitchClassOf(spelling) === pitchClassFor(midi));
    if (!name) throw new Error(`No spelling is available for MIDI note ${midi}.`);

    const letter = name[0];
    const accidental = name.slice(1);
    const octave = octaveFor(midi, letter, accidental);
    const letterStep = letterSteps[letter];
    if (letterStep === undefined || !Number.isInteger(octave)) {
      throw new Error(`${name} cannot be placed on the staff at MIDI note ${midi}.`);
    }

    return {
      midi,
      name,
      accidental,
      stepFromMiddleC: octave * 7 + letterStep - 28,
    };
  });

/** Places a live chromatic pitch using the key's preferred spellings where available. */
export const staffNoteForMidi = (midi: number, keyNotes: readonly string[]): StaffNote =>
  staffNotesFor([midi], [...keyNotes, ...chromaticSpellings])[0];

/** Every occurrence of a selected chord's tones in the fixed grand-staff range. */
export const staffNotesForChord = (spellings: readonly string[]): readonly StaffNote[] => {
  const midiNotes = spellings.flatMap(spelling => {
    const pitchClass = pitchClassOf(spelling);
    const first = grandStaffRegister.midiStart + (pitchClass - grandStaffRegister.midiStart + 12) % 12;
    return Array.from(
      { length: Math.floor((grandStaffRegister.midiEnd - first) / 12) + 1 },
      (_, index) => first + index * 12,
    );
  }).toSorted((left, right) => left - right);

  return staffNotesFor(midiNotes, spellings).filter(note =>
    note.stepFromMiddleC >= grandStaffSteps.lowest && note.stepFromMiddleC <= grandStaffSteps.highest);
};
