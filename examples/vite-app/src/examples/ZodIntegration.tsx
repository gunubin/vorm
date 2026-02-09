import { z } from 'zod';
import { vo, createField, createFormSchema } from '@vorm/core';
import type { Infer } from '@vorm/core';
import { useForm } from '@vorm/react';
import { fromZod } from '@vorm/zod';

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8);

const Email = vo('Email', fromZod(emailSchema));
type Email = Infer<typeof Email>;

const Password = vo('Password', fromZod(passwordSchema));
type Password = Infer<typeof Password>;

const emailField = createField(Email);
const passwordField = createField(Password);

const schema = createFormSchema({
  fields: {
    email: emailField({ required: true, messages: { REQUIRED: '必須です', email: 'メールアドレスの形式が正しくありません' } }),
    password: passwordField({ required: true, messages: { REQUIRED: '必須です', min: '8文字以上で入力してください' } }),
  },
});

export function ZodIntegration() {
  const form = useForm(schema, {
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const email = form.field('email');
  const password = form.field('password');

  return (
    <div>
      <h2>Zod Integration</h2>
      <p className="description">
        zod スキーマから fromZod() でバリデーションルールを自動生成。z.string().email() や z.string().min(8) がそのまま使える。
      </p>

      <form onSubmit={form.handleSubmit((v) => alert(JSON.stringify(v)))}>
        <div className="form-group">
          <label htmlFor="zod-email">Email</label>
          <input
            id="zod-email"
            type="email"
            className={email.error ? 'has-error' : ''}
            value={email.value}
            onChange={(e) => email.onChange(e.target.value)}
            onBlur={email.onBlur}
          />
          {email.error && <p className="error-message">{email.error.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="zod-password">Password</label>
          <input
            id="zod-password"
            type="password"
            className={password.error ? 'has-error' : ''}
            value={password.value}
            onChange={(e) => password.onChange(e.target.value)}
            onBlur={password.onBlur}
          />
          {password.error && <p className="error-message">{password.error.message}</p>}
        </div>

        <button type="submit" disabled={form.isSubmitting}>
          Register
        </button>
      </form>

      <div className="state-display">
        <strong>Zod schemas:</strong>{'\n'}
        {`email: z.string().email()\npassword: z.string().min(8)`}
        {'\n\n'}
        <strong>Form state:</strong>{'\n'}
{JSON.stringify({ values: form.values, errors: form.errors, isValid: form.isValid }, null, 2)}
      </div>
    </div>
  );
}
