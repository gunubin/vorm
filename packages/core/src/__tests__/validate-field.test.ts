import { describe, it, expect } from 'vitest';
import { vo } from '../vo.js';
import { createField } from '../create-field.js';
import { validateField } from '../validate-field.js';

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
  { code: 'NO_UPPERCASE', validate: (v: string) => /[A-Z]/.test(v) },
  { code: 'NO_NUMBER', validate: (v: string) => /[0-9]/.test(v) },
]);

const passwordField = createField(PasswordVO);

describe('validateField', () => {
  describe('required check', () => {
    const field = passwordField({ required: true, messages: { REQUIRED: 'Required' } });

    it('empty string returns REQUIRED error', () => {
      const error = validateField('', field);
      expect(error).toEqual({ code: 'REQUIRED', message: 'Required' });
    });

    it('undefined returns REQUIRED error', () => {
      const error = validateField(undefined, field);
      expect(error).toEqual({ code: 'REQUIRED', message: 'Required' });
    });

    it('null returns REQUIRED error', () => {
      const error = validateField(null, field);
      expect(error).toEqual({ code: 'REQUIRED', message: 'Required' });
    });
  });

  describe('empty value with required: false', () => {
    const field = passwordField({ required: false });

    it('empty string has no error (rules skipped)', () => {
      const error = validateField('', field);
      expect(error).toBeNull();
    });

    it('undefined has no error', () => {
      const error = validateField(undefined, field);
      expect(error).toBeNull();
    });

    it('null has no error', () => {
      const error = validateField(null, field);
      expect(error).toBeNull();
    });
  });

  describe('VO rules', () => {
    const field = passwordField({
      required: true,
      messages: {
        REQUIRED: 'Required',
        TOO_SHORT: 'At least 8 characters',
        NO_UPPERCASE: 'Must contain uppercase',
        NO_NUMBER: 'Must contain number',
      },
    });

    it('runs in definition order and stops at first failure', () => {
      const error = validateField('short', field);
      expect(error).toEqual({ code: 'TOO_SHORT', message: 'At least 8 characters' });
    });

    it('fails at next rule after first passes', () => {
      const error = validateField('longpassword', field);
      expect(error).toEqual({ code: 'NO_UPPERCASE', message: 'Must contain uppercase' });
    });

    it('returns null when all rules pass', () => {
      const error = validateField('Password1', field);
      expect(error).toBeNull();
    });
  });

  describe('custom rules for primitive fields', () => {
    const nameField = createField<string>({
      required: true,
      rules: [
        { code: 'TOO_LONG', validate: (v) => v.length <= 100 },
      ],
      messages: {
        REQUIRED: 'Please enter a name',
        TOO_LONG: 'Must be 100 characters or less',
      },
    });

    it('custom rule passes', () => {
      const error = validateField('Test', nameField);
      expect(error).toBeNull();
    });

    it('custom rule violation', () => {
      const error = validateField('a'.repeat(101), nameField);
      expect(error).toEqual({ code: 'TOO_LONG', message: 'Must be 100 characters or less' });
    });
  });
});
