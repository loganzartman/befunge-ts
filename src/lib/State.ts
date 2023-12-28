import {Direction} from '@/lib/Direction';
import {Program} from '@/lib/Program';

export class State {
  program: Program;
  stack: number[] = [];
  pcx: number = 0;
  pcy: number = 0;
  direction: Direction = Direction.RIGHT;
  stringmode: boolean = false;
  output: string[] = [];

  constructor(program: Program) {
    this.program = program;
  }

  push(v: number): void {
    this.stack.push(v);
  }

  pop(): number {
    return this.stack.pop() ?? 0;
  }

  getOutput(): string {
    return this.output.join('');
  }
}
