# @gunubin/vorm-rhf

[![npm](https://img.shields.io/npm/v/@gunubin/vorm-rhf)](https://www.npmjs.com/package/@gunubin/vorm-rhf)

React Hook Form resolver adapter for vorm — branded type output with zero API wrapping.

Part of the [vorm](https://github.com/gunubin/vorm) monorepo.

## Install

```bash
npm install @gunubin/vorm-core @gunubin/vorm-rhf react-hook-form
```

## Usage

### `useVorm`

A thin wrapper around RHF's `useForm` that automatically wires up a vorm resolver. All RHF APIs work as-is.

```tsx
import { useVorm } from '@gunubin/vorm-rhf';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useVorm(schema, {
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  return (
    <form onSubmit={handleSubmit((values) => {
      // values.email: Brand<string, 'Email'>
      login(values.email, values.password);
    })}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">Log in</button>
    </form>
  );
}
```

### `createVormResolver`

Use the resolver directly with RHF's `useForm`:

```ts
import { useForm } from 'react-hook-form';
import { createVormResolver } from '@gunubin/vorm-rhf';

const { register, handleSubmit } = useForm({
  resolver: createVormResolver(schema),
  defaultValues: { email: '', password: '' },
});
```

For full documentation, see the [vorm README](https://github.com/gunubin/vorm#readme).

## License

MIT
