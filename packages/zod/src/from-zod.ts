import type { ValidationRule } from '@vorm/core';
import type { z } from 'zod';

type ZodCheck = {
  kind: string;
  value?: number;
  inclusive?: boolean;
  message?: string;
  regex?: RegExp;
};

type ZodDef = {
  checks?: ZodCheck[];
  typeName?: string;
  type?: { _def: ZodDef };
};

function extractChecks(schema: z.ZodType<any>): ZodCheck[] {
  const def = (schema as any)._def as ZodDef;

  // Handle ZodBranded: unwrap to inner type
  if (def.typeName === 'ZodBranded' && def.type) {
    return extractChecks(def.type as z.ZodType<any>);
  }

  return (def.checks ?? []) as ZodCheck[];
}

function checkToRule<T>(check: ZodCheck): ValidationRule<T> {
  const code = check.message ?? check.kind;

  switch (check.kind) {
    case 'min':
      return {
        code,
        validate: (value: T) => {
          if (typeof value === 'string') return value.length >= (check.value ?? 0);
          if (typeof value === 'number') {
            return check.inclusive !== false
              ? value >= (check.value ?? 0)
              : value > (check.value ?? 0);
          }
          return true;
        },
      };

    case 'max':
      return {
        code,
        validate: (value: T) => {
          if (typeof value === 'string') return value.length <= (check.value ?? Infinity);
          if (typeof value === 'number') {
            return check.inclusive !== false
              ? value <= (check.value ?? Infinity)
              : value < (check.value ?? Infinity);
          }
          return true;
        },
      };

    case 'email':
      return {
        code,
        validate: (value: T) => {
          if (typeof value === 'string') {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          }
          return true;
        },
      };

    case 'regex':
      return {
        code,
        validate: (value: T) => {
          if (typeof value === 'string' && check.regex) {
            return check.regex.test(value);
          }
          return true;
        },
      };

    default:
      return {
        code,
        validate: () => true,
      };
  }
}

export function fromZod<T>(schema: z.ZodType<T>): ValidationRule<T>[] {
  const checks = extractChecks(schema);
  return checks.map((check) => checkToRule<T>(check));
}
