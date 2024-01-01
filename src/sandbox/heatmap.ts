import {
  Decoration,
  DecorationSet,
  EditorView,
  RangeSetBuilder,
  ViewPlugin,
  ViewUpdate,
} from '@uiw/react-codemirror';

export class Heatmap {
  counts: number[] = [];
  errors: Set<number> = new Set();
  max: number = 0;

  resize(length: number) {
    this.counts = Array.from<number>({length});
    this.reset();
    return this;
  }

  reset() {
    this.counts.fill(0);
    this.errors.clear();
    this.max = 0;
    return this;
  }

  bump(pos: number) {
    const c = ++this.counts[pos];
    this.max = Math.max(this.max, c);
  }

  error(pos: number) {
    this.errors.add(pos);
  }

  heat(pos: number): number {
    return this.counts[pos] / this.max;
  }

  isError(pos: number): boolean {
    return this.errors.has(pos);
  }
}

function heatmapDeco(view: EditorView, heatmap: Heatmap) {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  for (let pos = 0; pos < doc.length; pos++) {
    const styles: string[] = [];
    const h = heatmap.heat(pos);
    const color = `hsla(40deg,80%,50%,${h.toFixed(2)})`;
    styles.push(`background-color: ${color};`);
    if (heatmap.isError(pos)) {
      styles.push('box-shadow: 0 0 0 2px red');
      styles.push('border-radius: 4px');
    }

    const decoration = Decoration.mark({
      attributes: {
        style: styles.join('; '),
      },
    });
    builder.add(pos, pos + 1, decoration);
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
        if (update.docChanged) {
          this.decorations = heatmapDeco(update.view, heatmap);
        }
      }
    },
    {decorations: (v) => v.decorations},
  );
