import { useEffect, useState } from 'preact/hooks';
import { createChordPlayer } from '../audio/chordPlayer.ts';
import { chordFromTriad, chordName, chordNotes, chordPitchClasses, isMajorOrMinor, romanNumeral, toggledMajorMinor, type Chord } from '../domain/chords.ts';
import { degreeIn, harmonicFieldFor, keyCollectionLabel, keyCollectionNamed, keyCollections, pitchClassOf, thirdLinksIn, triadIn, type Degree, type DiatonicTriad, type HarmonicField, type TriadQuality } from '../domain/harmonicField.ts';
import { majorProgressions, progressionFamilies, progressionNamed, rotateBy, type ProgressionFamily } from '../domain/progressions.ts';
import { canonicalVoicings, voicingRegister } from '../domain/voiceLeading.ts';
import { sourceCircleLayout } from '../projections/circleOfThirds.ts';
import { ChordGlyph } from './ChordGlyph.tsx';
import { MiamiBeachLabsBrand } from './MiamiBeachLabsBrand.tsx';
import { PianoKeyboard } from './PianoKeyboard.tsx';
import { rootHueClass } from './rootHue.ts';

const point = (field: HarmonicField, degree: Degree) => {
  const { x, y } = sourceCircleLayout[degreeIn(field, degree).geometry];
  return `${x},${y}`;
};

const chordPath = (field: HarmonicField, chord: Chord) => triadIn(field, chord.root).members.map(degree => point(field, degree)).join(' ');
const nodeName = (note: string, quality: DiatonicTriad['quality']) => quality === 'minor' ? `${note}m` : note;
const progressionName = (chords: readonly Chord[]) => chords.map(romanNumeral).join('–');

type DisplayedSequence = Readonly<{
  name: string;
  description?: string;
  chords: readonly Chord[];
  canReorder: boolean;
}>;

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
  const [selectedChords, setSelectedChords] = useState<readonly Chord[]>([]);
  const [progressionId, setProgressionId] = useState<string | null>('pop-axis');
  const [progressionQualities, setProgressionQualities] = useState<readonly (TriadQuality | undefined)[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingStep, setPlayingStep] = useState<number | null>(null);
  const collection = keyCollectionNamed(collectionId);
  const field = harmonicFieldFor(collection.major, 'natural');
  const thirdLinks = thirdLinksIn(field);
  const progression = progressionId ? progressionNamed(progressionId) : null;
  const overriddenProgressionChords = progression?.chords.map((chord, index) =>
    progressionQualities[index] ? { ...chord, quality: progressionQualities[index] } : chord) ?? [];
  const progressionChords = rotateBy(overriddenProgressionChords, rotation);
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
    rootPitchClass: pitchClassOf(degreeIn(field, chord.root).note),
    pitchClasses: chordPitchClasses(field, chord),
  }));
  const voicedChords = canonicalVoicings(soundingChords);
  const sequenceKey = sequence.chords.map(chord => `${chord.root}:${chord.quality}`).join(':');
  const playbackContextKey = `${collectionId}|${sequenceKey}`;

  useEffect(() => () => chordPlayer.stop(), [chordPlayer]);

  useEffect(() => {
    chordPlayer.stop();
    setIsPlaying(false);
    setPlayingStep(null);
  }, [chordPlayer, playbackContextKey]);

  const addChord = (triad: DiatonicTriad) => {
    setProgressionId(null);
    setRotation(0);
    setSelectedChords(selected => [...selected, chordFromTriad(triad)]);
  };

  const removeChord = (index: number) =>
    setSelectedChords(selected => selected.filter((_, selectedIndex) => selectedIndex !== index));

  const moveChord = (from: number, to: number) =>
    setSelectedChords(selected => {
      if (to < 0 || to >= selected.length) return selected;
      const reordered = [...selected];
      const [chord] = reordered.splice(from, 1);
      reordered.splice(to, 0, chord);
      return reordered;
    });

  const toggleChordQuality = (index: number) => {
    if (progression) {
      setProgressionQualities(qualities => {
        const sourceIndex = (rotation % progression.chords.length + progression.chords.length + index) % progression.chords.length;
        const next = [...qualities];
        next[sourceIndex] = toggledMajorMinor(progressionChords[index]).quality;
        return next;
      });
      return;
    }

    setSelectedChords(selected => selected.map((chord, selectedIndex) =>
      selectedIndex === index ? toggledMajorMinor(chord) : chord));
  };

  const selectProgression = (id: string) => {
    setProgressionId(id || null);
    setRotation(0);
    setSelectedChords([]);
    setProgressionQualities([]);
  };

  const rotateSequence = (direction: -1 | 1) => {
    if (sequenceDegrees.length < 2) return;
    if (progression) {
      setRotation(current => current + direction);
      return;
    }
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
    void chordPlayer.playLoop(soundingChords, setPlayingStep).catch(() => {
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
            <div class="rotation-controls" aria-label="Rotate progression">
              <span>Rotate</span>
              <button class="rotate" aria-label="Rotate progression backward" disabled={sequenceDegrees.length < 2} onClick={() => rotateSequence(-1)}>↶</button>
              <button class="rotate" aria-label="Rotate progression forward" disabled={sequenceDegrees.length < 2} onClick={() => rotateSequence(1)}>↷</button>
            </div>
          </div>
          {sequence.description && <p class="progression-description">{sequence.description}</p>}
          {sequence.chords.length ? (
            <>
              <ul class="chord-list">
                {sequence.chords.map((chord, index) => {
                  const root = degreeIn(field, chord.root);
                  const name = chordName(field, chord);
                  const isDiatonic = chord.quality === triadIn(field, chord.root).quality;
                  return <li class={playingStep === index ? 'is-playing' : ''}>
                    <span class="progression-index">{index + 1}</span>
                    <ChordGlyph rootHue={rootHueClass(root.note)} midiNotes={voicedChords[index] ?? []} register={voicingRegister} label={`${name} in its played voicing`} />
                    <div class="chord-summary">
                      <strong class="chord-degree">{romanNumeral(chord)}</strong>
                      <span class="chord-relation">=</span>
                      <strong class="chord-name">{name}</strong>
                      <span class="chord-notes">({chordNotes(field, chord).join(' · ')})</span>
                    </div>
                    {(isMajorOrMinor(chord) || sequence.canReorder) && <span class="chord-actions" aria-label={`Edit ${name} at step ${index + 1}`}>
                      {isMajorOrMinor(chord) && <button class={`chord-action--quality ${isDiatonic ? '' : 'is-altered'}`} aria-label={`Change ${name} to ${chord.quality === 'major' ? 'minor' : 'major'}`} onClick={() => toggleChordQuality(index)}>{chord.quality === 'major' ? 'm' : 'M'}</button>}
                      {sequence.canReorder && <>
                        <button class="chord-action--remove" aria-label={`Remove ${name}`} onClick={() => removeChord(index)}>×</button>
                        <button class="chord-action--move" disabled={index === 0} aria-label={`Move ${name} earlier`} onClick={() => moveChord(index, index - 1)}>↑</button>
                        <button class="chord-action--move" disabled={index === sequence.chords.length - 1} aria-label={`Move ${name} later`} onClick={() => moveChord(index, index + 1)}>↓</button>
                      </>}
                    </span>}
                  </li>;
                })}
              </ul>
              <button class="primary play-sequence" onClick={togglePlayback}>{isPlaying ? 'Stop' : 'Play'}</button>
            </>
          ) : <p>Choose roots in the circle to build a progression.</p>}
          {sequence.canReorder && sequence.chords.length > 0 && <button class="clear" onClick={() => setSelectedChords([])}>Clear selection</button>}

        </aside>
      </main>

      <section class="keyboard-lens surface" aria-labelledby="keyboard-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">PIANO KEYBOARD</p>
            <h2 id="keyboard-title">Every octave</h2>
          </div>
        </div>
        <PianoKeyboard chords={sequence.chords.map(chord => ({
          rootHue: rootHueClass(degreeIn(field, chord.root).note),
          quality: chord.quality,
          pitchClasses: chordPitchClasses(field, chord),
        }))} />
        {sequence.chords.length > 0 && <ul class="keyboard-chord-list">
          {sequence.chords.map((chord, index) => {
            const root = degreeIn(field, chord.root);
            return <li class={`${rootHueClass(root.note)} keyboard-chord-list--${chord.quality}`}>
              <em>{index + 1}</em>
              <strong>{chordName(field, chord)}</strong>
              <span>{chordNotes(field, chord).join(' · ')}</span>
            </li>;
          })}
        </ul>}
      </section>
    </div>
  );
};
