import { grandStaffSteps, keySignatureFor, staffNoteForMidi, staffNotesForChord, type StaffNote } from '../domain/staffNotation.ts';
import { noteNameAtMidi, voiceRegisterReferences, type VoiceRegisterReference } from '../domain/voiceRegister.ts';
import { rootHueClass } from './rootHue.ts';
import { grandStaffViewBox, staffYFor } from './staffGeometry.ts';

type StaffChord = Readonly<{
  noteNames: readonly string[];
  label: string;
}>;

type GrandStaffProps = Readonly<{
  chord?: StaffChord;
  keyNotes: readonly string[];
  livePitch?: Readonly<{ note: StaffNote; cents: number }>;
  spectrum?: Readonly<{ raw: Uint8Array; noiseReduced: Uint8Array; registerBiased: Uint8Array; binWidth: number }>;
  voiceBias?: VoiceRegisterReference;
  onVoiceBiasChange?: (id: string | undefined) => void;
}>;

const lineX1 = 30;
const lineX2 = 128;
const clefX = 38;
const keySignatureX = 50;
const noteX = 93;
const livePitchX = 150;
const landmarkNoteX = 126;
const spectrumX = 155;
const spectrumWidth = 16;
const biasCurveX = 177;
const biasCurveWidth = 22;
const biasLabelRightX = 235;
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

const spectrumBarsFor = (
  spectrum: Readonly<{ raw: Uint8Array; noiseReduced: Uint8Array; registerBiased: Uint8Array; binWidth: number }> | undefined,
  keyNotes: readonly string[],
  noteY: (stepFromMiddleC: number) => number,
) => {
  if (!spectrum) return [];

  const strengthsByY = new Map<number, { raw: number; noiseReduced: number; registerBiased: number }>();
  spectrum.raw.forEach((level, index) => {
    const frequency = (index + .5) * spectrum.binWidth;
    const midi = 69 + 12 * Math.log2(frequency / 440);
    if (midi < 36 || midi > 84) return;

    const staffNote = staffNoteForMidi(Math.round(midi), keyNotes);
    const y = noteY(staffNote.stepFromMiddleC);
    const current = strengthsByY.get(y) ?? { raw: 0, noiseReduced: 0, registerBiased: 0 };
    current.raw = Math.max(current.raw, Math.sqrt(level / 255));
    current.noiseReduced = Math.max(current.noiseReduced, Math.sqrt((spectrum.noiseReduced[index] ?? 0) / 255));
    current.registerBiased = Math.max(current.registerBiased, Math.sqrt((spectrum.registerBiased[index] ?? 0) / 255));
    strengthsByY.set(y, current);
  });

  return [...strengthsByY].map(([y, strength]) => ({ y, ...strength }));
};

const biasCurveFor = (reference: VoiceRegisterReference, noteY: (stepFromMiddleC: number) => number) => {
  const top = noteY(staffNoteForMidi(reference.highestMidi, []).stepFromMiddleC);
  const center = noteY(staffNoteForMidi(reference.centerMidi, []).stepFromMiddleC);
  const bottom = noteY(staffNoteForMidi(reference.lowestMidi, []).stepFromMiddleC);
  const samples = 80;
  const line = Array.from({ length: samples + 1 }, (_, index) => {
    const fraction = index / samples;
    const y = top + (bottom - top) * fraction;
    const z = (y - center) / ((bottom - top) / 6);
    const x = biasCurveX + biasCurveWidth * Math.exp(-(z ** 2) / 2);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  return {
    line,
    area: `${line} L ${biasCurveX},${top} Z`,
  };
};

/** A fixed C2–C6 grand-staff window centred around middle C. */
export const GrandStaff = ({ chord, keyNotes, livePitch, spectrum, voiceBias, onVoiceBiasChange }: GrandStaffProps) => {
  const notes = chord ? staffNotesForChord(chord.noteNames) : [];
  const noteY = staffYFor;
  const spectrumBars = spectrumBarsFor(spectrum, keyNotes, noteY);
  const keySignature = keySignatureFor(keyNotes);
  const keySignatureY = (clef: 'treble' | 'bass', index: number) => {
    if (!keySignature) return 0;
    return noteY(keySignatureSteps[clef][keySignature.accidental === '♯' ? 'sharp' : 'flat'][index]);
  };

  return (
    <svg class="grand-staff" viewBox={`0 0 ${grandStaffViewBox.width} ${grandStaffViewBox.height}`} role="group" aria-label={chord?.label ?? 'Grand staff from C2 to C6'}>
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
      <line class="staff-middle-c" stroke="currentColor" x1={noteX - 9} x2={noteX + 9} y1={staffYFor(0)} y2={staffYFor(0)} />
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
      {spectrumBars.map(({ y, raw, noiseReduced, registerBiased }) => <g class="staff-spectrum">
        <line class="staff-spectrum-raw" x1={spectrumX} x2={spectrumX + spectrumWidth * raw} y1={y} y2={y} />
        {noiseReduced > 0 && <line class="staff-spectrum-noise-reduced" x1={spectrumX} x2={spectrumX + spectrumWidth * noiseReduced} y1={y} y2={y} />}
        {registerBiased > 0 && <line class="staff-spectrum-register-biased" x1={spectrumX} x2={spectrumX + spectrumWidth * registerBiased} y1={y} y2={y} />}
      </g>)}
      {onVoiceBiasChange && <g
        class={`staff-bias-none ${voiceBias ? '' : 'is-selected'}`}
        role="button"
        tabIndex={0}
        aria-pressed={!voiceBias}
        onClick={() => onVoiceBiasChange(undefined)}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onVoiceBiasChange(undefined); }}
      >
        <rect x={biasCurveX - 7} y="2" width="4" height="4" rx=".6" />
        {!voiceBias && <text class="staff-bias-none-check" x={biasCurveX - 5} y="5.4">✓</text>}
        <text x={biasCurveX} y="7">No bias</text>
      </g>}
      {voiceRegisterReferences.map(reference => {
        const centerY = noteY(staffNoteForMidi(reference.centerMidi, []).stepFromMiddleC);
        const selected = voiceBias?.id === reference.id;
        const select = () => onVoiceBiasChange?.(reference.id);
        const curve = biasCurveFor(reference, noteY);
        const labelWidth = reference.label.length * 3 + 3;
        const hitBoxX = biasCurveX - 2;
        const hitBoxWidth = biasLabelRightX - hitBoxX + 1;
        const rangeLabels = [reference.highestMidi, reference.centerMidi, reference.lowestMidi].map(midi => ({
          note: noteNameAtMidi(midi),
          y: noteY(staffNoteForMidi(midi, []).stepFromMiddleC),
        }));
        return <g
          class={`staff-bias-curve ${selected ? 'is-selected' : ''}`}
          role={onVoiceBiasChange ? 'button' : undefined}
          tabIndex={onVoiceBiasChange ? 0 : undefined}
          aria-pressed={selected}
          onClick={select}
          onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && onVoiceBiasChange) select(); }}
        >
          <rect class="staff-bias-hitbox" x={hitBoxX} y={centerY - 3.5} width={hitBoxWidth} height="7" rx="1" />
          {selected && curve && <path class="staff-bias-area" d={curve.area} />}
          {curve && <path d={curve.line} />}
          {selected && rangeLabels.map(({ note, y }) => <text class="staff-bias-range-label" x={biasCurveX + biasCurveWidth + 1} y={y}>{note}</text>)}
          {selected && <rect class="staff-bias-label-highlight" x={biasLabelRightX - labelWidth} y={centerY - 3} width={labelWidth} height="6" rx="1" />}
          <text x={biasLabelRightX} y={centerY}>{reference.label}</text>
        </g>;
      })}
      {livePitch && livePitch.note.stepFromMiddleC >= grandStaffSteps.lowest && livePitch.note.stepFromMiddleC <= grandStaffSteps.highest && (
        <circle
          class="staff-live-pitch"
          cx={livePitchX}
          cy={noteY(livePitch.note.stepFromMiddleC) - livePitch.cents / 100 * .8}
          r="3"
        />
      )}
    </svg>
  );
};
