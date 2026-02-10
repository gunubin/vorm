import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import {
  validateForm,
  type FormSchema,
  type FieldSchema,
  type FormInputValues,
  type FormOutputValues,
} from '@vorm/core';

type AnyFields = Record<string, FieldSchema<any, any, boolean, any>>;

type InputValues<TFields extends AnyFields> = FormInputValues<TFields> & FieldValues;
type OutputValues<TFields extends AnyFields> = FormOutputValues<TFields> & FieldValues;

/**
 * @vorm/core の FormSchema から React Hook Form 互換の Resolver を生成する。
 *
 * - バリデーションは @vorm/core の validateForm に委譲
 * - 成功時は VO の create() を通して Branded Type に変換した値を返す
 * - RHF の useForm にそのまま渡せる
 */
export function createVormResolver<TFields extends AnyFields>(
  schema: FormSchema<TFields>,
): Resolver<InputValues<TFields>, any, OutputValues<TFields>> {
  return ((values: InputValues<TFields>) => {
    const errors = validateForm(values as FormInputValues<TFields>, schema);

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

    const outputValues: Record<string, unknown> = {};
    for (const [name, fieldSchema] of Object.entries(schema.fields)) {
      const value = (values as Record<string, unknown>)[name];
      const isEmpty = value === undefined || value === null || value === '';

      if (isEmpty) {
        outputValues[name] = undefined;
      } else if (fieldSchema.vo) {
        outputValues[name] = fieldSchema.vo.create(value);
      } else {
        outputValues[name] = value;
      }
    }

    return {
      values: outputValues as OutputValues<TFields>,
      errors: {} as FieldErrors<InputValues<TFields>>,
    };
  }) as Resolver<InputValues<TFields>, any, OutputValues<TFields>>;
}
