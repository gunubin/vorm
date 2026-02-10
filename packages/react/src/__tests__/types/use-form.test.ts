import { expectTypeOf } from 'vitest';
import { vo, createField, createFormSchema, validateAndCreate } from '@vorm/core';
import type { Brand, Infer, FieldSchema, FieldError, FormInputValues, FormOutputValues, VOLike } from '@vorm/core';
import type { FormState, AsyncFieldValidator, AsyncValidators } from '../../use-form.js';

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

describe('useForm 型テスト', () => {
  it('values の型は FormInputValues（plain types、branded ではない）', () => {
    type Fields = typeof loginSchema.fields;
    type Input = FormInputValues<Fields>;
    expectTypeOf<Input>().toEqualTypeOf<{ email: string; password: string }>();
  });

  it('handleSubmit ハンドラは FormOutputValues（branded types）を受け取る', () => {
    type Fields = typeof loginSchema.fields;
    type Output = FormOutputValues<Fields>;
    expectTypeOf<Output>().toEqualTypeOf<{ email: Email; password: Password }>();
  });

  it('defaultValues は FormInputValues と一致', () => {
    type Fields = typeof loginSchema.fields;
    type Expected = FormInputValues<Fields>;
    expectTypeOf<Expected>().toEqualTypeOf<{ email: string; password: string }>();
  });

  it('field() の name パラメータはフィールド名に制約される', () => {
    type Fields = typeof loginSchema.fields;
    type Form = FormState<Fields>;
    type FieldFn = Form['field'];
    expectTypeOf<Parameters<FieldFn>[0]>().toEqualTypeOf<'email' | 'password'>();
  });

  describe('入力型 vs 検証済み型の分離', () => {
    it('入力値は plain string（branded ではない）', () => {
      type Fields = typeof loginSchema.fields;
      type Input = FormInputValues<Fields>;
      expectTypeOf<Input['email']>().toEqualTypeOf<string>();
      expectTypeOf<Input['email']>().not.toEqualTypeOf<Email>();
    });

    it('出力値は branded（plain string ではない）', () => {
      type Fields = typeof loginSchema.fields;
      type Output = FormOutputValues<Fields>;
      expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
      expectTypeOf<Output['password']>().toEqualTypeOf<Password>();
      expectTypeOf<Output['email']>().not.toEqualTypeOf<string>();
    });

    it('FieldSchema は TInput と TOutput を正しく分離する', () => {
      type Fields = typeof loginSchema.fields;
      type EmailInput = Fields['email'] extends FieldSchema<infer T, any, any, any> ? T : never;
      type EmailOutput = Fields['email'] extends FieldSchema<any, infer TOutput, any, any> ? TOutput : never;
      expectTypeOf<EmailInput>().toEqualTypeOf<string>();
      expectTypeOf<EmailOutput>().toEqualTypeOf<Email>();
      expectTypeOf<EmailInput>().not.toEqualTypeOf<EmailOutput>();
    });
  });

  describe('handleSubmit コールバックでのクロスブランド安全性', () => {
    it('handleSubmit の values.email は Email 型', () => {
      type Fields = typeof loginSchema.fields;
      type Output = FormOutputValues<Fields>;
      expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
    });

    it('Email と Password は互いに代入できない', () => {
      type Fields = typeof loginSchema.fields;
      type Output = FormOutputValues<Fields>;
      expectTypeOf<Output['email']>().not.toEqualTypeOf<Output['password']>();
      expectTypeOf<Output['password']>().not.toEqualTypeOf<Output['email']>();
    });

    it('handleSubmit ハンドラの型は FormOutputValues を受け取る', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      type HandlerParam = Parameters<Parameters<Form['handleSubmit']>[0]>[0];
      expectTypeOf<HandlerParam>().toEqualTypeOf<FormOutputValues<Fields>>();
    });
  });

  describe('setFieldError / clearFieldError / validate の型', () => {
    it('setFieldError はフィールド名に制約される', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      type SetFieldErrorName = Parameters<Form['setFieldError']>[0];
      expectTypeOf<SetFieldErrorName>().toEqualTypeOf<'email' | 'password'>();
    });

    it('clearFieldError はフィールド名に制約される（optional）', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      type ClearFieldErrorName = Parameters<Form['clearFieldError']>[0];
      expectTypeOf<ClearFieldErrorName>().toEqualTypeOf<'email' | 'password' | undefined>();
    });

    it('validate はフィールド名に制約される（optional）', () => {
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
    it('field("email") の T は string（branded ではない）', () => {
      type Fields = typeof loginSchema.fields;
      type EmailInput = Fields['email'] extends FieldSchema<infer T, any, any, any> ? T : never;
      expectTypeOf<EmailInput>().toEqualTypeOf<string>();
    });

    it('field("email") の TOutput は Email branded 型', () => {
      type Fields = typeof loginSchema.fields;
      type EmailOutput = Fields['email'] extends FieldSchema<any, infer TOutput, any, any> ? TOutput : never;
      expectTypeOf<EmailOutput>().toEqualTypeOf<Email>();
    });

    it('field("password") の T は string、TOutput は Password', () => {
      type Fields = typeof loginSchema.fields;
      type PasswordInput = Fields['password'] extends FieldSchema<infer T, any, any, any> ? T : never;
      type PasswordOutput = Fields['password'] extends FieldSchema<any, infer TOutput, any, any> ? TOutput : never;
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
        bio: createField<string>()(),
      },
    });

    it('vo() VO フィールドは Brand<string, "Email">', () => {
      type Output = FormOutputValues<typeof mixedSchema.fields>;
      expectTypeOf<Output['email']>().toEqualTypeOf<Email>();
    });

    it('手書き VO フィールドは Nickname branded 型', () => {
      type Output = FormOutputValues<typeof mixedSchema.fields>;
      expectTypeOf<Output['nickname']>().toEqualTypeOf<Nickname>();
    });

    it('プリミティブフィールドは string', () => {
      type Output = FormOutputValues<typeof mixedSchema.fields>;
      expectTypeOf<Output['bio']>().toEqualTypeOf<string | undefined>();
    });

    it('Email と Nickname は互いに代入できない', () => {
      type Output = FormOutputValues<typeof mixedSchema.fields>;
      expectTypeOf<Output['email']>().not.toEqualTypeOf<Output['nickname']>();
    });

    it('入力値は全てベース型', () => {
      type Input = FormInputValues<typeof mixedSchema.fields>;
      expectTypeOf<Input['email']>().toEqualTypeOf<string>();
      expectTypeOf<Input['nickname']>().toEqualTypeOf<string>();
      expectTypeOf<Input['bio']>().toEqualTypeOf<string | undefined>();
    });
  });

  describe('Infer 型アノテーション付きフォーム', () => {
    type EmailType = Infer<typeof EmailVO>;
    type PasswordType = Infer<typeof PasswordVO>;

    it('Infer<typeof VO> と Brand<T, B> は同じ型', () => {
      expectTypeOf<EmailType>().toEqualTypeOf<Email>();
      expectTypeOf<PasswordType>().toEqualTypeOf<Password>();
    });

    it('Infer 型は FormOutputValues のフィールド型と一致', () => {
      type Output = FormOutputValues<typeof loginSchema.fields>;
      expectTypeOf<Output['email']>().toEqualTypeOf<EmailType>();
      expectTypeOf<Output['password']>().toEqualTypeOf<PasswordType>();
    });
  });

  describe('ValidationMode 型', () => {
    it('mode は onChange | onBlur | onTouched | onSubmit', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      expectTypeOf<Form['mode']>().toEqualTypeOf<'onChange' | 'onBlur' | 'onTouched' | 'onSubmit'>();
    });

    it('onTouched は有効な mode 値', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      const _check: Form['mode'] = 'onTouched';
      expectTypeOf(_check).toEqualTypeOf<'onTouched'>();
    });
  });

  describe('非同期バリデーション型', () => {
    it('AsyncFieldValidator の validate は Promise<FieldError | null> を返す', () => {
      type V = AsyncFieldValidator<string>;
      expectTypeOf<V['validate']>().toEqualTypeOf<(value: string) => Promise<FieldError | null>>();
    });

    it('AsyncFieldValidator の on は AsyncTrigger | undefined', () => {
      type V = AsyncFieldValidator<string>;
      expectTypeOf<V['on']>().toEqualTypeOf<'blur' | 'change' | 'submit' | undefined>();
    });

    it('AsyncValidators のキーはスキーマのフィールド名に制約される', () => {
      type Fields = typeof loginSchema.fields;
      type Validators = AsyncValidators<Fields>;
      expectTypeOf<keyof Validators>().toEqualTypeOf<'email' | 'password'>();
    });

    it('AsyncValidators の validate は TInput 型を受け取る', () => {
      type Fields = typeof loginSchema.fields;
      type Validators = AsyncValidators<Fields>;
      type EmailValidator = NonNullable<Validators['email']>;
      expectTypeOf<Parameters<EmailValidator['validate']>[0]>().toEqualTypeOf<string>();
    });

    it('isValidating は boolean', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      expectTypeOf<Form['isValidating']>().toEqualTypeOf<boolean>();
    });

    it('validateAsync は Promise<boolean> を返す', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      expectTypeOf<ReturnType<Form['validateAsync']>>().toEqualTypeOf<Promise<boolean>>();
    });

    it('validateAsync の引数はフィールド名に制約される（optional）', () => {
      type Fields = typeof loginSchema.fields;
      type Form = FormState<Fields>;
      type ValidateAsyncName = Parameters<Form['validateAsync']>[0];
      expectTypeOf<ValidateAsyncName>().toEqualTypeOf<'email' | 'password' | undefined>();
    });
  });
});
