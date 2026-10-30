import { useState } from 'preact/hooks';
import { chordName, degreeIn, majorKeyNamed, majorKeys, thirdLinksIn, triadIn, type Degree, type DiatonicTriad, type MajorKey } from '../domain/majorKey.ts';
import { sourceCircleLayout } from '../projections/circleOfThirds.ts';

type Notation = 'notes' | 'roman';

const point = (degree: Degree) => {
  const { x, y } = sourceCircleLayout[degree];
  return `${x},${y}`;
};

const chordPath = (triad: DiatonicTriad) => triad.members.map(point).join(' ');
const chordNotes = (key: MajorKey, triad: DiatonicTriad) => triad.members.map(degree => degreeIn(key, degree).note).join(' · ');

const functionLabel = {
  stability: 'Stability',
  change: 'Change',
  tension: 'Tension',
} as const;

export const App = () => {
  const [tonic, setTonic] = useState('C');
  const [notation, setNotation] = useState<Notation>('notes');
  const [selectedRoots, setSelectedRoots] = useState<readonly Degree[]>([]);
  const key = majorKeyNamed(tonic);
  const thirdLinks = thirdLinksIn(key);
  const selectedTriads = selectedRoots.map(root => triadIn(key, root));

  const selectKey = (nextTonic: string) => {
    setTonic(nextTonic);
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
          <label>Key
            <select value={tonic} onChange={event => selectKey(event.currentTarget.value)}>
              {majorKeys.map(option => <option value={option.tonic}>{option.tonic} major</option>)}
            </select>
          </label>
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
                  x1={sourceCircleLayout[link.from].x}
                  y1={sourceCircleLayout[link.from].y}
                  x2={sourceCircleLayout[link.to].x}
                  y2={sourceCircleLayout[link.to].y}
                />
              ))}
              {selectedTriads.map(triad => (
                <polyline
                  class={`selection selection--${degreeIn(key, triad.root).function}`}
                  points={chordPath(triad)}
                />
              ))}
            </svg>
            {key.degrees.map(node => {
              const { x, y } = sourceCircleLayout[node.degree];
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
                  <strong>{notation === 'notes' ? chordName(key, triad.root) : `${triad.root} ${triad.quality}`}</strong>
                  <span>{notation === 'notes' ? `${triad.root} · ${chordNotes(key, triad)}` : triad.members.join(' · ')}</span>
                </li>
              ))}
            </ul>
          ) : <p>{notation === 'notes' ? `Tap ${key.tonic} to shade its tonic chord.` : 'Tap a degree to reveal its chord path.'} Select more roots to compare overlapping chords.</p>}
          {selectedTriads.length > 0 && <button class="clear" onClick={() => setSelectedRoots([])}>Clear selection</button>}

          <div class="function-reading">
            <p class="eyebrow">FUNCTIONAL FAMILIES</p>
            <dl>
              {(['stability', 'change', 'tension'] as const).map(functionName => (
                <div class={`function-family function-family--${functionName}`}>
                  <dt>{functionLabel[functionName]}</dt>
                  <dd>{key.degrees.filter(node => node.function === functionName).map(node => node.degree).join(' · ')}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </main>

      <section class="source-note">
        <strong>First lens, not the whole system.</strong> This view holds one {key.tonic}-major field. Adjacent-key comparison, progression paths, and the full Circle of Fifths remain separate future projections of the same harmonic facts.
      </section>

      <footer>Available offline after the first online visit.</footer>
    </div>
  );
};
