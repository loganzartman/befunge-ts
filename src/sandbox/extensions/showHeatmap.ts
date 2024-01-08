import {
  Decoration,
  DecorationSet,
  EditorView,
  RangeSetBuilder,
  ViewPlugin,
  ViewUpdate,
} from '@uiw/react-codemirror';

import {Heatmap} from '@/sandbox/metrics/heatmap';

function heatmapDeco(view: EditorView, heatmap: Heatmap) {
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

export const showHeatmap = (heatmap: Heatmap) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = heatmapDeco(view, heatmap);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = heatmapDeco(update.view, heatmap);
        }
      }
    },
    {decorations: (v) => v.decorations},
  );
