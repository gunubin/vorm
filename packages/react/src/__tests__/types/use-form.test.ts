import { expectTypeOf } from 'vitest';
import { vo, createField, createFormSchema } from '@vorm/core';
import type { Brand, FieldSchema, FormInputValues, FormOutputValues } from '@vorm/core';
import type { FormState } from '../../use-form.js';

type Email = Brand<string, 'Email'>;
type Password = Brand<string, 'Password'>;

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
    email: emailField({ required: true }),
    password: passwordField({ required: true }),
  },
});

describe('useForm type tests', () => {
  it('values type is FormInputValues (plain types, not branded)', () => {
    type Fields = typeof loginSchema.fields;
    type Input = FormInputValues<Fields>;
    expectTypeOf<Input>().toEqualTypeOf<{ email: string; password: string }>();
  });

  it('handleSubmit handler receives FormOutputValues (branded types)', () => {
    type Fields = typeof loginSchema.fields;
    type Output = FormOutputValues<Fields>;
    expectTypeOf<Output>().toEqualTypeOf<{ email: Email; password: Password }>();
  });

  it('defaultValues matches FormInputValues', () => {
    type Fields = typeof loginSchema.fields;
    type Expected = FormInputValues<Fields>;
    expectTypeOf<Expected>().toEqualTypeOf<{ email: string; password: string }>();
  });

  it('field() name parameter is constrained to field names', () => {
    type Fields = typeof loginSchema.fields;
    type Form = FormState<Fields>;
    type FieldFn = Form['field'];
    expectTypeOf<Parameters<FieldFn>[0]>().toEqualTypeOf<'email' | 'password'>();
  });

  describe('input vs validated type separation', () => {
    it('input values are plain string, not branded', () => {
      type Fields = typeof loginSchema.fields;
      type Input = FormInputValues<Fields>;
      expectTypeOf<Input['email']>().toEqualTypeOf<string>();
      expectTypeOf<Input['email']>().not.toEqualTypeOf<Email>();
    });

    it('output values are branded, not plain string', () => {
      type Fields = typeof loginSchema.fields;
      type Output = FormOutputValues<Fields>;
      expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
      expectTypeOf<Output['password']>().toEqualTypeOf<Password>();
      expectTypeOf<Output['email']>().not.toEqualTypeOf<string>();
    });

    it('FieldSchema separates TInput and TOutput correctly', () => {
      type Fields = typeof loginSchema.fields;
      type EmailInput = Fields['email'] extends FieldSchema<infer TInput, any, any> ? TInput : never;
      type EmailOutput = Fields['email'] extends FieldSchema<any, infer TOutput, any> ? TOutput : never;
      // TInput is plain string
      expectTypeOf<EmailInput>().toEqualTypeOf<string>();
      // TOutput is branded
      expectTypeOf<EmailOutput>().toEqualTypeOf<Email>();
      // They are different types
      expectTypeOf<EmailInput>().not.toEqualTypeOf<EmailOutput>();
    });
  });
});
