import type { VoicingRegister } from '../domain/voiceLeading.ts';

type ChordGlyphProps = Readonly<{
  rootHue: string;
  midiNotes: readonly number[];
  register: VoicingRegister;
  label: string;
}>;

const whitePitchClasses = new Set([0, 2, 4, 5, 7, 9, 11]);
const pitchClassOf = (midi: number) => (midi % 12 + 12) % 12;

/** A compact keyboard window showing the exact notes being played. */
export const ChordGlyph = ({ rootHue, midiNotes, register, label }: ChordGlyphProps) => {
  const keyboardNotes = Array.from({ length: register.midiEnd - register.midiStart + 1 }, (_, index) => register.midiStart + index);
  const whiteKeys = keyboardNotes.filter(midi => whitePitchClasses.has(pitchClassOf(midi)));
  const blackKeys = keyboardNotes.filter(midi => !whitePitchClasses.has(pitchClassOf(midi)));
  const whiteKeyPosition = (midi: number) => whiteKeys.indexOf(midi);
  const blackKeyPosition = (midi: number) => whiteKeys.filter(white => white < midi).length - .34;
  const width = whiteKeys.length;

  return (
    <svg class={`chord-glyph ${rootHue}`} viewBox={`0 0 ${width} 3.2`} role="img" aria-label={label}>
      {whiteKeys.map(midi => (
        <rect class={`chord-glyph__white ${midiNotes.includes(midi) ? 'is-selected' : ''}`} x={whiteKeyPosition(midi)} y="0" width="1" height="3.2" />
      ))}
      {blackKeys.map(midi => (
        <rect class={`chord-glyph__black ${midiNotes.includes(midi) ? 'is-selected' : ''}`} x={blackKeyPosition(midi)} y="0" width=".68" height="2" rx=".05" />
      ))}
    </svg>
  );
};
