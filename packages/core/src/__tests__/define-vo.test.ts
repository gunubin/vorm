import { describe, it, expect } from 'vitest';
import { vo, VOValidationError } from '../vo.js';
import { createRule } from '../create-rule.js';

const minLength = createRule(
  'TOO_SHORT',
  (v: string, min: number) => v.length >= min,
);

const minValue = createRule(
  'FIRST',
  (v: string, min: number) => v.length >= min,
);

describe('vo', () => {
  it('returns a VODefinition with brand, rules, create, safeCreate', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    expect(PasswordVO.brand).toBe('Password');
    expect(PasswordVO.rules).toHaveLength(1);
    expect(PasswordVO.rules[0].code).toBe('TOO_SHORT');
    expect(typeof PasswordVO.create).toBe('function');
    expect(typeof PasswordVO.safeCreate).toBe('function');
  });

  it('works with empty rules array', () => {
    const EmptyVO = vo('Empty', []);

    expect(EmptyVO.rules).toEqual([]);
    expect(EmptyVO.brand).toBe('Empty');
  });

  it('create returns branded value for valid input', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    const result = PasswordVO.create('mypassword');
    expect(result).toBe('mypassword');
  });

  it('create throws VOValidationError for invalid input', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    expect(() => PasswordVO.create('short')).toThrow(VOValidationError);
    expect(() => PasswordVO.create('short')).toThrow('Password is not valid (TOO_SHORT)');
  });

  it('safeCreate returns success for valid input', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    const result = PasswordVO.safeCreate('mypassword');
    expect(result).toEqual({ success: true, data: 'mypassword' });
  });

  it('safeCreate returns failure for invalid input', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    const result = PasswordVO.safeCreate('short');
    expect(result).toEqual({ success: false, error: { code: 'TOO_SHORT' } });
  });

  it('preserves rules definition order', () => {
    const second = createRule(
      'SECOND',
      (v: string, min: number) => v.length >= min,
    );
    const third = createRule(
      'THIRD',
      (v: string, min: number) => v.length >= min,
    );

    const PasswordVO = vo('Password', [minValue(1), second(2), third(3)]);

    expect(PasswordVO.rules.map((r) => r.code)).toEqual(['FIRST', 'SECOND', 'THIRD']);
  });
});
