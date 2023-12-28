import dedent from 'dedent';

import {execBefunge, StepLimitExceeded} from '@/lib/interpreter';

describe('execBefunge', () => {
  it('executes a minimal program', () => {
    const result = execBefunge('1.@');
    expect(result).toBe('1 ');
  });

  it('g instruction', () => {
    const result = execBefunge('50g,@x');
    expect(result).toBe('x');
  });

  it('can get and set program code', () => {
    const result = execBefunge(dedent`
      01g, 11g, 01g11p 11g,@
      abc
    `);
    expect(result).toBe('aba');
  });

  it('respects stepLimit', () => {
    expect(() => {
      execBefunge('012345@', {stepLimit: 5});
    }).toThrow(StepLimitExceeded);
  });

  it("doesn't stop too soon with stepLimit", () => {
    expect(() => {
      execBefunge('01234@', {stepLimit: 5});
    }).not.toThrow(StepLimitExceeded);
  });
});
