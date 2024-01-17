import {BefungeError} from '@/lib/BefungeError';

export class InputExhaustedError extends Error {}

export type InputGenerator = AsyncGenerator<string>;

export function inputFromString(s: string): InputGenerator {
  return (async function* () {
    for (const ch of s) {
      yield ch;
    }
  })();
}

export async function readChar(input: InputGenerator): Promise<string> {
  const next = await input.next();

  if (next.done) {
    throw new InputExhaustedError('Input required: character');
  }

  return next.value;
}

function isDecimal(s: string | undefined): boolean {
  return !!s && s >= '0' && s <= '9';
}

export async function readInteger(input: InputGenerator): Promise<number> {
  const buffer: string[] = [];
  let next = await input.next();

  // skip non-decimal characters
  while (!next.done && !isDecimal(next.value)) {
    next = await input.next();
  }

  // collect decimal characters
  while (!next.done && isDecimal(next.value)) {
    buffer.push(next.value);
    next = await input.next();
  }

  if (buffer.length === 0) {
    throw new InputExhaustedError('Input required: integer');
  }

  const numberValue = Number.parseInt(buffer.join(''), 10);
  if (!Number.isInteger(numberValue)) throw new BefungeError('Invalid number');
  return numberValue;
}
