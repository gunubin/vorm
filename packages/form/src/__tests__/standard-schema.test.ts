import { describe, it, expect } from 'vitest';
import { vo } from '@gunubin/vorm-core';
import { createField } from '../create-field.js';
import { createFormSchema } from '../create-form-schema.js';

const EmailVO = vo('Email', [
  { code: 'INVALID_FORMAT', validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
]);

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
]);

const emailField = createField(EmailVO);
const passwordField = createField(PasswordVO);

const loginSchema = createFormSchema({
  fields: {
    email: emailField({
      required: true,
      messages: { REQUIRED: 'Email is required', INVALID_FORMAT: 'Invalid email format' },
    }),
    password: passwordField({
      required: true,
      messages: { REQUIRED: 'Password is required', TOO_SHORT: 'Must be at least 8 characters' },
    }),
  },
});

describe('FormSchema as Standard Schema v1', () => {
  it('has ~standard with version 1 and vendor "vorm"', () => {
    expect(loginSchema['~standard'].version).toBe(1);
    expect(loginSchema['~standard'].vendor).toBe('vorm');
  });

  it('returns value on valid input', () => {
    const result = loginSchema['~standard'].validate({
      email: 'test@example.com',
      password: 'Password1',
    });
    expect(result).toEqual({
      value: { email: 'test@example.com', password: 'Password1' },
    });
    expect(result).not.toHaveProperty('issues');
  });

  it('returns issues with field path on validation failure', () => {
    const result = loginSchema['~standard'].validate({
      email: '',
      password: '',
    });
    expect('issues' in result && result.issues).toBeDefined();
    if ('issues' in result && result.issues) {
      expect(result.issues).toHaveLength(2);
      expect(result.issues).toContainEqual({
        message: 'Email is required',
        path: ['email'],
      });
      expect(result.issues).toContainEqual({
        message: 'Password is required',
        path: ['password'],
      });
    }
  });

  it('returns issues for specific field errors', () => {
    const result = loginSchema['~standard'].validate({
      email: 'invalid',
      password: 'short',
    });
    expect('issues' in result && result.issues).toBeDefined();
    if ('issues' in result && result.issues) {
      expect(result.issues).toContainEqual({
        message: 'Invalid email format',
        path: ['email'],
      });
      expect(result.issues).toContainEqual({
        message: 'Must be at least 8 characters',
        path: ['password'],
      });
    }
  });

  it('partial failure returns only failing fields', () => {
    const result = loginSchema['~standard'].validate({
      email: 'test@example.com',
      password: '',
    });
    expect('issues' in result && result.issues).toBeDefined();
    if ('issues' in result && result.issues) {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toEqual({
        message: 'Password is required',
        path: ['password'],
      });
    }
  });
});
