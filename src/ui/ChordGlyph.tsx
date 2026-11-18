import { pitchClassOf as notePitchClassOf } from '../domain/harmonicField.ts';
import type { VoicingRegister } from '../domain/voiceLeading.ts';
import { rootHueClass } from './rootHue.ts';

type ChordGlyphProps = Readonly<{
  midiNotes: readonly number[];
  noteNames: readonly string[];
  register: VoicingRegister;
  label: string;
}>;

const whitePitchClasses = new Set([0, 2, 4, 5, 7, 9, 11]);
const pitchClassOf = (midi: number) => (midi % 12 + 12) % 12;

/** A compact keyboard window showing the exact notes being played. */
export const ChordGlyph = ({ midiNotes, noteNames, register, label }: ChordGlyphProps) => {
  const keyboardNotes = Array.from({ length: register.midiEnd - register.midiStart + 1 }, (_, index) => register.midiStart + index);
  const whiteKeys = keyboardNotes.filter(midi => whitePitchClasses.has(pitchClassOf(midi)));
  const blackKeys = keyboardNotes.filter(midi => !whitePitchClasses.has(pitchClassOf(midi)));
  const whiteKeyPosition = (midi: number) => whiteKeys.indexOf(midi);
  const blackKeyPosition = (midi: number) => whiteKeys.filter(white => white < midi).length - .34;
  const width = whiteKeys.length;
  const noteHue = (midi: number) => {
    const note = noteNames.find(name => notePitchClassOf(name) === pitchClassOf(midi));
    if (!note) throw new Error(`No chord spelling is available for MIDI note ${midi}.`);
    return rootHueClass(note);
  };
  const keyClass = (key: 'white' | 'black', midi: number) =>
    `chord-glyph__${key} ${midiNotes.includes(midi) ? `is-selected ${noteHue(midi)}` : ''}`;

  return (
    <svg class="chord-glyph" viewBox={`0 0 ${width} 3.2`} role="img" aria-label={label}>
      {whiteKeys.map(midi => (
        <rect class={keyClass('white', midi)} x={whiteKeyPosition(midi)} y="0" width="1" height="3.2" />
      ))}
      {blackKeys.map(midi => (
        <rect class={keyClass('black', midi)} x={blackKeyPosition(midi)} y="0" width=".68" height="2" rx=".05" />
      ))}
    </svg>
  );
};
