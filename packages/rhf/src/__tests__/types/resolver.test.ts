import { expectTypeOf } from 'vitest';
import { vo, createField, createFormSchema } from '@gunubin/vorm-core';
import type { Brand, FormInputValues, FormOutputValues } from '@gunubin/vorm-core';
import type { FieldValues } from 'react-hook-form';
import { useVorm } from '../../use-vorm-form.js';

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

describe('RHF resolver type tests', () => {
  it('FormInputValues is plain string', () => {
    type Input = FormInputValues<typeof loginSchema.fields>;
    expectTypeOf<Input['email']>().toEqualTypeOf<string>();
    expectTypeOf<Input['password']>().toEqualTypeOf<string>();
  });

  it('FormOutputValues is Branded Type', () => {
    type Output = FormOutputValues<typeof loginSchema.fields>;
    expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
    expectTypeOf<Output['password']>().toEqualTypeOf<Password>();
  });

  it('Email and Password are not assignable to each other', () => {
    type Output = FormOutputValues<typeof loginSchema.fields>;
    expectTypeOf<Output['email']>().not.toEqualTypeOf<Output['password']>();
  });

  it('optional field resolves to | undefined', () => {
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true }),
        nickname: createField<string>()({ required: false }),
      },
    });

    type Output = FormOutputValues<typeof schema.fields>;
    expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
    expectTypeOf<Output['nickname']>().toEqualTypeOf<string | undefined>();
  });
});

describe('useVorm handleSubmit type tests', () => {
  it('handleSubmit callback first argument is Branded Type', () => {
    type Fields = typeof loginSchema.fields;
    type Output = FormOutputValues<Fields> & FieldValues;

    type Form = ReturnType<typeof useVorm<Fields>>;
    type HandleSubmit = Form['handleSubmit'];

    type OnValidCallback = Parameters<HandleSubmit>[0];
    type SubmitData = Parameters<OnValidCallback>[0];

    expectTypeOf<SubmitData['email']>().toEqualTypeOf<Email>();
    expectTypeOf<SubmitData['password']>().toEqualTypeOf<Password>();
  });

  it('handleSubmit values are Branded Type (not plain string)', () => {
    type Fields = typeof loginSchema.fields;
    type Output = FormOutputValues<Fields> & FieldValues;

    type Form = ReturnType<typeof useVorm<Fields>>;
    type OnValidCallback = Parameters<Form['handleSubmit']>[0];
    type SubmitData = Parameters<OnValidCallback>[0];

    expectTypeOf<SubmitData['email']>().toMatchTypeOf<string>();
    expectTypeOf<string>().not.toMatchTypeOf<SubmitData['email']>();
  });

  it('cannot confuse Email and Password in handleSubmit', () => {
    type Fields = typeof loginSchema.fields;
    type Form = ReturnType<typeof useVorm<Fields>>;
    type OnValidCallback = Parameters<Form['handleSubmit']>[0];
    type SubmitData = Parameters<OnValidCallback>[0];

    expectTypeOf<SubmitData['email']>().not.toEqualTypeOf<SubmitData['password']>();
  });
});
