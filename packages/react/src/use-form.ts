import { useState, useCallback, useRef } from 'react';
import type {
  FormSchema,
  FieldSchema,
  FormInputValues,
  FormOutputValues,
  FormErrors,
  FieldError,
} from '@vorm/core';
import type { FieldState } from './use-field.js';
import { validateField, validateForm } from '@vorm/core';

type ValidationMode = 'onChange' | 'onBlur' | 'onSubmit';

type UseFormOptions<TFields extends Record<string, FieldSchema<any, any, boolean>>> = {
  defaultValues: FormInputValues<TFields>;
  mode?: ValidationMode;
};

export type FormState<TFields extends Record<string, FieldSchema<any, any, boolean>>> = {
  values: FormInputValues<TFields>;
  errors: FormErrors;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  touchedFields: Record<string, boolean>;
  handleSubmit: (handler: (values: FormOutputValues<TFields>) => void | Promise<void>) => (e?: { preventDefault?: () => void }) => Promise<void>;
  reset: (values?: Partial<FormInputValues<TFields>>) => void;
  setFieldValue: (name: string, value: any) => void;
  setFieldTouched: (name: string) => void;
  setFieldError: (name: string & keyof TFields, error: FieldError) => void;
  clearFieldError: (name?: string & keyof TFields) => void;
  validate: (name?: string & keyof TFields) => boolean;
  field: <TName extends string & keyof TFields>(
    name: TName,
  ) => FieldState<TFields[TName] extends FieldSchema<infer TInput, any, any> ? TInput : never>;
  schema: FormSchema<TFields>;
  mode: ValidationMode;
  defaultValues: FormInputValues<TFields>;
};

export function useForm<TFields extends Record<string, FieldSchema<any, any, boolean>>>(
  schema: FormSchema<TFields>,
  options: UseFormOptions<TFields>,
): FormState<TFields> {
  const { defaultValues, mode = 'onSubmit' } = options;
  const [values, setValues] = useState<FormInputValues<TFields>>({ ...defaultValues });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const defaultValuesRef = useRef(defaultValues);

  const isValid = Object.keys(errors).length === 0;

  const validateSingleField = useCallback(
    (name: string, value: any) => {
      const fieldSchema = schema.fields[name];
      if (!fieldSchema) return;
      const formMessages = schema.messages?.[name];
      const error = validateField(value, fieldSchema, formMessages);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) {
          next[name] = error;
        } else {
          delete next[name];
        }
        return next;
      });
    },
    [schema],
  );

  const setFieldValue = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setIsDirty(true);
      if (mode === 'onChange') {
        validateSingleField(name, value);
      }
    },
    [mode, validateSingleField],
  );

  const setFieldTouched = useCallback(
    (name: string) => {
      setTouchedFields((prev) => ({ ...prev, [name]: true }));
      if (mode === 'onBlur') {
        const currentValue = (values as Record<string, unknown>)[name];
        validateSingleField(name, currentValue);
      }
    },
    [mode, values, validateSingleField],
  );

  const setFieldError = useCallback(
    (name: string, error: FieldError) => {
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [],
  );

  const clearFieldError = useCallback(
    (name?: string) => {
      if (name) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      } else {
        setErrors({});
      }
    },
    [],
  );

  const validate = useCallback(
    (name?: string): boolean => {
      if (name) {
        const fieldSchema = schema.fields[name];
        if (!fieldSchema) return true;
        const formMessages = schema.messages?.[name];
        const error = validateField(
          (values as Record<string, unknown>)[name],
          fieldSchema,
          formMessages,
        );
        setErrors((prev) => {
          const next = { ...prev };
          if (error) {
            next[name] = error;
          } else {
            delete next[name];
          }
          return next;
        });
        return !error;
      }
      const formErrors = validateForm(values, schema);
      setErrors(formErrors);
      return Object.keys(formErrors).length === 0;
    },
    [values, schema],
  );

  const handleSubmit = useCallback(
    (handler: (values: FormOutputValues<TFields>) => void | Promise<void>) => {
      return async (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();
        const formErrors = validateForm(values, schema);
        setErrors(formErrors);

        if (Object.keys(formErrors).length > 0) {
          return;
        }

        setIsSubmitting(true);
        try {
          await handler(values as unknown as FormOutputValues<TFields>);
        } finally {
          setIsSubmitting(false);
        }
      };
    },
    [values, schema],
  );

  const reset = useCallback(
    (newValues?: Partial<FormInputValues<TFields>>) => {
      const resetValues = newValues
        ? { ...defaultValuesRef.current, ...newValues }
        : { ...defaultValuesRef.current };
      setValues(resetValues as FormInputValues<TFields>);
      setErrors({});
      setIsDirty(false);
      setTouchedFields({});
    },
    [],
  );

  const field = <TName extends string & keyof TFields>(name: TName) => {
    type TValue = TFields[TName] extends FieldSchema<infer TInput, any, any> ? TInput : never;
    const value = (values as Record<string, unknown>)[name as string] as TValue;
    const error = errors[name as string] ?? null;
    const fieldIsDirty = value !== (defaultValuesRef.current as Record<string, unknown>)[name as string];
    const isTouched = touchedFields[name as string] ?? false;
    return {
      value,
      error,
      isDirty: fieldIsDirty,
      isTouched,
      onChange: (newValue: TValue) => { setFieldValue(name as string, newValue); },
      onBlur: () => { setFieldTouched(name as string); },
    };
  };

  return {
    values,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    touchedFields,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    validate,
    field,
    schema,
    mode,
    defaultValues: defaultValuesRef.current,
  };
}
