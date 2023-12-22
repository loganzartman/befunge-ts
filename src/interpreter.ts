import {Context} from './Context';
import {ALL_DIRECTIONS, Direction} from './Direction';
import {createProgram} from './Program';
import {State} from './State';
import {choice, chr, mod, ord} from './util';

class ExitProgram {}

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
    const [x, y] = [state.pop(), state.pop()];
    let code = Number.parseInt(state.program.get(x, y));
    if (!Number.isInteger(code)) {
      code = 0;
    }
    state.push(code);
  } else if (c === 'p') {
    const [y, x, v] = [state.pop(), state.pop(), state.pop()];
    state.program.set(x, y, chr(v));
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
  execInstruction(state, c, context);
  stepPc(state);
}

function* runState(state: State, context: Context): Generator<string> {
  const outputBuffer: string[] = [];
  while (true) {
    try {
      stepState(state, context);
      const newOutput = state.getOutput();
      state.output.length = 0;
      outputBuffer.push(newOutput);
      yield newOutput;
    } catch (e) {
      if (e instanceof ExitProgram) {
        break;
      } else {
        throw e;
      }
    }
  }
  return outputBuffer.join('');
}

export function execBefunge(
  src: string,
  contextOptions: Partial<Context> = {},
): string | undefined {
  const program = createProgram(src);
  const state = new State(program);
  const context = {interactive: false, ...contextOptions};
  let result;
  for (result of runState(state, context)) {
    console.log(result);
  }
  return result;
}
