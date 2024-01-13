import {Instruction} from '@/lib/instructions';
import {getInstruction} from '@/lib/interpreter';
import {State} from '@/lib/State';

export class MetricsRecorder {
  maxTraceLength: number;
  length: number = 0;
  maxExecs: number = 0;
  totalExecs: number = 0;
  instructions: Array<Instruction | 'multiple' | 'none'> = [];
  execs: number[] = [];
  trace: number[] = [];

  constructor({maxTraceLength = 16}: {maxTraceLength: number}) {
    this.maxTraceLength = maxTraceLength;
  }

  resize(length: number) {
    if (this.length === length) {
      return this;
    }
    this.length = length;
    this.instructions = Array.from({length});
    this.execs = Array.from({length});
    this.trace = [];
    this.reset();
    return this;
  }

  reset() {
    this.totalExecs = 0;
    this.maxExecs = 0;
    this.instructions.fill('none');
    this.execs.fill(0);
    this.trace.length = 0;
    return this;
  }

  exec(pos: number, state: State) {
    this.execs[pos] += 1;
    this.totalExecs += 1;
    this.maxExecs = Math.max(this.maxExecs, this.execs[pos]);

    this.trace.push(pos);
    while (this.trace.length > this.maxTraceLength) {
      this.trace.shift();
    }

    const oldInst = this.instructions[pos];
    if (oldInst === 'none') {
      this.instructions[pos] = getInstruction(state);
    } else if (oldInst !== 'multiple') {
      const inst = getInstruction(state);
      if (oldInst.type !== inst.type) {
        this.instructions[pos] = 'multiple';
      }
    }
  }
}
