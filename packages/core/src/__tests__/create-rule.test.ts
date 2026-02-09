import { describe, it, expect } from 'vitest';
import { createRule } from '../create-rule.js';
import { vo } from '../vo.js';
import type { ValidationRule } from '../types.js';

describe('createRule', () => {
  it('option ありのルールファクトリを作成できる', () => {
    const minLength = createRule(
      'minLength',
      (val: string, min: number) => val.length >= min,
    );

    const rule = minLength(8);
    expect(rule.code).toBe('minLength');
    expect(rule.validate('12345678')).toBe(true);
    expect(rule.validate('1234567')).toBe(false);
  });

  it('option なしのルールファクトリを作成できる', () => {
    const hasUppercase = createRule(
      'hasUppercase',
      (val: string) => /[A-Z]/.test(val),
    );

    const rule = hasUppercase();
    expect(rule.code).toBe('hasUppercase');
    expect(rule.validate('Hello')).toBe(true);
    expect(rule.validate('hello')).toBe(false);
  });

  it('返却された関数が ValidationRule 型に準拠する', () => {
    const minLength = createRule(
      'minLength',
      (val: string, min: number) => val.length >= min,
    );

    const rule: ValidationRule<string> = minLength(8);
    expect(rule).toHaveProperty('code');
    expect(rule).toHaveProperty('validate');
  });

  it('vo() と組み合わせて使える', () => {
    const minLength = createRule(
      'minLength',
      (val: string, min: number) => val.length >= min,
    );
    const hasUppercase = createRule(
      'hasUppercase',
      (val: string) => /[A-Z]/.test(val),
    );

    const PasswordVO = vo('Password', [minLength(8), hasUppercase()]);

    expect(PasswordVO.brand).toBe('Password');
    expect(PasswordVO.rules).toHaveLength(2);
    expect(PasswordVO.rules[0].code).toBe('minLength');
    expect(PasswordVO.rules[1].code).toBe('hasUppercase');
  });

  it('同じルールファクトリから異なる option で複数ルールを作成できる', () => {
    const minLength = createRule(
      'minLength',
      (val: string, min: number) => val.length >= min,
    );

    const rule3 = minLength(3);
    const rule8 = minLength(8);

    expect(rule3.validate('abc')).toBe(true);
    expect(rule8.validate('abc')).toBe(false);
  });
});
