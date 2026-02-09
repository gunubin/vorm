# vorm - 仕様書 v1.0

## 概要

**vorm** は、Value Object（VO）ファーストなフォームライブラリ。ドメインのバリデーションルールをVOに集約し、そこからフォームスキーマを宣言的に構築する。

### 設計思想

- VOがバリデーションの単一の情報源（Single Source of Truth）
- クラスを使わず関数型で構成
- ブランド型による型安全性
- フレームワーク非依存のコア + React バインディング
- 宣言的なスキーマ定義を最優先とする

### 既存ライブラリとの差別化

| 観点 | React Hook Form | TanStack Form | vorm |
|------|----------------|---------------|------|
| バリデーション定義場所 | フォーム側 | フォーム側 | VO側（ドメイン層） |
| 状態管理 | uncontrolled | controlled | controlled |
| 型安全性 | 中（resolver依存） | 高 | 高（VO→フォーム型自動導出） |
| ドメインロジック再利用 | 困難 | 困難 | VO経由で自然に再利用 |
| React Native対応 | ref依存で制限あり | 対応可能 | controlled前提で完全対応 |

---

## アーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────────────────────┐
│  React バインディング（useForm, useField, etc.） │
├─────────────────────────────────────────────────┤
│  コアランタイム（状態管理・バリデーション実行）    │
├─────────────────────────────────────────────────┤
│  フォームスキーマ（項目スキーマの集合体）          │
├─────────────────────────────────────────────────┤
│  項目スキーマ（ファクトリ関数で生成）              │
├─────────────────────────────────────────────────┤
│  VO定義（ブランド型 + バリデーションルール）       │
└─────────────────────────────────────────────────┘
```

### パッケージ構成

| パッケージ | 役割 |
|-----------|------|
| `@vorm/core` | VO定義ユーティリティ、項目スキーマ、フォームスキーマ、バリデーション実行エンジン |
| `@vorm/react` | React hooks（useForm, useField 等） |
| `@vorm/zod` | zodスキーマからValidationRuleへのアダプター |

---

## Layer 1: Value Object（VO）定義

### ブランド型

```typescript
// ブランド型のユーティリティ
type Brand<T, B extends string> = T & { readonly __brand: B };

// VO型の定義
type Password = Brand<string, 'Password'>;
type Email = Brand<string, 'Email'>;
type Age = Brand<number, 'Age'>;
```

### バリデーションルール

VOのバリデーションルールは **エラーコードのみ** を返す。エラーメッセージはVO層の責務ではない。

```typescript
// バリデーションルールの型
type ValidationRule<T> = {
  code: string;
  validate: (value: T) => boolean; // true = 通過, false = 失敗
};

// VO定義の型
type VODefinition<TInput, TBrand extends string> = {
  brand: TBrand;
  rules: ValidationRule<TInput>[];
  parse: (input: TInput) => Brand<TInput, TBrand>;
};

// VO定義関数
function defineVO<T, B extends string>(config: {
  brand: B;
  rules: ValidationRule<T>[];
  parse: (input: T) => Brand<T, B>;
}): VODefinition<T, B>;
```

### VO定義の例

```typescript
const PasswordVO = defineVO<string, 'Password'>({
  brand: 'Password',
  rules: [
    { code: 'TOO_SHORT', validate: (v) => v.length >= 8 },
    { code: 'NO_UPPERCASE', validate: (v) => /[A-Z]/.test(v) },
    { code: 'NO_NUMBER', validate: (v) => /[0-9]/.test(v) },
  ],
  parse: (input) => input as Password,
});

const EmailVO = defineVO<string, 'Email'>({
  brand: 'Email',
  rules: [
    { code: 'INVALID_FORMAT', validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
  ],
  parse: (input) => input as Email,
});

const AgeVO = defineVO<number, 'Age'>({
  brand: 'Age',
  rules: [
    { code: 'TOO_YOUNG', validate: (v) => v >= 0 },
    { code: 'TOO_OLD', validate: (v) => v <= 150 },
  ],
  parse: (input) => input as Age,
});
```

### zodアダプターによるVO定義

```typescript
import { fromZod } from '@vorm/zod';

const PasswordVO = defineVO<string, 'Password'>({
  brand: 'Password',
  rules: fromZod(z.string().min(8, 'TOO_SHORT').regex(/[A-Z]/, 'NO_UPPERCASE')),
  parse: (input) => input as Password,
});
```

> **アダプターの責務**: zodスキーマを `ValidationRule[]` に変換する。zodのエラーメッセージはエラーコードとして扱う。

### zodの `.brand()` との関係

- **vorm独自の `Brand<T, B>` 型のみを使用する**
- zodの `.brand()` はvormでは無視する（使用しても型に影響しない）
- zodの役割はバリデーションルールの供給のみ。型の世界（ブランド型の付与・管理）はvormが管轄する

```typescript
// ✅ 正しい使い方：zodはルールのみ、ブランドはvorm
const PasswordVO = defineVO<string, 'Password'>({
  brand: 'Password',
  rules: fromZod(z.string().min(8, 'TOO_SHORT')),
  parse: (input) => input as Password,
});

// ⚠️ zodのbrandを付けても無視される（エラーにはならない）
rules: fromZod(z.string().min(8, 'TOO_SHORT').brand<'Password'>())
// → .brand() 部分は無視され、ルールのみ抽出される
```

---

## Layer 2: 項目スキーマ（Field Schema）

### エラーメッセージの型

項目スキーマのエラーメッセージは2つの形式をサポートする。

```typescript
// エラーコード → メッセージのマッピング
type ErrorMessageMap = Record<string, string>;

// エラーコードを受け取ってメッセージを返す関数
type ErrorMessageFn = (error: { code: string }) => string;

// どちらでも指定可能
type ErrorMessages = ErrorMessageMap | ErrorMessageFn;
```

### ファクトリ関数

項目スキーマはファクトリ関数で生成する。VOのバリデーションルールを継承しつつ、UI固有の関心事（必須、エラー文言）を付与する。

```typescript
type FieldSchemaConfig = {
  required?: boolean;
  messages?: ErrorMessages;
};

type FieldSchema<TInput, TOutput, TRequired extends boolean> = {
  vo: VODefinition<TInput, string> | null;
  required: TRequired;
  messages: ErrorMessages;
  rules: ValidationRule<TInput>[];
};
```

### VO由来の項目スキーマ

```typescript
// ファクトリ生成関数
const passwordField = createFieldFactory(PasswordVO);

// 利用側：項目スキーマ生成（Recordでメッセージ定義）
const password = passwordField({
  required: true,
  messages: {
    REQUIRED: 'パスワードを入力してください',
    TOO_SHORT: 'パスワードは8文字以上で入力してください',
    NO_UPPERCASE: '大文字を1文字以上含めてください',
  },
});

// 利用側：関数でメッセージ定義
const password = passwordField({
  required: true,
  messages: ({ code }) => {
    if (code === 'TOO_SHORT') return '8文字以上で入力してください';
    if (code === 'NO_UPPERCASE') return '大文字を含めてください';
    return 'パスワードが無効です';
  },
});
```

### プリミティブ由来の項目スキーマ

VOを持たないシンプルなフィールドにも対応する。

```typescript
const nameField = createPrimitiveField<string>({
  required: true,
  rules: [
    { code: 'TOO_LONG', validate: (v) => v.length <= 100 },
  ],
  messages: {
    REQUIRED: '名前を入力してください',
    TOO_LONG: '100文字以内で入力してください',
  },
});
```

### ファクトリ関数の型推論

`required` の値に応じて、生成される項目スキーマの型が変わる。

```typescript
const passwordField = createFieldFactory(PasswordVO);

// required: true → FieldSchema<string, Password, true>
const f1 = passwordField({ required: true });

// required: false → FieldSchema<string, Password, false>
const f2 = passwordField({ required: false });

// required省略 → FieldSchema<string, Password, false>（デフォルトfalse）
const f3 = passwordField();
```

### エラーコードとメッセージの解決優先度

```
1. 項目スキーマの messages（最優先）
2. デフォルトメッセージ（フォールバック）

※ VO層はエラーコードのみ保持し、メッセージを持たない
```

---

## Layer 3: フォームスキーマ（Form Schema）

### 定義

項目スキーマの集合体。フォーム全体のエラー文言上書きや動的バリデーションを定義する。

```typescript
type FormSchemaConfig<TFields> = {
  fields: TFields;
  messages?: Record<string, ErrorMessages>; // フィールド名 → ErrorMessages
  resolver?: (values: FormInputValues<TFields>) => FormErrors | null;
};
```

### フォームスキーマの定義例

```typescript
const emailField = createFieldFactory(EmailVO);
const passwordField = createFieldFactory(PasswordVO);

const loginFormSchema = createFormSchema({
  fields: {
    email: emailField({ required: true, messages: { REQUIRED: 'メールアドレスは必須です' } }),
    password: passwordField({ required: true }),
  },
  // フォームスキーマレベルでのメッセージ上書き（項目スキーマより優先）
  messages: {
    password: {
      TOO_SHORT: 'ログイン画面用：8文字以上入力してください',
    },
  },
});
```

### エラーメッセージの最終解決優先度

```
1. フォームスキーマの messages（最優先）
2. 項目スキーマの messages
3. デフォルトメッセージ（フォールバック）
```

### 動的バリデーション（Resolver）

クロスフィールドバリデーションなど、複数フィールド間の依存関係を持つルールを定義する。

```typescript
const signupFormSchema = createFormSchema({
  fields: {
    password: passwordField({ required: true }),
    confirmPassword: createPrimitiveField<string>({ required: true }),
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
```

> **resolver の型安全性**: `values` パラメータは `FormInputValues<TFields>` 型として推論され、定義済みフィールド名のみ型安全にアクセスできる。

---

## 型導出

### 入力型と出力型の分離

フォーム入力中は未検証のプリミティブ型、submit成功時にブランド型付きの検証済み型に昇格する。

```typescript
// フォームスキーマから2つの型が自動導出される

// 入力型：フォーム入力中の値（プリミティブ）
type LoginFormInput = FormInputValues<typeof loginFormSchema>;
// => { email: string; password: string }

// 出力型：バリデーション通過後の値（ブランド型）
type LoginFormOutput = FormOutputValues<typeof loginFormSchema>;
// => { email: Email; password: Password }

// プリミティブ由来のフィールドは入力型 = 出力型
```

### 型導出のルール

| 項目スキーマの定義元 | 入力型 (Input) | 出力型 (Output) |
|-------------------|---------------|----------------|
| VO由来 | VOの基底型（例: `string`） | ブランド型（例: `Password`） |
| プリミティブ由来 | そのプリミティブ型 | 同じプリミティブ型 |
| `required: true` | `T` | `T` |
| `required: false` | `T \| undefined` | `T \| undefined` |

---

## バリデーション実行

### 実行タイミング

| イベント | 実行対象 |
|---------|---------|
| フィールド変更時（onChange） | 当該フィールドの項目スキーマルール |
| フィールドBlur時（onBlur） | 当該フィールドの項目スキーマルール |
| Submit時 | 全フィールドの項目スキーマルール + resolver |

> 実行タイミングはカスタマイズ可能（`useForm` のオプションで指定）。

### バリデーション実行順序

```
1. required チェック（空判定）
2. VOのバリデーションルール（定義順に実行、最初の失敗で停止）
3. resolver（submit時のみ、全フィールドのルール通過後に実行）
```

### エラー表現

```typescript
type FieldError = {
  code: string;
  message: string;
};

type FormErrors = Record<string, FieldError>;
```

---

## React バインディング

### useForm

フォームの状態管理とバリデーションを統合するメインhook。

```typescript
const form = useForm(loginFormSchema, {
  defaultValues: { email: '', password: '' },
  mode: 'onBlur', // バリデーション実行タイミング: 'onChange' | 'onBlur' | 'onSubmit'
});

// form の戻り値
form.handleSubmit   // (handler: (values: LoginFormOutput) => void) => void
form.errors         // FormErrors
form.isValid        // boolean
form.isSubmitting   // boolean
form.isDirty        // boolean
form.reset          // (values?: Partial<LoginFormInput>) => void
form.values         // LoginFormInput（現在の入力値）
```

### useField

個別フィールドの状態を取得するhook。

```typescript
const emailField = useField(form, 'email');

// emailField の戻り値
emailField.value      // string（入力型）
emailField.onChange    // (value: string) => void
emailField.onBlur     // () => void
emailField.error      // FieldError | null
emailField.isDirty    // boolean
emailField.isTouched  // boolean
```

### 利用パターン：Container / View 分離

```typescript
// --- Container ---
const LoginFormContainer = () => {
  const form = useForm(loginFormSchema, {
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    // values は LoginFormOutput 型（ブランド型付き）
    await api.login(values);
  });

  return (
    <LoginFormView
      form={form}
      onSubmit={onSubmit}
    />
  );
};

// --- View ---
const LoginFormView = ({ form, onSubmit }) => {
  const email = useField(form, 'email');
  const password = useField(form, 'password');

  return (
    <form onSubmit={onSubmit}>
      <TextInput
        value={email.value}
        onChange={email.onChange}
        onBlur={email.onBlur}
      />
      {email.error && <ErrorText>{email.error.message}</ErrorText>}

      <TextInput
        value={password.value}
        onChange={password.onChange}
        onBlur={password.onBlur}
        secureTextEntry
      />
      {password.error && <ErrorText>{password.error.message}</ErrorText>}

      <Button onPress={onSubmit} disabled={!form.isValid}>
        ログイン
      </Button>
    </form>
  );
};
```

### submit時の型遷移

```typescript
form.handleSubmit((values) => {
  // values は LoginFormOutput 型
  // values.email → Email（ブランド型）
  // values.password → Password（ブランド型）
  await api.login(values);
});
```

---

## zodアダプター（@vorm/zod）

### 責務

zodスキーマを `ValidationRule[]` に変換する。zodのエラーメッセージはエラーコードとして扱う。

### API

```typescript
// zodスキーマからValidationRule[]を生成
function fromZod<T>(schema: z.ZodType<T>): ValidationRule<T>[];
```

### 変換ルール

| zod API | 生成されるcode |
|---------|---------------|
| `z.string().min(n, code)` | 第2引数の文字列 |
| `z.string().email(code)` | 第2引数の文字列 |
| `z.number().min(n, code)` | 第2引数の文字列 |
| `z.string().regex(re, code)` | 第2引数の文字列 |

> zodのデフォルトエラーメッセージ（codeを省略した場合）は、zodのissue codeがそのまま使用される。

### zodの `.brand()` について

- zodの `.brand()` はvormでは無視される
- zodの役割はバリデーションルールの供給のみ
- ブランド型の付与・管理はvormの `defineVO` が担当する

---

## 完全な利用例

### VO定義（ドメイン層）

```typescript
// domain/email.ts
import { defineVO, type Brand } from '@vorm/core';

export type Email = Brand<string, 'Email'>;

export const EmailVO = defineVO<string, 'Email'>({
  brand: 'Email',
  rules: [
    { code: 'INVALID_FORMAT', validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
  ],
  parse: (input) => input as Email,
});

// domain/password.ts
import { defineVO, type Brand } from '@vorm/core';

export type Password = Brand<string, 'Password'>;

export const PasswordVO = defineVO<string, 'Password'>({
  brand: 'Password',
  rules: [
    { code: 'TOO_SHORT', validate: (v) => v.length >= 8 },
    { code: 'NO_UPPERCASE', validate: (v) => /[A-Z]/.test(v) },
  ],
  parse: (input) => input as Password,
});
```

### フィールドファクトリ定義（フォーム層）

```typescript
// forms/fields.ts
import { createFieldFactory } from '@vorm/core';
import { EmailVO } from '@/domain/email';
import { PasswordVO } from '@/domain/password';

export const emailField = createFieldFactory(EmailVO);
export const passwordField = createFieldFactory(PasswordVO);
```

### フォームスキーマ定義（フォーム層）

```typescript
// forms/login-form.ts
import { createFormSchema } from '@vorm/core';
import { emailField, passwordField } from './fields';

export const loginFormSchema = createFormSchema({
  fields: {
    email: emailField({
      required: true,
      messages: {
        REQUIRED: 'メールアドレスを入力してください',
        INVALID_FORMAT: 'メールアドレスの形式が正しくありません',
      },
    }),
    password: passwordField({
      required: true,
      messages: ({ code }) => {
        if (code === 'REQUIRED') return 'パスワードを入力してください';
        if (code === 'TOO_SHORT') return '8文字以上で入力してください';
        if (code === 'NO_UPPERCASE') return '大文字を1文字以上含めてください';
        return 'パスワードが無効です';
      },
    }),
  },
});
```

### コンポーネント（React層）

```typescript
// components/LoginForm.tsx
import { useForm, useField } from '@vorm/react';
import { loginFormSchema } from '@/forms/login-form';

export const LoginForm = () => {
  const form = useForm(loginFormSchema, {
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const email = useField(form, 'email');
  const password = useField(form, 'password');

  const onSubmit = form.handleSubmit(async (values) => {
    // values.email: Email（ブランド型）
    // values.password: Password（ブランド型）
    await api.login(values);
  });

  return (
    <View>
      <TextInput value={email.value} onChange={email.onChange} onBlur={email.onBlur} />
      {email.error && <Text>{email.error.message}</Text>}

      <TextInput value={password.value} onChange={password.onChange} onBlur={password.onBlur} />
      {password.error && <Text>{password.error.message}</Text>}

      <Button onPress={onSubmit} disabled={!form.isValid}>ログイン</Button>
    </View>
  );
};
```

---

## 初期スコープ / ロードマップ

### v1（初期リリース）

- VO定義（defineVO）
- 項目スキーマ（createFieldFactory, createPrimitiveField）
- フォームスキーマ（createFormSchema）
- バリデーション実行エンジン（controlled）
- 入力型/出力型の自動導出
- resolver（クロスフィールドバリデーション）
- エラーメッセージ解決（3層優先度、Record + 関数）
- React バインディング（useForm, useField）
- zodアダプター（@vorm/zod）

### v2 以降

- field単位の再描画最適化（useSyncExternalStore）
- transform（入出力の双方向変換）
- normalize（値の正規化）
- deps（フィールド間依存関係）
- 配列フィールド（動的増減）
- ネストされたオブジェクトフィールド
- 非同期バリデーション（API問い合わせ等）
- 他アダプター（yup等）
- フレームワークバインディング追加（Vue, Svelte等）
- DevTools

---

## 設計方針メモ

### zodへの依存について

- コア（`@vorm/core`）はzodに一切依存しない
- zodサポートは `@vorm/zod` アダプターパッケージとして分離
- アダプターは `ValidationRule[]` への変換のみを責務とする
- 将来的に他のバリデーションライブラリアダプターも同様の構造で追加可能

### controlledを選択した理由

- React Native対応を見据え、uncontrolledはref依存でWeb前提になるため
- フレームワーク非依存のコアとの整合性（コアが状態を管理できる）
- v1では全フィールド再描画の簡易実装、v2でfield単位の再描画最適化を予定

### エラーのコード/メッセージ分離の理由

- VOはドメインロジックのためUI文言を持つべきではない
- 同じVOを異なる画面で使うとき、エラー文言は画面ごとに異なる
- i18n対応時はエラーコードをキーにして翻訳を引ける

### 参照プロジェクトからの知見

- **ralie-app**: RHFラッパーとして`useForm`を実運用。Container/View分離パターン、`fields`オブジェクトのスプレッド渡し、`createFormFieldFactoryByValueObject`によるVO連携が有効だった
- **hoshiimo-mikke**: 独自Rule型（`type` + `option` + `validate`）、ブランド型VO、ファクトリパターンの型推論が参考になった。`useForm`未使用で手動管理していた点は、hooks APIの実用性担保の重要性を示している
