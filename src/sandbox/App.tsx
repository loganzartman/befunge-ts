import {materialDark} from '@uiw/codemirror-theme-material';
import CodeMirror, {
  crosshairCursor,
  Decoration,
  EditorView,
  highlightWhitespace,
  ReactCodeMirrorRef,
  rectangularSelection,
  ViewUpdate,
} from '@uiw/react-codemirror';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import {InputExhaustedError, inputFromString} from '@/lib/input';
import {stepBefunge, StepLimitExceeded} from '@/lib/interpreter';
import {State} from '@/lib/State';
import {chr} from '@/lib/util';
import {heatmapDeco} from '@/sandbox/extensions/heatmapDeco';
import {rowColPanel} from '@/sandbox/extensions/rowColPanel';
import {showDebug} from '@/sandbox/extensions/showDebug';
import {syntaxDeco} from '@/sandbox/extensions/syntaxDeco';
import {traceDeco} from '@/sandbox/extensions/traceDeco';
import {DebugInfo} from '@/sandbox/metrics/debugInfo';
import {MetricsRecorder} from '@/sandbox/metrics/metricsRecorder';
import {decodeHash, encodeHash} from '@/sandbox/sharing';
import {useStateField} from '@/sandbox/useStateField';

type Status = 'none' | 'awaiting' | 'exited' | 'timeout' | 'error';

function StatusBadge({status}: {status: Status}) {
  if (status === 'none') {
    return (
      <div class="inline-block rounded-lg px-2 py-1 font-mono-serif bg-blue-300 text-blue-900">
        Loading
      </div>
    );
  } else if (status === 'awaiting') {
    return (
      <div class="inline-block rounded-lg px-2 py-1 font-mono-serif bg-violet-300 text-violet-900">
        Waiting
      </div>
    );
  } else if (status === 'exited') {
    return (
      <div class="inline-block rounded-lg px-2 py-1 font-mono-serif bg-green-300 text-green-900">
        Exited
      </div>
    );
  } else if (status === 'timeout') {
    return (
      <div class="inline-block rounded-lg px-2 py-1 font-mono-serif bg-yellow-300 text-yellow-900">
        Timeout
      </div>
    );
  } else if (status === 'error') {
    return (
      <div class="inline-block rounded-lg px-2 py-1 font-mono-serif bg-red-300 text-red-900">
        Error
      </div>
    );
  }
  throw new Error('Invalid status');
}

const vizModes = ['none', 'syntax', 'heatmap', 'trace'] as const;
type VizMode = (typeof vizModes)[number];

export default function App() {
  const [cm, setCm] = useState<ReactCodeMirrorRef>();
  const inputRef = useRef<HTMLInputElement>(null);
  const debugInfo = useRef<DebugInfo>(new DebugInfo()).current;
  const metrics = useRef<MetricsRecorder>(
    new MetricsRecorder({maxTraceLength: 16}),
  ).current;
  const [status, setStatus] = useState<Status>('none');
  const [error, setError] = useState<unknown | null>(null);
  const [output, setOutput] = useState<string>('');
  const [programState, setProgramState] = useState<State | null>(null);
  const [code, setCode] = useState<string>('');
  const [vizMode, setVizMode, vizModeField] = useStateField<VizMode>(
    cm?.view,
    'syntax',
  );

  const vizExtension = useRef(
    EditorView.decorations.from(vizModeField, (vizMode) => (view) => {
      if (vizMode === 'none') return Decoration.none;
      if (vizMode === 'syntax') return syntaxDeco(view, metrics);
      if (vizMode === 'trace') return traceDeco(metrics);
      if (vizMode === 'heatmap') return heatmapDeco(view, metrics);
      throw new Error('Unsupported vizMode');
    }),
  ).current;

  const update = useCallback(
    async (view: EditorView, stepLimit: number) => {
      setOutput('');
      setProgramState(null);
      setError(null);
      setStatus('none');

      const doc = view.state.doc;
      const code = doc.toString();
      debugInfo.reset();
      metrics.reset();
      let lastPos = 0;
      const outputBuffer = [];
      const inputString = inputRef.current?.value ?? '';
      const input = inputFromString(inputString);
      console.log('input', inputString);

      try {
        let lastState: State | null = null;
        const steps = stepBefunge(code, {
          stepLimit,
          input,
        });
        for await (const {state, output} of steps) {
          // need to account for line breaks
          metrics.resize((state.program.w + 1) * state.program.h);
          if (doc) {
            const line = doc.line(state.pcy + 1);
            if (state.pcx < line.length) {
              const pos = line.from + Math.min(line.length - 1, state.pcx);
              lastPos = pos;
              metrics.exec(pos, state);
            }
          }
          outputBuffer.push(output);
          lastState = state;
        }
        setProgramState(lastState);
        setStatus('exited');
      } catch (e) {
        if (e instanceof StepLimitExceeded) {
          setStatus('timeout');
        } else if (e instanceof InputExhaustedError) {
          setError(e);
          setStatus('awaiting');
        } else {
          debugInfo.markError(lastPos, e);
          setError(e);
          setStatus('error');
        }
      } finally {
        setOutput(outputBuffer.join(''));
      }
    },
    [debugInfo, metrics],
  );

  useEffect(() => {
    const h = window.location.hash;
    if (h) {
      try {
        const newCode = decodeHash(h.substring(1));
        setCode(newCode);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleCreate = useCallback(
    (view: EditorView) => {
      update(view, 10_000);
    },
    [update],
  );

  const handleChange = useCallback(
    (value: string, viewUpdate: ViewUpdate) => {
      setCode(value);
      update(viewUpdate.view, 10_000);
    },
    [update],
  );

  const handleInputChange = useCallback(() => {
    const view = cm?.view;
    if (view) update(view, 10_000);
  }, [cm, update]);

  const handleShare = useCallback(() => {
    window.location.hash = encodeHash(code);
  }, [code]);

  const renderedStack = programState?.stack.map((val, i) => (
    <div
      key={i}
      class="flex flex-col items-center rounded-md p-1 font-mono bg-zinc-900"
    >
      <div class="text-orange-200">{val}</div>
      <div class="text-lime-200">{chr(val)}</div>
    </div>
  ));

  return (
    <div class="flex flex-col items-center p-8">
      <h1 class="text-2xl mb-4 font-mono-serif">befunge-ts sandbox</h1>
      <main class="max-w-full w-[1000px] flex flex-col items-stretch">
        <div class="flex flex-row self-stretch gap-3 p-3 rounded-t-lg bg-zinc-900">
          <button
            onClick={() => alert('coming soon')}
            class="p-2 ring-2 ring-zinc-700 rounded-md font-mono transition-colors hover:transition-none hover:bg-zinc-700"
          >
            Debug
          </button>
          <label class="flex flex-row items-center gap-2 ring-2 ring-zinc-700 bg-zinc-700 rounded-md pl-2 font-mono-serif">
            View
            <select
              class="self-stretch px-2 bg-zinc-900 rounded-md font-mono"
              value={vizMode}
              onChange={(e) => setVizMode(e.currentTarget.value as VizMode)}
            >
              {vizModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>
          <div class="flex-1" />
          <button
            onClick={handleShare}
            class="p-2 ring-2 ring-zinc-700 rounded-md font-mono transition-colors hover:transition-none hover:bg-zinc-700"
          >
            Share
          </button>
        </div>
        <CodeMirror
          ref={setCm}
          className="w-full"
          theme={materialDark}
          value={code}
          onCreateEditor={handleCreate}
          onChange={handleChange}
          basicSetup={{
            closeBrackets: false,
            bracketMatching: false,
            indentOnInput: false,
            lineNumbers: false,
            highlightActiveLine: false,
          }}
          extensions={[
            showDebug(debugInfo),
            vizModeField.extension,
            vizExtension,
            highlightWhitespace(),
            rectangularSelection({eventFilter: () => true}),
            rowColPanel(),
          ]}
        />
        <div class="flex flex-col mt-4 gap-2 items-stretch">
          <label class="flex items-center pl-2 rounded-md font-mono-serif ring-2 ring-zinc-700 bg-zinc-700">
            <span>Input</span>
            <input
              type="text"
              ref={inputRef}
              onInput={handleInputChange}
              class="flex-grow font-mono ml-2 p-2 rounded-md bg-zinc-900"
            />
          </label>
          <div class="flex flex-row mt-6 gap-2 items-center font-mono">
            <StatusBadge status={status} />
            {error && <div>{error.toString().replace(/^Error: /, '')}</div>}
          </div>
          <div class="grid grid-cols-[auto,1fr] gap-2 mt-2 items-start">
            <div class="font-mono-serif bg-zinc-300 text-zinc-900 px-2 py-1 rounded-lg text-center">
              stack
            </div>
            <div>
              <div class="flex flex-row gap-1">{renderedStack}</div>
            </div>
            <div class="font-mono-serif bg-zinc-300 text-zinc-900 px-2 py-1 rounded-lg text-center">
              output
            </div>
            <div class="flex flex-col font-mono px-2 py-1">
              {output.split(/\r|\n|\r\n/).map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
