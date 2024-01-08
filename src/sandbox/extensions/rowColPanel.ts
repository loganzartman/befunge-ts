import {EditorView, Panel, showPanel} from '@codemirror/view';
import {Extension} from '@uiw/react-codemirror';

function getRowCol(view: EditorView) {
  const rangeCoords = view.state.selection.ranges.map((range) => {
    const line0 = view.state.doc.lineAt(range.from);
    const line1 = view.state.doc.lineAt(range.to);
    const row0 = line0.number - 1;
    const row1 = line1.number - 1;
    const col0 = range.from - line0.from;
    const col1 = range.to - line1.from;
    return {
      minRow: Math.min(row0, row1),
      maxRow: Math.max(row0, row1),
      minCol: Math.min(col0, col1),
      maxCol: Math.max(col0, col1),
    };
  });
  const minRow = Math.min.apply(
    null,
    rangeCoords.map((c) => c.minRow),
  );
  const maxRow = Math.max.apply(
    null,
    rangeCoords.map((c) => c.maxRow),
  );
  const minCol = Math.min.apply(
    null,
    rangeCoords.map((c) => c.minCol),
  );
  const maxCol = Math.max.apply(
    null,
    rangeCoords.map((c) => c.maxCol),
  );
  if (minRow === maxRow && minCol === maxCol) {
    return `${minCol}, ${minRow}`;
  }
  return `${minCol}, ${minRow} to ${maxCol}, ${maxRow}`;
}

function makeRowColPanel(view: EditorView): Panel {
  const dom = document.createElement('div');
  dom.className = 'font-mono text-sm text-white/50 p-1';
  dom.textContent = getRowCol(view);
  return {
    dom,
    update(update) {
      dom.textContent = getRowCol(update.view);
    },
  };
}

export function rowColPanel(): Extension {
  return showPanel.of(makeRowColPanel);
}
