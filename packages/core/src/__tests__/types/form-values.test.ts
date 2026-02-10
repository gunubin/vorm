import { expectTypeOf } from 'vitest';
import { vo } from '../../vo.js';
import { createField } from '../../create-field.js';
import { createFormSchema } from '../../create-form-schema.js';
import type { Brand, FormInputValues, FormOutputValues } from '../../types.js';

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
  it('VO 由来のフィールドはベース型（string）になる', () => {
    type Input = FormInputValues<typeof loginFormSchema.fields>;
    expectTypeOf<Input['email']>().toEqualTypeOf<string>();
    expectTypeOf<Input['password']>().toEqualTypeOf<string>();
  });

  it('プリミティブフィールドは型を保持する', () => {
    type Input = FormInputValues<typeof mixedFormSchema.fields>;
    expectTypeOf<Input['nickname']>().toEqualTypeOf<string>();
  });

  it('required: false → T | undefined', () => {
    type Input = FormInputValues<typeof mixedFormSchema.fields>;
    expectTypeOf<Input['bio']>().toEqualTypeOf<string | undefined>();
  });

  it('required: true → T', () => {
    type Input = FormInputValues<typeof mixedFormSchema.fields>;
    expectTypeOf<Input['email']>().toEqualTypeOf<string>();
  });
});

describe('FormOutputValues', () => {
  it('VO 由来のフィールドは branded 型になる', () => {
    type Output = FormOutputValues<typeof loginFormSchema.fields>;
    expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
    expectTypeOf<Output['password']>().toEqualTypeOf<Password>();
  });

  it('プリミティブフィールドは入力型と同じ', () => {
    type Output = FormOutputValues<typeof mixedFormSchema.fields>;
    expectTypeOf<Output['nickname']>().toEqualTypeOf<string>();
  });

  it('required: false → T | undefined', () => {
    type Output = FormOutputValues<typeof mixedFormSchema.fields>;
    expectTypeOf<Output['bio']>().toEqualTypeOf<string | undefined>();
  });

  it('required: true → T (branded 型)', () => {
    type Output = FormOutputValues<typeof loginFormSchema.fields>;
    expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
  });
});
