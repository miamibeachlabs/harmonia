import { useEffect, useState } from 'preact/hooks';
import { createChordPlayer } from '../audio/chordPlayer.ts';
import { chordName, chordPitchClasses, degreeIn, harmonicFieldFor, keyCollectionNamed, keyCollections, pitchClassOf, thirdLinksIn, triadIn, type Degree, type DiatonicTriad, type HarmonicField } from '../domain/harmonicField.ts';
import { majorProgressions, progressionNamed } from '../domain/progressions.ts';
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

const chordPath = (field: HarmonicField, triad: DiatonicTriad) => triad.members.map(degree => point(field, degree)).join(' ');
const chordNotes = (field: HarmonicField, triad: DiatonicTriad) => triad.members.map(degree => degreeIn(field, degree).note).join(' · ');
const chordIdentity = (field: HarmonicField, triad: DiatonicTriad) => chordPitchClasses(field, triad).toSorted((a, b) => a - b).join(':');
const nodeName = (note: string, quality: DiatonicTriad['quality']) => quality === 'minor' ? `${note}m` : note;
const progressionName = (degrees: readonly Degree[]) => degrees.join('–');

type DisplayedSequence = Readonly<{
  name: string;
  degrees: readonly Degree[];
  triads: readonly DiatonicTriad[];
  isEditable: boolean;
}>;

const arrowSegment = (field: HarmonicField, from: Degree, to: Degree) => {
  const start = sourceCircleLayout[degreeIn(field, from).geometry];
  const end = sourceCircleLayout[degreeIn(field, to).geometry];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const inset = 6;
  return {
    x1: start.x + dx / distance * inset,
    y1: start.y + dy / distance * inset,
    x2: end.x - dx / distance * inset,
    y2: end.y - dy / distance * inset,
  };
};

export const App = () => {
  const [chordPlayer] = useState(createChordPlayer);
  const [collectionId, setCollectionId] = useState('C');
  const [selectedChordIds, setSelectedChordIds] = useState<readonly string[]>([]);
  const [progressionId, setProgressionId] = useState<string | null>('doo-wop');
  const collection = keyCollectionNamed(collectionId);
  const field = harmonicFieldFor(collection.major, 'natural');
  const thirdLinks = thirdLinksIn(field);
  const progression = progressionId ? progressionNamed(progressionId) : null;
  const triadByIdentity = new Map(field.triads.map(triad => [chordIdentity(field, triad), triad]));
  const selectedTriads = selectedChordIds.flatMap(identity => {
    const triad = triadByIdentity.get(identity);
    return triad ? [triad] : [];
  });
  const selectedDegrees = selectedTriads.map(triad => triad.root);
  const sequence: DisplayedSequence = progression
    ? {
      name: progression.name,
      degrees: progression.degrees,
      triads: progression.degrees.map(degree => triadIn(field, degree)),
      isEditable: false,
    }
    : {
      name: progressionName(selectedDegrees) || 'Free selection',
      degrees: selectedDegrees,
      triads: selectedTriads,
      isEditable: true,
    };
  const soundingChords = sequence.triads.map(triad => ({
    rootPitchClass: pitchClassOf(degreeIn(field, triad.root).note),
    pitchClasses: chordPitchClasses(field, triad),
  }));
  const voicedChords = canonicalVoicings(soundingChords);

  useEffect(() => () => chordPlayer.stop(), [chordPlayer]);

  useEffect(() => {
    const available = new Set(field.triads.map(triad => chordIdentity(field, triad)));
    setSelectedChordIds(selected => {
      const retained = selected.filter(identity => available.has(identity));
      return retained.length === selected.length ? selected : retained;
    });
  }, [field]);

  const selectCollection = (nextCollectionId: string) => {
    setCollectionId(nextCollectionId);
    setSelectedChordIds([]);
  };

  const addChord = (triad: DiatonicTriad) => {
    setProgressionId(null);
    const identity = chordIdentity(field, triad);
    setSelectedChordIds(selected => [...selected, identity]);
  };

  const removeChord = (index: number) =>
    setSelectedChordIds(selected => selected.filter((_, selectedIndex) => selectedIndex !== index));

  const moveChord = (from: number, to: number) =>
    setSelectedChordIds(selected => {
      if (to < 0 || to >= selected.length) return selected;
      const reordered = [...selected];
      const [chord] = reordered.splice(from, 1);
      reordered.splice(to, 0, chord);
      return reordered;
    });

  const selectProgression = (id: string) => {
    setProgressionId(id || null);
    setSelectedChordIds([]);
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
            <select value={collectionId} onChange={event => selectCollection(event.currentTarget.value)}>
              {keyCollections.map(option => <option value={option.id}>{option.major.tonic} ({option.relativeMinor.tonic}m)</option>)}
            </select>
          </label>
          <label>Progression
            <select value={progressionId ?? ''} onChange={event => selectProgression(event.currentTarget.value)}>
              <option value="">{sequence.isEditable ? sequence.name : 'Free selection'}</option>
              {majorProgressions.map(option => <option value={option.id}>{option.name}</option>)}
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
              {sequence.degrees.length > 1 && <defs>
                <marker id="progression-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
              </defs>}
              {thirdLinks.map(link => (
                <line
                  class={`third-link third-link--${link.interval}`}
                  x1={sourceCircleLayout[degreeIn(field, link.from).geometry].x}
                  y1={sourceCircleLayout[degreeIn(field, link.from).geometry].y}
                  x2={sourceCircleLayout[degreeIn(field, link.to).geometry].x}
                  y2={sourceCircleLayout[degreeIn(field, link.to).geometry].y}
                />
              ))}
              {sequence.degrees.slice(1).map((to, index) => {
                const from = sequence.degrees[index];
                const segment = arrowSegment(field, from, to);
                return <line class="progression-link" {...segment} marker-end="url(#progression-arrow)" />;
              })}
              {sequence.triads.map(triad => {
                const hue = rootHueClass(degreeIn(field, triad.root).note);
                return <polygon class={`selection ${hue}`} points={chordPath(field, triad)} />;
              })}
            </svg>
            {field.degrees.map(node => {
              const { x, y } = sourceCircleLayout[node.geometry];
              const triad = triadIn(field, node.degree);
              const selected = sequence.triads.some(active => active.root === triad.root);
              const steps = sequence.degrees.flatMap((degree, index) => degree === node.degree ? [index + 1] : []);
              return (
                <div class="degree-slot" style={{ left: `${x}%`, top: `${y}%` }}>
                  <button
                    class={`degree-node degree-node--${node.quality} ${rootHueClass(node.note)} ${selected ? 'is-selected' : ''}`}
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
          <p class="eyebrow">PROGRESSION</p>
          <h2 id="reading-title">{sequence.name}</h2>
          {sequence.triads.length ? (
            <>
              <ul class="chord-list">
                {sequence.triads.map((triad, index) => {
                  const root = degreeIn(field, triad.root);
                  const name = chordName(field, triad.root);
                  return <li>
                    <span class="progression-index">{index + 1}</span>
                    <ChordGlyph rootHue={rootHueClass(root.note)} midiNotes={voicedChords[index] ?? []} register={voicingRegister} label={`${name} in its played voicing`} />
                    <div class="chord-summary">
                      <strong class="chord-degree">{triad.root}</strong>
                      <span class="chord-relation">=</span>
                      <strong class="chord-name">{name}</strong>
                      <span class="chord-notes">({chordNotes(field, triad)})</span>
                    </div>
                    {sequence.isEditable && <span class="chord-actions" aria-label={`Edit ${name} at step ${index + 1}`}>
                      <button class="chord-action--remove" aria-label={`Remove ${name}`} onClick={() => removeChord(index)}>×</button>
                      <button class="chord-action--move" disabled={index === 0} aria-label={`Move ${name} earlier`} onClick={() => moveChord(index, index - 1)}>↑</button>
                      <button class="chord-action--move" disabled={index === sequence.triads.length - 1} aria-label={`Move ${name} later`} onClick={() => moveChord(index, index + 1)}>↓</button>
                    </span>}
                  </li>;
                })}
              </ul>
              <button class="primary play-sequence" onClick={() => void chordPlayer.playSequence(soundingChords)}>Play sequence</button>
            </>
          ) : <p>Choose roots in the circle to build a progression.</p>}
          {sequence.isEditable && sequence.triads.length > 0 && <button class="clear" onClick={() => setSelectedChordIds([])}>Clear selection</button>}

        </aside>
      </main>

      <section class="keyboard-lens surface" aria-labelledby="keyboard-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">PIANO KEYBOARD</p>
            <h2 id="keyboard-title">Every octave</h2>
          </div>
        </div>
        <PianoKeyboard chords={sequence.triads.map(triad => ({
          rootHue: rootHueClass(degreeIn(field, triad.root).note),
          quality: triad.quality,
          pitchClasses: chordPitchClasses(field, triad),
        }))} />
        {sequence.triads.length > 0 && <ul class="keyboard-chord-list">
          {sequence.triads.map((triad, index) => {
            const root = degreeIn(field, triad.root);
            return <li class={`${rootHueClass(root.note)} keyboard-chord-list--${triad.quality}`}>
              <em>{index + 1}</em>
              <strong>{chordName(field, triad.root)}</strong>
              <span>{chordNotes(field, triad)}</span>
            </li>;
          })}
        </ul>}
      </section>
    </div>
  );
};
