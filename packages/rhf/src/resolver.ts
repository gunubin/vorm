import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import {
  validateForm,
  buildOutputValues,
  type FormSchema,
  type FieldSchema,
  type FormInputValues,
  type FormOutputValues,
} from '@gunubin/vorm-form';

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
 * Create a React Hook Form-compatible Resolver from a @gunubin/vorm-core FormSchema.
 *
 * - RHF holds string values, so parse is applied in the resolver
 * - Validation is delegated to @gunubin/vorm-core's validateForm
 * - On success, values are converted to Branded Types via VO's create()
 * - Can be passed directly to RHF's useForm
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
