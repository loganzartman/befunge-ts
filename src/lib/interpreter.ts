import {Context} from './Context';
import {ALL_DIRECTIONS, Direction} from './Direction';
import {createProgram} from './Program';
import {State} from './State';
import {choice, chr, mod, ord} from './util';

class ExitProgram {}
export class StepLimitExceeded {}

function stepPc(state: State): void {
  let {pcx, pcy} = state;
  if (state.direction === Direction.RIGHT) {
    pcx += 1;
  } else if (state.direction === Direction.DOWN) {
    pcy += 1;
  } else if (state.direction === Direction.LEFT) {
    pcx -= 1;
  } else if (state.direction === Direction.UP) {
    pcy -= 1;
  } else {
    throw new Error('Invalid direction');
  }
  state.pcx = mod(pcx, state.program.w);
  state.pcy = mod(pcy, state.program.h);
}

function execInstruction(state: State, c: string, context: Context) {
  if (state.stringmode && c !== '"') {
    state.push(ord(c));
    return;
  }

  if (c === ' ') {
    // no-op
  } else if (c === '+') {
    const [a, b] = [state.pop(), state.pop()];
    state.push(a + b);
  } else if (c === '-') {
    const [a, b] = [state.pop(), state.pop()];
    state.push(b - a);
  } else if (c === '*') {
    const [a, b] = [state.pop(), state.pop()];
    state.push(a * b);
  } else if (c === '/') {
    const [a, b] = [state.pop(), state.pop()];
    if (a === 0) {
      throw new Error('div by 0; what result do you want?');
    }
    state.push(Math.floor(b / a));
  } else if (c === '%') {
    const [a, b] = [state.pop(), state.pop()];
    if (a === 0) {
      throw new Error('div by 0; what result do you want?');
    }
    state.push(mod(b, a));
  } else if (c === '!') {
    const a = state.pop();
    if (a === 0) {
      state.push(1);
    } else {
      state.push(0);
    }
  } else if (c === '`') {
    const [a, b] = [state.pop(), state.pop()];
    if (b > a) {
      state.push(1);
    } else {
      state.push(0);
    }
  } else if (c === '>') {
    state.direction = Direction.RIGHT;
  } else if (c === 'v') {
    state.direction = Direction.DOWN;
  } else if (c === '<') {
    state.direction = Direction.LEFT;
  } else if (c === '^') {
    state.direction = Direction.UP;
  } else if (c === '?') {
    state.direction = choice(ALL_DIRECTIONS);
  } else if (c === '_') {
    const a = state.pop();
    if (a === 0) {
      state.direction = Direction.RIGHT;
    } else {
      state.direction = Direction.LEFT;
    }
  } else if (c === '|') {
    const a = state.pop();
    if (a === 0) {
      state.direction = Direction.DOWN;
    } else {
      state.direction = Direction.UP;
    }
  } else if (c === '"') {
    state.stringmode = !state.stringmode;
  } else if (c === ':') {
    const a = state.pop();
    state.push(a);
    state.push(a);
  } else if (c === '\\') {
    const [a, b] = [state.pop(), state.pop()];
    state.push(a);
    state.push(b);
  } else if (c === '$') {
    state.pop();
  } else if (c === '.') {
    state.output.push(`${state.pop()} `);
  } else if (c === ',') {
    state.output.push(chr(state.pop()));
  } else if (c === '#') {
    stepPc(state);
  } else if (c === 'g') {
    const [y, x] = [state.pop(), state.pop()];
    if (!state.program.inBounds(x, y)) {
      return 0;
    }
    const code = ord(state.program.get(x, y));
    state.push(code);
  } else if (c === 'p') {
    const [y, x, v] = [state.pop(), state.pop(), state.pop()];
    if (state.program.inBounds(x, y)) {
      state.program.set(x, y, chr(v));
    }
  } else if (c === '&') {
    throw new Error('Not implemented');
  } else if (c === '~') {
    throw new Error('Not implemented');
  } else if (c === '@') {
    throw new ExitProgram();
  } else if (c >= '0' && c <= '9') {
    state.push(Number.parseInt(c));
  } else {
    throw new Error(`Unsupported command '${c}'`);
  }
}

function stepState(state: State, context: Context): void {
  const c = state.program.get(state.pcx, state.pcy);
  console.log(c, state);
  execInstruction(state, c, context);
  stepPc(state);
}

function* runState(state: State, context: Context): Generator<string> {
  let i = 0;
  while (true) {
    if (i++ > context.stepLimit) {
      throw new StepLimitExceeded();
    }
    try {
      stepState(state, context);
      const newOutput = state.getOutput();
      state.output.length = 0;
      yield newOutput;
    } catch (e) {
      if (e instanceof ExitProgram) {
        break;
      } else {
        throw e;
      }
    }
  }
}

/**
 * Return a generator that steps through Befunge code and yields output produced by each step.
 * @param src Befunge-93 source code
 * @param contextOptions
 * @yields output of each step
 */
export function* stepBefunge(
  src: string,
  contextOptions: Partial<Context> = {},
): Generator<string> {
  const program = createProgram(src);
  const state = new State(program);
  const context = {interactive: false, stepLimit: Infinity, ...contextOptions};
  yield* runState(state, context);
}

/**
 * Execute Befunge code to completion and return the output.
 * @param src Befunge-93 source code
 * @param contextOptions
 * @returns output of Befunge program
 */
export function execBefunge(
  src: string,
  contextOptions: Partial<Context> = {},
): string | undefined {
  const outputBuffer = [];
  for (const output of stepBefunge(src, contextOptions))
    outputBuffer.push(output);
  return outputBuffer.join('');
}
