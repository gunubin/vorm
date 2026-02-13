import { z } from 'zod';
import { vo } from '@gunubin/vorm-core';
import type { Infer } from '@gunubin/vorm-core';
import { createField, createFormSchema } from '@gunubin/vorm-form';
import { useForm } from '@gunubin/vorm-react';
import { fromZod } from '@gunubin/vorm-zod';

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8);

const Email = vo('Email', fromZod(emailSchema));
type Email = Infer<typeof Email>;

const Password = vo('Password', fromZod(passwordSchema));
type Password = Infer<typeof Password>;

const emailField = createField(Email, {
  messages: { email: 'Invalid email format' },
});
const passwordField = createField(Password, {
  messages: { min: 'Must be at least 8 characters' },
});

const schema = createFormSchema({
  fields: {
    email: emailField({ required: true, messages: { REQUIRED: 'Required' } }),
    password: passwordField({ required: true, messages: { REQUIRED: 'Required' } }),
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
        Auto-generate validation rules from zod schemas via fromZod(). Works directly with z.string().email() and z.string().min(8).
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
