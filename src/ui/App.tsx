import { useEffect, useRef, useState } from 'preact/hooks';
import { createChordPlayer, type PlaybackSettings } from '../audio/chordPlayer.ts';
import { chordFromTriad, chordName, chordNotes, chordPitchClasses, chordRootNote, chordRootPitchClass, isMajorOrMinor, romanNumeral, toggledMajorMinor, type Chord } from '../domain/chords.ts';
import { degreeIn, harmonicFieldFor, keyCollectionLabel, keyCollectionNamed, keyCollections, pitchClassOf, relativeHarmonicMinorFieldFor, thirdLinksIn, triadIn, type Degree, type DiatonicTriad, type HarmonicField, type MinorForm } from '../domain/harmonicField.ts';
import { majorProgressions, progressionFamilies, progressionNamed, rotateBy, type ProgressionFamily } from '../domain/progressions.ts';
import { canonicalVoicings, voicingRegister } from '../domain/voiceLeading.ts';
import { sourceCircleLayout } from '../projections/circleOfThirds.ts';
import { ChordGlyph } from './ChordGlyph.tsx';
import { MiamiBeachLabsBrand } from './MiamiBeachLabsBrand.tsx';
import { PianoKeyboard } from './PianoKeyboard.tsx';
import { rootHueClass } from './rootHue.ts';

const defaultPlayback: PlaybackSettings = { tempo: 100, beatsPerChord: 4 };

const point = (field: HarmonicField, degree: Degree) => {
  const { x, y } = sourceCircleLayout[degreeIn(field, degree).geometry];
  return `${x},${y}`;
};

const chordPath = (field: HarmonicField, chord: Chord) => triadIn(field, chord.root).members.map(degree => point(field, degree)).join(' ');
const nodeName = (note: string, quality: DiatonicTriad['quality']) => ({
  major: note,
  minor: `${note}m`,
  diminished: `${note}°`,
  augmented: `${note}+`,
})[quality];
const progressionName = (chords: readonly Chord[]) => chords.map(romanNumeral).join('–');
const chordIdentity = (chord: Chord) => `${chord.root}:${chord.quality}`;

type DisplayedSequence = Readonly<{
  name: string;
  description?: string;
  chords: readonly Chord[];
  canReorder: boolean;
}>;

type KeyboardChordGroup = Readonly<{
  label: string;
  chords: readonly Chord[];
}>;

type KeyboardReading = 'major' | MinorForm;

const arrowSegment = (field: HarmonicField, from: Degree, to: Degree) => {
  const start = sourceCircleLayout[degreeIn(field, from).geometry];
  const end = sourceCircleLayout[degreeIn(field, to).geometry];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  if (!distance) return null;
  const inset = 6;
  const unitX = dx / distance;
  const unitY = dy / distance;
  const tipX = end.x - unitX * inset;
  const tipY = end.y - unitY * inset;
  const baseX = tipX - unitX * 3;
  const baseY = tipY - unitY * 3;
  const perpendicularX = -unitY * 2;
  const perpendicularY = unitX * 2;
  return {
    x1: start.x + unitX * inset,
    y1: start.y + unitY * inset,
    x2: tipX,
    y2: tipY,
    head: `${tipX},${tipY} ${baseX + perpendicularX},${baseY + perpendicularY} ${baseX - perpendicularX},${baseY - perpendicularY}`,
  };
};

export const App = () => {
  const [chordPlayer] = useState(createChordPlayer);
  const [collectionId, setCollectionId] = useState('C');
  const [keyboardReading, setKeyboardReading] = useState<KeyboardReading>('major');
  const [keyboardChordId, setKeyboardChordId] = useState<string | null>(null);
  const [selectedChords, setSelectedChords] = useState<readonly Chord[]>([]);
  const [progressionId, setProgressionId] = useState<string | null>('pop-axis');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingStep, setPlayingStep] = useState<number | null>(null);
  const [playback, setPlayback] = useState(defaultPlayback);
  const playbackRef = useRef(playback);
  const collection = keyCollectionNamed(collectionId);
  const progression = progressionId ? progressionNamed(progressionId) : null;
  const referenceField = harmonicFieldFor(collection.major, 'natural');
  const harmonicExploration = keyboardReading === 'harmonic' && !progression;
  const field = harmonicExploration
    ? relativeHarmonicMinorFieldFor(collection)
    : referenceField;
  const keyboardField = keyboardReading === 'major'
    ? referenceField
    : harmonicFieldFor(collection.relativeMinor, keyboardReading);
  const thirdLinks = thirdLinksIn(field);
  const progressionChords = progression?.chords ?? [];
  const sequence: DisplayedSequence = progression
    ? {
      name: progressionName(progressionChords),
      description: progression.description,
      chords: progressionChords,
      canReorder: false,
    }
    : {
      name: progressionName(selectedChords) || 'Free selection',
      chords: selectedChords,
      canReorder: true,
    };
  const sequenceDegrees = sequence.chords.map(chord => chord.root);
  const soundingChords = sequence.chords.map(chord => ({
    rootPitchClass: chordRootPitchClass(field, chord),
    pitchClasses: chordPitchClasses(field, chord),
  }));
  const voicedChords = canonicalVoicings(soundingChords);
  const sequenceKey = sequence.chords.map(chordIdentity).join(':');
  const playbackContextKey = `${collectionId}|${keyboardReading}|${sequenceKey}`;
  const keyboardTonic = keyboardReading === 'major' ? collection.major.tonic : collection.relativeMinor.tonic;
  const keyboardReadingLabel = keyboardReading === 'major'
    ? `${collection.major.tonic} major`
    : `${collection.relativeMinor.tonic} ${keyboardReading} minor`;
  const keyboardCollection = {
    notes: keyboardField.degrees.map(degree => ({
      name: degree.note,
      pitchClass: pitchClassOf(degree.note),
    })),
    tonicPitchClass: pitchClassOf(keyboardTonic),
    label: `${keyboardReadingLabel} notes from C2 through C5`,
  };
  const circleChords = field.triads.map(chordFromTriad);
  const progressionKeyboardChords = sequence.chords.filter((chord, index, chords) =>
    chords.findIndex(candidate => chordIdentity(candidate) === chordIdentity(chord)) === index);
  const vocabularyChords = circleChords.filter(circleChord =>
    !progressionKeyboardChords.some(chord => chordIdentity(chord) === chordIdentity(circleChord)));
  const keyboardChordGroups: readonly KeyboardChordGroup[] = [
    ...(progressionKeyboardChords.length ? [{ label: 'Progression', chords: progressionKeyboardChords }] : []),
    ...(vocabularyChords.length ? [{ label: 'Key vocabulary', chords: vocabularyChords }] : []),
  ];
  const keyboardChord = keyboardChordGroups.flatMap(group => group.chords)
    .find(chord => chordIdentity(chord) === keyboardChordId) ?? null;
  const progressionNotes = sequence.chords.flatMap(chord => chordNotes(field, chord)).map(name => ({
    name,
    pitchClass: pitchClassOf(name),
  })).filter((note, index, notes) => notes.findIndex(candidate => candidate.pitchClass === note.pitchClass) === index);

  useEffect(() => () => chordPlayer.stop(), [chordPlayer]);

  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  useEffect(() => {
    chordPlayer.stop();
    setIsPlaying(false);
    setPlayingStep(null);
  }, [chordPlayer, playbackContextKey]);

  const addChord = (triad: DiatonicTriad) => {
    setProgressionId(null);
    setSelectedChords(selected => [...selected, chordFromTriad(triad)]);
  };

  const removeChord = (index: number) =>
    setSelectedChords(selected => selected.filter((_, selectedIndex) => selectedIndex !== index));

  const duplicateChord = (index: number) =>
    setSelectedChords(selected => [
      ...selected.slice(0, index + 1),
      selected[index],
      ...selected.slice(index + 1),
    ]);

  const moveChord = (from: number, to: number) =>
    setSelectedChords(selected => {
      if (to < 0 || to >= selected.length) return selected;
      const reordered = [...selected];
      const [chord] = reordered.splice(from, 1);
      reordered.splice(to, 0, chord);
      return reordered;
    });

  const toggleChordQuality = (index: number) => {
    setSelectedChords(selected => selected.map((chord, selectedIndex) =>
      selectedIndex === index ? toggledMajorMinor(sequence.chords[index]) : chord));
  };

  const selectProgression = (id: string) => {
    setProgressionId(id || null);
    setSelectedChords([]);
    setKeyboardReading('major');
    setKeyboardChordId(null);
  };

  const editProgression = () => {
    if (!progression) return;
    setSelectedChords(sequence.chords);
    setProgressionId(null);
  };

  const rotateSequence = (direction: -1 | 1) => {
    if (sequenceDegrees.length < 2) return;
    setSelectedChords(selected => rotateBy(selected, direction));
  };

  const togglePlayback = () => {
    if (isPlaying) {
      chordPlayer.stop();
      setIsPlaying(false);
      setPlayingStep(null);
      return;
    }

    setIsPlaying(true);
    void chordPlayer.playLoop(soundingChords, () => playbackRef.current, setPlayingStep).catch(() => {
      setIsPlaying(false);
      setPlayingStep(null);
    });
  };

  return (
    <div class="workspace">
      <header class="masthead">
        <div>
          <h1>Harmonia</h1>
          <MiamiBeachLabsBrand />
        </div>
        <div class="view-controls">
          <label>Key
            <select value={collectionId} onChange={event => setCollectionId(event.currentTarget.value)}>
              {keyCollections.map(option => <option value={option.id}>{keyCollectionLabel(option)}</option>)}
            </select>
          </label>
          <label>Progression
            <select value={progressionId ?? ''} onChange={event => selectProgression(event.currentTarget.value)}>
              <optgroup label="Free selection">
                <option value="">{sequence.canReorder ? sequence.name : 'Empty — select your own'}</option>
              </optgroup>
              {(Object.entries(progressionFamilies) as readonly [ProgressionFamily, string][]).map(([family, label]) => (
                <optgroup label={label}>
                  {majorProgressions.filter(option => option.family === family).map(option => <option value={option.id}>{option.label}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main class="study">
        <section class="diagram surface" aria-labelledby="diagram-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">SOURCE GEOMETRY</p>
              <h2 id="diagram-title">Circle of thirds</h2>
            </div>
          </div>

          <div class="circle-stage">
            <svg class="circle" viewBox="0 0 100 100" aria-hidden="true">
              {thirdLinks.map(link => (
                <line
                  class={`third-link third-link--${link.interval}`}
                  x1={sourceCircleLayout[degreeIn(field, link.from).geometry].x}
                  y1={sourceCircleLayout[degreeIn(field, link.from).geometry].y}
                  x2={sourceCircleLayout[degreeIn(field, link.to).geometry].x}
                  y2={sourceCircleLayout[degreeIn(field, link.to).geometry].y}
                />
              ))}
              {sequenceDegrees.slice(1).map((to, index) => {
                const from = sequenceDegrees[index];
                const segment = arrowSegment(field, from, to);
                if (!segment) return null;
                return <>
                  <line class="progression-link" x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} />
                  <polygon class="progression-arrowhead" points={segment.head} />
                </>;
              })}
              {sequence.chords.map(chord => {
                const hue = rootHueClass(degreeIn(field, chord.root).note);
                return <polygon class={`selection ${hue}`} points={chordPath(field, chord)} />;
              })}
            </svg>
            {field.degrees.map(node => {
              const { x, y } = sourceCircleLayout[node.geometry];
              const triad = triadIn(field, node.degree);
              const selected = sequence.chords.some(active => active.root === triad.root);
              const playing = playingStep !== null && sequenceDegrees[playingStep] === node.degree;
              const steps = sequenceDegrees.flatMap((degree, index) => degree === node.degree ? [index + 1] : []);
              return (
                <div class="degree-slot" style={{ left: `${x}%`, top: `${y}%` }}>
                  <button
                    class={`degree-node degree-node--${node.quality} ${rootHueClass(node.note)} ${selected ? 'is-selected' : ''} ${playing ? 'is-playing' : ''}`}
                    aria-label={`Add ${node.note} ${node.quality} chord, ${node.degree}`}
                    onClick={() => addChord(triad)}
                  >
                    <span class="note">{nodeName(node.note, node.quality)}</span>
                  </button>
                  <span class="numeral">{node.degree}</span>
                  {steps.length > 0 && <span class="progression-step">{steps.join('·')}</span>}
                </div>
              );
            })}
          </div>

          <div class="legend" aria-label="Diagram legend">
            <span><i class="legend-line legend-line--major-third" />longer · major third</span>
            <span><i class="legend-line legend-line--minor-third" />shorter · minor third</span>
          </div>
        </section>

        <aside class="reading surface" aria-labelledby="reading-title">
          <div class="reading-heading">
            <div>
              <p class="eyebrow">PROGRESSION</p>
              <h2 id="reading-title">{sequence.name}</h2>
            </div>
            {progression
              ? <button class="edit-progression" onClick={editProgression}>Edit</button>
              : <div class="rotation-controls" aria-label="Rotate progression">
                <span>Rotate</span>
                <button class="rotate" aria-label="Rotate progression backward" disabled={sequenceDegrees.length < 2} onClick={() => rotateSequence(-1)}>↶</button>
                <button class="rotate" aria-label="Rotate progression forward" disabled={sequenceDegrees.length < 2} onClick={() => rotateSequence(1)}>↷</button>
              </div>}
          </div>
          {sequence.description && <p class="progression-description">{sequence.description}</p>}
          {sequence.chords.length ? (
            <>
              <ul class="chord-list">
                {sequence.chords.map((chord, index) => {
                  const rootNote = chordRootNote(field, chord);
                  const name = chordName(field, chord);
                  const isDiatonic = chord.quality === triadIn(field, chord.root).quality;
                  return <li class={playingStep === index ? 'is-playing' : ''}>
                    <span class="progression-index">{index + 1}</span>
                    <ChordGlyph rootHue={rootHueClass(rootNote)} midiNotes={voicedChords[index] ?? []} register={voicingRegister} label={`${name} in its played voicing`} />
                    <div class="chord-summary">
                      <strong class="chord-degree">{romanNumeral(chord)}</strong>
                      <span class="chord-relation">=</span>
                      <strong class="chord-name">{name}</strong>
                      {sequence.canReorder && isMajorOrMinor(chord) && <button class={`chord-action--quality ${isDiatonic ? '' : 'is-altered'}`} aria-label={`Change ${name} to ${chord.quality === 'major' ? 'minor' : 'major'}`} onClick={() => toggleChordQuality(index)}>{chord.quality === 'major' ? 'm' : 'M'}</button>}
                      <span class="chord-notes">({chordNotes(field, chord).join(' · ')})</span>
                    </div>
                    {sequence.canReorder && <>
                      <span class="chord-actions" aria-label={`Remove ${name} at step ${index + 1}`}>
                        <button class="chord-action--remove" aria-label={`Remove ${name}`} onClick={() => removeChord(index)}>×</button>
                      </span>
                      <span class="sequence-actions" aria-label={`Reorder ${name} at step ${index + 1}`}>
                        <button class="chord-action--duplicate" aria-label={`Duplicate ${name} after step ${index + 1}`} onClick={() => duplicateChord(index)}>+</button>
                        <button class="chord-action--move" disabled={index === 0} aria-label={`Move ${name} earlier`} onClick={() => moveChord(index, index - 1)}>↑</button>
                        <button class="chord-action--move" disabled={index === sequence.chords.length - 1} aria-label={`Move ${name} later`} onClick={() => moveChord(index, index + 1)}>↓</button>
                      </span>
                    </>}
                  </li>;
                })}
              </ul>
              <div class="playback-controls" aria-label="Playback settings">
                <label>Tempo
                  <input
                    type="range"
                    min="40"
                    max="180"
                    step="5"
                    value={playback.tempo}
                    onInput={event => setPlayback(current => ({ ...current, tempo: Number(event.currentTarget.value) }))}
                  />
                  <output>{playback.tempo}{'\u00a0'}BPM</output>
                </label>
                <div class="beats-per-chord" aria-label="Beats per chord">
                  <span>Beats</span>
                  {([2, 3, 4] as const).map(beats => <button
                    class={playback.beatsPerChord === beats ? 'is-selected' : ''}
                    aria-pressed={playback.beatsPerChord === beats}
                    onClick={() => setPlayback(current => ({ ...current, beatsPerChord: beats }))}
                  >{beats}</button>)}
                </div>
              </div>
              <button class="primary play-sequence" onClick={togglePlayback}>{isPlaying ? 'Stop' : 'Play'}</button>
            </>
          ) : <p>Choose roots in the circle to build a progression.</p>}
          {sequence.canReorder && sequence.chords.length > 0 && <button class="clear" onClick={() => setSelectedChords([])}>Clear selection</button>}

        </aside>
      </main>

      <section class="keyboard-lens surface" aria-labelledby="keyboard-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">KEY MAP</p>
            <h2 id="keyboard-title">{keyboardReadingLabel}</h2>
          </div>
          <div class="keyboard-reading-controls" aria-label="Keyboard reading">
            <button class={keyboardReading === 'major' ? 'is-selected' : ''} aria-pressed={keyboardReading === 'major'} onClick={() => setKeyboardReading('major')}>{collection.major.tonic}</button>
            <button class={keyboardReading === 'natural' ? 'is-selected' : ''} aria-pressed={keyboardReading === 'natural'} onClick={() => setKeyboardReading('natural')}>{collection.relativeMinor.tonic}m</button>
            <button class={keyboardReading === 'harmonic' ? 'is-selected' : ''} aria-pressed={keyboardReading === 'harmonic'} disabled={Boolean(progression)} onClick={() => setKeyboardReading('harmonic')}>{collection.relativeMinor.tonic}m harmonic</button>
          </div>
        </div>
        <div class="keyboard-chord-groups" aria-label="Show chord tones on keyboard">
          {keyboardChordGroups.map(group => <div class="keyboard-chord-group">
            <p>{group.label}</p>
            <div class="keyboard-chord-picker">
              {group.chords.map(chord => {
                const id = chordIdentity(chord);
                const active = keyboardChordId === id;
                const note = chordRootNote(field, chord);
                return <button class={`${rootHueClass(note)} keyboard-chord-picker--${chord.quality} ${group.label === 'Progression' ? 'is-in-progression' : ''} ${active ? 'is-selected' : ''}`} aria-pressed={active} onClick={() => setKeyboardChordId(active ? null : id)}>
                  <span>{chord.root}</span>{chordName(field, chord)}{group.label === 'Progression' && <i aria-hidden="true" />}
                </button>;
              })}
            </div>
          </div>)}
        </div>
        <PianoKeyboard collection={keyboardCollection} chord={keyboardChord ? {
          rootHue: rootHueClass(chordRootNote(field, keyboardChord)),
          pitchClasses: chordPitchClasses(field, keyboardChord),
        } : undefined} progressionNotes={progressionNotes} />
      </section>
    </div>
  );
};
