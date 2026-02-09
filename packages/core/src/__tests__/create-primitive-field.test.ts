import { describe, it, expect } from 'vitest';
import { createField } from '../create-field.js';

describe('createField (primitive)', () => {
  it('vo が null の FieldSchema を返す', () => {
    const field = createField<string>();

    expect(field.vo).toBeNull();
  });

  it('required: true で FieldSchema を生成する', () => {
    const field = createField<string>({ required: true });

    expect(field.required).toBe(true);
  });

  it('required: false で FieldSchema を生成する', () => {
    const field = createField<string>({ required: false });

    expect(field.required).toBe(false);
  });

  it('required 省略時はデフォルトで false', () => {
    const field = createField<string>();

    expect(field.required).toBe(false);
  });

  it('カスタムルールを設定できる', () => {
    const field = createField<string>({
      rules: [
        { code: 'TOO_LONG', validate: (v) => v.length <= 100 },
      ],
    });

    expect(field.rules).toHaveLength(1);
    expect(field.rules[0].code).toBe('TOO_LONG');
  });

  it('Record 形式の messages を設定できる', () => {
    const field = createField<string>({
      required: true,
      messages: {
        REQUIRED: '名前を入力してください',
      },
    });

    expect(field.messages).toEqual({
      REQUIRED: '名前を入力してください',
    });
  });

  it('関数形式の messages を設定できる', () => {
    const messageFn = ({ code }: { code: string }) => `Error: ${code}`;
    const field = createField<string>({
      messages: messageFn,
    });

    expect(field.messages).toBe(messageFn);
  });

  it('rules と messages 省略時はデフォルト値', () => {
    const field = createField<string>();

    expect(field.rules).toEqual([]);
    expect(field.messages).toEqual({});
  });
});
