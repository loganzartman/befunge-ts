import {StepLimitExceeded, execBefunge} from 'src/lib/interpreter';
import {EditorView, basicSetup} from 'codemirror';
import {highlightWhitespace} from '@codemirror/view';

const runButton = document.getElementById('run-button')! as HTMLButtonElement;
const sourceContainer = document.getElementById('source-container')!;
const outputDisplay = document.getElementById('output-display')!;

function update({stepLimit}: {stepLimit?: number} = {}) {
  try {
    const output = execBefunge(getCode(), {stepLimit});
    outputDisplay.innerText = output ?? '';
  } catch (e) {
    if (e instanceof StepLimitExceeded) {
      outputDisplay.innerText = '⏱ Timeout';
    } else {
      outputDisplay.innerText = `ERROR: ${e}`;
    }
  }
}

const updateListener = EditorView.updateListener.of(() => {
  update({stepLimit: 1000});
});

const editor = new EditorView({
  extensions: [basicSetup, highlightWhitespace(), updateListener],
  parent: sourceContainer,
});

function getCode(): string {
  return editor.state.doc.toString();
}

runButton.addEventListener('click', () => {
  update();
});
