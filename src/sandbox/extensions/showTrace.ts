import {
  Decoration,
  DecorationSet,
  EditorView,
  RangeSetBuilder,
  ViewPlugin,
  ViewUpdate,
} from '@uiw/react-codemirror';

import {Trace} from '@/sandbox/metrics/trace';

function traceDeco(view: EditorView, trace: Trace) {
  const decorations: [number, Decoration][] = [];

  for (let i = 0; i < trace.positions.length; ++i) {
    const pos = trace.positions[i];
    const f = i / (trace.positions.length - 1);
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

export const showTrace = (trace: Trace) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = traceDeco(view, trace);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = traceDeco(update.view, trace);
        }
      }
    },
    {decorations: (v) => v.decorations},
  );
