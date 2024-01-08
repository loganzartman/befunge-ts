import {
  Decoration,
  DecorationSet,
  EditorView,
  RangeSetBuilder,
  ViewPlugin,
  ViewUpdate,
} from '@uiw/react-codemirror';

import {DebugInfo} from '@/sandbox/metrics/debugInfo';

function debugDeco(view: EditorView, debug: DebugInfo) {
  const builder = new RangeSetBuilder<Decoration>();

  for (const error of debug.errors) {
    const decoration = Decoration.mark({
      attributes: {
        style: [
          'position: relative',
          'padding: 0.1em',
          'margin: -0.1em',
          'color: red',
          'box-shadow: 0 0 0 2px red',
          'border-radius: 4px',
        ].join('; '),
      },
    });
    builder.add(error.pos, error.pos + 1, decoration);
  }

  return builder.finish();
}

export const showDebug = (debug: DebugInfo) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = debugDeco(view, debug);
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.decorations = debugDeco(update.view, debug);
        }
      }
    },
    {decorations: (v) => v.decorations},
  );
