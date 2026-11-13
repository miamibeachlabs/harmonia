import { canonicalVoicings, type SoundingChord } from '../domain/voiceLeading.ts';

export type { SoundingChord } from '../domain/voiceLeading.ts';

const bassRegister = 36; // C2

export type PlaybackSettings = Readonly<{
  tempo: number;
  beatsPerChord: 1 | 2 | 3 | 4;
}>;

export type PlaybackSettingsSource = () => PlaybackSettings;

const secondsPerBeat = (tempo: number) => 60 / tempo;

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
  const scheduledTasks = new Set<number>();
  let playbackGeneration = 0;

  const schedule = (afterMilliseconds: number, task: () => void) => {
    const id = window.setTimeout(() => {
      scheduledTasks.delete(id);
      task();
    }, Math.max(0, afterMilliseconds));
    scheduledTasks.add(id);
  };

  const stop = () => {
    playbackGeneration += 1;
    scheduledTasks.forEach(clearTimeout);
    scheduledTasks.clear();
    activeOscillators.forEach(oscillator => oscillator.stop());
    activeOscillators.clear();
  };

  const playNote = (midi: number, when: number, voice: 'chord' | 'bass', duration: number) => {
    const destination = output;
    if (!destination) return;

    const { context, input } = destination;
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const releaseAt = when + duration * 0.87;
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
    async playLoop(
      chords: readonly SoundingChord[],
      settings: PlaybackSettingsSource,
      onStep: (index: number) => void,
    ) {
      if (!chords.length) return;

      output ??= audioOutput();
      await output.context.resume();
      stop();

      const generation = playbackGeneration;
      const voicings = canonicalVoicings(chords);
      const scheduleChord = (step: number, chordStart: number) => {
        const destination = output;
        if (generation !== playbackGeneration || !destination) return;

        const current = settings();
        const beatLength = secondsPerBeat(current.tempo);
        const chordLength = current.beatsPerChord * beatLength;
        const chordIndex = step % chords.length;
        const voicing = voicings[chordIndex];
        const bass = bassRegister + chords[chordIndex].rootPitchClass;

        playNote(bass, chordStart, 'bass', chordLength);
        schedule((chordStart - destination.context.currentTime) * 1_000, () => {
          if (generation === playbackGeneration) onStep(chordIndex);
        });

        for (let beat = 0; beat < current.beatsPerChord; beat += 1) {
          const when = chordStart + beat * beatLength;
          voicing.forEach(midi => playNote(midi, when, 'chord', beatLength));
        }

        const nextChordAt = chordStart + chordLength;
        schedule((nextChordAt - destination.context.currentTime - 0.04) * 1_000, () => scheduleChord(step + 1, nextChordAt));
      };

      scheduleChord(0, output.context.currentTime + 0.04);
    },
    stop,
  };
};
