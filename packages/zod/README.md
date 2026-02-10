# @gunubin/vorm-zod

Zod schema adapter for vorm — convert Zod checks to validation rules.

Part of the [vorm](https://github.com/gunubin/vorm) monorepo.

## Install

```bash
npm install @gunubin/vorm-core @gunubin/vorm-zod zod
```

## Usage

```ts
import { z } from 'zod';
import { fromZod } from '@gunubin/vorm-zod';
import { vo } from '@gunubin/vorm-core';

const emailSchema = z.string().email('INVALID_EMAIL').min(1, 'REQUIRED');
const Email = vo('Email', fromZod(emailSchema));
```

`fromZod()` extracts Zod's built-in checks (`min`, `max`, `email`, `regex`) and converts them to vorm `ValidationRule[]`. Works with `ZodBranded` schemas too.

For full documentation, see the [vorm README](https://github.com/gunubin/vorm#readme).

## License

MIT
