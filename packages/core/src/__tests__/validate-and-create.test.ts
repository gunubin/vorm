import { describe, it, expect } from 'vitest';
import { validateAndCreate, safeValidateAndCreate, VOValidationError } from '../index.js';

const rules = [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 3 },
  { code: 'NO_UPPER', validate: (v: string) => /[A-Z]/.test(v) },
];

describe('validateAndCreate', () => {
  it('returns value when all rules pass', () => {
    const result = validateAndCreate('Hello', rules, 'Name');
    expect(result).toBe('Hello');
  });

  it('throws VOValidationError when first rule fails', () => {
    expect(() => validateAndCreate('Hi', rules, 'Name')).toThrow(VOValidationError);
    try {
      validateAndCreate('Hi', rules, 'Name');
    } catch (e) {
      expect(e).toBeInstanceOf(VOValidationError);
      expect((e as VOValidationError).brand).toBe('Name');
      expect((e as VOValidationError).code).toBe('TOO_SHORT');
      expect((e as VOValidationError).input).toBe('Hi');
    }
  });

  it('throws VOValidationError when second rule fails', () => {
    expect(() => validateAndCreate('hello', rules, 'Name')).toThrow(VOValidationError);
    try {
      validateAndCreate('hello', rules, 'Name');
    } catch (e) {
      expect((e as VOValidationError).code).toBe('NO_UPPER');
    }
  });
});

describe('safeValidateAndCreate', () => {
  it('returns success when all rules pass', () => {
    const result = safeValidateAndCreate('Hello', rules);
    expect(result).toEqual({ success: true, data: 'Hello' });
  });

  it('returns failure when first rule fails', () => {
    const result = safeValidateAndCreate('Hi', rules);
    expect(result).toEqual({ success: false, error: { code: 'TOO_SHORT' } });
  });

  it('returns failure when second rule fails', () => {
    const result = safeValidateAndCreate('hello', rules);
    expect(result).toEqual({ success: false, error: { code: 'NO_UPPER' } });
  });
});
