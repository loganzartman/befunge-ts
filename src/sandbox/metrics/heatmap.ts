export class Heatmap {
  counts: number[] = [];
  max: number = 0;

  resize(length: number) {
    this.counts = Array.from<number>({length});
    this.reset();
    return this;
  }

  reset() {
    this.counts.fill(0);
    this.max = 0;
    return this;
  }

  bump(pos: number) {
    const c = ++this.counts[pos];
    this.max = Math.max(this.max, c);
  }

  heat(pos: number): number {
    return this.counts[pos] / this.max;
  }
}
