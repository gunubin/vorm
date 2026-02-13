import { expectTypeOf } from 'vitest';
import { vo } from '@gunubin/vorm-core';
import type { Brand, StandardSchemaV1 } from '@gunubin/vorm-core';
import { createField, createFormSchema, formToStandardSchema } from '../../index.js';

const EmailVO = vo('Email', [
  { code: 'INVALID_FORMAT', validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
]);

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
]);

const loginSchema = createFormSchema({
  fields: {
    email: createField(EmailVO)({ required: true }),
    password: createField(PasswordVO)({ required: true }),
  },
});

type Email = Brand<string, 'Email'>;
type Password = Brand<string, 'Password'>;

describe('formToStandardSchema type tests', () => {
  const schema = formToStandardSchema(loginSchema);

  it('returns StandardSchemaV1<FormInputValues, FormOutputValues>', () => {
    expectTypeOf(schema).toMatchTypeOf<
      StandardSchemaV1<{ email: string; password: string }, { email: Email; password: Password }>
    >();
  });

  it('~standard.validate accepts FormInputValues and returns Result<FormOutputValues>', () => {
    type ValidateFn = typeof schema['~standard']['validate'];
    type ResultOutput = Extract<ReturnType<ValidateFn>, { value: unknown }>['value'];
    expectTypeOf<ResultOutput>().toEqualTypeOf<{ email: Email; password: Password }>();
  });
});
