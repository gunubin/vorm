import { useCallback, useSyncExternalStore } from 'react';
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
  TFields extends Record<string, FieldSchema<any, any, boolean, any>>,
  TName extends string & keyof TFields,
>(
  form: FormState<TFields>,
  name: TName,
): FieldState<TFields[TName] extends FieldSchema<infer TInput, any, any, any> ? TInput : never> {
  type TValue = TFields[TName] extends FieldSchema<infer TInput, any, any, any> ? TInput : never;

  const store = form.__store;

  const subscribe = useCallback(
    (listener: () => void) => store.subscribeField(name as string, listener),
    [store, name],
  );
  const getSnapshot = useCallback(
    () => store.getFieldSnapshot(name as string),
    [store, name],
  );

  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const value = snap.value as TValue;
  const error = snap.error;
  const isTouched = snap.isTouched;
  const isDirty = value !== (form.defaultValues as Record<string, unknown>)[name as string];

  const onChange = useCallback(
    (newValue: TValue) => {
      form.setFieldValue(name as string, newValue);
    },
    [form.setFieldValue, name],
  );

  const onBlur = useCallback(() => {
    form.setFieldTouched(name as string);
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
