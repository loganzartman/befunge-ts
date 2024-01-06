import {decode, encode} from 'base2048';
import {compressToUint8Array, decompressFromUint8Array} from 'lz-string';

export const encodeHash = (text: string): string => {
  const compressed = compressToUint8Array(text);
  return encode(compressed);
};

export const decodeHash = (hash: string): string => {
  const encoded = decodeURIComponent(hash);
  const decoded = decode(encoded);
  return decompressFromUint8Array(decoded);
};
