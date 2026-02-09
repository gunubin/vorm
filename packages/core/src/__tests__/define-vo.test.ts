import { describe, it, expect } from 'vitest';
import { vo } from '../vo.js';
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
  it('brand, rules, parse を持つ VODefinition を返す', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    expect(PasswordVO.brand).toBe('Password');
    expect(PasswordVO.rules).toHaveLength(1);
    expect(PasswordVO.rules[0].code).toBe('TOO_SHORT');
    expect(typeof PasswordVO.parse).toBe('function');
  });

  it('rules が空配列でも動作する', () => {
    const EmptyVO = vo<string>('Empty', []);

    expect(EmptyVO.rules).toEqual([]);
    expect(EmptyVO.brand).toBe('Empty');
  });

  it('parse がブランド型の値を返す', () => {
    const PasswordVO = vo('Password', [minLength(8)]);

    const result = PasswordVO.parse('mypassword');
    expect(result).toBe('mypassword');
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
