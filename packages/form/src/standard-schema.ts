import type { StandardSchemaV1 } from '@gunubin/vorm-core';
import type { FormSchema, FieldSchema, FormInputValues, FormOutputValues } from './types.js';
import { validateForm } from './validate-form.js';
import { buildOutputValues } from './build-output-values.js';

type AnyFields = Record<string, FieldSchema<any, any, boolean, any>>;

/**
 * Wraps a FormSchema as a Standard Schema v1 compliant object.
 *
 * - Input:  FormInputValues (plain types, e.g. { email: string; password: string })
 * - Output: FormOutputValues (branded types, e.g. { email: Email; password: Password })
 * - On failure, returns issues with field-level path segments
 */
export function formToStandardSchema<TFields extends AnyFields>(
  schema: FormSchema<TFields>,
): StandardSchemaV1<FormInputValues<TFields>, FormOutputValues<TFields>> {
  return {
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
}
