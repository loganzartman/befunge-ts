import {
  Decoration,
  DecorationSet,
  EditorView,
  RangeSetBuilder,
} from '@uiw/react-codemirror';

import {Heatmap} from '@/sandbox/metrics/heatmap';

export function heatmapDeco(
  view: EditorView,
  heatmap: Heatmap | null,
): DecorationSet {
  if (!heatmap) return Decoration.none;

  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  for (let pos = 0; pos < doc.length; pos++) {
    const h = heatmap.heat(pos);
    if (h > 0) {
      const bg = `hsla(40deg,80%,${(h * 50).toFixed(2)}%,0.5)`;
      const fg = `hsl(40deg,80%,${((h + 0.5) * 50).toFixed(2)}%)`;

      const decoration = Decoration.mark({
        attributes: {
          style: `background-color: ${bg}; color: ${fg}`,
        },
      });
      builder.add(pos, pos + 1, decoration);
    }
  }

  return builder.finish();
}
