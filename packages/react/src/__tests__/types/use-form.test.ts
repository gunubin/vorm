import { expectTypeOf } from 'vitest';
import { vo, createField, createFormSchema, validateAndCreate } from '@vorm/core';
import type { Brand, Infer, FieldSchema, FormInputValues, FormOutputValues, VOLike } from '@vorm/core';
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

  describe('handleSubmit コールバック内のクロスブランド安全性', () => {
    it('handleSubmit の values.email は Email 型', () => {
      type Fields = typeof loginSchema.fields;
      type Output = FormOutputValues<Fields>;
      expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
    });

    it('Email と Password は相互代入不可', () => {
      type Fields = typeof loginSchema.fields;
      type Output = FormOutputValues<Fields>;
      expectTypeOf<Output['email']>().not.toEqualTypeOf<Output['password']>();
      expectTypeOf<Output['password']>().not.toEqualTypeOf<Output['email']>();
    });

    it('handleSubmit の handler 型が FormOutputValues を受け取る', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      type HandlerParam = Parameters<Parameters<Form['handleSubmit']>[0]>[0];
      expectTypeOf<HandlerParam>().toEqualTypeOf<FormOutputValues<Fields>>();
    });
  });

  describe('setFieldError / clearFieldError / validate の型', () => {
    it('setFieldError は field name に制約される', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      type SetFieldErrorName = Parameters<Form['setFieldError']>[0];
      expectTypeOf<SetFieldErrorName>().toEqualTypeOf<'email' | 'password'>();
    });

    it('clearFieldError は field name に制約される（省略可）', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      type ClearFieldErrorName = Parameters<Form['clearFieldError']>[0];
      expectTypeOf<ClearFieldErrorName>().toEqualTypeOf<'email' | 'password' | undefined>();
    });

    it('validate は field name に制約される（省略可）', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      type ValidateName = Parameters<Form['validate']>[0];
      expectTypeOf<ValidateName>().toEqualTypeOf<'email' | 'password' | undefined>();
    });

    it('validate は boolean を返す', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      type ValidateReturn = ReturnType<Form['validate']>;
      expectTypeOf<ValidateReturn>().toEqualTypeOf<boolean>();
    });
  });

  describe('field() の FieldState 型', () => {
    it('field("email") の TInput は string（ブランドなし）', () => {
      type Fields = typeof loginSchema.fields;
      type EmailInput = Fields['email'] extends FieldSchema<infer TInput, any, any> ? TInput : never;
      expectTypeOf<EmailInput>().toEqualTypeOf<string>();
    });

    it('field("email") の TOutput は Email ブランド型', () => {
      type Fields = typeof loginSchema.fields;
      type EmailOutput = Fields['email'] extends FieldSchema<any, infer TOutput, any> ? TOutput : never;
      expectTypeOf<EmailOutput>().toEqualTypeOf<Email>();
    });

    it('field("password") の TInput は string、TOutput は Password', () => {
      type Fields = typeof loginSchema.fields;
      type PasswordInput = Fields['password'] extends FieldSchema<infer TInput, any, any> ? TInput : never;
      type PasswordOutput = Fields['password'] extends FieldSchema<any, infer TOutput, any> ? TOutput : never;
      expectTypeOf<PasswordInput>().toEqualTypeOf<string>();
      expectTypeOf<PasswordOutput>().toEqualTypeOf<Password>();
    });
  });

  describe('手書き VO + vo() VO の混在フォーム', () => {
    type Nickname = string & { readonly __brand: 'Nickname' };
    const nicknameRules = [{ code: 'TOO_SHORT', validate: (v: string) => v.length >= 2 }] as const;
    const NicknameDef: VOLike<string, Nickname> = {
      rules: [...nicknameRules],
      create: (v: string): Nickname => validateAndCreate(v, nicknameRules, 'Nickname') as Nickname,
    };

    const nicknameField = createField(NicknameDef);

    const mixedSchema = createFormSchema({
      fields: {
        email: emailField({ required: true }),
        nickname: nicknameField({ required: true }),
        bio: createField<string>(),
      },
    });

    it('vo() VO のフィールドは Brand<string, "Email">', () => {
      type Output = FormOutputValues<typeof mixedSchema.fields>;
      expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
    });

    it('手書き VO のフィールドは Nickname ブランド型', () => {
      type Output = FormOutputValues<typeof mixedSchema.fields>;
      expectTypeOf<Output['nickname']>().toEqualTypeOf<Nickname>();
    });

    it('プリミティブフィールドは string のまま', () => {
      type Output = FormOutputValues<typeof mixedSchema.fields>;
      expectTypeOf<Output['bio']>().toEqualTypeOf<string | undefined>();
    });

    it('Email と Nickname は相互代入不可', () => {
      type Output = FormOutputValues<typeof mixedSchema.fields>;
      expectTypeOf<Output['email']>().not.toEqualTypeOf<Output['nickname']>();
    });

    it('input values は全て基底型', () => {
      type Input = FormInputValues<typeof mixedSchema.fields>;
      expectTypeOf<Input['email']>().toEqualTypeOf<string>();
      expectTypeOf<Input['nickname']>().toEqualTypeOf<string>();
      expectTypeOf<Input['bio']>().toEqualTypeOf<string | undefined>();
    });
  });

  describe('Infer で型注釈を付けたフォーム', () => {
    type EmailType = Infer<typeof EmailVO>;
    type PasswordType = Infer<typeof PasswordVO>;

    it('Infer<typeof VO> と Brand<T, B> は同一型', () => {
      expectTypeOf<EmailType>().toEqualTypeOf<Email>();
      expectTypeOf<PasswordType>().toEqualTypeOf<Password>();
    });

    it('Infer 型は FormOutputValues のフィールド型と一致', () => {
      type Output = FormOutputValues<typeof loginSchema.fields>;
      expectTypeOf<Output['email']>().toEqualTypeOf<EmailType>();
      expectTypeOf<Output['password']>().toEqualTypeOf<PasswordType>();
    });
  });
});
