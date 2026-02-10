import { describe, it, expect } from 'vitest';
import { vo, createField, createFormSchema } from '@gunubin/vorm-core';
import { createVormResolver } from '../resolver.js';

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
      messages: { REQUIRED: 'Email is required', INVALID_FORMAT: 'Invalid email' },
    }),
    password: passwordField({
      required: true,
      messages: { REQUIRED: 'Password is required', TOO_SHORT: 'Min 8 chars' },
    }),
  },
});

describe('createVormResolver', () => {
  const resolver = createVormResolver(loginSchema);

  it('returns required errors in RHF FieldErrors format', async () => {
    const result = await resolver(
      { email: '', password: '' },
      undefined,
      { criteriaMode: 'firstError', fields: {}, names: [], shouldUseNativeValidation: false },
    );

    expect(result.errors.email).toEqual({
      type: 'REQUIRED',
      message: 'Email is required',
    });
    expect(result.errors.password).toEqual({
      type: 'REQUIRED',
      message: 'Password is required',
    });
    expect(result.values).toEqual({});
  });

  it('returns validation rule errors', async () => {
    const result = await resolver(
      { email: 'invalid', password: 'short' },
      undefined,
      { criteriaMode: 'firstError', fields: {}, names: [], shouldUseNativeValidation: false },
    );

    expect(result.errors.email).toEqual({
      type: 'INVALID_FORMAT',
      message: 'Invalid email',
    });
    expect(result.errors.password).toEqual({
      type: 'TOO_SHORT',
      message: 'Min 8 chars',
    });
  });

  it('returns VO Branded Type values when validation passes', async () => {
    const result = await resolver(
      { email: 'test@example.com', password: 'Password1' },
      undefined,
      { criteriaMode: 'firstError', fields: {}, names: [], shouldUseNativeValidation: false },
    );

    expect(result.errors).toEqual({});
    expect(result.values).toEqual({
      email: 'test@example.com',
      password: 'Password1',
    });

    expect(result.values.email).toBe('test@example.com');
    expect(result.values.password).toBe('Password1');
  });

  it('returns undefined for empty optional field', async () => {
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true, messages: { REQUIRED: 'Required' } }),
        nickname: createField<string>()({ required: false }),
      },
    });

    const optionalResolver = createVormResolver(schema);
    const result = await optionalResolver(
      { email: 'test@example.com', nickname: '' },
      undefined,
      { criteriaMode: 'firstError', fields: {}, names: [], shouldUseNativeValidation: false },
    );

    expect(result.errors).toEqual({});
    expect(result.values.email).toBe('test@example.com');
    expect(result.values.nickname).toBeUndefined();
  });

  it('returns value as-is for field without VO', async () => {
    const schema = createFormSchema({
      fields: {
        name: createField<string>({ messages: { REQUIRED: 'Name required' } })({ required: true }),
      },
    });

    const plainResolver = createVormResolver(schema);
    const result = await plainResolver(
      { name: 'John' },
      undefined,
      { criteriaMode: 'firstError', fields: {}, names: [], shouldUseNativeValidation: false },
    );

    expect(result.errors).toEqual({});
    expect(result.values.name).toBe('John');
  });

  describe('parse application', () => {
    it('runs string -> parse -> validate -> vo.create pipeline', async () => {
      const PriceVO = vo('Price', [
        { code: 'POSITIVE', validate: (v: number) => v > 0 },
      ]);

      const schema = createFormSchema({
        fields: {
          price: createField(PriceVO, {
            parse: (v: string) => Number(v.replace(/,/g, '')),
          })({ required: true, messages: { REQUIRED: 'Required', POSITIVE: 'Must be positive' } }),
        },
      });

      const r = createVormResolver(schema);

      // Valid value
      const result = await r(
        { price: '1,000' } as any,
        undefined,
        { criteriaMode: 'firstError', fields: {}, names: [], shouldUseNativeValidation: false },
      );
      expect(result.errors).toEqual({});
      expect(result.values.price).toBe(1000);

      // Validation failure
      const result2 = await r(
        { price: '-1' } as any,
        undefined,
        { criteriaMode: 'firstError', fields: {}, names: [], shouldUseNativeValidation: false },
      );
      expect(result2.errors.price).toEqual({
        type: 'POSITIVE',
        message: 'Must be positive',
      });
    });
  });

  describe('cross-field resolver', () => {
    const signupSchema = createFormSchema({
      fields: {
        password: passwordField({ required: true, messages: { REQUIRED: 'Required' } }),
        confirmPassword: createField<string>({ messages: { REQUIRED: 'Required' } })({ required: true }),
      },
      resolver: (values) => {
        if (values.password !== values.confirmPassword) {
          return {
            confirmPassword: { code: 'MISMATCH', message: 'Passwords do not match' },
          };
        }
        return null;
      },
    });

    it('returns cross-field validation error', async () => {
      const r = createVormResolver(signupSchema);
      const result = await r(
        { password: 'Password1', confirmPassword: 'Different1' },
        undefined,
        { criteriaMode: 'firstError', fields: {}, names: [], shouldUseNativeValidation: false },
      );

      expect(result.errors.confirmPassword).toEqual({
        type: 'MISMATCH',
        message: 'Passwords do not match',
      });
    });

    it('passes cross-field validation', async () => {
      const r = createVormResolver(signupSchema);
      const result = await r(
        { password: 'Password1', confirmPassword: 'Password1' },
        undefined,
        { criteriaMode: 'firstError', fields: {}, names: [], shouldUseNativeValidation: false },
      );

      expect(result.errors).toEqual({});
      expect(result.values.password).toBe('Password1');
    });
  });
});
