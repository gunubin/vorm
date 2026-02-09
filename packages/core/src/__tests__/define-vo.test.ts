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
  it('brand, rules, create, safeCreate を持つ VODefinition を返す', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    expect(PasswordVO.brand).toBe('Password');
    expect(PasswordVO.rules).toHaveLength(1);
    expect(PasswordVO.rules[0].code).toBe('TOO_SHORT');
    expect(typeof PasswordVO.create).toBe('function');
    expect(typeof PasswordVO.safeCreate).toBe('function');
  });

  it('rules が空配列でも動作する', () => {
    const EmptyVO = vo('Empty', []);

    expect(EmptyVO.rules).toEqual([]);
    expect(EmptyVO.brand).toBe('Empty');
  });

  it('create が有効な値でブランド型の値を返す', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    const result = PasswordVO.create('mypassword');
    expect(result).toBe('mypassword');
  });

  it('create が無効な値で VOValidationError を投げる', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    expect(() => PasswordVO.create('short')).toThrow(VOValidationError);
    expect(() => PasswordVO.create('short')).toThrow('Password is not valid');
  });

  it('safeCreate が有効な値で success を返す', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    const result = PasswordVO.safeCreate('mypassword');
    expect(result).toEqual({ success: true, data: 'mypassword' });
  });

  it('safeCreate が無効な値で failure を返す', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    const result = PasswordVO.safeCreate('short');
    expect(result).toEqual({ success: false, error: { code: 'TOO_SHORT' } });
  });

  it('rules の定義順が保持される', () => {
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
