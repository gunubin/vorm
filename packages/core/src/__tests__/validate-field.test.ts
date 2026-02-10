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
    const field = passwordField({ required: true, messages: { REQUIRED: 'Required' } });

    it('空文字は REQUIRED エラー', () => {
      const error = validateField('', field);
      expect(error).toEqual({ code: 'REQUIRED', message: 'Required' });
    });

    it('undefined は REQUIRED エラー', () => {
      const error = validateField(undefined, field);
      expect(error).toEqual({ code: 'REQUIRED', message: 'Required' });
    });

    it('null は REQUIRED エラー', () => {
      const error = validateField(null, field);
      expect(error).toEqual({ code: 'REQUIRED', message: 'Required' });
    });
  });

  describe('required: false で空値の場合', () => {
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
        REQUIRED: 'Required',
        TOO_SHORT: 'At least 8 characters',
        NO_UPPERCASE: 'Must contain uppercase',
        NO_NUMBER: 'Must contain number',
      },
    });

    it('定義順に実行、最初の失敗で停止', () => {
      const error = validateField('short', field);
      expect(error).toEqual({ code: 'TOO_SHORT', message: 'At least 8 characters' });
    });

    it('最初のルール通過後、次のルールで失敗', () => {
      const error = validateField('longpassword', field);
      expect(error).toEqual({ code: 'NO_UPPERCASE', message: 'Must contain uppercase' });
    });

    it('全ルール通過で null', () => {
      const error = validateField('Password1', field);
      expect(error).toBeNull();
    });
  });

  describe('プリミティブフィールドのカスタムルール', () => {
    const nameField = createField<string>({
      rules: [
        { code: 'TOO_LONG', validate: (v) => v.length <= 100 },
      ],
      messages: {
        REQUIRED: 'Please enter a name',
        TOO_LONG: 'Must be 100 characters or less',
      },
    })({ required: true });

    it('カスタムルール通過', () => {
      const error = validateField('Test', nameField);
      expect(error).toBeNull();
    });

    it('カスタムルール違反', () => {
      const error = validateField('a'.repeat(101), nameField);
      expect(error).toEqual({ code: 'TOO_LONG', message: 'Must be 100 characters or less' });
    });
  });

  describe('parse 済みの値に対して直接バリデーション', () => {
    it('数値フィールドの検証（parse 後の number に対して）', () => {
      const field = createField<number>({
        rules: [
          { code: 'POSITIVE', validate: (v) => v > 0 },
        ],
      })({ required: true });

      expect(validateField(100, field)).toBeNull();
      expect(validateField(-1, field)).toEqual({ code: 'POSITIVE', message: 'POSITIVE' });
    });

    it('required チェックは空値に対して行われる', () => {
      const field = createField<number>({
        rules: [
          { code: 'POSITIVE', validate: (v) => v > 0 },
        ],
      })({ required: true });

      const error = validateField(undefined, field);
      expect(error).toEqual({ code: 'REQUIRED', message: 'This field is required' });
    });
  });
});
