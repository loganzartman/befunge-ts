import {execBefunge} from './interpreter';

describe('execBefunge', () => {
  it('executes a minimal program', () => {
    const result = execBefunge('1.@');
    expect(result).toBe('1 ');
  });
});
