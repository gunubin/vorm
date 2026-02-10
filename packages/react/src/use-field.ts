import { useCallback, useSyncExternalStore } from 'react';
import type { FieldSchema, FieldError } from '@vorm/core';
import type { FormState } from './use-form.js';

export type FieldState<TValue> = {
  value: TValue;
  formattedValue: string;
  onChange: (raw: string) => void;
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
): FieldState<TFields[TName] extends FieldSchema<infer T, any, any, any> ? T : never> {
  type TValue = TFields[TName] extends FieldSchema<infer T, any, any, any> ? T : never;

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

  const fieldSchema = form.schema.fields[name] as FieldSchema<TValue, any, boolean, any>;
  const formatFn = fieldSchema?.format;
  const parseFn = fieldSchema?.parse;

  const formattedValue = formatFn ? formatFn(value) : String(value ?? '');

  const onChange = useCallback(
    (raw: string) => {
      const parsed = parseFn ? parseFn(raw) : raw;
      form.setFieldValue(name as string, parsed);
    },
    [form.setFieldValue, name, parseFn],
  );

  const onBlur = useCallback(() => {
    form.setFieldTouched(name as string);
  }, [form.setFieldTouched, name]);

  return {
    value,
    formattedValue,
    onChange,
    onBlur,
    error,
    isDirty,
    isTouched,
  };
}
