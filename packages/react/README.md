# @gunubin/vorm-react

React hooks for vorm — `useForm` and `useField` with per-field subscriptions via `useSyncExternalStore`.

Part of the [vorm](https://github.com/gunubin/vorm) monorepo.

## Install

```bash
npm install @gunubin/vorm-core @gunubin/vorm-react
```

## Quick Start

```tsx
import { useForm, useField } from '@gunubin/vorm-react';

function LoginForm() {
  const form = useForm(loginSchema, {
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const email = useField(form, 'email');
  const password = useField(form, 'password');

  return (
    <form onSubmit={form.handleSubmit((values) => {
      // values.email is Brand<string, 'Email'>
      login(values.email, values.password);
    })}>
      <input value={email.value} onChange={(e) => email.onChange(e.target.value)} onBlur={email.onBlur} />
      {email.error && <span>{email.error.message}</span>}

      <input type="password" value={password.value} onChange={(e) => password.onChange(e.target.value)} onBlur={password.onBlur} />
      {password.error && <span>{password.error.message}</span>}

      <button type="submit" disabled={form.isSubmitting}>Log in</button>
    </form>
  );
}
```

## Why `useField`?

`useField(form, 'email')` subscribes **only** to the email field's state. When the password changes, the email input does not re-render.

`form.field('email')` also works but reads from the form-level snapshot, so it re-renders with every field change. Use `useField` for performance-critical forms.

## Validation Modes

| Mode | Behavior |
|------|----------|
| `onSubmit` | Validate only on submit (default) |
| `onBlur` | Validate when a field loses focus |
| `onChange` | Validate on every value change |
| `onTouched` | Validate on first blur, then re-validate on change |

## Async Validation

```ts
const form = useForm(schema, {
  defaultValues: { email: '' },
  asyncValidators: {
    email: {
      validate: async (value) => {
        const taken = await checkEmailExists(value);
        if (taken) return { code: 'TAKEN', message: 'Already registered' };
        return null;
      },
      on: 'blur',
      debounceMs: 300,
    },
  },
});
```

For full documentation, see the [vorm README](https://github.com/gunubin/vorm#readme).

## License

MIT
