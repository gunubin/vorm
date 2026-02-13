import { useForm, type UseFormProps, type UseFormReturn, type FieldValues } from 'react-hook-form';
import type { FormSchema, FieldSchema, FormInputValues, FormOutputValues } from '@gunubin/vorm-form';
import { createVormResolver } from './resolver.js';

type AnyFields = Record<string, FieldSchema<any, any, boolean, any>>;

type UseVormProps<TFields extends AnyFields> = Omit<
  UseFormProps<FormInputValues<TFields> & FieldValues>,
  'resolver'
>;

/**
 * A thin wrapper around RHF's useForm that sets up the resolver and generics.
 *
 * - register, watch, formState, etc. work exactly as in RHF
 * - handleSubmit callback receives FormOutputValues (Branded Types)
 * - Performance characteristics are identical to RHF (uncontrolled / ref-based)
 */
export function useVorm<TFields extends AnyFields>(
  schema: FormSchema<TFields>,
  props?: UseVormProps<TFields>,
): UseFormReturn<
  FormInputValues<TFields> & FieldValues,
  any,
  FormOutputValues<TFields> & FieldValues
> {
  return useForm({
    ...props,
    resolver: createVormResolver(schema),
  });
}
