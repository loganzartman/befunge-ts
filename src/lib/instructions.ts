export const InstructionType = {
  noop: 'noop',
  add: 'add',
  subtract: 'subtract',
  multiply: 'multiply',
  divide: 'divide',
  mod: 'mod',
  not: 'not',
  greater: 'greater',
  right: 'right',
  down: 'down',
  left: 'left',
  up: 'up',
  random: 'random',
  branchHorizontal: 'branchHorizontal',
  branchVertical: 'branchVertical',
  toggleString: 'toggleString',
  duplicate: 'duplicate',
  swap: 'swap',
  pop: 'pop',
  outputNumber: 'outputNumber',
  outputChar: 'outputChar',
  skip: 'skip',
  get: 'get',
  put: 'put',
  readNumber: 'readNumber',
  readChar: 'readChar',
  exit: 'exit',
  pushLiteral: 'pushLiteral',
} as const;

export type InstructionType = keyof typeof InstructionType;

export type Instruction =
  | {type: Exclude<InstructionType, 'pushLiteral'>}
  | {type: 'pushLiteral'; value: number};
