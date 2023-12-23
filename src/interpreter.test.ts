import dedent from 'dedent';
import {execBefunge} from './interpreter';

describe('execBefunge', () => {
  it('executes a minimal program', () => {
    const result = execBefunge('1.@');
    expect(result).toBe('1 ');
  });

  it('can get and set program code', () => {
    const result = execBefunge(dedent`
      10g,12g,11g12p12g,@
      abcdef
    `);
    expect(result).toBe('aba');
  });
});
