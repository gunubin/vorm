# @gunubin/vorm-core

VO-first form validation core — branded types, field schemas, and validation logic.

Part of the [vorm](https://github.com/gunubin/vorm) monorepo.

## Install

```bash
npm install @gunubin/vorm-core
```

## Quick Start

### Define Value Objects

```ts
import { vo } from '@gunubin/vorm-core';

const Email = vo('Email', [
  { code: 'INVALID_FORMAT', validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
]);

Email.create('user@example.com'); // Brand<string, 'Email'>
```

### Create Fields and Form Schema

```ts
import { createField, createFormSchema } from '@gunubin/vorm-core';

const emailField = createField(Email);

const schema = createFormSchema({
  fields: {
    email: emailField({
      required: true,
      messages: { REQUIRED: 'Email is required', INVALID_FORMAT: 'Invalid email' },
    }),
  },
});
```

### Reusable Rules with `createRule`

```ts
import { createRule } from '@gunubin/vorm-core';

const minLength = createRule('TOO_SHORT', (v: string, min: number) => v.length >= min);
const maxLength = createRule('TOO_LONG', (v: string, max: number) => v.length <= max);

const Username = vo('Username', [minLength(3), maxLength(20)]);
```

### Parse / Format

```ts
const priceField = createField<number>({
  parse: (v: string) => Number(v.replace(/,/g, '')),
  format: (v: number) => v.toLocaleString(),
})({ required: true });
```

## API

| Export | Description |
|--------|-------------|
| `vo(brand, rules)` | Define a Value Object type with branded output |
| `createField(vo, options?)` | Create a field factory from a VO definition |
| `createField(config)` | Create a field schema directly for plain types |
| `createRule(code, validate)` | Create reusable, parameterized validation rules |
| `createFormSchema(config)` | Bundle fields into a form schema |
| `validateField(value, schema)` | Validate a single field |
| `validateForm(values, schema)` | Validate all fields |
| `VOValidationError` | Error thrown by `vo().create()` on failure |

### Types

```ts
import type { Brand, Infer, ErrorMessageMap } from '@gunubin/vorm-core';
```

For full documentation, see the [vorm README](https://github.com/gunubin/vorm#readme).

## License

MIT
