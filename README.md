# vorm

**VO-first form library for React.**

vorm brings Value Object (branded type) safety to form handling. Define your domain types once, and get type-safe input, validation, and output — all with zero runtime overhead.

## Features

- **Branded types** — Output values carry compile-time brand tags (`Email`, `Password`, etc.)
- **VO-first schema** — Define fields from Value Object definitions; validation rules come from the domain
- **Selective re-rendering** — Built on `useSyncExternalStore`; `useField()` subscribes per-field, not per-form
- **Async validation** — Per-field async validators with debounce, AbortController race-condition handling
- **Validation modes** — `onChange`, `onBlur`, `onTouched`, `onSubmit`
- **Zod adapter** — Convert Zod schemas to vorm validation rules with `@vorm/zod`
- **Zero dependencies** — Only peer deps are `react` and optionally `zod`
- **React 18+ / React 19** — Uses native `useSyncExternalStore`, no shims

## Packages

| Package | Description |
|---------|-------------|
| `@vorm/core` | VO definitions, field schemas, validation logic |
| `@vorm/react` | `useForm`, `useField` hooks |
| `@vorm/zod` | `fromZod()` — convert Zod schemas to validation rules |

## Quick Start

```bash
npm install @vorm/core @vorm/react
```

### 1. Define Value Objects

```ts
import { vo } from '@vorm/core';

const Email = vo('Email', [
  { code: 'INVALID_FORMAT', validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
]);

const Password = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
]);
```

`Email.create('user@example.com')` returns `Brand<string, 'Email'>` — a branded string that the type system tracks.

### 2. Create a Form Schema

```ts
import { createField, createFormSchema } from '@vorm/core';

const emailField = createField(Email);
const passwordField = createField(Password);

const loginSchema = createFormSchema({
  fields: {
    email: emailField({
      required: true,
      messages: { REQUIRED: 'Email is required', INVALID_FORMAT: 'Invalid email' },
    }),
    password: passwordField({
      required: true,
      messages: { REQUIRED: 'Password is required', TOO_SHORT: 'Min 8 characters' },
    }),
  },
});
```

### 3. Use in React

```tsx
import { useForm, useField } from '@vorm/react';

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
      // values.password is Brand<string, 'Password'>
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

### Why useField?

`useField(form, 'email')` subscribes **only** to the email field's value, error, and touched state. When the password changes, the email input does not re-render. This is powered by an external store with `useSyncExternalStore` under the hood.

`form.field('email')` also works — but it reads from the form-level snapshot, so it re-renders with every field change. Use `useField` for performance-critical forms.

## Async Validation

```ts
const form = useForm(loginSchema, {
  defaultValues: { email: '', password: '' },
  mode: 'onBlur',
  asyncValidators: {
    email: {
      validate: async (value) => {
        const taken = await checkEmailExists(value);
        if (taken) return { code: 'TAKEN', message: 'Already registered' };
        return null;
      },
      on: 'blur',        // 'blur' | 'change' | 'submit'
      debounceMs: 300,    // debounce for 'change' trigger
    },
  },
});
```

- Sync validation runs first; async is skipped if sync fails
- Previous async calls are aborted via `AbortController` (no race conditions)
- `form.isValidating` tracks async-in-progress state
- `form.validateAsync('email')` triggers async validation manually

## Validation Modes

| Mode | Behavior |
|------|----------|
| `onSubmit` | Validate only on submit (default) |
| `onBlur` | Validate when a field loses focus |
| `onChange` | Validate on every value change |
| `onTouched` | Validate on first blur, then re-validate on change |

## Zod Adapter

```bash
npm install @vorm/zod zod
```

```ts
import { z } from 'zod';
import { fromZod } from '@vorm/zod';
import { vo } from '@vorm/core';

const emailSchema = z.string().email('INVALID_EMAIL').min(1, 'REQUIRED');
const Email = vo('Email', fromZod(emailSchema));
```

`fromZod()` extracts Zod's built-in checks (`min`, `max`, `email`, `regex`) and converts them to vorm `ValidationRule[]`. Works with `ZodBranded` schemas too.

## API Reference

### `@vorm/core`

#### `vo(brand, rules)`

Define a Value Object type.

```ts
const Email = vo('Email', [
  { code: 'INVALID', validate: (v: string) => /\S+@\S+/.test(v) },
]);

Email.create('a@b.com');     // Brand<string, 'Email'>
Email.create('bad');          // throws VOValidationError
Email.safeCreate('bad');      // { success: false, error: { code: 'INVALID' } }
```

#### `createField(vo)`

Create a field factory from a VO definition. Returns a function that accepts `{ required, messages }`.

```ts
const emailField = createField(Email);
const field = emailField({ required: true, messages: { REQUIRED: 'Required' } });
```

#### `createField(config)` (without VO)

Create a field schema directly for plain types.

```ts
const ageField = createField<number>({ required: true, rules: [{ code: 'MIN', validate: (v) => v >= 0 }] });
```

#### `createRule(code, validate)`

Create reusable, parameterized validation rules.

```ts
import { createRule } from '@vorm/core';

const minLength = createRule<string, number>('TOO_SHORT', (v, min) => v.length >= min);
const maxLength = createRule<string, number>('TOO_LONG', (v, max) => v.length <= max);

const Username = vo('Username', [
  minLength(3),
  maxLength(20),
]);
```

Without parameters:

```ts
const nonEmpty = createRule<string>('REQUIRED', (v) => v.length > 0);
const Name = vo('Name', [nonEmpty()]);
```

#### `createFormSchema({ fields, messages?, resolver? })`

Bundle fields into a form schema.

```ts
const schema = createFormSchema({
  fields: { email: emailField({ required: true }) },
  messages: {
    email: { REQUIRED: 'Email is required' },  // form-level message overrides
  },
  resolver: (values) => {                       // cross-field validation
    if (values.password !== values.confirm) {
      return { confirm: { code: 'MISMATCH', message: 'Passwords must match' } };
    }
    return null;
  },
});
```

#### `validateField(value, fieldSchema, messages?)`

Validate a single field. Returns `FieldError | null`.

#### `validateForm(values, schema)`

Validate all fields. Returns `FormErrors` (a `Record<string, FieldError>`).

#### `VOValidationError`

Error thrown by `vo().create()` when validation fails.

```ts
import { VOValidationError } from '@vorm/core';

try {
  Email.create('bad');
} catch (e) {
  if (e instanceof VOValidationError) {
    e.brand; // 'Email'
    e.code;  // 'INVALID_FORMAT'
    e.input; // 'bad'
  }
}
```

#### Utility Types

```ts
import type { Brand, Infer } from '@vorm/core';

type EmailType = Brand<string, 'Email'>;    // string & { readonly __brand: 'Email' }
type Inferred = Infer<typeof Email>;         // Brand<string, 'Email'>
```

### `@vorm/react`

#### `useForm(schema, options)`

```ts
const form = useForm(schema, {
  defaultValues: { email: '', password: '' },
  mode: 'onBlur',                  // optional, default 'onSubmit'
  asyncValidators: { ... },        // optional
});
```

Returns `FormState`:

| Property | Type | Description |
|----------|------|-------------|
| `values` | `FormInputValues` | Current form values |
| `errors` | `FormErrors` | Current validation errors |
| `isValid` | `boolean` | `true` when no errors |
| `isDirty` | `boolean` | `true` when any value changed |
| `isSubmitting` | `boolean` | `true` during submit handler |
| `isValidating` | `boolean` | `true` during async validation |
| `touchedFields` | `Record<string, boolean>` | Which fields have been blurred |
| `handleSubmit(handler)` | `(e?) => Promise<void>` | Submit with sync+async validation |
| `setFieldValue(name, value)` | `void` | Update a field |
| `setFieldTouched(name)` | `void` | Mark a field as touched |
| `setFieldError(name, error)` | `void` | Manually set an error |
| `clearFieldError(name?)` | `void` | Clear one or all errors |
| `validate(name?)` | `boolean` | Run sync validation |
| `validateAsync(name?)` | `Promise<boolean>` | Run sync + async validation |
| `reset(values?)` | `void` | Reset to default values |
| `field(name)` | `FieldState` | Get field state (form-level subscription) |
| `schema` | `FormSchema` | The schema passed to `useForm` |
| `mode` | `ValidationMode` | Current validation mode |
| `defaultValues` | `FormInputValues` | Initial default values |

#### `useField(form, name)`

Subscribe to a single field with per-field re-rendering.

```ts
const email = useField(form, 'email');
// email.value, email.onChange, email.onBlur, email.error, email.isDirty, email.isTouched
```

### `@vorm/zod`

#### `fromZod(zodSchema)`

Convert a Zod schema to `ValidationRule[]`.

Supported checks: `min`, `max`, `email`, `regex`. Unsupported checks pass through as no-op rules.

## Architecture

```
@vorm/core          @vorm/zod
  vo()               fromZod()
  createField()         │
  createFormSchema()    │
  validateField()  ←────┘
  validateForm()
       │
       ▼
@vorm/react
  useForm()  ──→  FormStore (useSyncExternalStore)
  useField() ──→  subscribeField() (per-field subscription)
```

## Requirements

- TypeScript 5.0+
- React 18+ or React 19

## License

MIT
