import { expectTypeOf } from 'vitest';
import { vo } from '@gunubin/vorm-core';
import type { Brand } from '@gunubin/vorm-core';
import { createField } from '../../create-field.js';
import { createFormSchema } from '../../create-form-schema.js';
import type { FormInputValues, FormOutputValues } from '../../types.js';

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

const loginFormSchema = createFormSchema({
  fields: {
    email: emailField({ required: true }),
    password: passwordField({ required: true }),
  },
});

const mixedFormSchema = createFormSchema({
  fields: {
    email: emailField({ required: true }),
    nickname: createField<string>()({ required: true }),
    bio: createField<string>()(),
  },
});

describe('FormInputValues', () => {
  it('VO-derived fields resolve to base type (string)', () => {
    type Input = FormInputValues<typeof loginFormSchema.fields>;
    expectTypeOf<Input['email']>().toEqualTypeOf<string>();
    expectTypeOf<Input['password']>().toEqualTypeOf<string>();
  });

  it('primitive fields retain their type', () => {
    type Input = FormInputValues<typeof mixedFormSchema.fields>;
    expectTypeOf<Input['nickname']>().toEqualTypeOf<string>();
  });

  it('required: false resolves to T | undefined', () => {
    type Input = FormInputValues<typeof mixedFormSchema.fields>;
    expectTypeOf<Input['bio']>().toEqualTypeOf<string | undefined>();
  });

  it('required: true resolves to T', () => {
    type Input = FormInputValues<typeof mixedFormSchema.fields>;
    expectTypeOf<Input['email']>().toEqualTypeOf<string>();
  });
});

describe('FormOutputValues', () => {
  it('VO-derived fields resolve to branded type', () => {
    type Output = FormOutputValues<typeof loginFormSchema.fields>;
    expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
    expectTypeOf<Output['password']>().toEqualTypeOf<Password>();
  });

  it('primitive fields match input type', () => {
    type Output = FormOutputValues<typeof mixedFormSchema.fields>;
    expectTypeOf<Output['nickname']>().toEqualTypeOf<string>();
  });

  it('required: false resolves to T | undefined', () => {
    type Output = FormOutputValues<typeof mixedFormSchema.fields>;
    expectTypeOf<Output['bio']>().toEqualTypeOf<string | undefined>();
  });

  it('required: true resolves to T (branded type)', () => {
    type Output = FormOutputValues<typeof loginFormSchema.fields>;
    expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
  });
});
