export class Trace {
  length: number;
  positions: number[] = [];

  constructor(params: {length: number}) {
    this.length = params.length;
  }

  reset(): void {
    this.positions.length = 0;
  }

  record(pos: number): void {
    this.positions.push(pos);
    while (this.positions.length > this.length) {
      this.positions.shift();
    }
  }
}
