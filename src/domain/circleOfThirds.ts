/**
 * The diatonic triads of a major key, shown in circle-of-fifths order.
 *
 * This module names musical relationships only. It knows nothing about SVG,
 * screens, persistence, or a particular visual treatment.
 */
export type Degree = 'I' | 'ii' | 'iii' | 'IV' | 'V' | 'vi' | 'vii°';
export type TriadQuality = 'major' | 'minor' | 'diminished';

export type DegreePoint = Readonly<{
  degree: Degree;
  note: string;
  quality: TriadQuality;
  x: number;
  y: number;
}>;

export type Triad = Readonly<{
  root: Degree;
  quality: TriadQuality;
  degrees: readonly [Degree, Degree, Degree];
}>;

export type CircleOfThirds = Readonly<{
  tonic: string;
  degrees: readonly DegreePoint[];
  triads: readonly Triad[];
}>;

const majorTriad = (root: Degree, degrees: Triad['degrees']): Triad => ({ root, quality: 'major', degrees });
const minorTriad = (root: Degree, degrees: Triad['degrees']): Triad => ({ root, quality: 'minor', degrees });

/**
 * The source diagram's G-major example. Coordinates are intentionally part of
 * this first projection, not a claim about the abstract musical structure.
 */
export const gMajorCircleOfThirds: CircleOfThirds = {
  tonic: 'G',
  degrees: [
    { degree: 'I', note: 'G', quality: 'major', x: 50, y: 78 },
    { degree: 'V', note: 'D', quality: 'major', x: 78, y: 54 },
    { degree: 'ii', note: 'A', quality: 'minor', x: 35, y: 16 },
    { degree: 'vi', note: 'E', quality: 'minor', x: 19, y: 76 },
    { degree: 'iii', note: 'B', quality: 'minor', x: 88, y: 82 },
    { degree: 'vii°', note: 'F♯', quality: 'diminished', x: 64, y: 22 },
    { degree: 'IV', note: 'C', quality: 'major', x: 25, y: 43 },
  ],
  triads: [
    majorTriad('I', ['I', 'iii', 'V']),
    majorTriad('IV', ['IV', 'vi', 'I']),
    majorTriad('V', ['V', 'vii°', 'iii']),
    minorTriad('ii', ['ii', 'IV', 'vi']),
    minorTriad('iii', ['iii', 'V', 'vii°']),
    minorTriad('vi', ['vi', 'I', 'iii']),
  ],
};

export const degreeByName = (circle: CircleOfThirds, degree: Degree) => {
  const found = circle.degrees.find(point => point.degree === degree);
  if (!found) throw new Error(`Circle does not contain ${degree}.`);
  return found;
};
