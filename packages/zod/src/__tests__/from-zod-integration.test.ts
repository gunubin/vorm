import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { vo, createField, createFormSchema, validateForm } from '@vorm/core';
import { fromZod } from '../from-zod.js';

describe('fromZod integration test', () => {
  it('full flow: fromZod → vo → createField → createFormSchema', () => {
    const PasswordVO = vo('Password', fromZod(z.string().min(8, 'TOO_SHORT').regex(/[A-Z]/, 'NO_UPPERCASE')));

    const EmailVO = vo('Email', fromZod(z.string().email('INVALID_FORMAT')));

    const passwordField = createField(PasswordVO);
    const emailField = createField(EmailVO);

    const schema = createFormSchema({
      fields: {
        email: emailField({
          required: true,
          messages: {
            REQUIRED: 'Email is required',
            INVALID_FORMAT: 'Invalid email format',
          },
        }),
        password: passwordField({
          required: true,
          messages: {
            REQUIRED: 'Password is required',
            TOO_SHORT: 'At least 8 characters',
            NO_UPPERCASE: 'Must contain uppercase',
          },
        }),
      },
    });

    // all empty
    const errors1 = validateForm({ email: '', password: '' }, schema);
    expect(errors1.email).toEqual({ code: 'REQUIRED', message: 'Email is required' });
    expect(errors1.password).toEqual({ code: 'REQUIRED', message: 'Password is required' });

    // invalid format
    const errors2 = validateForm({ email: 'invalid', password: 'short' }, schema);
    expect(errors2.email).toEqual({ code: 'INVALID_FORMAT', message: 'Invalid email format' });
    expect(errors2.password).toEqual({ code: 'TOO_SHORT', message: 'At least 8 characters' });

    // valid
    const errors3 = validateForm({ email: 'test@example.com', password: 'Password1' }, schema);
    expect(errors3).toEqual({});
  });
});
