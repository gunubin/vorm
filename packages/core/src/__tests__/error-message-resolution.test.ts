import { describe, it, expect } from 'vitest';
import { resolveMessage } from '../resolve-message.js';

describe('resolveMessage', () => {
  describe('3層優先度', () => {
    it('FormSchema の messages が最優先', () => {
      const fieldMessages = { TOO_SHORT: '項目レベル' };
      const formMessages = { TOO_SHORT: 'フォームレベル' };

      const message = resolveMessage('TOO_SHORT', formMessages, fieldMessages);
      expect(message).toBe('フォームレベル');
    });

    it('FormSchema に定義がなければ FieldSchema の messages', () => {
      const fieldMessages = { TOO_SHORT: '項目レベル' };
      const formMessages = { OTHER_CODE: 'フォームレベル' };

      const message = resolveMessage('TOO_SHORT', formMessages, fieldMessages);
      expect(message).toBe('項目レベル');
    });

    it('両方に定義がなければデフォルトメッセージ', () => {
      const message = resolveMessage('REQUIRED', {}, {});
      expect(message).toBe('This field is required');
    });

    it('デフォルトメッセージにもなければコードそのもの', () => {
      const message = resolveMessage('UNKNOWN_CODE', {}, {});
      expect(message).toBe('UNKNOWN_CODE');
    });
  });

  describe('Record 形式', () => {
    it('コードに対応するメッセージを返す', () => {
      const messages = {
        TOO_SHORT: '8文字以上で入力してください',
        NO_UPPERCASE: '大文字を含めてください',
      };

      expect(resolveMessage('TOO_SHORT', messages)).toBe('8文字以上で入力してください');
      expect(resolveMessage('NO_UPPERCASE', messages)).toBe('大文字を含めてください');
    });

    it('未定義のコードはフォールバック', () => {
      const messages = { TOO_SHORT: '8文字以上' };

      expect(resolveMessage('UNKNOWN', messages)).toBe('UNKNOWN');
    });
  });

  describe('関数形式', () => {
    it('code を引数に受け取りメッセージを返す', () => {
      const messageFn = ({ code }: { code: string }) => {
        if (code === 'TOO_SHORT') return '8文字以上で入力してください';
        return 'バリデーションエラー';
      };

      expect(resolveMessage('TOO_SHORT', messageFn)).toBe('8文字以上で入力してください');
      expect(resolveMessage('UNKNOWN', messageFn)).toBe('バリデーションエラー');
    });
  });

  describe('source が undefined の場合', () => {
    it('undefined をスキップして次の source を使う', () => {
      const fieldMessages = { TOO_SHORT: '項目レベル' };

      const message = resolveMessage('TOO_SHORT', undefined, fieldMessages);
      expect(message).toBe('項目レベル');
    });

    it('全て undefined ならデフォルトまたはコード', () => {
      expect(resolveMessage('REQUIRED', undefined, undefined)).toBe('This field is required');
      expect(resolveMessage('CUSTOM', undefined, undefined)).toBe('CUSTOM');
    });
  });
});
