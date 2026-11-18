export type VoiceRegisterReference = Readonly<{
  id: string;
  label: string;
  lowestMidi: number;
  centerMidi: number;
  highestMidi: number;
}>;

/** Broad conventional singing ranges used only as navigational landmarks. */
export const voiceRegisterReferences: readonly VoiceRegisterReference[] = [
  { id: 'bass', label: 'Bass', lowestMidi: 40, centerMidi: 52, highestMidi: 64 },
  { id: 'baritone', label: 'Baritone', lowestMidi: 43, centerMidi: 55, highestMidi: 67 },
  { id: 'tenor', label: 'Tenor', lowestMidi: 48, centerMidi: 60, highestMidi: 72 },
  { id: 'alto', label: 'Alto', lowestMidi: 53, centerMidi: 65, highestMidi: 77 },
  { id: 'mezzo', label: 'Mezzo', lowestMidi: 57, centerMidi: 69, highestMidi: 81 },
  { id: 'soprano', label: 'Soprano', lowestMidi: 60, centerMidi: 72, highestMidi: 84 },
] as const;

export const voiceRegisterWindow = { lowestMidi: 36, highestMidi: 84 } as const;
export const defaultVoiceCenterId = 'tenor';
export const registerSpread = 5.5;

const chromaticNames = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

export const noteNameAtMidi = (midi: number) => `${chromaticNames[(midi % 12 + 12) % 12]}${Math.floor(midi / 12) - 1}`;

/** A strong but non-zero beginner-oriented expectation: far-away notes remain possible. */
export const registerPriorAt = (midi: number, centerMidi: number) => (
  .02 + .98 * Math.exp(-.5 * ((midi - centerMidi) / registerSpread) ** 2)
);
