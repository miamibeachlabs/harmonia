import { degreeIn, pitchClassOf, triadIn, type Degree, type DiatonicTriad, type HarmonicField, type TriadQuality } from './harmonicField.ts';

/** A chord occurrence: its circle root is independent from its selected quality. */
export type Chord = Readonly<{
  root: Degree;
  quality: TriadQuality;
}>;

export const chord = (root: Degree, quality: TriadQuality): Chord => ({ root, quality });

const triadIntervals: Readonly<Record<TriadQuality, readonly [number, number, number]>> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
};

const chordSuffix: Readonly<Record<TriadQuality, string>> = {
  major: '',
  minor: 'm',
  diminished: '°',
  augmented: '+',
};

const numeralSuffix: Readonly<Record<TriadQuality, string>> = {
  major: '',
  minor: '',
  diminished: '°',
  augmented: '+',
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

const accidentalFor = (letter: string, targetPitchClass: number) => {
  const natural = naturalPitchClasses[letter];
  if (natural === undefined) throw new Error(`${letter} is not a supported note letter.`);

  const distance = (targetPitchClass - natural + 12) % 12;
  const accidental = ({ 0: '', 1: '♯', 2: '𝄪', 10: '𝄫', 11: '♭' } as Readonly<Record<number, string>>)[distance];
  if (accidental === undefined) throw new Error(`${letter} cannot be spelled as pitch class ${targetPitchClass}.`);
  return accidental;
};

const memberDegrees = (field: HarmonicField, chord: Chord) => triadIn(field, chord.root).members;

const memberPitchClasses = (field: HarmonicField, chord: Chord) => {
  const rootPitchClass = pitchClassOf(degreeIn(field, chord.root).note);
  return triadIntervals[chord.quality].map(interval => (rootPitchClass + interval) % 12);
};

export const chordFromTriad = (triad: DiatonicTriad): Chord => chord(triad.root, triad.quality);

export const chordWithQuality = (chord: Chord, quality: TriadQuality): Chord => ({ ...chord, quality });

/** The conventional Roman numeral for a root and chosen triad quality. */
export const romanNumeral = (chord: Chord) => {
  const stem = chord.root.replace(/[°+]/g, '');
  const letters = chord.quality === 'major' || chord.quality === 'augmented' ? stem.toUpperCase() : stem.toLowerCase();
  return `${letters}${numeralSuffix[chord.quality]}`;
};

export const chordName = (field: HarmonicField, chord: Chord) => `${degreeIn(field, chord.root).note}${chordSuffix[chord.quality]}`;

/** Preserves staff-letter spelling while altering the chord tones when needed. */
export const chordNotes = (field: HarmonicField, chord: Chord) => {
  const pitchClasses = memberPitchClasses(field, chord);
  return memberDegrees(field, chord)
  .map((degree, index) => {
    const sourceNote = degreeIn(field, degree).note;
    return `${sourceNote[0]}${accidentalFor(sourceNote[0], pitchClasses[index])}`;
  });
};

export const chordPitchClasses = (field: HarmonicField, chord: Chord) => memberPitchClasses(field, chord);

export const isMajorOrMinor = (chord: Chord) => chord.quality === 'major' || chord.quality === 'minor';

export const toggledMajorMinor = (chord: Chord): Chord =>
  chordWithQuality(chord, chord.quality === 'major' ? 'minor' : 'major');
