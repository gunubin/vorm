import { vo, createRule, createField, createFormSchema } from '@gunubin/vorm-core';
import type { Infer } from '@gunubin/vorm-core';
import { useForm } from '@gunubin/vorm-react';

const minLength = createRule<string, number>(
  'minLength',
  (value, min) => value.length >= min,
);

const emailPattern = createRule<string>(
  'email',
  (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
);

// --- Defined with vo() ---
const Email = vo('Email', [emailPattern()]);
type Email = Infer<typeof Email>;

const Password = vo('Password', [minLength(8)]);
type Password = Infer<typeof Password>;

const emailField = createField(Email, {
  messages: { email: 'Invalid email format' },
});
const passwordField = createField(Password, {
  messages: { minLength: 'Must be at least 8 characters' },
});

const schema = createFormSchema({
  fields: {
    email: emailField({ required: true, messages: { REQUIRED: 'Required' } }),
    password: passwordField({ required: true, messages: { REQUIRED: 'Required' } }),
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
    // Type-safe: const cross: Password = values.email; -> type error
    alert(JSON.stringify(values, null, 2));
  });

  return (
    <div>
      <h2>Basic Login Form</h2>
      <p className="description">
        Define validated value objects with vo(). Type-safe creation with create(), safe creation with safeCreate().
        In forms, useForm uses the rules internally.
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
