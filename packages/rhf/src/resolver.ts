import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import {
  validateForm,
  buildOutputValues,
  type FormSchema,
  type FieldSchema,
  type FormInputValues,
  type FormOutputValues,
} from '@vorm/core';

type AnyFields = Record<string, FieldSchema<any, any, boolean, any>>;

type InputValues<TFields extends AnyFields> = FormInputValues<TFields> & FieldValues;
type OutputValues<TFields extends AnyFields> = FormOutputValues<TFields> & FieldValues;

function applyParse(
  values: Record<string, unknown>,
  fields: Record<string, FieldSchema<any, any, boolean, any>>,
): Record<string, unknown> {
  const parsed: Record<string, unknown> = {};
  for (const [name, fieldSchema] of Object.entries(fields)) {
    const raw = values[name];
    parsed[name] = fieldSchema.parse && typeof raw === 'string' ? fieldSchema.parse(raw) : raw;
  }
  return parsed;
}

/**
 * @vorm/core の FormSchema から React Hook Form 互換の Resolver を生成する。
 *
 * - RHF は string を保持するため、resolver 側で parse を適用
 * - バリデーションは @vorm/core の validateForm に委譲
 * - 成功時は VO の create() を通して Branded Type に変換した値を返す
 * - RHF の useForm にそのまま渡せる
 */
export function createVormResolver<TFields extends AnyFields>(
  schema: FormSchema<TFields>,
): Resolver<InputValues<TFields>, any, OutputValues<TFields>> {
  return ((values: InputValues<TFields>) => {
    const parsed = applyParse(values as Record<string, unknown>, schema.fields);
    const errors = validateForm(parsed as FormInputValues<TFields>, schema);

    if (Object.keys(errors).length > 0) {
      const rhfErrors: FieldErrors<InputValues<TFields>> = {};
      for (const [name, error] of Object.entries(errors)) {
        (rhfErrors as Record<string, unknown>)[name] = {
          type: error.code,
          message: error.message,
        };
      }
      return { values: {}, errors: rhfErrors };
    }

    const outputValues = buildOutputValues(parsed, schema.fields);

    return {
      values: outputValues as OutputValues<TFields>,
      errors: {} as FieldErrors<InputValues<TFields>>,
    };
  }) as Resolver<InputValues<TFields>, any, OutputValues<TFields>>;
}
