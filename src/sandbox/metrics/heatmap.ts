export class Heatmap {
  private counts: number[] = [];
  private max: number = 0;

  resize(length: number) {
    if (this.counts.length === length) {
      return this;
    }
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
