export class Program {
  lines: string[][];
  w: number;
  h: number;

  constructor({lines, w, h}: {lines: string[][]; w: number; h: number}) {
    this.lines = lines;
    this.w = w;
    this.h = h;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x: number, y: number): string {
    if (!this.inBounds(x, y)) {
      throw new Error(`Index out of bounds: ${x}, ${y}`);
    }
    if (x < this.lines[y].length) {
      return this.lines[y][x];
    }
    return ' ';
  }

  set(x: number, y: number, v: string): void {
    if (v.length !== 1) {
      throw new Error(`Invalid value, must have length 1: '${v}'`);
    }
    if (!this.inBounds(x, y)) {
      throw new Error(`Index out of bounds: ${x}, ${y}`);
    }
    if (x >= this.lines[y].length) {
      this.lines[y].fill(' ', this.lines[y].length, x);
    }
    this.lines[y][x] = v;
  }

  toString(): string {
    return this.lines.map((line) => line.join('')).join('\n');
  }
}

export function createProgram(src: string): Program {
  const rawLines = src.split(/\r?\n/);
  const w = rawLines.reduce((max, line) => Math.max(max, line.length), 0);
  const h = rawLines.length;
  const lines = rawLines.map((l) => l.split(''));
  return new Program({lines, w, h});
}
