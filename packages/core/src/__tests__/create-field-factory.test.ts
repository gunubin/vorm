import { describe, it, expect } from 'vitest';
import { vo } from '../vo.js';
import { createField } from '../create-field.js';

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
  { code: 'NO_UPPERCASE', validate: (v: string) => /[A-Z]/.test(v) },
]);

describe('createField (VO)', () => {
  it('VODefinition からファクトリ関数を生成する', () => {
    const passwordField = createField(PasswordVO);
    expect(typeof passwordField).toBe('function');
  });

  it('ファクトリがFieldSchemaを返す', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: true });

    expect(field.vo).toBe(PasswordVO);
    expect(field.required).toBe(true);
    expect(field.rules).toHaveLength(2);
  });

  it('required: true で FieldSchema を生成する', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: true });

    expect(field.required).toBe(true);
  });

  it('required: false で FieldSchema を生成する', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: false });

    expect(field.required).toBe(false);
  });

  it('required 省略時はデフォルトで false', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField();

    expect(field.required).toBe(false);
  });

  it('Record 形式の messages を設定できる', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({
      required: true,
      messages: {
        REQUIRED: 'パスワードを入力してください',
        TOO_SHORT: '8文字以上で入力してください',
      },
    });

    expect(field.messages).toEqual({
      REQUIRED: 'パスワードを入力してください',
      TOO_SHORT: '8文字以上で入力してください',
    });
  });

  it('関数形式の messages を設定できる', () => {
    const messageFn = ({ code }: { code: string }) => `Error: ${code}`;
    const passwordField = createField(PasswordVO);
    const field = passwordField({
      required: true,
      messages: messageFn,
    });

    expect(field.messages).toBe(messageFn);
  });

  it('VO の rules が FieldSchema に継承される', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: true });

    expect(field.rules).toHaveLength(2);
    expect(field.rules[0].code).toBe('TOO_SHORT');
    expect(field.rules[1].code).toBe('NO_UPPERCASE');
  });
});
