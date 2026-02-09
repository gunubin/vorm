import { describe, it, expect } from 'vitest';
import { vo } from '../vo.js';
import { createField } from '../create-field.js';
import { validateField } from '../validate-field.js';

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
  { code: 'NO_UPPERCASE', validate: (v: string) => /[A-Z]/.test(v) },
  { code: 'NO_NUMBER', validate: (v: string) => /[0-9]/.test(v) },
]);

const passwordField = createField(PasswordVO);

describe('validateField', () => {
  describe('required チェック', () => {
    const field = passwordField({ required: true, messages: { REQUIRED: '必須です' } });

    it('空文字は REQUIRED エラー', () => {
      const error = validateField('', field);
      expect(error).toEqual({ code: 'REQUIRED', message: '必須です' });
    });

    it('undefined は REQUIRED エラー', () => {
      const error = validateField(undefined, field);
      expect(error).toEqual({ code: 'REQUIRED', message: '必須です' });
    });

    it('null は REQUIRED エラー', () => {
      const error = validateField(null, field);
      expect(error).toEqual({ code: 'REQUIRED', message: '必須です' });
    });
  });

  describe('required: false で空値', () => {
    const field = passwordField({ required: false });

    it('空文字はエラーなし（ルールスキップ）', () => {
      const error = validateField('', field);
      expect(error).toBeNull();
    });

    it('undefined はエラーなし', () => {
      const error = validateField(undefined, field);
      expect(error).toBeNull();
    });

    it('null はエラーなし', () => {
      const error = validateField(null, field);
      expect(error).toBeNull();
    });
  });

  describe('VO ルール', () => {
    const field = passwordField({
      required: true,
      messages: {
        REQUIRED: '必須です',
        TOO_SHORT: '8文字以上',
        NO_UPPERCASE: '大文字必須',
        NO_NUMBER: '数字必須',
      },
    });

    it('定義順に実行され、最初の失敗で停止する', () => {
      const error = validateField('short', field);
      expect(error).toEqual({ code: 'TOO_SHORT', message: '8文字以上' });
    });

    it('最初のルール通過後、次のルールで失敗する', () => {
      const error = validateField('longpassword', field);
      expect(error).toEqual({ code: 'NO_UPPERCASE', message: '大文字必須' });
    });

    it('全ルール通過で null', () => {
      const error = validateField('Password1', field);
      expect(error).toBeNull();
    });
  });

  describe('プリミティブフィールドのカスタムルール', () => {
    const nameField = createField<string>({
      required: true,
      rules: [
        { code: 'TOO_LONG', validate: (v) => v.length <= 100 },
      ],
      messages: {
        REQUIRED: '名前を入力してください',
        TOO_LONG: '100文字以内で入力してください',
      },
    });

    it('カスタムルール通過', () => {
      const error = validateField('テスト', nameField);
      expect(error).toBeNull();
    });

    it('カスタムルール違反', () => {
      const error = validateField('a'.repeat(101), nameField);
      expect(error).toEqual({ code: 'TOO_LONG', message: '100文字以内で入力してください' });
    });
  });
});
