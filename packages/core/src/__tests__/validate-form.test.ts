import { describe, it, expect } from 'vitest';
import { vo } from '../vo.js';
import { createField } from '../create-field.js';
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
  it('全フィールドのルール実行とエラー集約', () => {
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true, messages: { REQUIRED: 'メール必須' } }),
        password: passwordField({ required: true, messages: { REQUIRED: 'パスワード必須' } }),
      },
    });

    const errors = validateForm({ email: '', password: '' }, schema);

    expect(errors.email).toEqual({ code: 'REQUIRED', message: 'メール必須' });
    expect(errors.password).toEqual({ code: 'REQUIRED', message: 'パスワード必須' });
  });

  it('バリデーション通過時は空オブジェクト', () => {
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
        confirmPassword: createField<string>({ required: true }),
      },
      resolver: (values) => {
        if (values.password !== values.confirmPassword) {
          return {
            confirmPassword: { code: 'MISMATCH', message: 'パスワードが一致しません' },
          };
        }
        return null;
      },
    });

    it('全ルール通過後に resolver を実行する', () => {
      const errors = validateForm(
        { password: 'Password1', confirmPassword: 'Different1' },
        signupSchema,
      );

      expect(errors.confirmPassword).toEqual({
        code: 'MISMATCH',
        message: 'パスワードが一致しません',
      });
    });

    it('resolver が null を返す場合はエラーなし', () => {
      const errors = validateForm(
        { password: 'Password1', confirmPassword: 'Password1' },
        signupSchema,
      );

      expect(errors).toEqual({});
    });

    it('フィールドエラーがある場合 resolver はスキップされる', () => {
      let resolverCalled = false;
      const schema = createFormSchema({
        fields: {
          password: passwordField({ required: true }),
          confirmPassword: createField<string>({ required: true }),
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

  it('パスワード確認の統合例', () => {
    const schema = createFormSchema({
      fields: {
        password: passwordField({
          required: true,
          messages: {
            REQUIRED: 'パスワードを入力してください',
            TOO_SHORT: '8文字以上で入力してください',
          },
        }),
        confirmPassword: createField<string>({
          required: true,
          messages: { REQUIRED: '確認パスワードを入力してください' },
        }),
      },
      resolver: (values) => {
        if (values.password !== values.confirmPassword) {
          return {
            confirmPassword: { code: 'MISMATCH', message: 'パスワードが一致しません' },
          };
        }
        return null;
      },
    });

    // 全空
    const errors1 = validateForm({ password: '', confirmPassword: '' }, schema);
    expect(errors1.password).toEqual({ code: 'REQUIRED', message: 'パスワードを入力してください' });
    expect(errors1.confirmPassword).toEqual({ code: 'REQUIRED', message: '確認パスワードを入力してください' });

    // パスワードが短い
    const errors2 = validateForm({ password: 'short', confirmPassword: 'short' }, schema);
    expect(errors2.password).toEqual({ code: 'TOO_SHORT', message: '8文字以上で入力してください' });

    // 不一致
    const errors3 = validateForm({ password: 'Password1', confirmPassword: 'Different1' }, schema);
    expect(errors3.confirmPassword).toEqual({ code: 'MISMATCH', message: 'パスワードが一致しません' });

    // 正常
    const errors4 = validateForm({ password: 'Password1', confirmPassword: 'Password1' }, schema);
    expect(errors4).toEqual({});
  });
});
