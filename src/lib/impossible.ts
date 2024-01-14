export const impossible = (_: never): never => {
  throw new Error('This case is impossible.');
};
