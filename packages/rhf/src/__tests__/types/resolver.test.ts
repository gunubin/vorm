import { expectTypeOf } from 'vitest';
import { vo, createField, createFormSchema } from '@vorm/core';
import type { Brand, FormInputValues, FormOutputValues } from '@vorm/core';
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

describe('RHF resolver 型テスト', () => {
  it('FormInputValues は plain string', () => {
    type Input = FormInputValues<typeof loginSchema.fields>;
    expectTypeOf<Input['email']>().toEqualTypeOf<string>();
    expectTypeOf<Input['password']>().toEqualTypeOf<string>();
  });

  it('FormOutputValues は Branded Type', () => {
    type Output = FormOutputValues<typeof loginSchema.fields>;
    expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
    expectTypeOf<Output['password']>().toEqualTypeOf<Password>();
  });

  it('Email と Password は互いに代入できない', () => {
    type Output = FormOutputValues<typeof loginSchema.fields>;
    expectTypeOf<Output['email']>().not.toEqualTypeOf<Output['password']>();
  });

  it('optional フィールドは | undefined になる', () => {
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

describe('useVorm handleSubmit 型テスト', () => {
  it('handleSubmit コールバックの第1引数は Branded Type', () => {
    type Fields = typeof loginSchema.fields;
    type Output = FormOutputValues<Fields> & FieldValues;

    type Form = ReturnType<typeof useVorm<Fields>>;
    type HandleSubmit = Form['handleSubmit'];

    type OnValidCallback = Parameters<HandleSubmit>[0];
    type SubmitData = Parameters<OnValidCallback>[0];

    expectTypeOf<SubmitData['email']>().toEqualTypeOf<Email>();
    expectTypeOf<SubmitData['password']>().toEqualTypeOf<Password>();
  });

  it('handleSubmit の値は Branded Type（plain string ではない）', () => {
    type Fields = typeof loginSchema.fields;
    type Output = FormOutputValues<Fields> & FieldValues;

    type Form = ReturnType<typeof useVorm<Fields>>;
    type OnValidCallback = Parameters<Form['handleSubmit']>[0];
    type SubmitData = Parameters<OnValidCallback>[0];

    expectTypeOf<SubmitData['email']>().toMatchTypeOf<string>();
    expectTypeOf<string>().not.toMatchTypeOf<SubmitData['email']>();
  });

  it('handleSubmit で Email と Password を混同できない', () => {
    type Fields = typeof loginSchema.fields;
    type Form = ReturnType<typeof useVorm<Fields>>;
    type OnValidCallback = Parameters<Form['handleSubmit']>[0];
    type SubmitData = Parameters<OnValidCallback>[0];

    expectTypeOf<SubmitData['email']>().not.toEqualTypeOf<SubmitData['password']>();
  });
});
