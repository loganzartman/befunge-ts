import {githubDark} from '@uiw/codemirror-theme-github';
import CodeMirror, {
  highlightWhitespace,
  ReactCodeMirrorRef,
  rectangularSelection,
} from '@uiw/react-codemirror';
import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';

import {stepBefunge, StepLimitExceeded} from '@/lib/interpreter';
import {State} from '@/lib/State';
import {chr} from '@/lib/util';
import {rowColPanel} from '@/sandbox/extensions/rowColPanel';
import {showDebug} from '@/sandbox/extensions/showDebug';
import {showHeatmap} from '@/sandbox/extensions/showHeatmap';
import {showTrace} from '@/sandbox/extensions/showTrace';
import {DebugInfo} from '@/sandbox/metrics/debugInfo';
import {Heatmap} from '@/sandbox/metrics/heatmap';
import {Trace} from '@/sandbox/metrics/trace';
import {padLines} from '@/sandbox/padlines';
import {decodeHash, encodeHash} from '@/sandbox/sharing';

type Status = 'none' | 'exited' | 'timeout' | 'error';

function StatusBadge({status}: {status: Status}) {
  if (status === 'none') {
    return (
      <div class="inline-block rounded-lg px-2 py-1 font-mono-serif bg-blue-300 text-blue-900">
        Loading
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

const vizModes = ['none', 'heatmap', 'trace'];
type VizMode = (typeof vizModes)[number];

export default function App() {
  const cmRef = useRef<ReactCodeMirrorRef>();
  const heatmap = useRef<Heatmap>(new Heatmap()).current;
  const debugInfo = useRef<DebugInfo>(new DebugInfo()).current;
  const trace = useRef<Trace>(new Trace({length: 16})).current;
  const [status, setStatus] = useState<Status>('none');
  const [error, setError] = useState<unknown | null>(null);
  const [output, setOutput] = useState<string>('');
  const [programState, setProgramState] = useState<State | null>(null);
  const [code, setCode] = useState<string>('');
  const [vizMode, setVizMode] = useState<VizMode>('trace');

  const update = useCallback(
    (code: string, stepLimit: number) => {
      setOutput('');
      setProgramState(null);
      setError(null);
      setStatus('none');

      const doc = cmRef.current?.view?.state.doc;
      debugInfo.reset();
      heatmap.reset();
      trace.reset();
      let lastPos = 0;
      const outputBuffer = [];

      try {
        let first = true;
        let lastState: State | null = null;
        for (const {state, output} of stepBefunge(code, {stepLimit})) {
          if (first) {
            heatmap.resize(state.program.w * state.program.h);
            first = false;
          }
          if (doc) {
            const line = doc.line(state.pcy + 1);
            if (state.pcx < line.length) {
              const pos = line.from + state.pcx;
              lastPos = pos;
              heatmap.bump(pos);
              trace.record(pos);
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
        } else {
          debugInfo.markError(lastPos, e);
          setError(e);
          setStatus('error');
        }
      } finally {
        setOutput(outputBuffer.join(''));
      }
    },
    [debugInfo, heatmap, trace],
  );

  useEffect(() => {
    update(code, 10_000);
  }, [code, update]);

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

  const handleChange = useCallback((value: string) => {
    setCode(value);
  }, []);

  const renderedStack = programState?.stack.map((val, i) => (
    <div
      key={i}
      class="flex flex-col items-center rounded-md p-1 font-mono bg-zinc-900"
    >
      <div class="text-orange-200">{val}</div>
      <div class="text-lime-200">{chr(val)}</div>
    </div>
  ));

  const handleShare = useCallback(() => {
    window.location.hash = encodeHash(code);
  }, [code]);

  const extensions = useMemo(
    () =>
      [
        padLines({char: ' '}),
        showDebug(debugInfo),
        vizMode === 'heatmap' && showHeatmap(heatmap),
        vizMode === 'trace' && showTrace(trace),
        highlightWhitespace(),
        rectangularSelection({eventFilter: () => true}),
        rowColPanel(),
      ].filter(Boolean),
    [debugInfo, heatmap, trace, vizMode],
  );

  return (
    <div class="flex flex-col items-center p-8">
      <h1 class="text-2xl mb-4 font-mono-serif">befunge-ts sandbox</h1>
      <main class="max-w-full w-[1000px] flex flex-col items-start">
        <div class="flex flex-row self-stretch gap-3 p-3 rounded-t-lg bg-zinc-900">
          <button
            onClick={() => alert('coming soon')}
            class="p-2 ring-2 ring-zinc-700 rounded-md font-mono-serif transition-colors hover:transition-none hover:bg-zinc-700"
          >
            Debug
          </button>
          <label class="flex flex-row items-center gap-2 ring-2 ring-zinc-700 bg-zinc-700 rounded-md pl-2 font-mono-serif">
            Visualize
            <select
              class="self-stretch px-2 bg-zinc-900 rounded-md"
              value={vizMode}
              onChange={(e) => setVizMode(e.currentTarget.value)}
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
            class="p-2 ring-2 ring-zinc-700 rounded-md font-mono-serif transition-colors hover:transition-none hover:bg-zinc-700"
          >
            Share
          </button>
        </div>
        <CodeMirror
          ref={cmRef}
          className="w-full"
          theme={githubDark}
          value={code}
          onChange={handleChange}
          basicSetup={{
            closeBrackets: false,
            bracketMatching: false,
            indentOnInput: false,
            crosshairCursor: true,
            lineNumbers: false,
            highlightActiveLine: false,
          }}
          extensions={extensions}
        />
        <div class="flex flex-col gap-2 mt-6 items-start">
          <div class="flex flex-row gap-2 items-center font-mono">
            <StatusBadge status={status} />
            {error && (
              <div class="text-red-300">
                {error.toString().replace(/^Error: /, '')}
              </div>
            )}
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
