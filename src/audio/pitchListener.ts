import { PitchDetector } from 'pitchy';
import { pitchAt, type DetectedPitch } from '../domain/pitch.ts';
import { defaultVoiceCenterId, registerPriorAt, voiceRegisterReferences } from '../domain/voiceRegister.ts';

type PitchListener = Readonly<{
  start: (onAnalysis: (analysis: PitchAnalysis) => void) => Promise<void>;
  setVoiceCenter: (midi: number | undefined) => void;
  stop: () => void;
}>;

export type PitchAnalysis = Readonly<{
  pitch: DetectedPitch | undefined;
  spectrum: Readonly<{
    raw: Uint8Array;
    noiseReduced: Uint8Array;
    registerBiased: Uint8Array;
  }>;
  binWidth: number;
}>;

const singingRange = { minimum: 60, maximum: 1_200 } as const;
const analysisSize = 4_096;
const minimumClarity = 0.88;
const maximumRegisterPenalty = 0.115;
const noiseLearningRate = 0.04;

const noiseReducedSpectrum = (spectrum: Uint8Array, noiseFloor: Float32Array) => Uint8Array.from(
  spectrum,
  (level, index) => Math.max(0, level - noiseFloor[index]),
);

const registerBiasedSpectrum = (spectrum: Uint8Array, binWidth: number, centerMidi: number | undefined) => Uint8Array.from(
  spectrum,
  (level, index) => {
    if (centerMidi === undefined) return level;
    const frequency = (index + .5) * binWidth;
    const midi = 69 + 12 * Math.log2(frequency / 440);
    return level * registerPriorAt(midi, centerMidi);
  },
);
/** Browser-only microphone lifecycle around the pure monophonic detector. */
export const createPitchListener = (): PitchListener => {
  let context: AudioContext | undefined;
  let stream: MediaStream | undefined;
  let frame: number | undefined;
  let voiceCenterMidi = voiceRegisterReferences.find(reference => reference.id === defaultVoiceCenterId)?.centerMidi;

  const stop = () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    stream?.getTracks().forEach(track => track.stop());
    stream = undefined;
    void context?.close();
    context = undefined;
  };

  return {
    async start(onAnalysis) {
      stop();
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = analysisSize;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -20;
      analyser.smoothingTimeConstant = 0.65;
      const samples = new Float32Array(analyser.fftSize);
      const spectrum = new Uint8Array(analyser.frequencyBinCount);
      const noiseFloor = new Float32Array(analyser.frequencyBinCount);
      let hasNoiseFloor = false;
      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      detector.clarityThreshold = minimumClarity;
      let lastAnalysis = 0;

      source.connect(analyser);
      await context.resume();

      const listen = (now: number) => {
        if (now - lastAnalysis >= 50) {
          analyser.getFloatTimeDomainData(samples);
          analyser.getByteFrequencyData(spectrum);
          const [frequency, clarity] = detector.findPitch(samples, context!.sampleRate);
          const candidate = pitchAt(frequency, clarity);
          const distanceFromRegister = voiceCenterMidi === undefined
            ? 0
            : 1 - registerPriorAt(candidate.nearestMidi, voiceCenterMidi);
          const requiredClarity = voiceCenterMidi === undefined
            ? minimumClarity
            : minimumClarity + distanceFromRegister ** 3 * maximumRegisterPenalty;
          const pitch = frequency >= singingRange.minimum && frequency <= singingRange.maximum && clarity >= requiredClarity
            ? candidate
            : undefined;
          if (!pitch && !hasNoiseFloor) {
            noiseFloor.set(spectrum);
            hasNoiseFloor = true;
          } else if (!pitch) spectrum.forEach((level, index) => {
            noiseFloor[index] += (level - noiseFloor[index]) * noiseLearningRate;
          });
          const binWidth = context!.sampleRate / analyser.fftSize;
          const noiseReduced = noiseReducedSpectrum(spectrum, noiseFloor);
          onAnalysis({
            pitch,
            spectrum: {
              raw: spectrum.slice(),
              noiseReduced,
              registerBiased: registerBiasedSpectrum(noiseReduced, binWidth, voiceCenterMidi),
            },
            binWidth,
          });
          lastAnalysis = now;
        }
        frame = requestAnimationFrame(listen);
      };

      frame = requestAnimationFrame(listen);
    },
    setVoiceCenter(midi) {
      voiceCenterMidi = midi;
    },
    stop,
  };
};
