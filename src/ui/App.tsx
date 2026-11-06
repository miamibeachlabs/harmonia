import { useEffect, useState } from 'preact/hooks';
import { chordName, chordPitchClasses, degreeIn, harmonicFieldFor, keyCollectionNamed, keyCollections, thirdLinksIn, triadIn, type Degree, type DiatonicTriad, type HarmonicField } from '../domain/harmonicField.ts';
import { majorProgressions, progressionNamed } from '../domain/progressions.ts';
import { sourceCircleLayout } from '../projections/circleOfThirds.ts';
import { ChordGlyph } from './ChordGlyph.tsx';
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

export const App = () => {
  const [collectionId, setCollectionId] = useState('C');
  const [selectedChordIds, setSelectedChordIds] = useState<readonly string[]>([]);
  const [progressionId, setProgressionId] = useState<string | null>(null);
  const collection = keyCollectionNamed(collectionId);
  const field = harmonicFieldFor(collection.major, 'natural');
  const thirdLinks = thirdLinksIn(field);
  const progression = progressionId ? progressionNamed(progressionId) : null;
  const triadByIdentity = new Map(field.triads.map(triad => [chordIdentity(field, triad), triad]));
  const selectedTriads = selectedChordIds.flatMap(identity => {
    const triad = triadByIdentity.get(identity);
    return triad ? [triad] : [];
  });
  const progressionTriads = progression?.degrees.map(degree => triadIn(field, degree)) ?? [];
  const activeTriads = progression ? progressionTriads : selectedTriads;
  const activeDegrees = progression?.degrees ?? activeTriads.map(triad => triad.root);

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

  const toggleChord = (triad: DiatonicTriad) => {
    setProgressionId(null);
    const identity = chordIdentity(field, triad);
    setSelectedChordIds(selected => selected.includes(identity)
      ? selected.filter(item => item !== identity)
      : [...selected, identity]);
  };

  const selectProgression = (id: string) => {
    setProgressionId(id || null);
    setSelectedChordIds([]);
  };

  return (
    <div class="workspace">
      <header class="masthead">
        <div>
          <p class="eyebrow">HARMONIA · FIRST STUDY</p>
          <h1>Circle of thirds<span>.</span></h1>
        </div>
        <div class="view-controls">
          <label>Key
            <select value={collectionId} onChange={event => selectCollection(event.currentTarget.value)}>
              {keyCollections.map(option => <option value={option.id}>{option.major.tonic} ({option.relativeMinor.tonic}m)</option>)}
            </select>
          </label>
          <label>Progression
            <select value={progressionId ?? ''} onChange={event => selectProgression(event.currentTarget.value)}>
              <option value="">Free selection</option>
              {majorProgressions.map(option => <option value={option.id}>{option.name}</option>)}
            </select>
          </label>
        </div>
      </header>

      <section class="keyboard-lens surface" aria-label="Keyboard">
        <PianoKeyboard chords={activeTriads.map(triad => ({
          rootHue: rootHueClass(degreeIn(field, triad.root).note),
          quality: triad.quality,
          pitchClasses: chordPitchClasses(field, triad),
        }))} />
        {activeTriads.length > 0 && <ul class="keyboard-chord-list">
          {activeTriads.map((triad, index) => {
            const root = degreeIn(field, triad.root);
            return <li class={`${rootHueClass(root.note)} keyboard-chord-list--${triad.quality}`}>
              <em>{index + 1}</em>
              <strong>{chordName(field, triad.root)}</strong>
              <span>{chordNotes(field, triad)}</span>
            </li>;
          })}
        </ul>}
      </section>

      <main class="study">
        <section class="diagram surface" aria-labelledby="diagram-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">SOURCE GEOMETRY</p>
              <h2 id="diagram-title">{progression ? 'Follow this chord path.' : 'Select a root to reveal its chord.'}</h2>
            </div>
          </div>

          <div class="circle-stage">
            <svg class="circle" viewBox="0 0 100 100" aria-hidden="true">
              {activeDegrees.length > 1 && <defs>
                <marker id="progression-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="4" markerHeight="4" orient="auto">
                  <path d="M 0 0 L 8 4 L 0 8 z" />
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
              {activeDegrees.slice(1).map((to, index) => {
                const from = activeDegrees[index];
                const start = sourceCircleLayout[degreeIn(field, from).geometry];
                const end = sourceCircleLayout[degreeIn(field, to).geometry];
                return <line class="progression-link" x1={start.x} y1={start.y} x2={end.x} y2={end.y} marker-end="url(#progression-arrow)" />;
              })}
              {activeTriads.map(triad => {
                const hue = rootHueClass(degreeIn(field, triad.root).note);
                return <polygon class={`selection ${hue}`} points={chordPath(field, triad)} />;
              })}
            </svg>
            {field.degrees.map(node => {
              const { x, y } = sourceCircleLayout[node.geometry];
              const triad = triadIn(field, node.degree);
              const selected = activeTriads.some(active => active.root === triad.root);
              const steps = activeDegrees.flatMap((degree, index) => degree === node.degree ? [index + 1] : []);
              return (
                <div class="degree-slot" style={{ left: `${x}%`, top: `${y}%` }}>
                  <button
                    class={`degree-node degree-node--${node.quality} ${rootHueClass(node.note)} ${selected ? 'is-selected' : ''}`}
                    aria-pressed={selected}
                    aria-label={`${selected ? 'Hide' : 'Show'} ${node.note} ${node.quality} chord, ${node.degree}`}
                    onClick={() => toggleChord(triad)}
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
          <p class="eyebrow">{progression ? 'PROGRESSION' : 'CHORDS IN VIEW'}</p>
          <h2 id="reading-title">{progression?.name ?? (activeTriads.length ? 'Selected chords' : 'Nothing selected yet')}</h2>
          {activeTriads.length ? (
            <ul class="chord-list">
              {activeTriads.map((triad, index) => {
                const root = degreeIn(field, triad.root);
                const name = chordName(field, triad.root);
                return <li>
                  <span class="progression-index">{index + 1}</span>
                  <ChordGlyph rootHue={rootHueClass(root.note)} pitchClasses={chordPitchClasses(field, triad)} label={`${name} on one octave of piano keys`} />
                  <div>
                    <strong>{name}</strong>
                    <span>{triad.root} · {chordNotes(field, triad)}</span>
                  </div>
                </li>;
              })}
            </ul>
          ) : <p>Tap {field.tonic} to shade its tonic chord. Select more roots to compare overlapping chords.</p>}
          {!progression && activeTriads.length > 0 && <button class="clear" onClick={() => setSelectedChordIds([])}>Clear selection</button>}

        </aside>
      </main>
    </div>
  );
};
