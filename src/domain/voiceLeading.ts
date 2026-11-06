export type SoundingChord = Readonly<{
  rootPitchClass: number;
  pitchClasses: readonly number[];
}>;

export type VoicingRegister = Readonly<{
  midiStart: number;
  octaves: number;
}>;

/** The shared C3–C5 space for voice-leading and compact keyboard glyphs. */
export const voicingRegister: VoicingRegister = { midiStart: 48, octaves: 2 };

const rootRegister = voicingRegister.midiStart;
const lowestVoice = voicingRegister.midiStart;
const highestVoice = lowestVoice + voicingRegister.octaves * 12;

const midiFor = (pitchClass: number, rootPitchClass: number) =>
  rootRegister + rootPitchClass + (pitchClass - rootPitchClass + 12) % 12;

const rootPosition = ({ rootPitchClass, pitchClasses }: SoundingChord) =>
  pitchClasses.map(pitchClass => midiFor(pitchClass, rootPitchClass));

const notesFor = (pitchClass: number) => {
  const first = lowestVoice + (pitchClass - lowestVoice + 12) % 12;
  const notes: number[] = [];
  for (let note = first; note <= highestVoice; note += 12) notes.push(note);
  return notes;
};

const voicingsFor = (pitchClasses: readonly number[]) => pitchClasses
  .reduce<readonly number[][]>((partialVoicings, pitchClass) =>
    partialVoicings.flatMap(partial => notesFor(pitchClass).map(note => [...partial, note])), [[]])
  .map(voicing => voicing.toSorted((left, right) => left - right));

/** Keeps every chord tone while choosing the nearest available notes to the last chord. */
const nearestVoicing = (previous: readonly number[], chord: SoundingChord) =>
  voicingsFor(chord.pitchClasses).reduce((best, candidate) => {
    const movement = candidate.reduce((total, note, index) => total + Math.abs(note - previous[index]), 0);
    const spread = candidate.at(-1)! - candidate[0];
    const bestMovement = best.reduce((total, note, index) => total + Math.abs(note - previous[index]), 0);
    const bestSpread = best.at(-1)! - best[0];
    return movement + spread * 0.03 < bestMovement + bestSpread * 0.03 ? candidate : best;
  });

/** Gives each chord the close voicing that follows the prior one with least motion. */
export const voiceLead = (chords: readonly SoundingChord[]): readonly (readonly number[])[] => {
  const first = chords[0];
  if (!first) return [];

  return chords.slice(1).reduce<readonly (readonly number[])[]>((voicings, chord) => {
    const previous = voicings.at(-1)!;
    return [...voicings, nearestVoicing(previous, chord)];
  }, [rootPosition(first)]);
};
