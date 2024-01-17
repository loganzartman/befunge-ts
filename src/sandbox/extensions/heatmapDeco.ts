import {
  Decoration,
  DecorationSet,
  EditorView,
  RangeSetBuilder,
} from '@uiw/react-codemirror';

import {MetricsRecorder} from '@/sandbox/metrics/metricsRecorder';

export function heatmapDeco(
  view: EditorView,
  metrics: MetricsRecorder,
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  for (let pos = 0; pos < doc.length; pos++) {
    const h = metrics.execs[pos] / metrics.maxExecs;

    const bg = `hsla(40deg,100%,${(h * 50).toFixed(2)}%,0.5)`;
    const fg =
      h > 0
        ? `hsl(40deg,100%,${((h + 0.5) * 100).toFixed(2)}%)`
        : 'hsl(40deg,0%,30%)';

    const decoration = Decoration.mark({
      attributes: {
        style: `background-color: ${bg}; color: ${fg}`,
      },
    });
    builder.add(pos, pos + 1, decoration);
  }

  return builder.finish();
}
