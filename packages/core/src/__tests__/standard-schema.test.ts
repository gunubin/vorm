import { describe, it, expect } from 'vitest';
import { vo } from '../vo.js';
import { createRule } from '../create-rule.js';
import { toStandardSchema } from '../standard-schema.js';

const minLength = createRule(
  'TOO_SHORT',
  (v: string, min: number) => v.length >= min,
);

const maxLength = createRule(
  'TOO_LONG',
  (v: string, max: number) => v.length <= max,
);

const hasUppercase = createRule<string>(
  'NO_UPPERCASE',
  (v) => /[A-Z]/.test(v),
);

describe('toStandardSchema', () => {
  const PasswordVO = vo('Password', [minLength(8), maxLength(100), hasUppercase()]);
  const schema = toStandardSchema(PasswordVO);

  it('has correct ~standard properties', () => {
    expect(schema['~standard'].version).toBe(1);
    expect(schema['~standard'].vendor).toBe('vorm');
    expect(typeof schema['~standard'].validate).toBe('function');
  });

  it('returns value for valid input', () => {
    const result = schema['~standard'].validate('MyPassword');
    expect(result).toEqual({ value: 'MyPassword' });
  });

  it('returns issues for invalid input', () => {
    const result = schema['~standard'].validate('Short');
    expect(result).toEqual({
      issues: [{ message: 'TOO_SHORT' }],
    });
  });

  it('collects all failing issues', () => {
    const result = schema['~standard'].validate('ab');
    expect(result).toEqual({
      issues: [
        { message: 'TOO_SHORT' },
        { message: 'NO_UPPERCASE' },
      ],
    });
  });

  it('validates unknown input (type mismatch)', () => {
    const result = schema['~standard'].validate(12345);
    // number has no .length, so minLength/maxLength fail
    expect('issues' in result && result.issues!.length).toBeGreaterThan(0);
  });

  it('works with empty rules', () => {
    const EmptyVO = vo('Empty', []);
    const emptySchema = toStandardSchema(EmptyVO);
    const result = emptySchema['~standard'].validate('anything');
    expect(result).toEqual({ value: 'anything' });
  });
});
