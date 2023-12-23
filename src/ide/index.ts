import {StepLimitExceeded, execBefunge} from 'src/lib/interpreter';

const runButton = document.getElementById('run-button')! as HTMLButtonElement;
const sourceInput = document.getElementById(
  'source-input',
)! as HTMLTextAreaElement;
const outputDisplay = document.getElementById('output-display')!;

function update({stepLimit}: {stepLimit?: number} = {}) {
  try {
    const output = execBefunge(sourceInput.value, {stepLimit});
    outputDisplay.innerText = output ?? '';
  } catch (e) {
    if (e instanceof StepLimitExceeded) {
      outputDisplay.innerText = '⏱ Timeout';
    } else {
      outputDisplay.innerText = `ERROR: ${e}`;
    }
  }
}

sourceInput.addEventListener('keyup', () => {
  update({stepLimit: 1000});
});

runButton.addEventListener('click', () => {
  update();
});
