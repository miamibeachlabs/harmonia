/** A degree is a place in a major-key harmonic field, not a fixed chord. */
export type Degree = 'I' | 'ii' | 'iii' | 'IV' | 'V' | 'vi' | 'vii°';
export type TriadQuality = 'major' | 'minor' | 'diminished';
export type HarmonicFunction = 'stability' | 'change' | 'tension';

export type DegreeInKey = Readonly<{
  degree: Degree;
  note: string;
  quality: TriadQuality;
  function: HarmonicFunction;
}>;

export type DiatonicTriad = Readonly<{
  root: Degree;
  quality: TriadQuality;
  members: readonly [Degree, Degree, Degree];
}>;

export type MajorKey = Readonly<{
  tonic: string;
  degrees: readonly DegreeInKey[];
  triads: readonly DiatonicTriad[];
}>;

const degrees: readonly Degree[] = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

const qualities: readonly TriadQuality[] = [
  'major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished',
];

const functions: readonly HarmonicFunction[] = [
  'stability', 'change', 'stability', 'change', 'tension', 'stability', 'tension',
];

const triadAt = (rootIndex: number): DiatonicTriad => ({
  root: degrees[rootIndex],
  quality: qualities[rootIndex],
  members: [
    degrees[rootIndex],
    degrees[(rootIndex + 2) % degrees.length],
    degrees[(rootIndex + 4) % degrees.length],
  ],
});

export const majorKey = (tonic: string, notes: readonly string[]): MajorKey => ({
  tonic,
  degrees: degrees.map((degree, index) => ({
    degree,
    note: notes[index],
    quality: qualities[index],
    function: functions[index],
  })),
  triads: degrees.map((_, index) => triadAt(index)),
});

export const cMajor = majorKey('C', ['C', 'D', 'E', 'F', 'G', 'A', 'B']);

export const degreeIn = (key: MajorKey, degree: Degree): DegreeInKey => {
  const found = key.degrees.find(item => item.degree === degree);
  if (!found) throw new Error(`${degree} is not present in ${key.tonic} major.`);
  return found;
};

export const triadIn = (key: MajorKey, root: Degree): DiatonicTriad => {
  const found = key.triads.find(triad => triad.root === root);
  if (!found) throw new Error(`${root} has no diatonic triad in ${key.tonic} major.`);
  return found;
};

export const chordName = (key: MajorKey, root: Degree) => {
  const degree = degreeIn(key, root);
  return `${degree.note} ${degree.quality}`;
};
