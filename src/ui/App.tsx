import { useState } from 'preact/hooks';
import { cMajor, chordName, degreeIn, triadIn, type Degree, type DiatonicTriad } from '../domain/majorKey.ts';
import { sourceCircleLayout } from '../projections/circleOfThirds.ts';

const key = cMajor;

const point = (degree: Degree) => {
  const { x, y } = sourceCircleLayout[degree];
  return `${x},${y}`;
};

const chordPath = (triad: DiatonicTriad) => triad.members.map(point).join(' ');
const chordNotes = (triad: DiatonicTriad) => triad.members.map(degree => degreeIn(key, degree).note).join(' · ');

const functionLabel = {
  stability: 'Stability',
  change: 'Change',
  tension: 'Tension',
} as const;

export const App = () => {
  const [selectedRoots, setSelectedRoots] = useState<readonly Degree[]>([]);
  const selectedTriads = selectedRoots.map(root => triadIn(key, root));

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
        <p class="key">C major</p>
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
              {key.triads.map(triad => <polyline class={`triad triad--${triad.quality}`} points={chordPath(triad)} />)}
              {selectedTriads.map(triad => <polygon class={`selection selection--${triad.quality}`} points={chordPath(triad)} />)}
            </svg>
            {key.degrees.map(node => {
              const { x, y } = sourceCircleLayout[node.degree];
              const selected = selectedRoots.includes(node.degree);
              return (
                <button
                  class={`degree-node degree-node--${node.degree} ${selected ? 'is-selected' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  aria-pressed={selected}
                  aria-label={`${selected ? 'Hide' : 'Show'} ${node.note} ${node.quality} chord, ${node.degree}`}
                  onClick={() => toggleChord(node.degree)}
                >
                  <span class="note">{node.note}</span>
                  <span class="numeral">{node.degree}</span>
                </button>
              );
            })}
          </div>

          <div class="legend" aria-label="Diagram legend">
            <span><i class="legend-line legend-line--major" />major triad</span>
            <span><i class="legend-line legend-line--minor" />minor triad</span>
          </div>
        </section>

        <aside class="reading surface" aria-labelledby="reading-title">
          <p class="eyebrow">CHORDS IN VIEW</p>
          <h2 id="reading-title">{selectedTriads.length ? 'Selected chords' : 'Nothing selected yet'}</h2>
          {selectedTriads.length ? (
            <ul class="chord-list">
              {selectedTriads.map(triad => <li><strong>{chordName(key, triad.root)}</strong><span>{triad.root} · {chordNotes(triad)}</span></li>)}
            </ul>
          ) : <p>Tap C to shade C–E–G. Select more roots to compare overlapping chords.</p>}
          {selectedTriads.length > 0 && <button class="clear" onClick={() => setSelectedRoots([])}>Clear selection</button>}

          <div class="function-reading">
            <p class="eyebrow">FUNCTIONAL FAMILIES</p>
            <dl>
              {(['stability', 'change', 'tension'] as const).map(functionName => (
                <div>
                  <dt>{functionLabel[functionName]}</dt>
                  <dd>{key.degrees.filter(node => node.function === functionName).map(node => node.degree).join(' · ')}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </main>

      <section class="source-note">
        <strong>First lens, not the whole system.</strong> This view holds one C-major field. Adjacent-key comparison, progression paths, and the full Circle of Fifths remain separate future projections of the same harmonic facts.
      </section>

      <footer>Available offline after the first online visit.</footer>
    </div>
  );
};
