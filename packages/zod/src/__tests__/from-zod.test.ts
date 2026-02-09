import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { fromZod } from '../from-zod.js';

describe('fromZod', () => {
  describe('z.string()', () => {
    it('.min() → ValidationRule 変換', () => {
      const rules = fromZod(z.string().min(8, 'TOO_SHORT'));

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('TOO_SHORT');
      expect(rules[0].validate('12345678')).toBe(true);
      expect(rules[0].validate('1234567')).toBe(false);
    });

    it('.email() → ValidationRule 変換', () => {
      const rules = fromZod(z.string().email('INVALID_EMAIL'));

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('INVALID_EMAIL');
      expect(rules[0].validate('test@example.com')).toBe(true);
      expect(rules[0].validate('invalid')).toBe(false);
    });

    it('.regex() → ValidationRule 変換', () => {
      const rules = fromZod(z.string().regex(/[A-Z]/, 'NO_UPPERCASE'));

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('NO_UPPERCASE');
      expect(rules[0].validate('Hello')).toBe(true);
      expect(rules[0].validate('hello')).toBe(false);
    });

    it('複数ルールチェーン → 複数 ValidationRule', () => {
      const rules = fromZod(
        z.string().min(8, 'TOO_SHORT').regex(/[A-Z]/, 'NO_UPPERCASE').email('BAD_EMAIL'),
      );

      expect(rules).toHaveLength(3);
      expect(rules[0].code).toBe('TOO_SHORT');
      expect(rules[1].code).toBe('NO_UPPERCASE');
      expect(rules[2].code).toBe('BAD_EMAIL');
    });
  });

  describe('z.number()', () => {
    it('.min() → ValidationRule 変換', () => {
      const rules = fromZod(z.number().min(0, 'TOO_YOUNG'));

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('TOO_YOUNG');
      expect(rules[0].validate(0)).toBe(true);
      expect(rules[0].validate(-1)).toBe(false);
    });

    it('.max() → ValidationRule 変換', () => {
      const rules = fromZod(z.number().max(150, 'TOO_OLD'));

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('TOO_OLD');
      expect(rules[0].validate(150)).toBe(true);
      expect(rules[0].validate(151)).toBe(false);
    });
  });

  describe('code の設定', () => {
    it('第2引数が code に設定される', () => {
      const rules = fromZod(z.string().min(1, 'CUSTOM_CODE'));
      expect(rules[0].code).toBe('CUSTOM_CODE');
    });

    it('code 省略時は zod の check kind を使用', () => {
      const rules = fromZod(z.string().min(1));
      expect(rules[0].code).toBe('min');
    });

    it('email の code 省略時', () => {
      const rules = fromZod(z.string().email());
      expect(rules[0].code).toBe('email');
    });
  });

  describe('.brand()', () => {
    it('.brand() が無視される（内部のルールのみ抽出される）', () => {
      const rules = fromZod(z.string().min(8, 'TOO_SHORT').brand<'Password'>());

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('TOO_SHORT');
      expect(rules[0].validate('12345678')).toBe(true);
      expect(rules[0].validate('1234567')).toBe(false);
    });
  });
});
