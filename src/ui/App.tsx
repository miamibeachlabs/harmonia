import { useEffect, useState } from 'preact/hooks';
import { chordName, chordPitchClasses, degreeIn, harmonicFieldFor, keyCollectionNamed, keyCollections, thirdLinksIn, triadIn, type Degree, type DiatonicTriad, type HarmonicField, type KeyMode, type MinorForm } from '../domain/harmonicField.ts';
import { sourceCircleLayout } from '../projections/circleOfThirds.ts';
import { ChordGlyph } from './ChordGlyph.tsx';
import { PianoKeyboard } from './PianoKeyboard.tsx';
import { rootHueClass } from './rootHue.ts';

type Notation = 'notes' | 'roman';

const point = (field: HarmonicField, degree: Degree) => {
  const { x, y } = sourceCircleLayout[degreeIn(field, degree).geometry];
  return `${x},${y}`;
};

const chordPath = (field: HarmonicField, triad: DiatonicTriad) => triad.members.map(degree => point(field, degree)).join(' ');
const chordNotes = (field: HarmonicField, triad: DiatonicTriad) => triad.members.map(degree => degreeIn(field, degree).note).join(' · ');
const chordIdentity = (field: HarmonicField, triad: DiatonicTriad) => chordPitchClasses(field, triad).toSorted((a, b) => a - b).join(':');

export const App = () => {
  const [collectionId, setCollectionId] = useState('C');
  const [mode, setMode] = useState<KeyMode>('major');
  const [minorForm, setMinorForm] = useState<MinorForm>('natural');
  const [notation, setNotation] = useState<Notation>('notes');
  const [selectedChordIds, setSelectedChordIds] = useState<readonly string[]>([]);
  const collection = keyCollectionNamed(collectionId);
  const choice = mode === 'major' ? collection.major : collection.relativeMinor;
  const field = harmonicFieldFor(choice, minorForm);
  const thirdLinks = thirdLinksIn(field);
  const selectedTriads = field.triads.filter(triad => selectedChordIds.includes(chordIdentity(field, triad)));

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

  const selectMode = (nextMode: KeyMode) => {
    setMode(nextMode);
  };

  const selectMinorForm = (nextForm: MinorForm) => {
    setMinorForm(nextForm);
  };

  const toggleChord = (triad: DiatonicTriad) => {
    const identity = chordIdentity(field, triad);
    setSelectedChordIds(selected => selected.includes(identity)
      ? selected.filter(item => item !== identity)
      : [...selected, identity]);
  };

  return (
    <div class="workspace">
      <header class="masthead">
        <div>
          <p class="eyebrow">HARMONIA · FIRST STUDY</p>
          <h1>Circle of thirds<span>.</span></h1>
        </div>
        <div class="view-controls">
          <label>Shared collection
            <select value={collectionId} onChange={event => selectCollection(event.currentTarget.value)}>
              {keyCollections.map(option => <option value={option.id}>{option.major.tonic} major ↔ {option.relativeMinor.tonic} minor</option>)}
            </select>
          </label>
          <div class="mode-switch" aria-label="Tonal centre">
            <span>Read as</span>
            <div>
              <button class={mode === 'major' ? 'is-active' : ''} aria-pressed={mode === 'major'} onClick={() => selectMode('major')}>Major</button>
              <button class={mode === 'minor' ? 'is-active' : ''} aria-pressed={mode === 'minor'} onClick={() => selectMode('minor')}>Relative minor</button>
            </div>
          </div>
          {mode === 'minor' && <label>Minor form
            <select value={minorForm} onChange={event => selectMinorForm(event.currentTarget.value as MinorForm)}>
              <option value="natural">Natural minor</option>
              <option value="harmonic">Harmonic minor · raised 7th</option>
            </select>
          </label>}
          <label>View
            <select value={notation} onChange={event => setNotation(event.currentTarget.value as Notation)}>
              <option value="notes">Note names</option>
              <option value="roman">Roman numerals</option>
            </select>
          </label>
        </div>
      </header>

      <section class="keyboard-lens surface" aria-label="Keyboard">
        <PianoKeyboard chords={selectedTriads.map(triad => ({
          rootHue: rootHueClass(degreeIn(field, triad.root).note),
          quality: triad.quality,
          pitchClasses: chordPitchClasses(field, triad),
        }))} />
        {selectedTriads.length > 0 && <ul class="keyboard-chord-list">
          {selectedTriads.map(triad => {
            const root = degreeIn(field, triad.root);
            return <li class={`${rootHueClass(root.note)} keyboard-chord-list--${triad.quality}`}>
              <strong>{notation === 'notes' ? chordName(field, triad.root) : `${triad.root} ${triad.quality}`}</strong>
              <span>{notation === 'notes' ? chordNotes(field, triad) : triad.members.join(' · ')}</span>
            </li>;
          })}
        </ul>}
      </section>

      <main class="study">
        <section class="diagram surface" aria-labelledby="diagram-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">SOURCE GEOMETRY</p>
              <h2 id="diagram-title">Select a root to reveal its chord.</h2>
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
              {selectedTriads.map(triad => (
                <polyline
                  class={`selection ${rootHueClass(degreeIn(field, triad.root).note)}`}
                  points={chordPath(field, triad)}
                />
              ))}
            </svg>
            {field.degrees.map(node => {
              const { x, y } = sourceCircleLayout[node.geometry];
              const triad = triadIn(field, node.degree);
              const selected = selectedChordIds.includes(chordIdentity(field, triad));
              return (
                <div class="degree-slot" style={{ left: `${x}%`, top: `${y}%` }}>
                  <button
                    class={`degree-node degree-node--${node.quality} ${rootHueClass(node.note)} ${notation === 'roman' ? 'is-abstract' : ''} ${selected ? 'is-selected' : ''}`}
                    aria-pressed={selected}
                    aria-label={`${selected ? 'Hide' : 'Show'} ${node.note} ${node.quality} chord, ${node.degree}`}
                    onClick={() => toggleChord(triad)}
                  >
                    <span class="note">{notation === 'notes' ? node.note : node.degree}</span>
                  </button>
                  {notation === 'notes' && <span class="numeral">{node.degree}</span>}
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
          <p class="eyebrow">CHORDS IN VIEW</p>
          <h2 id="reading-title">{selectedTriads.length ? 'Selected chords' : 'Nothing selected yet'}</h2>
          {selectedTriads.length ? (
            <ul class="chord-list">
              {selectedTriads.map(triad => {
                const root = degreeIn(field, triad.root);
                const name = notation === 'notes' ? chordName(field, triad.root) : `${triad.root} ${triad.quality}`;
                return <li>
                  <ChordGlyph rootHue={rootHueClass(root.note)} pitchClasses={chordPitchClasses(field, triad)} label={`${name} on one octave of piano keys`} />
                  <div>
                    <strong>{name}</strong>
                    <span>{notation === 'notes' ? `${triad.root} · ${chordNotes(field, triad)}` : triad.members.join(' · ')}</span>
                  </div>
                </li>;
              })}
            </ul>
          ) : <p>{notation === 'notes' ? `Tap ${field.tonic} to shade its tonic chord.` : 'Tap a degree to reveal its chord path.'} Select more roots to compare overlapping chords.</p>}
          {selectedTriads.length > 0 && <button class="clear" onClick={() => setSelectedChordIds([])}>Clear selection</button>}

        </aside>
      </main>
    </div>
  );
};
