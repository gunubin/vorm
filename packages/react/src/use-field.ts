import { useCallback } from 'react';
import type { FieldSchema, FieldError } from '@vorm/core';
import type { FormState } from './use-form.js';

export type FieldState<TValue> = {
  value: TValue;
  onChange: (value: TValue) => void;
  onBlur: () => void;
  error: FieldError | null;
  isDirty: boolean;
  isTouched: boolean;
};

export function useField<
  TFields extends Record<string, FieldSchema<any, any, boolean>>,
  TName extends string & keyof TFields,
>(
  form: FormState<TFields>,
  name: TName,
): FieldState<TFields[TName] extends FieldSchema<infer TInput, any, any> ? TInput : never> {
  type TValue = TFields[TName] extends FieldSchema<infer TInput, any, any> ? TInput : never;

  const value = (form.values as Record<string, unknown>)[name] as TValue;
  const error = form.errors[name] ?? null;
  const isDirty = value !== (form.defaultValues as Record<string, unknown>)[name];
  const isTouched = form.touchedFields[name] ?? false;

  const onChange = useCallback(
    (newValue: TValue) => {
      form.setFieldValue(name, newValue);
    },
    [form.setFieldValue, name],
  );

  const onBlur = useCallback(() => {
    form.setFieldTouched(name);
  }, [form.setFieldTouched, name]);

  return {
    value,
    onChange,
    onBlur,
    error,
    isDirty,
    isTouched,
  };
}
