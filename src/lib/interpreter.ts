import {BefungeError} from '@/lib/BefungeError';
import {Context} from '@/lib/Context';
import {ALL_DIRECTIONS, Direction} from '@/lib/Direction';
import {Instruction, InstructionType} from '@/lib/instructions';
import {createProgram} from '@/lib/Program';
import {State} from '@/lib/State';
import {choice, chr, mod, ord} from '@/lib/util';

class ExitProgram {}
export class StepLimitExceeded {
  toString() {
    return 'Step limit exceeded.';
  }
}

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
    throw new BefungeError('Invalid direction');
  }
  state.pcx = mod(pcx, state.program.w);
  state.pcy = mod(pcy, state.program.h);
}

export function getInstruction(state: State): Instruction {
  const c = state.program.get(state.pcx, state.pcy);
  if (state.stringmode && c !== '"') {
    return {type: InstructionType.pushLiteral, value: c};
  }

  if (c === ' ') return {type: InstructionType.noop};
  else if (c === '+') return {type: InstructionType.add};
  else if (c === '-') return {type: InstructionType.subtract};
  else if (c === '*') return {type: InstructionType.multiply};
  else if (c === '/') return {type: InstructionType.divide};
  else if (c === '%') return {type: InstructionType.mod};
  else if (c === '!') return {type: InstructionType.not};
  else if (c === '`') return {type: InstructionType.greater};
  else if (c === '>') return {type: InstructionType.right};
  else if (c === 'v') return {type: InstructionType.down};
  else if (c === '<') return {type: InstructionType.left};
  else if (c === '^') return {type: InstructionType.up};
  else if (c === '?') return {type: InstructionType.random};
  else if (c === '_') return {type: InstructionType.branchHorizontal};
  else if (c === '|') return {type: InstructionType.branchVertical};
  else if (c === '"') return {type: InstructionType.toggleString};
  else if (c === ':') return {type: InstructionType.duplicate};
  else if (c === '\\') return {type: InstructionType.swap};
  else if (c === '$') return {type: InstructionType.pop};
  else if (c === '.') return {type: InstructionType.outputNumber};
  else if (c === ',') return {type: InstructionType.outputChar};
  else if (c === '#') return {type: InstructionType.skip};
  else if (c === 'g') return {type: InstructionType.get};
  else if (c === 'p') return {type: InstructionType.put};
  else if (c === '&') return {type: InstructionType.readNumber};
  else if (c === '~') return {type: InstructionType.readChar};
  else if (c === '@') return {type: InstructionType.exit};
  else if (c >= '0' && c <= '9')
    return {type: InstructionType.pushLiteral, value: Number.parseInt(c, 10)};

  throw new BefungeError(`Unsupported command '${c}'`);
}

type Behavior = (args: {
  state: State;
  inst: Instruction;
  context: Context;
}) => void;

const behaviorTable: Record<InstructionType, Behavior> = {
  [InstructionType.noop]: () => {},
  [InstructionType.add]: ({state}) => {
    const [a, b] = [state.pop(), state.pop()];
    state.push(a + b);
  },
  [InstructionType.subtract]: ({state}) => {
    const [a, b] = [state.pop(), state.pop()];
    state.push(b - a);
  },
  [InstructionType.multiply]: ({state}) => {
    const [a, b] = [state.pop(), state.pop()];
    state.push(a * b);
  },
  [InstructionType.divide]: ({state}) => {
    const [a, b] = [state.pop(), state.pop()];
    if (a === 0) {
      throw new BefungeError('div by 0; what result do you want?');
    }
    state.push(Math.floor(b / a));
  },
  [InstructionType.mod]: ({state}) => {
    const [a, b] = [state.pop(), state.pop()];
    if (a === 0) {
      throw new BefungeError('div by 0; what result do you want?');
    }
    state.push(mod(b, a));
  },
  [InstructionType.not]: ({state}) => {
    const a = state.pop();
    if (a === 0) {
      state.push(1);
    } else {
      state.push(0);
    }
  },
  [InstructionType.greater]: ({state}) => {
    const [a, b] = [state.pop(), state.pop()];
    if (b > a) {
      state.push(1);
    } else {
      state.push(0);
    }
  },
  [InstructionType.right]: ({state}) => {
    state.direction = Direction.RIGHT;
  },
  [InstructionType.down]: ({state}) => {
    state.direction = Direction.DOWN;
  },
  [InstructionType.left]: ({state}) => {
    state.direction = Direction.LEFT;
  },
  [InstructionType.up]: ({state}) => {
    state.direction = Direction.UP;
  },
  [InstructionType.random]: ({state}) => {
    state.direction = choice(ALL_DIRECTIONS);
  },
  [InstructionType.branchHorizontal]: ({state}) => {
    const a = state.pop();
    if (a === 0) {
      state.direction = Direction.RIGHT;
    } else {
      state.direction = Direction.LEFT;
    }
  },
  [InstructionType.branchVertical]: ({state}) => {
    const a = state.pop();
    if (a === 0) {
      state.direction = Direction.DOWN;
    } else {
      state.direction = Direction.UP;
    }
  },
  [InstructionType.toggleString]: ({state}) => {
    state.stringmode = !state.stringmode;
  },
  [InstructionType.duplicate]: ({state}) => {
    const a = state.pop();
    state.push(a);
    state.push(a);
  },
  [InstructionType.swap]: ({state}) => {
    const [a, b] = [state.pop(), state.pop()];
    state.push(a);
    state.push(b);
  },
  [InstructionType.pop]: ({state}) => {
    state.pop();
  },
  [InstructionType.outputNumber]: ({state}) => {
    state.output.push(`${state.pop()} `);
  },
  [InstructionType.outputChar]: ({state}) => {
    state.output.push(chr(state.pop()));
  },
  [InstructionType.skip]: ({state}) => {
    stepPc(state);
  },
  [InstructionType.get]: ({state}) => {
    const [y, x] = [state.pop(), state.pop()];
    if (!state.program.inBounds(x, y)) {
      return 0;
    }
    const code = ord(state.program.get(x, y));
    state.push(code);
  },
  [InstructionType.put]: ({state}) => {
    const [y, x, v] = [state.pop(), state.pop(), state.pop()];
    if (state.program.inBounds(x, y)) {
      state.program.set(x, y, chr(v));
    }
  },
  [InstructionType.readNumber]: () => {
    throw new BefungeError('Not implemented');
  },
  [InstructionType.readChar]: () => {
    throw new BefungeError('Not implemented');
  },
  [InstructionType.exit]: () => {
    throw new ExitProgram();
  },
  [InstructionType.pushLiteral]: ({state, inst}) => {
    if (inst.type !== 'pushLiteral') throw new Error('internal error');

    if (typeof inst.value === 'number') state.push(inst.value);
    else if (typeof inst.value === 'string') state.push(ord(inst.value));
    else {
      throw new Error(
        `Unsupported push-literal value type: ${typeof inst.value}`,
      );
    }
  },
};

function step(state: State, context: Context): void {
  if (state.program.w > 0 && state.program.h > 0) {
    const inst = getInstruction(state);
    const behavior = behaviorTable[inst.type];
    behavior({state, inst, context});
  }
  stepPc(state);
}

export type Step = {state: State; output: string};

function* execute(state: State, context: Context): Generator<Step> {
  let i = 0;
  while (true) {
    if (i++ > context.stepLimit) {
      throw new StepLimitExceeded();
    }
    try {
      step(state, context);
      const output = state.getOutput();
      state.output.length = 0;
      yield {state, output};
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
): Generator<Step> {
  const program = createProgram(src);
  const state = new State(program);
  const context = {interactive: false, stepLimit: Infinity, ...contextOptions};
  yield* execute(state, context);
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
  for (const {output} of stepBefunge(src, contextOptions))
    outputBuffer.push(output);
  return outputBuffer.join('');
}
