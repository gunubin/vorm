import { describe, it, expect } from 'vitest';
import { vo } from '../vo.js';
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

describe('createFormSchema', () => {
  it('returns a FormSchema with fields', () => {
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true }),
        password: passwordField({ required: true }),
      },
    });

    expect(schema.fields).toBeDefined();
    expect(schema.fields.email).toBeDefined();
    expect(schema.fields.password).toBeDefined();
  });

  it('works with empty fields', () => {
    const schema = createFormSchema({
      fields: {},
    });

    expect(schema.fields).toEqual({});
  });

  it('works with a single field', () => {
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true }),
      },
    });

    expect(Object.keys(schema.fields)).toEqual(['email']);
  });

  it('supports mixed VO-derived and primitive fields', () => {
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true }),
        name: createField<string>({ required: true }),
      },
    });

    expect(schema.fields.email.vo).toBe(EmailVO);
    expect(schema.fields.name.vo).toBeNull();
  });

  it('can set messages (form-level override)', () => {
    const schema = createFormSchema({
      fields: {
        password: passwordField({ required: true }),
      },
      messages: {
        password: {
          TOO_SHORT: 'For login screen: Must be at least 8 characters',
        },
      },
    });

    expect(schema.messages).toBeDefined();
    expect(schema.messages!.password).toEqual({
      TOO_SHORT: 'For login screen: Must be at least 8 characters',
    });
  });

  it('can set resolver function', () => {
    const resolver = (values: { password: string; confirmPassword: string }) => {
      if (values.password !== values.confirmPassword) {
        return {
          confirmPassword: { code: 'MISMATCH', message: 'Passwords do not match' },
        };
      }
      return null;
    };

    const schema = createFormSchema({
      fields: {
        password: passwordField({ required: true }),
        confirmPassword: createField<string>({ required: true }),
      },
      resolver,
    });

    expect(schema.resolver).toBe(resolver);
  });
});
