import { describe, it, expect } from 'vitest';
import { createField } from '../create-field.js';

describe('createField (primitive)', () => {
  it('ファクトリ関数を返す', () => {
    const factory = createField<string>();
    expect(typeof factory).toBe('function');
  });

  it('ファクトリが vo: null の FieldSchema を返す', () => {
    const factory = createField<string>();
    const field = factory();

    expect(field.vo).toBeNull();
  });

  it('required: true で FieldSchema を生成する', () => {
    const factory = createField<string>();
    const field = factory({ required: true });

    expect(field.required).toBe(true);
  });

  it('required: false で FieldSchema を生成する', () => {
    const factory = createField<string>();
    const field = factory({ required: false });

    expect(field.required).toBe(false);
  });

  it('引数省略時は required: false', () => {
    const factory = createField<string>();
    const field = factory();

    expect(field.required).toBe(false);
  });

  it('定義レベルでカスタムルールを設定できる', () => {
    const factory = createField<string>({
      rules: [
        { code: 'TOO_LONG', validate: (v) => v.length <= 100 },
      ],
    });
    const field = factory();

    expect(field.rules).toHaveLength(1);
    expect(field.rules[0].code).toBe('TOO_LONG');
  });

  it('定義レベルで Record 形式のメッセージを設定できる', () => {
    const factory = createField<string>({
      messages: {
        TOO_LONG: 'Must be 100 characters or less',
      },
    });
    const field = factory();

    expect(field.messages).toEqual({
      TOO_LONG: 'Must be 100 characters or less',
    });
  });

  it('ファクトリレベルでメッセージを設定できる', () => {
    const factory = createField<string>();
    const field = factory({
      required: true,
      messages: {
        REQUIRED: 'Please enter a name',
      },
    });

    expect(field.messages).toEqual({
      REQUIRED: 'Please enter a name',
    });
  });

  it('定義とファクトリのメッセージをマージ（ファクトリ優先）', () => {
    const factory = createField<string>({
      messages: {
        TOO_LONG: 'definition level',
      },
    });
    const field = factory({
      required: true,
      messages: {
        REQUIRED: 'factory level',
        TOO_LONG: 'factory override',
      },
    });

    expect(field.messages).toEqual({
      REQUIRED: 'factory level',
      TOO_LONG: 'factory override',
    });
  });

  it('関数形式のメッセージを設定できる', () => {
    const messageFn = ({ code }: { code: string }) => `Error: ${code}`;
    const factory = createField<string>({
      messages: messageFn,
    });
    const field = factory();

    expect(field.messages).toBe(messageFn);
  });

  it('ルールとメッセージ省略時はデフォルト値', () => {
    const factory = createField<string>();
    const field = factory();

    expect(field.rules).toEqual([]);
    expect(field.messages).toEqual({});
  });

  it('定義レベルで parse を設定できる', () => {
    const factory = createField<string>({
      parse: (v: string) => v.trim(),
    });
    const field = factory();

    expect(field.parse).toBeDefined();
    expect(field.parse!('  hello  ')).toBe('hello');
  });

  it('定義レベルで format を設定できる', () => {
    const factory = createField<string, number>({
      format: (v: string) => `formatted: ${v}`,
    });
    const field = factory({ required: true });

    expect(field.format).toBeDefined();
    expect(field.format!('42')).toBe('formatted: 42');
  });

  it('parse と format を両方設定できる', () => {
    const factory = createField<number>({
      parse: (v: string) => Number(v.replace(/,/g, '')),
      format: (v: number) => v.toLocaleString(),
    });
    const field = factory({ required: true });

    expect(field.parse!('1,000')).toBe(1000);
    expect(field.format!(1000)).toBe('1,000');
  });
});
