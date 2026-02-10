import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { fromZod } from '../from-zod.js';

describe('fromZod', () => {
  describe('z.string()', () => {
    it('.min() → ValidationRule conversion', () => {
      const rules = fromZod(z.string().min(8, 'TOO_SHORT'));

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('TOO_SHORT');
      expect(rules[0].validate('12345678')).toBe(true);
      expect(rules[0].validate('1234567')).toBe(false);
    });

    it('.email() → ValidationRule conversion', () => {
      const rules = fromZod(z.string().email('INVALID_EMAIL'));

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('INVALID_EMAIL');
      expect(rules[0].validate('test@example.com')).toBe(true);
      expect(rules[0].validate('invalid')).toBe(false);
    });

    it('.regex() → ValidationRule conversion', () => {
      const rules = fromZod(z.string().regex(/[A-Z]/, 'NO_UPPERCASE'));

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('NO_UPPERCASE');
      expect(rules[0].validate('Hello')).toBe(true);
      expect(rules[0].validate('hello')).toBe(false);
    });

    it('multiple rule chain → multiple ValidationRules', () => {
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
    it('.min() → ValidationRule conversion', () => {
      const rules = fromZod(z.number().min(0, 'TOO_YOUNG'));

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('TOO_YOUNG');
      expect(rules[0].validate(0)).toBe(true);
      expect(rules[0].validate(-1)).toBe(false);
    });

    it('.max() → ValidationRule conversion', () => {
      const rules = fromZod(z.number().max(150, 'TOO_OLD'));

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('TOO_OLD');
      expect(rules[0].validate(150)).toBe(true);
      expect(rules[0].validate(151)).toBe(false);
    });
  });

  describe('code configuration', () => {
    it('2nd argument is set as code', () => {
      const rules = fromZod(z.string().min(1, 'CUSTOM_CODE'));
      expect(rules[0].code).toBe('CUSTOM_CODE');
    });

    it('uses zod check kind when code is omitted', () => {
      const rules = fromZod(z.string().min(1));
      expect(rules[0].code).toBe('min');
    });

    it('email code when omitted', () => {
      const rules = fromZod(z.string().email());
      expect(rules[0].code).toBe('email');
    });
  });

  describe('z.number() exclusive', () => {
    it('.gt() (exclusive min) → value > min', () => {
      const rules = fromZod(z.number().gt(0, 'MUST_BE_POSITIVE'));

      expect(rules).toHaveLength(1);
      expect(rules[0].validate(1)).toBe(true);
      expect(rules[0].validate(0)).toBe(false);
      expect(rules[0].validate(-1)).toBe(false);
    });

    it('.lt() (exclusive max) → value < max', () => {
      const rules = fromZod(z.number().lt(100, 'MUST_BE_UNDER_100'));

      expect(rules).toHaveLength(1);
      expect(rules[0].validate(99)).toBe(true);
      expect(rules[0].validate(100)).toBe(false);
      expect(rules[0].validate(101)).toBe(false);
    });
  });

  describe('z.string() .max()', () => {
    it('.max() → string length check', () => {
      const rules = fromZod(z.string().max(5, 'TOO_LONG'));

      expect(rules).toHaveLength(1);
      expect(rules[0].validate('hello')).toBe(true);
      expect(rules[0].validate('hello!')).toBe(false);
    });
  });

  describe('non-string/number values', () => {
    it('min returns true for non-string/number', () => {
      const rules = fromZod(z.string().min(1, 'MIN'));
      expect(rules[0].validate(true as any)).toBe(true);
    });

    it('max returns true for non-string/number', () => {
      const rules = fromZod(z.string().max(5, 'MAX'));
      expect(rules[0].validate(true as any)).toBe(true);
    });

    it('email returns true for non-string', () => {
      const rules = fromZod(z.string().email('EMAIL'));
      expect(rules[0].validate(123 as any)).toBe(true);
    });

    it('regex returns true for non-string', () => {
      const rules = fromZod(z.string().regex(/abc/, 'REGEX'));
      expect(rules[0].validate(123 as any)).toBe(true);
    });
  });

  describe('unknown check kind', () => {
    it('unsupported check kind → no-op rule (always true)', () => {
      const schema = z.string().url('INVALID_URL');
      const rules = fromZod(schema);

      expect(rules.length).toBeGreaterThan(0);
      const urlRule = rules.find((r) => r.code === 'INVALID_URL');
      expect(urlRule).toBeDefined();
      expect(urlRule!.validate('anything')).toBe(true);
    });
  });

  describe('.brand()', () => {
    it('.brand() is ignored (only inner rules are extracted)', () => {
      const rules = fromZod(z.string().min(8, 'TOO_SHORT').brand<'Password'>());

      expect(rules).toHaveLength(1);
      expect(rules[0].code).toBe('TOO_SHORT');
      expect(rules[0].validate('12345678')).toBe(true);
      expect(rules[0].validate('1234567')).toBe(false);
    });
  });
});
