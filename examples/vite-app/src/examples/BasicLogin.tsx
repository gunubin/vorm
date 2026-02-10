import { vo, createRule, createField, createFormSchema } from '@vorm/core';
import type { Infer } from '@vorm/core';
import { useForm } from '@vorm/react';

const minLength = createRule<string, number>(
  'minLength',
  (value, min) => value.length >= min,
);

const emailPattern = createRule<string>(
  'email',
  (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
);

// --- vo() で定義 ---
const Email = vo('Email', [emailPattern()]);
type Email = Infer<typeof Email>;

const Password = vo('Password', [minLength(8)]);
type Password = Infer<typeof Password>;

const emailField = createField(Email, {
  messages: { email: 'メールアドレスの形式が正しくありません' },
});
const passwordField = createField(Password, {
  messages: { minLength: '8文字以上で入力してください' },
});

const schema = createFormSchema({
  fields: {
    email: emailField({ required: true, messages: { REQUIRED: '必須です' } }),
    password: passwordField({ required: true, messages: { REQUIRED: '必須です' } }),
  },
});

export function BasicLogin() {
  const form = useForm(schema, {
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const email = form.field('email');
  const password = form.field('password');

  const onSubmit = form.handleSubmit((values) => {
    // values.email: Email (branded), values.password: Password (branded)
    // 型安全: const cross: Password = values.email; → 型エラー
    alert(JSON.stringify(values, null, 2));
  });

  return (
    <div>
      <h2>Basic Login Form</h2>
      <p className="description">
        vo() でバリデーション付き値オブジェクトを定義。create() で型安全に生成、safeCreate() で安全に生成。
        フォームでは useForm が rules を内部で使うだけ。
      </p>

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={email.error ? 'has-error' : ''}
            value={email.value}
            onChange={(e) => email.onChange(e.target.value)}
            onBlur={email.onBlur}
          />
          {email.error && <p className="error-message">{email.error.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className={password.error ? 'has-error' : ''}
            value={password.value}
            onChange={(e) => password.onChange(e.target.value)}
            onBlur={password.onBlur}
          />
          {password.error && <p className="error-message">{password.error.message}</p>}
        </div>

        <button type="submit" disabled={form.isSubmitting}>
          Login
        </button>
      </form>

      <div className="state-display">
        <strong>VO standalone usage:</strong>{'\n'}
        {`Email.create('test@example.com')  → OK\n`}
        {`Email.safeCreate('invalid')       → { success: false, error: { code: 'email' } }\n`}
        {`Password.create('short')          → throws VOValidationError\n`}
        {'\n'}
        <strong>Form state:</strong>{'\n'}
{JSON.stringify({ values: form.values, errors: form.errors, isDirty: form.isDirty, isValid: form.isValid, touched: form.touchedFields }, null, 2)}
      </div>
    </div>
  );
}
