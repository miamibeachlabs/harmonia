import { useState } from 'preact/hooks';
import { chordName, degreeIn, harmonicFieldFor, keyCollectionNamed, keyCollections, thirdLinksIn, triadIn, type Degree, type DiatonicTriad, type HarmonicField, type KeyMode, type MinorForm } from '../domain/harmonicField.ts';
import { sourceCircleLayout } from '../projections/circleOfThirds.ts';

type Notation = 'notes' | 'roman';

const point = (field: HarmonicField, degree: Degree) => {
  const { x, y } = sourceCircleLayout[degreeIn(field, degree).geometry];
  return `${x},${y}`;
};

const chordPath = (field: HarmonicField, triad: DiatonicTriad) => triad.members.map(degree => point(field, degree)).join(' ');
const chordNotes = (field: HarmonicField, triad: DiatonicTriad) => triad.members.map(degree => degreeIn(field, degree).note).join(' · ');

const functionLabel = {
  stability: 'Stability · tonic',
  change: 'Change · predominant',
  tension: 'Tension · dominant',
  context: 'Context-dependent',
} as const;

const functionNames = ['stability', 'change', 'tension', 'context'] as const;

const fieldName = (field: HarmonicField) =>
  field.mode === 'major'
    ? `${field.tonic} major`
    : `${field.tonic} ${field.minorForm} minor`;

export const App = () => {
  const [collectionId, setCollectionId] = useState('C');
  const [mode, setMode] = useState<KeyMode>('major');
  const [minorForm, setMinorForm] = useState<MinorForm>('natural');
  const [notation, setNotation] = useState<Notation>('notes');
  const [selectedRoots, setSelectedRoots] = useState<readonly Degree[]>([]);
  const collection = keyCollectionNamed(collectionId);
  const choice = mode === 'major' ? collection.major : collection.relativeMinor;
  const field = harmonicFieldFor(choice, minorForm);
  const thirdLinks = thirdLinksIn(field);
  const selectedTriads = selectedRoots.map(root => triadIn(field, root));

  const selectCollection = (nextCollectionId: string) => {
    setCollectionId(nextCollectionId);
    setSelectedRoots([]);
  };

  const selectMode = (nextMode: KeyMode) => {
    setMode(nextMode);
    setSelectedRoots([]);
  };

  const selectMinorForm = (nextForm: MinorForm) => {
    setMinorForm(nextForm);
    setSelectedRoots([]);
  };

  const toggleChord = (root: Degree) =>
    setSelectedRoots(selected => selected.includes(root)
      ? selected.filter(item => item !== root)
      : [...selected, root]);

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

      <main class="study">
        <section class="diagram surface" aria-labelledby="diagram-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">SOURCE GEOMETRY</p>
              <h2 id="diagram-title">Select a root to reveal its chord.</h2>
            </div>
            <p>Unequal edges make the unequal intervals visible before you name them.</p>
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
                  class={`selection selection--${degreeIn(field, triad.root).function}`}
                  points={chordPath(field, triad)}
                />
              ))}
            </svg>
            {field.degrees.map(node => {
              const { x, y } = sourceCircleLayout[node.geometry];
              const selected = selectedRoots.includes(node.degree);
              return (
                <div class="degree-slot" style={{ left: `${x}%`, top: `${y}%` }}>
                  <button
                    class={`degree-node degree-node--${node.quality} degree-node--${node.function} ${notation === 'roman' ? 'is-abstract' : ''} ${selected ? 'is-selected' : ''}`}
                    aria-pressed={selected}
                    aria-label={`${selected ? 'Hide' : 'Show'} ${node.note} ${node.quality} chord, ${node.degree}`}
                    onClick={() => toggleChord(node.degree)}
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
              {selectedTriads.map(triad => (
                <li>
                  <strong>{notation === 'notes' ? chordName(field, triad.root) : `${triad.root} ${triad.quality}`}</strong>
                  <span>{notation === 'notes' ? `${triad.root} · ${chordNotes(field, triad)}` : triad.members.join(' · ')}</span>
                </li>
              ))}
            </ul>
          ) : <p>{notation === 'notes' ? `Tap ${field.tonic} to shade its tonic chord.` : 'Tap a degree to reveal its chord path.'} Select more roots to compare overlapping chords.</p>}
          {selectedTriads.length > 0 && <button class="clear" onClick={() => setSelectedRoots([])}>Clear selection</button>}

          <div class="function-reading">
            <p class="eyebrow">FUNCTIONAL FAMILIES</p>
            <dl>
              {functionNames.filter(functionName => field.degrees.some(node => node.function === functionName)).map(functionName => (
                <div class={`function-family function-family--${functionName}`}>
                  <dt>{functionLabel[functionName]}</dt>
                  <dd>{field.degrees.filter(node => node.function === functionName).map(node => node.degree).join(' · ')}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </main>

      <section class="source-note">
        <strong>First lens, not the whole system.</strong> This view holds one {fieldName(field)} field. {field.minorForm === 'natural' && 'Natural minor retains its relative major’s pitch collection; only the tonal centre changes.'} {field.minorForm === 'harmonic' && 'Harmonic minor raises the leading tone so V and vii° can create dominant tension.'} Adjacent-key comparison, progression paths, and the full Circle of Fifths remain separate future projections of the same harmonic facts.
      </section>

      <footer>Available offline after the first online visit.</footer>
    </div>
  );
};
