import {ChangeSpec, EditorState, Extension, Text} from '@uiw/react-codemirror';

function contentLen(line: string): number {
  for (let i = line.length - 1; i >= 0; --i) {
    if (line[i] !== ' ') return i + 1;
  }
  return 0;
}

function isRemoval(
  fromA: number,
  toA: number,
  fromB: number,
  toB: number,
  inserted: Text,
): boolean {
  const lenA = toA - fromA;
  const lenB = toB - fromB;
  return lenB - lenA + inserted.length < 0;
}

export const padLines = ({char}: {char: string}): Extension => {
  if (char.length !== 1) throw new Error('char must be 1-length string');
  return EditorState.transactionFilter.of((tr) => {
    if (!tr.docChanged) return tr;

    const doc = tr.newDoc;
    let maxLen = 0;
    let maxContentLen = 0;
    for (const l of doc.iterLines()) {
      maxLen = Math.max(maxLen, l.length);
      maxContentLen = Math.max(maxContentLen, contentLen(l));
    }

    let hasRemoval = false;
    tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
      if (isRemoval(fromA, toA, fromB, toB, inserted)) {
        console.log(tr.changes);
        hasRemoval = true;
      }
    });

    const changes: ChangeSpec[] = [];
    for (let i = 1; i <= doc.lines; ++i) {
      const line = doc.line(i);
      const padLen = maxContentLen - line.length;
      if (padLen > 0) {
        const padding = char.repeat(padLen);
        changes.push({from: line.from + line.length, insert: padding});
      }
      if (padLen < 0 && hasRemoval) {
        const to = line.from + line.length;
        changes.push({from: to + padLen, to, newLength: 0});
      }
    }

    return [tr, {changes, sequential: true}];
  });
};
