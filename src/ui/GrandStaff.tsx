import { grandStaffSteps, keySignatureFor, staffNotesForChord } from '../domain/staffNotation.ts';
import { rootHueClass } from './rootHue.ts';

type StaffChord = Readonly<{
  noteNames: readonly string[];
  label: string;
}>;

type GrandStaffProps = Readonly<{
  chord?: StaffChord;
  keyNotes: readonly string[];
}>;

const middleCY = 54;
const stepHeight = 3;
const lineX1 = 30;
const lineX2 = 128;
const clefX = 38;
const keySignatureX = 50;
const noteX = 93;
const landmarkNoteX = 126;
const lineYs = [24, 30, 36, 42, 48, 60, 66, 72, 78, 84];

const keySignatureSteps = {
  treble: {
    sharp: [10, 7, 4, 8, 5, 9, 6],
    flat: [6, 9, 5, 8, 4, 7, 10],
  },
  bass: {
    sharp: [-4, -7, -3, -6, -9, -5, -8],
    flat: [-8, -5, -9, -6, -3, -7, -4],
  },
} as const;

const staffLandmarks = [
  { label: 'C6', step: 14 },
  { label: 'F5', step: 10 },
  { label: 'C5', step: 7 },
  { label: 'G4', step: 4 },
  { label: 'C4', step: 0 },
  { label: 'F3', step: -4 },
  { label: 'C3', step: -7 },
  { label: 'G2', step: -10 },
  { label: 'C2', step: -14 },
] as const;

const ledgerStepsFor = (stepFromMiddleC: number) => {
  if (stepFromMiddleC === 0) return [0];
  if (stepFromMiddleC >= 12) return Array.from({ length: Math.floor((stepFromMiddleC - 12) / 2) + 1 }, (_, index) => 12 + index * 2);
  if (stepFromMiddleC <= -12) return Array.from({ length: Math.floor((-12 - stepFromMiddleC) / 2) + 1 }, (_, index) => -12 - index * 2);
  return [];
};

/** A fixed C2–C6 grand-staff window centred around middle C. */
export const GrandStaff = ({ chord, keyNotes }: GrandStaffProps) => {
  const notes = chord ? staffNotesForChord(chord.noteNames) : [];
  const noteY = (stepFromMiddleC: number) => middleCY - stepFromMiddleC * stepHeight;
  const keySignature = keySignatureFor(keyNotes);
  const keySignatureY = (clef: 'treble' | 'bass', index: number) => {
    if (!keySignature) return 0;
    return noteY(keySignatureSteps[clef][keySignature.accidental === '♯' ? 'sharp' : 'flat'][index]);
  };

  return (
    <svg class="grand-staff" viewBox="0 0 146 124" role="img" aria-label={chord?.label ?? 'Grand staff from C2 to C6'}>
      {lineYs.map(y => <line class="staff-line" stroke="currentColor" x1={lineX1} x2={lineX2} y1={y} y2={y} />)}
      {staffLandmarks.map(landmark => {
        const y = noteY(landmark.step);
        return <g class={`staff-landmark ${landmark.label.startsWith('C') ? 'staff-landmark--c' : ''}`} aria-hidden="true">
          {ledgerStepsFor(landmark.step).map(ledgerStep => {
            const ledgerY = noteY(ledgerStep);
            return <line class="staff-landmark-ledger" stroke="currentColor" x1={landmarkNoteX - 7} x2={lineX2} y1={ledgerY} y2={ledgerY} />;
          })}
          <ellipse class="staff-landmark-note" cx={landmarkNoteX} cy={y} rx="2" ry="1.4" transform={`rotate(-18 ${landmarkNoteX} ${y})`} />
          <text class="staff-landmark-label" x={lineX2 + 4} y={y}>{landmark.label}</text>
        </g>;
      })}
      <text class="staff-clef staff-clef--treble" fill="currentColor" x={clefX} y="42">𝄞</text>
      <text class="staff-clef staff-clef--bass" fill="currentColor" x={clefX} y="69">𝄢</text>
      {keySignature && (['treble', 'bass'] as const).flatMap(clef =>
        Array.from({ length: keySignature.count }, (_, index) => (
          <text class="staff-key-signature" fill="currentColor" x={keySignatureX + index * 3.5} y={keySignatureY(clef, index)}>{keySignature.accidental}</text>
        )))}
      <line class="staff-middle-c" stroke="currentColor" x1={noteX - 9} x2={noteX + 9} y1={middleCY} y2={middleCY} />
      {notes.map(note => {
        const y = noteY(note.stepFromMiddleC);
        if (note.stepFromMiddleC < grandStaffSteps.lowest || note.stepFromMiddleC > grandStaffSteps.highest) return null;
        return <g class={`staff-note ${rootHueClass(note.name)}`}>
          {ledgerStepsFor(note.stepFromMiddleC).map(ledgerStep => {
            const ledgerY = noteY(ledgerStep);
            return <line class="staff-ledger-line" stroke="currentColor" x1={noteX - 9} x2={noteX + 9} y1={ledgerY} y2={ledgerY} />;
          })}
          {note.accidental && <text class="staff-accidental" fill="currentColor" x={noteX - 7} y={y}>{note.accidental}</text>}
          <ellipse class="staff-notehead" fill="currentColor" stroke="currentColor" cx={noteX} cy={y} rx="2.7" ry="1.9" transform={`rotate(-18 ${noteX} ${y})`} />
          <text class="staff-note-label" fill="currentColor" x={noteX + 5} y={y}>{note.name}</text>
        </g>;
      })}
    </svg>
  );
};
