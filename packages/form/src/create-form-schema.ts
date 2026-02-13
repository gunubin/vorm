import type { StandardSchemaV1 } from '@gunubin/vorm-core';
import type { AnyFieldSchema, FormSchema, FormSchemaConfig, FormInputValues, FormOutputValues } from './types.js';
import { validateForm } from './validate-form.js';
import { buildOutputValues } from './build-output-values.js';

export function parseFieldPath(key: string): (string | number)[] {
  const result: (string | number)[] = [];
  let i = 0;
  let current = '';

  while (i < key.length) {
    if (key[i] === '[') {
      if (current) {
        result.push(current);
        current = '';
      }
      i++;
      let num = '';
      while (i < key.length && key[i] !== ']') {
        num += key[i];
        i++;
      }
      result.push(Number(num));
      i++; // skip ']'
    } else {
      current += key[i];
      i++;
    }
  }

  if (current) {
    result.push(current);
  }

  return result;
}

export function createFormSchema<TFields extends Record<string, AnyFieldSchema>>(
  config: FormSchemaConfig<TFields>,
): FormSchema<TFields> {
  const schema: FormSchema<TFields> = {
    fields: config.fields,
    messages: config.messages,
    resolver: config.resolver,
    '~standard': {
      version: 1,
      vendor: 'vorm',
      validate(
        value: unknown,
      ): StandardSchemaV1.Result<FormOutputValues<TFields>> {
        const values = value as FormInputValues<TFields>;
        const errors = validateForm(values, schema);
        const errorEntries = Object.entries(errors);

        if (errorEntries.length > 0) {
          const issues: StandardSchemaV1.Issue[] = errorEntries.map(
            ([field, error]) => ({
              message: error.message || error.code,
              path: parseFieldPath(field),
            }),
          );
          return { issues };
        }

        const output = buildOutputValues(
          values as Record<string, unknown>,
          schema.fields,
        );
        return { value: output as FormOutputValues<TFields> };
      },
      types: undefined as unknown as StandardSchemaV1.Types<
        FormInputValues<TFields>,
        FormOutputValues<TFields>
      >,
    },
  };

  return schema;
}
