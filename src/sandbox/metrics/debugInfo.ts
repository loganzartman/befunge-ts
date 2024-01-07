export type DebugInfoError = {pos: number; error: unknown};

export class DebugInfo {
  errors: DebugInfoError[] = [];

  reset(): void {
    this.errors.length = 0;
  }

  markError(pos: number, error: unknown): void {
    this.errors.push({pos, error});
  }
}
