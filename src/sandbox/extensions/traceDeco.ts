import {
  Decoration,
  DecorationSet,
  RangeSetBuilder,
} from '@uiw/react-codemirror';

import {MetricsRecorder} from '@/sandbox/metrics/metricsRecorder';

export function traceDeco(metrics: MetricsRecorder): DecorationSet {
  const decorations: [number, Decoration][] = [];
  const trace = metrics.trace;

  for (let i = 0; i < trace.length; ++i) {
    const pos = trace[i];
    const f = i / (trace.length - 1);
    const bg = `hsla(160deg,30%,${(f * 100).toFixed(2)}%, 0.5)`;
    const fg = `hsl(160deg,80%,${((f * 0.5 + 0.5) * 100).toFixed(2)}%)`;

    decorations.push([
      pos,
      Decoration.mark({
        attributes: {
          style: [`background-color: ${bg}`, `color: ${fg}`].join('; '),
        },
      }),
    ]);
  }

  const builder = new RangeSetBuilder<Decoration>();
  decorations
    .sort(([pa], [pb]) => pa - pb)
    .forEach(([pos, value]) => builder.add(pos, pos + 1, value));
  return builder.finish();
}
