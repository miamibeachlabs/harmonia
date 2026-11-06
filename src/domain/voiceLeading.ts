export type SoundingChord = Readonly<{
  rootPitchClass: number;
  pitchClasses: readonly number[];
}>;

export type VoicingRegister = Readonly<{
  midiStart: number;
  midiEnd: number;
}>;

/** A fixed window centred on the canonical C4–E4–G4 reference triad. */
export const voicingRegister: VoicingRegister = { midiStart: 55, midiEnd: 74 }; // G3–D5

const lowestVoice = voicingRegister.midiStart;
const highestVoice = voicingRegister.midiEnd;
const referenceVoicing = [60, 64, 67] as const; // C4–E4–G4

const notesFor = (pitchClass: number) => {
  const first = lowestVoice + (pitchClass - lowestVoice + 12) % 12;
  const notes: number[] = [];
  for (let note = first; note <= highestVoice; note += 12) notes.push(note);
  return notes;
};

const distanceFromReference = (voicing: readonly number[]) =>
  voicing.reduce((distance, note, index) => distance + (note - referenceVoicing[index]) ** 2, 0);

const voicingsFor = (pitchClasses: readonly number[]) => pitchClasses
  .reduce<readonly number[][]>((partialVoicings, pitchClass) =>
    partialVoicings.flatMap(partial => notesFor(pitchClass).map(note => [...partial, note])), [[]])
  .map(voicing => voicing.toSorted((left, right) => left - right));

/** The one fixed inversion and register placement assigned to a triad. */
export const canonicalVoicing = (chord: SoundingChord): readonly number[] => {
  const closest = voicingsFor(chord.pitchClasses)
    .toSorted((left, right) => distanceFromReference(left) - distanceFromReference(right))[0];
  if (!closest) throw new Error('No canonical voicing fits the shared register.');
  return closest;
};

/** Applies the same context-independent voicing rule to every chord in a sequence. */
export const canonicalVoicings = (chords: readonly SoundingChord[]) => chords.map(canonicalVoicing);
