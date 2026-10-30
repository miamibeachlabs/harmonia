/**
 * A key choice identifies a tonal centre. A harmonic field then states which
 * pitch collection and harmonic vocabulary are being read from that centre.
 */
export type Degree =
  | 'I' | 'ii' | 'iii' | 'IV' | 'V' | 'vi' | 'vii°'
  | 'i' | 'ii°' | 'III' | 'iv' | 'v' | 'VI' | 'VII' | 'III+';

export type GeometrySlot = 'I' | 'ii' | 'iii' | 'IV' | 'V' | 'vi' | 'vii°';
export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented';
export type HarmonicFunction = 'stability' | 'change' | 'tension' | 'context';
export type ThirdInterval = 'major-third' | 'minor-third';
export type KeyMode = 'major' | 'minor';
export type MinorForm = 'natural' | 'harmonic';

export type KeyChoice = Readonly<{
  id: string;
  tonic: string;
  mode: KeyMode;
  naturalNotes: readonly string[];
  harmonicNotes?: readonly string[];
}>;

export type KeyCollection = Readonly<{
  id: string;
  major: KeyChoice;
  relativeMinor: KeyChoice;
}>;

export type DegreeInField = Readonly<{
  degree: Degree;
  note: string;
  quality: TriadQuality;
  function: HarmonicFunction;
  geometry: GeometrySlot;
}>;

export type DiatonicTriad = Readonly<{
  root: Degree;
  quality: TriadQuality;
  members: readonly [Degree, Degree, Degree];
}>;

export type ThirdLink = Readonly<{
  from: Degree;
  to: Degree;
  interval: ThirdInterval;
}>;

export type HarmonicField = Readonly<{
  tonic: string;
  mode: KeyMode;
  minorForm?: MinorForm;
  degrees: readonly DegreeInField[];
  triads: readonly DiatonicTriad[];
}>;

type FieldPattern = Readonly<{
  degrees: readonly Degree[];
  qualities: readonly TriadQuality[];
  functions: readonly HarmonicFunction[];
  geometry: readonly GeometrySlot[];
}>;

const majorPattern: FieldPattern = {
  degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  qualities: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'],
  functions: ['stability', 'change', 'stability', 'change', 'tension', 'stability', 'tension'],
  geometry: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
};

/** Natural minor shares its pitch collection with its relative major. */
const naturalMinorPattern: FieldPattern = {
  degrees: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
  qualities: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'],
  // i, ii° and iv have clear tonic/predominant roles. The remaining chords
  // are deliberately contextual: natural minor has no leading-tone dominant.
  functions: ['stability', 'change', 'context', 'change', 'context', 'context', 'context'],
  geometry: ['vi', 'vii°', 'I', 'ii', 'iii', 'IV', 'V'],
};

/** Harmonic minor raises scale degree 7 for a genuine V and vii° dominant pair. */
const harmonicMinorPattern: FieldPattern = {
  degrees: ['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°'],
  qualities: ['minor', 'diminished', 'augmented', 'minor', 'major', 'major', 'diminished'],
  functions: ['stability', 'change', 'context', 'change', 'tension', 'context', 'tension'],
  geometry: ['vi', 'vii°', 'I', 'ii', 'iii', 'IV', 'V'],
};

const fieldFrom = (
  tonic: string,
  mode: KeyMode,
  notes: readonly string[],
  pattern: FieldPattern,
  minorForm?: MinorForm,
): HarmonicField => {
  const triadAt = (rootIndex: number): DiatonicTriad => ({
    root: pattern.degrees[rootIndex],
    quality: pattern.qualities[rootIndex],
    members: [
      pattern.degrees[rootIndex],
      pattern.degrees[(rootIndex + 2) % pattern.degrees.length],
      pattern.degrees[(rootIndex + 4) % pattern.degrees.length],
    ],
  });

  return {
    tonic,
    mode,
    minorForm,
    degrees: pattern.degrees.map((degree, index) => ({
      degree,
      note: notes[index],
      quality: pattern.qualities[index],
      function: pattern.functions[index],
      geometry: pattern.geometry[index],
    })),
    triads: pattern.degrees.map((_, index) => triadAt(index)),
  };
};

const major = (tonic: string, notes: readonly string[]): KeyChoice => ({
  id: `major:${tonic}`,
  tonic,
  mode: 'major',
  naturalNotes: notes,
});

const minor = (tonic: string, naturalNotes: readonly string[], harmonicNotes: readonly string[]): KeyChoice => ({
  id: `minor:${tonic}`,
  tonic,
  mode: 'minor',
  naturalNotes,
  harmonicNotes,
});

const majorKeyChoices: readonly KeyChoice[] = [
  major('C', ['C', 'D', 'E', 'F', 'G', 'A', 'B']),
  major('G', ['G', 'A', 'B', 'C', 'D', 'E', 'F♯']),
  major('D', ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯']),
  major('A', ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯']),
  major('E', ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯']),
  major('B', ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯']),
  major('F♯', ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯']),
  major('D♭', ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C']),
  major('A♭', ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G']),
  major('E♭', ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D']),
  major('B♭', ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A']),
  major('F', ['F', 'G', 'A', 'B♭', 'C', 'D', 'E']),
];

const minorKeyChoices: readonly KeyChoice[] = [
  minor('A', ['A', 'B', 'C', 'D', 'E', 'F', 'G'], ['A', 'B', 'C', 'D', 'E', 'F', 'G♯']),
  minor('E', ['E', 'F♯', 'G', 'A', 'B', 'C', 'D'], ['E', 'F♯', 'G', 'A', 'B', 'C', 'D♯']),
  minor('B', ['B', 'C♯', 'D', 'E', 'F♯', 'G', 'A'], ['B', 'C♯', 'D', 'E', 'F♯', 'G', 'A♯']),
  minor('F♯', ['F♯', 'G♯', 'A', 'B', 'C♯', 'D', 'E'], ['F♯', 'G♯', 'A', 'B', 'C♯', 'D', 'E♯']),
  minor('C♯', ['C♯', 'D♯', 'E', 'F♯', 'G♯', 'A', 'B'], ['C♯', 'D♯', 'E', 'F♯', 'G♯', 'A', 'B♯']),
  minor('G♯', ['G♯', 'A♯', 'B', 'C♯', 'D♯', 'E', 'F♯'], ['G♯', 'A♯', 'B', 'C♯', 'D♯', 'E', 'F𝄪']),
  minor('D♯', ['D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B', 'C♯'], ['D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B', 'C𝄪']),
  minor('B♭', ['B♭', 'C', 'D♭', 'E♭', 'F', 'G♭', 'A♭'], ['B♭', 'C', 'D♭', 'E♭', 'F', 'G♭', 'A♮']),
  minor('F', ['F', 'G', 'A♭', 'B♭', 'C', 'D♭', 'E♭'], ['F', 'G', 'A♭', 'B♭', 'C', 'D♭', 'E♮']),
  minor('C', ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B♭'], ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B♮']),
  minor('G', ['G', 'A', 'B♭', 'C', 'D', 'E♭', 'F'], ['G', 'A', 'B♭', 'C', 'D', 'E♭', 'F♯']),
  minor('D', ['D', 'E', 'F', 'G', 'A', 'B♭', 'C'], ['D', 'E', 'F', 'G', 'A', 'B♭', 'C♯']),
];

export const keyCollections: readonly KeyCollection[] = majorKeyChoices.map((major, index) => ({
  id: major.tonic,
  major,
  relativeMinor: minorKeyChoices[index],
}));

export const keyCollectionNamed = (id: string): KeyCollection => {
  const found = keyCollections.find(collection => collection.id === id);
  if (!found) throw new Error(`${id} is not available.`);
  return found;
};

export const harmonicFieldFor = (choice: KeyChoice, minorForm: MinorForm): HarmonicField => {
  if (choice.mode === 'major') return fieldFrom(choice.tonic, 'major', choice.naturalNotes, majorPattern);

  const notes = minorForm === 'harmonic' ? choice.harmonicNotes : choice.naturalNotes;
  return fieldFrom(choice.tonic, 'minor', notes ?? choice.naturalNotes, minorForm === 'harmonic' ? harmonicMinorPattern : naturalMinorPattern, minorForm);
};

export const degreeIn = (field: HarmonicField, degree: Degree): DegreeInField => {
  const found = field.degrees.find(item => item.degree === degree);
  if (!found) throw new Error(`${degree} is not present in ${field.tonic} ${field.mode}.`);
  return found;
};

export const triadIn = (field: HarmonicField, root: Degree): DiatonicTriad => {
  const found = field.triads.find(triad => triad.root === root);
  if (!found) throw new Error(`${root} has no triad in ${field.tonic} ${field.mode}.`);
  return found;
};

const thirdIntervals: Readonly<Record<TriadQuality, readonly [ThirdInterval, ThirdInterval]>> = {
  major: ['major-third', 'minor-third'],
  minor: ['minor-third', 'major-third'],
  diminished: ['minor-third', 'minor-third'],
  augmented: ['major-third', 'major-third'],
};

/** The seven distinct third-links that make the circle's visible skeleton. */
export const thirdLinksIn = (field: HarmonicField): readonly ThirdLink[] => {
  const seen = new Set<string>();

  return field.triads.flatMap(triad => {
    const intervals = thirdIntervals[triad.quality];
    return ([0, 1] as const).flatMap(index => {
      const from = triad.members[index];
      const to = triad.members[index + 1];
      const identity = [from, to].sort().join(':');
      if (seen.has(identity)) return [];
      seen.add(identity);
      return [{ from, to, interval: intervals[index] }];
    });
  });
};

export const chordName = (field: HarmonicField, root: Degree) => {
  const degree = degreeIn(field, root);
  return `${degree.note} ${degree.quality}`;
};
