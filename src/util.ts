export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function ord(c: string): number {
  if (c.length !== 1) {
    throw new Error(`Input must have length 1: '${c}'`);
  }
  return c.charCodeAt(0);
}

export function chr(code: number): string {
  return String.fromCharCode(code);
}

export function choice<T>(choices: T[]): T {
  if (choices.length === 0) throw new Error('Empty choices array');
  return choices[Math.floor(Math.random() * choices.length)];
}
