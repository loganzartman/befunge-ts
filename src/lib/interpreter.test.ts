import dedent from 'dedent';

import {execBefunge, StepLimitExceeded} from '@/lib/interpreter';

describe('execBefunge', () => {
  it('executes a minimal program', async () => {
    const result = await execBefunge('1.@');
    expect(result).toBe('1 ');
  });

  it('handles directions', async () => {
    const result = await execBefunge(dedent`
      v
      1>.@
      >^
    `);
    expect(result).toBe('1 ');
  });

  it('g instruction', async () => {
    const result = await execBefunge('50g,@x');
    expect(result).toBe('x');
  });

  it('can get and set program code', async () => {
    const result = await execBefunge(dedent`
      01g, 11g, 01g11p 11g,@
      abc
    `);
    expect(result).toBe('aba');
  });

  it('respects stepLimit', async () => {
    await expect(async () => {
      await execBefunge('012345@', {stepLimit: 5});
    }).toThrow(StepLimitExceeded);
  });

  it("doesn't stop too soon with stepLimit", async () => {
    await expect(async () => {
      await execBefunge('01234@', {stepLimit: 5});
    }).not.toThrow(StepLimitExceeded);
  });

  it("doesn't throw on an empty program", async () => {
    await expect(async () => {
      await execBefunge('', {stepLimit: 5});
    }).toThrow(StepLimitExceeded);
  });
});
