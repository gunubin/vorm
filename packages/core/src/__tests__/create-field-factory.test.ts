import { describe, it, expect } from 'vitest';
import { vo } from '../vo.js';
import { createField } from '../create-field.js';

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
  { code: 'NO_UPPERCASE', validate: (v: string) => /[A-Z]/.test(v) },
]);

describe('createField (VO)', () => {
  it('VO定義からファクトリ関数を生成する', () => {
    const passwordField = createField(PasswordVO);
    expect(typeof passwordField).toBe('function');
  });

  it('ファクトリが FieldSchema を返す', () => {
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

  it('引数省略時は required: false', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField();

    expect(field.required).toBe(false);
  });

  it('ファクトリレベルで Record 形式のメッセージを設定できる', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({
      required: true,
      messages: {
        REQUIRED: 'Please enter a password',
        TOO_SHORT: 'Must be at least 8 characters',
      },
    });

    expect(field.messages).toEqual({
      REQUIRED: 'Please enter a password',
      TOO_SHORT: 'Must be at least 8 characters',
    });
  });

  it('定義レベルでメッセージを設定できる', () => {
    const passwordField = createField(PasswordVO, {
      messages: {
        TOO_SHORT: 'definition: 8文字以上',
        NO_UPPERCASE: 'definition: 大文字必須',
      },
    });
    const field = passwordField({ required: true });

    expect(field.messages).toEqual({
      TOO_SHORT: 'definition: 8文字以上',
      NO_UPPERCASE: 'definition: 大文字必須',
    });
  });

  it('定義とファクトリのメッセージをマージ（ファクトリ優先）', () => {
    const passwordField = createField(PasswordVO, {
      messages: {
        TOO_SHORT: 'definition level',
        NO_UPPERCASE: 'definition level',
      },
    });
    const field = passwordField({
      required: true,
      messages: {
        REQUIRED: 'factory only',
        TOO_SHORT: 'factory override',
      },
    });

    expect(field.messages).toEqual({
      NO_UPPERCASE: 'definition level',
      REQUIRED: 'factory only',
      TOO_SHORT: 'factory override',
    });
  });

  it('ファクトリレベルで関数形式のメッセージを設定できる', () => {
    const messageFn = ({ code }: { code: string }) => `Error: ${code}`;
    const passwordField = createField(PasswordVO);
    const field = passwordField({
      required: true,
      messages: messageFn,
    });

    expect(field.messages).toBe(messageFn);
  });

  it('VO のルールが FieldSchema に継承される', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: true });

    expect(field.rules).toHaveLength(2);
    expect(field.rules[0].code).toBe('TOO_SHORT');
    expect(field.rules[1].code).toBe('NO_UPPERCASE');
  });

  it('定義レベルで parse を設定できる', () => {
    const passwordField = createField(PasswordVO, {
      parse: (v: string) => v.trim(),
    });
    const field = passwordField({ required: true });

    expect(field.parse).toBeDefined();
    expect(field.parse!('  Password1  ')).toBe('Password1');
  });

  it('定義レベルで format を設定できる', () => {
    const passwordField = createField(PasswordVO, {
      format: (v: string) => v.toUpperCase(),
    });
    const field = passwordField({ required: true });

    expect(field.format).toBeDefined();
    expect(field.format!('Password1')).toBe('PASSWORD1');
  });

  it('parse と format を両方設定できる', () => {
    const passwordField = createField(PasswordVO, {
      parse: (v: string) => v.trim(),
      format: (v: string) => v.toUpperCase(),
    });
    const field = passwordField({ required: true });

    expect(field.parse!('  Password1  ')).toBe('Password1');
    expect(field.format!('Password1')).toBe('PASSWORD1');
  });
});
