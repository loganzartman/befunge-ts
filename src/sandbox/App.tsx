import CodeMirror, {
  highlightWhitespace,
  keymap,
  ReactCodeMirrorRef,
  rectangularSelection,
} from '@uiw/react-codemirror';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import {stepBefunge, StepLimitExceeded} from '@/lib/interpreter';
import {Heatmap, showHeatmap} from '@/sandbox/heatmap';
import {padLines} from '@/sandbox/padlines';

export default function App() {
  const cmRef = useRef<ReactCodeMirrorRef>();
  const heatmapRef = useRef<Heatmap>(new Heatmap());
  const [output, setOutput] = useState<string>('');
  const [code, setCode] = useState<string>('');

  const update = useCallback((code: string, stepLimit: number) => {
    const doc = cmRef.current?.view?.state.doc;
    try {
      const heatmap = heatmapRef.current;
      const outputBuffer = [];
      let first = true;
      for (const {state, output} of stepBefunge(code, {stepLimit})) {
        if (first) {
          heatmap.resize(state.program.w * state.program.h);
          first = false;
        }
        if (doc) {
          const line = doc.line(state.pcy + 1);
          if (state.pcx < line.length) {
            const pos = line.from + state.pcx;
            heatmap.bump(pos);
          }
        }
        outputBuffer.push(output);
      }
      setOutput(outputBuffer.join(''));
    } catch (e) {
      if (e instanceof StepLimitExceeded) {
        setOutput('⏱ Timeout');
      } else {
        setOutput(`ERROR: ${e}`);
      }
    }
  }, []);

  useEffect(() => {
    update(code, 10_000);
  }, [code, update]);

  const handleChange = useCallback((value: string) => {
    setCode(value);
  }, []);

  return (
    <div class="flex flex-col align-center p-8">
      <h1 class="text-2xl mb-4">befunge-ts sandbox</h1>
      <main class="w-[800px] max-w-full flex flex-col gap-2">
        <div class="flex flex-row gap-2">
          <button id="button-run" class="p-2 bg-slate-200 rounded-md">
            ▶️ Run
          </button>
          <button id="button-step" class="p-2 bg-slate-200 rounded-md">
            ⏭️ Step
          </button>
          <button id="button-stop" class="p-2 bg-slate-200 rounded-md">
            ⏹️ Stop
          </button>
        </div>
        <CodeMirror
          ref={cmRef}
          theme="dark"
          value={code}
          onChange={handleChange}
          basicSetup={{
            closeBrackets: false,
            bracketMatching: false,
            indentOnInput: false,
            crosshairCursor: true,
          }}
          extensions={[
            padLines({char: ' '}),
            showHeatmap(heatmapRef.current),
            highlightWhitespace(),
            rectangularSelection({eventFilter: () => true}),
          ]}
        />
        <div>{output}</div>
      </main>
    </div>
  );
}
