import type { StandardSchemaV1 } from '@gunubin/vorm-core';
import type { FieldSchema, FormSchema, FormSchemaConfig, FormInputValues, FormOutputValues } from './types.js';
import { validateForm } from './validate-form.js';
import { buildOutputValues } from './build-output-values.js';

export function createFormSchema<TFields extends Record<string, FieldSchema<any, any, boolean, any>>>(
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
              path: [field],
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
