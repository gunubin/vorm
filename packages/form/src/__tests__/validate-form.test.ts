import { describe, it, expect } from 'vitest';
import { vo } from '@gunubin/vorm-core';
import { createField } from '../create-field.js';
import { createArrayField } from '../create-array-field.js';
import { createFormSchema } from '../create-form-schema.js';
import { validateForm } from '../validate-form.js';

const EmailVO = vo('Email', [
  { code: 'INVALID_FORMAT', validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
]);

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
]);

const emailField = createField(EmailVO);
const passwordField = createField(PasswordVO);

describe('validateForm', () => {
  it('runs rules on all fields and aggregates errors', () => {
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true, messages: { REQUIRED: 'Email is required' } }),
        password: passwordField({ required: true, messages: { REQUIRED: 'Password is required' } }),
      },
    });

    const errors = validateForm({ email: '', password: '' }, schema);

    expect(errors.email).toEqual({ code: 'REQUIRED', message: 'Email is required' });
    expect(errors.password).toEqual({ code: 'REQUIRED', message: 'Password is required' });
  });

  it('returns empty object when validation passes', () => {
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true }),
        password: passwordField({ required: true }),
      },
    });

    const errors = validateForm(
      { email: 'test@example.com', password: 'Password1' },
      schema,
    );

    expect(errors).toEqual({});
  });

  describe('resolver', () => {
    const signupSchema = createFormSchema({
      fields: {
        password: passwordField({ required: true }),
        confirmPassword: createField<string>()({ required: true }),
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

    it('runs resolver after all rules pass', () => {
      const errors = validateForm(
        { password: 'Password1', confirmPassword: 'Different1' },
        signupSchema,
      );

      expect(errors.confirmPassword).toEqual({
        code: 'MISMATCH',
        message: 'Passwords do not match',
      });
    });

    it('no error when resolver returns null', () => {
      const errors = validateForm(
        { password: 'Password1', confirmPassword: 'Password1' },
        signupSchema,
      );

      expect(errors).toEqual({});
    });

    it('skips resolver when field errors exist', () => {
      let resolverCalled = false;
      const schema = createFormSchema({
        fields: {
          password: passwordField({ required: true }),
          confirmPassword: createField<string>()({ required: true }),
        },
        resolver: () => {
          resolverCalled = true;
          return null;
        },
      });

      validateForm({ password: '', confirmPassword: '' }, schema);
      expect(resolverCalled).toBe(false);
    });
  });

  describe('array field', () => {
    const TagVO = vo('Tag', [
      { code: 'TOO_SHORT', validate: (v: string) => v.length >= 2 },
    ]);

    it('validates required array field', () => {
      const schema = createFormSchema({
        fields: {
          name: createField<string>()({ required: true }),
          tags: createArrayField(TagVO)({ required: true }),
        },
      });

      const errors = validateForm({ name: 'test', tags: [] }, schema);
      expect(errors.tags).toEqual({ code: 'REQUIRED', message: 'This field is required' });
    });

    it('validates per-item errors with bracket notation keys', () => {
      const schema = createFormSchema({
        fields: {
          tags: createArrayField(TagVO)({ required: true }),
        },
      });

      const errors = validateForm({ tags: ['ab', 'x'] }, schema);
      expect(errors['tags[1]']).toEqual({ code: 'TOO_SHORT', message: 'TOO_SHORT' });
      expect(errors['tags[0]']).toBeUndefined();
      expect(errors.tags).toBeUndefined();
    });

    it('validates minLength on array field', () => {
      const schema = createFormSchema({
        fields: {
          tags: createArrayField(TagVO)({ required: true, minLength: 2 }),
        },
      });

      const errors = validateForm({ tags: ['ab'] }, schema);
      expect(errors.tags).toEqual({ code: 'MIN_LENGTH', message: 'MIN_LENGTH' });
    });

    it('mixes scalar and array field validation', () => {
      const schema = createFormSchema({
        fields: {
          name: createField<string>()({ required: true }),
          tags: createArrayField(TagVO)({ required: true }),
        },
      });

      const errors = validateForm({ name: '', tags: [] }, schema);
      expect(errors.name).toEqual({ code: 'REQUIRED', message: 'This field is required' });
      expect(errors.tags).toEqual({ code: 'REQUIRED', message: 'This field is required' });
    });

    it('returns empty when array field is valid', () => {
      const schema = createFormSchema({
        fields: {
          tags: createArrayField(TagVO)({ required: true }),
        },
      });

      const errors = validateForm({ tags: ['ab', 'cd'] }, schema);
      expect(errors).toEqual({});
    });
  });

  it('password confirmation integration example', () => {
    const schema = createFormSchema({
      fields: {
        password: passwordField({
          required: true,
          messages: {
            REQUIRED: 'Please enter a password',
            TOO_SHORT: 'Must be at least 8 characters',
          },
        }),
        confirmPassword: createField<string>({
          messages: { REQUIRED: 'Please enter confirmation password' },
        })({ required: true }),
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

    // all empty
    const errors1 = validateForm({ password: '', confirmPassword: '' }, schema);
    expect(errors1.password).toEqual({ code: 'REQUIRED', message: 'Please enter a password' });
    expect(errors1.confirmPassword).toEqual({ code: 'REQUIRED', message: 'Please enter confirmation password' });

    // password too short
    const errors2 = validateForm({ password: 'short', confirmPassword: 'short' }, schema);
    expect(errors2.password).toEqual({ code: 'TOO_SHORT', message: 'Must be at least 8 characters' });

    // mismatch
    const errors3 = validateForm({ password: 'Password1', confirmPassword: 'Different1' }, schema);
    expect(errors3.confirmPassword).toEqual({ code: 'MISMATCH', message: 'Passwords do not match' });

    // valid
    const errors4 = validateForm({ password: 'Password1', confirmPassword: 'Password1' }, schema);
    expect(errors4).toEqual({});
  });
});
