import CodeMirror, {
  highlightWhitespace,
  ReactCodeMirrorRef,
} from '@uiw/react-codemirror';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import {execBefunge, StepLimitExceeded} from '@/lib/interpreter';

export default function App() {
  const cmRef = useRef<ReactCodeMirrorRef>();
  const [output, setOutput] = useState<string>('');
  const [code, setCode] = useState<string>('');

  const update = useCallback((code: string, stepLimit: number) => {
    try {
      const newOutput = execBefunge(code, {stepLimit});
      setOutput(newOutput ?? '');
    } catch (e) {
      if (e instanceof StepLimitExceeded) {
        setOutput('⏱ Timeout');
      } else {
        setOutput(`ERROR: ${e}`);
      }
    }
  }, []);

  useEffect(() => {
    update(code, 1000);
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
          extensions={[highlightWhitespace()]}
          value={code}
          onChange={handleChange}
        />
        <div>{output}</div>
      </main>
    </div>
  );
}
