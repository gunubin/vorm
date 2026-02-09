import { expectTypeOf } from 'vitest';
import { z } from 'zod';
import type { ValidationRule } from '@vorm/core';
import { fromZod } from '../../from-zod.js';

describe('fromZod 型テスト', () => {
  it('fromZod<string> → ValidationRule<string>[]', () => {
    const rules = fromZod(z.string().min(1));
    expectTypeOf(rules).toEqualTypeOf<ValidationRule<string>[]>();
  });

  it('fromZod<number> → ValidationRule<number>[]', () => {
    const rules = fromZod(z.number().min(0));
    expectTypeOf(rules).toEqualTypeOf<ValidationRule<number>[]>();
  });
});
