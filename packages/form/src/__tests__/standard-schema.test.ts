import { describe, it, expect } from 'vitest';
import { vo } from '@gunubin/vorm-core';
import { createField } from '../create-field.js';
import { createArrayField } from '../create-array-field.js';
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

describe('Standard Schema with array fields', () => {
  const TagVO = vo('Tag', [
    { code: 'TOO_SHORT', validate: (v: string) => v.length >= 2 },
  ]);

  const arraySchema = createFormSchema({
    fields: {
      name: createField<string>()({ required: true }),
      tags: createArrayField(TagVO)({
        required: true,
        minLength: 1,
        messages: { REQUIRED: 'Tags are required' },
      }),
    },
  });

  it('returns value on valid input with array field', () => {
    const result = arraySchema['~standard'].validate({
      name: 'test',
      tags: ['ab', 'cd'],
    });
    expect(result).toEqual({
      value: { name: 'test', tags: ['ab', 'cd'] },
    });
    expect(result).not.toHaveProperty('issues');
  });

  it('returns issues with field name path for array-level error', () => {
    const result = arraySchema['~standard'].validate({
      name: 'test',
      tags: [],
    });
    expect('issues' in result && result.issues).toBeDefined();
    if ('issues' in result && result.issues) {
      expect(result.issues).toContainEqual({
        message: 'Tags are required',
        path: ['tags'],
      });
    }
  });

  it('returns issues with [field, index] path for per-item errors', () => {
    const result = arraySchema['~standard'].validate({
      name: 'test',
      tags: ['ab', 'x'],
    });
    expect('issues' in result && result.issues).toBeDefined();
    if ('issues' in result && result.issues) {
      expect(result.issues).toContainEqual({
        message: 'TOO_SHORT',
        path: ['tags', 1],
      });
    }
  });

  it('returns issues for both scalar and array fields', () => {
    const result = arraySchema['~standard'].validate({
      name: '',
      tags: [],
    });
    expect('issues' in result && result.issues).toBeDefined();
    if ('issues' in result && result.issues) {
      expect(result.issues).toHaveLength(2);
      expect(result.issues).toContainEqual({
        message: 'This field is required',
        path: ['name'],
      });
      expect(result.issues).toContainEqual({
        message: 'Tags are required',
        path: ['tags'],
      });
    }
  });
});
