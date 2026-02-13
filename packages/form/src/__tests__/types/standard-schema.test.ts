import { expectTypeOf } from 'vitest';
import { vo } from '@gunubin/vorm-core';
import type { Brand, StandardSchemaV1 } from '@gunubin/vorm-core';
import { createField, createFormSchema } from '../../index.js';

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

describe('FormSchema is StandardSchemaV1', () => {
  it('createFormSchema result is assignable to StandardSchemaV1', () => {
    expectTypeOf(loginSchema).toMatchTypeOf<
      StandardSchemaV1<{ email: string; password: string }, { email: Email; password: Password }>
    >();
  });

  it('~standard.validate returns Result<FormOutputValues>', () => {
    type ValidateFn = typeof loginSchema['~standard']['validate'];
    type ResultOutput = Extract<ReturnType<ValidateFn>, { value: unknown }>['value'];
    expectTypeOf<ResultOutput>().toEqualTypeOf<{ email: Email; password: Password }>();
  });
});
