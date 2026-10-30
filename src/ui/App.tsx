import { degreeByName, gMajorCircleOfThirds, type Degree, type Triad } from '../domain/circleOfThirds.ts';

const circle = gMajorCircleOfThirds;

const point = (degree: Degree) => {
  const { x, y } = degreeByName(circle, degree);
  return `${x},${y}`;
};

const triangle = (triad: Triad) => triad.degrees.map(point).join(' ');

const DegreeNode = ({ degree }: { degree: Degree }) => {
  const node = degreeByName(circle, degree);
  return (
    <g class={`degree degree--${node.quality}`} transform={`translate(${node.x} ${node.y})`}>
      <circle r="5.2" />
      <text class="note" text-anchor="middle" dominant-baseline="central">{node.note}</text>
      <text class="numeral" text-anchor="middle" y="9">{node.degree}</text>
    </g>
  );
};

export const App = () => (
  <div class="workspace">
    <header class="masthead">
      <div>
        <p class="eyebrow">HARMONIA · FIRST STUDY</p>
        <h1>Circle of thirds<span>.</span></h1>
      </div>
      <p class="key">G major</p>
    </header>

    <main class="study">
      <section class="diagram surface" aria-labelledby="diagram-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">SOURCE GEOMETRY</p>
            <h2 id="diagram-title">Diatonic triads, held in one shape</h2>
          </div>
          <p>The first Harmonia view follows the supplied G-major reference.</p>
        </div>

        <svg class="circle" viewBox="0 0 100 100" role="img" aria-labelledby="circle-title circle-description">
          <title id="circle-title">Circle of thirds in G major</title>
          <desc id="circle-description">Seven scale degrees arranged in fifth-order. Dark triangles are major triads and light triangles are minor triads.</desc>
          <path class="outer-loop" d="M 50 78 L 78 54 L 35 16 L 19 76 L 88 82 L 64 22 L 25 43 Z" />
          {circle.triads.filter(triad => triad.quality === 'major').map(triad => <polygon class="triad triad--major" points={triangle(triad)} />)}
          {circle.triads.filter(triad => triad.quality === 'minor').map(triad => <polygon class="triad triad--minor" points={triangle(triad)} />)}
          {circle.degrees.map(node => <DegreeNode degree={node.degree} />)}
        </svg>

        <div class="legend" aria-label="Diagram legend">
          <span><i class="legend-line legend-line--major" />major triad</span>
          <span><i class="legend-line legend-line--minor" />minor triad</span>
          <span><i class="legend-line" />fifth-order route</span>
        </div>
      </section>

      <section class="reading surface" aria-labelledby="reading-title">
        <p class="eyebrow">WHAT THIS FIRST VIEW CLAIMS</p>
        <h2 id="reading-title">Each triangle is a chord; the same notes participate in several chords.</h2>
        <p>G–B–D, C–E–G, and D–F♯–A are the major triads. The lighter triangles reveal their minor counterparts. F♯° remains present as degree vii°, while its diminished chord is intentionally left unresolved until the source treatment is better specified.</p>
      </section>
    </main>

    <footer>Available offline after the first online visit.</footer>
  </div>
);
