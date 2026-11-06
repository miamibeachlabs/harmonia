import { voiceLead, type SoundingChord } from '../domain/voiceLeading.ts';

export type { SoundingChord } from '../domain/voiceLeading.ts';

const beatsPerChord = 4;
const beatLength = 0.48;
const bassRegister = 36; // C2

type AudioOutput = Readonly<{
  context: AudioContext;
  input: GainNode;
}>;

const frequencyFor = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** WebKit honours this category through iPhone Silent Mode when it is available. */
const requestPlaybackAudioSession = () => {
  const session = (navigator as Navigator & {
    audioSession?: { type: string };
  }).audioSession;

  if (session) session.type = 'playback';
};

const generatedRoom = (context: AudioContext) => {
  const duration = 1.1;
  const buffer = context.createBuffer(2, context.sampleRate * duration, context.sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    for (let index = 0; index < samples.length; index += 1) {
      const decay = (1 - index / samples.length) ** 2.6;
      samples[index] = (Math.random() * 2 - 1) * decay;
    }
  }

  return buffer;
};

const audioOutput = (): AudioOutput => {
  requestPlaybackAudioSession();
  const context = new AudioContext();
  const input = context.createGain();
  const room = context.createConvolver();
  const roomGain = context.createGain();

  input.gain.value = 0.68;
  room.buffer = generatedRoom(context);
  roomGain.gain.value = 0.1;
  input.connect(context.destination);
  input.connect(room).connect(roomGain).connect(context.destination);

  return { context, input };
};

/** A small synthesized player for auditioning Harmonia's ordered chord sets. */
export const createChordPlayer = () => {
  let output: AudioOutput | undefined;
  const activeOscillators = new Set<OscillatorNode>();

  const stop = () => {
    activeOscillators.forEach(oscillator => oscillator.stop());
    activeOscillators.clear();
  };

  const playNote = (midi: number, when: number, voice: 'chord' | 'bass') => {
    const destination = output;
    if (!destination) return;

    const { context, input } = destination;
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const releaseAt = when + beatLength * 0.87;
    const isBass = voice === 'bass';

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isBass ? 900 : 2_200, when);
    filter.frequency.exponentialRampToValueAtTime(isBass ? 240 : 900, releaseAt);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(isBass ? 0.09 : 0.055, when + 0.018);
    envelope.gain.exponentialRampToValueAtTime(isBass ? 0.04 : 0.024, when + 0.18);
    envelope.gain.exponentialRampToValueAtTime(0.0001, releaseAt);

    ([
      { ratio: 1, level: 1 },
      { ratio: 2, level: isBass ? 0.16 : 0.22 },
      { ratio: 3, level: isBass ? 0.05 : 0.09 },
    ] as const).forEach(({ ratio, level }) => {
      const oscillator = context.createOscillator();
      const partial = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequencyFor(midi) * ratio;
      partial.gain.value = level;
      oscillator.connect(partial).connect(filter);
      oscillator.addEventListener('ended', () => activeOscillators.delete(oscillator));
      oscillator.start(when);
      oscillator.stop(releaseAt + 0.01);
      activeOscillators.add(oscillator);
    });

    filter.connect(envelope).connect(input);
  };

  return {
    async playSequence(chords: readonly SoundingChord[]) {
      if (!chords.length) return;

      output ??= audioOutput();
      await output.context.resume();
      stop();

      const firstChordAt = output.context.currentTime + 0.04;
      voiceLead(chords).forEach((voicing, chordIndex) => {
        const bass = bassRegister + chords[chordIndex].rootPitchClass;
        for (let beat = 0; beat < beatsPerChord; beat += 1) {
          const when = firstChordAt + (chordIndex * beatsPerChord + beat) * beatLength;
          voicing.forEach(midi => playNote(midi, when, 'chord'));
          if (beat === 0) playNote(bass, when, 'bass');
        }
      });
    },
    stop,
  };
};
