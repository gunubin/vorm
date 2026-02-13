import { describe, it, expect } from 'vitest';
import { vo } from '@gunubin/vorm-core';
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

    it('returns REQUIRED error for empty string', () => {
      const error = validateField('', field);
      expect(error).toEqual({ code: 'REQUIRED', message: 'Required' });
    });

    it('returns REQUIRED error for undefined', () => {
      const error = validateField(undefined, field);
      expect(error).toEqual({ code: 'REQUIRED', message: 'Required' });
    });

    it('returns REQUIRED error for null', () => {
      const error = validateField(null, field);
      expect(error).toEqual({ code: 'REQUIRED', message: 'Required' });
    });
  });

  describe('required: false with empty value', () => {
    const field = passwordField({ required: false });

    it('returns no error for empty string (rules skipped)', () => {
      const error = validateField('', field);
      expect(error).toBeNull();
    });

    it('returns no error for undefined', () => {
      const error = validateField(undefined, field);
      expect(error).toBeNull();
    });

    it('returns no error for null', () => {
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

    it('executes in definition order and stops at first failure', () => {
      const error = validateField('short', field);
      expect(error).toEqual({ code: 'TOO_SHORT', message: 'At least 8 characters' });
    });

    it('fails on next rule after first rule passes', () => {
      const error = validateField('longpassword', field);
      expect(error).toEqual({ code: 'NO_UPPERCASE', message: 'Must contain uppercase' });
    });

    it('returns null when all rules pass', () => {
      const error = validateField('Password1', field);
      expect(error).toBeNull();
    });
  });

  describe('custom rules for primitive field', () => {
    const nameField = createField<string>({
      rules: [
        { code: 'TOO_LONG', validate: (v) => v.length <= 100 },
      ],
      messages: {
        REQUIRED: 'Please enter a name',
        TOO_LONG: 'Must be 100 characters or less',
      },
    })({ required: true });

    it('passes custom rule', () => {
      const error = validateField('Test', nameField);
      expect(error).toBeNull();
    });

    it('fails custom rule', () => {
      const error = validateField('a'.repeat(101), nameField);
      expect(error).toEqual({ code: 'TOO_LONG', message: 'Must be 100 characters or less' });
    });
  });

  describe('validates directly against pre-parsed values', () => {
    it('validates number field (against parsed number)', () => {
      const field = createField<number>({
        rules: [
          { code: 'POSITIVE', validate: (v) => v > 0 },
        ],
      })({ required: true });

      expect(validateField(100, field)).toBeNull();
      expect(validateField(-1, field)).toEqual({ code: 'POSITIVE', message: 'POSITIVE' });
    });

    it('performs required check against empty values', () => {
      const field = createField<number>({
        rules: [
          { code: 'POSITIVE', validate: (v) => v > 0 },
        ],
      })({ required: true });

      const error = validateField(undefined, field);
      expect(error).toEqual({ code: 'REQUIRED', message: 'This field is required' });
    });
  });
});
