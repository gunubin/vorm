import { describe, it, expect } from 'vitest';
import { vo } from '../vo.js';
import { createField } from '../create-field.js';
import { createFormSchema } from '../create-form-schema.js';

const EmailVO = vo('Email', [
  { code: 'INVALID_FORMAT', validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
]);

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
]);

const emailField = createField(EmailVO);
const passwordField = createField(PasswordVO);

describe('createFormSchema', () => {
  it('fields を持つ FormSchema を返す', () => {
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true }),
        password: passwordField({ required: true }),
      },
    });

    expect(schema.fields).toBeDefined();
    expect(schema.fields.email).toBeDefined();
    expect(schema.fields.password).toBeDefined();
  });

  it('空の fields で動作する', () => {
    const schema = createFormSchema({
      fields: {},
    });

    expect(schema.fields).toEqual({});
  });

  it('単一フィールドで動作する', () => {
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true }),
      },
    });

    expect(Object.keys(schema.fields)).toEqual(['email']);
  });

  it('VO由来とプリミティブの混在', () => {
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true }),
        name: createField<string>({ required: true }),
      },
    });

    expect(schema.fields.email.vo).toBe(EmailVO);
    expect(schema.fields.name.vo).toBeNull();
  });

  it('messages（フォームレベル上書き）を設定できる', () => {
    const schema = createFormSchema({
      fields: {
        password: passwordField({ required: true }),
      },
      messages: {
        password: {
          TOO_SHORT: 'ログイン画面用：8文字以上入力してください',
        },
      },
    });

    expect(schema.messages).toBeDefined();
    expect(schema.messages!.password).toEqual({
      TOO_SHORT: 'ログイン画面用：8文字以上入力してください',
    });
  });

  it('resolver 関数を設定できる', () => {
    const resolver = (values: { password: string; confirmPassword: string }) => {
      if (values.password !== values.confirmPassword) {
        return {
          confirmPassword: { code: 'MISMATCH', message: 'パスワードが一致しません' },
        };
      }
      return null;
    };

    const schema = createFormSchema({
      fields: {
        password: passwordField({ required: true }),
        confirmPassword: createField<string>({ required: true }),
      },
      resolver,
    });

    expect(schema.resolver).toBe(resolver);
  });
});
