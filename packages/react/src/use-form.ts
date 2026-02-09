import { useState, useCallback, useRef, useEffect } from 'react';
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

type ValidationMode = 'onChange' | 'onBlur' | 'onTouched' | 'onSubmit';

type AsyncTrigger = 'blur' | 'change' | 'submit';

export type AsyncFieldValidator<TInput> = {
  validate: (value: TInput) => Promise<FieldError | null>;
  on?: AsyncTrigger;
  debounceMs?: number;
};

export type AsyncValidators<TFields extends Record<string, FieldSchema<any, any, boolean>>> = {
  [K in string & keyof TFields]?: AsyncFieldValidator<
    TFields[K] extends FieldSchema<infer TInput, any, any> ? TInput : never
  >;
};

type UseFormOptions<TFields extends Record<string, FieldSchema<any, any, boolean>>> = {
  defaultValues: FormInputValues<TFields>;
  mode?: ValidationMode;
  asyncValidators?: AsyncValidators<TFields>;
};

export type FormState<TFields extends Record<string, FieldSchema<any, any, boolean>>> = {
  values: FormInputValues<TFields>;
  errors: FormErrors;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  touchedFields: Record<string, boolean>;
  handleSubmit: (handler: (values: FormOutputValues<TFields>) => void | Promise<void>) => (e?: { preventDefault?: () => void }) => Promise<void>;
  reset: (values?: Partial<FormInputValues<TFields>>) => void;
  setFieldValue: (name: string, value: any) => void;
  setFieldTouched: (name: string) => void;
  setFieldError: (name: string & keyof TFields, error: FieldError) => void;
  clearFieldError: (name?: string & keyof TFields) => void;
  validate: (name?: string & keyof TFields) => boolean;
  validateAsync: (name?: string & keyof TFields) => Promise<boolean>;
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
  const { defaultValues, mode = 'onSubmit', asyncValidators } = options;
  const [values, setValues] = useState<FormInputValues<TFields>>({ ...defaultValues });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const defaultValuesRef = useRef(defaultValues);
  const asyncValidatorsRef = useRef(asyncValidators);
  asyncValidatorsRef.current = asyncValidators;
  const validatingFieldsRef = useRef(new Set<string>());
  const abortControllersRef = useRef(new Map<string, AbortController>());
  const debounceTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const isValid = Object.keys(errors).length === 0;

  const runAsyncValidation = useCallback(
    async (name: string, value: any): Promise<FieldError | null> => {
      const asyncValidator = asyncValidatorsRef.current?.[name];
      if (!asyncValidator) return null;

      // Abort previous async validation for this field
      const prevController = abortControllersRef.current.get(name);
      if (prevController) prevController.abort();

      const controller = new AbortController();
      abortControllersRef.current.set(name, controller);

      validatingFieldsRef.current.add(name);
      setIsValidating(true);

      try {
        const error = await asyncValidator.validate(value);
        if (controller.signal.aborted) return null;

        setErrors((prev) => {
          const next = { ...prev };
          if (error) {
            next[name] = error;
          } else {
            delete next[name];
          }
          return next;
        });
        return error;
      } finally {
        if (!controller.signal.aborted) {
          validatingFieldsRef.current.delete(name);
          abortControllersRef.current.delete(name);
          if (validatingFieldsRef.current.size === 0) {
            setIsValidating(false);
          }
        }
      }
    },
    [],
  );

  const scheduleAsyncValidation = useCallback(
    (name: string, value: any, trigger: AsyncTrigger) => {
      const asyncValidator = asyncValidatorsRef.current?.[name];
      if (!asyncValidator) return;

      const on = asyncValidator.on ?? 'blur';
      if (on !== trigger) return;

      // Sync must pass first
      const fieldSchema = schema.fields[name];
      if (fieldSchema) {
        const formMessages = schema.messages?.[name];
        const syncError = validateField(value, fieldSchema, formMessages);
        if (syncError) return;
      }

      // Clear any existing debounce timer
      const existingTimer = debounceTimersRef.current.get(name);
      if (existingTimer) clearTimeout(existingTimer);

      const debounceMs = asyncValidator.debounceMs;
      if (trigger === 'change' && debounceMs && debounceMs > 0) {
        const timer = setTimeout(() => {
          debounceTimersRef.current.delete(name);
          runAsyncValidation(name, value);
        }, debounceMs);
        debounceTimersRef.current.set(name, timer);
      } else {
        runAsyncValidation(name, value);
      }
    },
    [schema, runAsyncValidation],
  );

  const validateSingleField = useCallback(
    (name: string, value: any, trigger?: AsyncTrigger) => {
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
      if (!error && trigger) {
        scheduleAsyncValidation(name, value, trigger);
      }
    },
    [schema, scheduleAsyncValidation],
  );

  const setFieldValue = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setIsDirty(true);
      if (mode === 'onChange') {
        validateSingleField(name, value, 'change');
      } else if (mode === 'onTouched' && touchedFields[name]) {
        validateSingleField(name, value, 'change');
      }
    },
    [mode, touchedFields, validateSingleField],
  );

  const setFieldTouched = useCallback(
    (name: string) => {
      setTouchedFields((prev) => ({ ...prev, [name]: true }));
      if (mode === 'onBlur' || mode === 'onTouched') {
        const currentValue = (values as Record<string, unknown>)[name];
        validateSingleField(name, currentValue, 'blur');
      } else {
        // Even without onBlur mode, trigger async if configured for blur
        const currentValue = (values as Record<string, unknown>)[name];
        const fieldSchema = schema.fields[name];
        if (fieldSchema) {
          const formMessages = schema.messages?.[name];
          const syncError = validateField(currentValue, fieldSchema, formMessages);
          if (!syncError) {
            scheduleAsyncValidation(name, currentValue, 'blur');
          }
        }
      }
    },
    [mode, values, schema, validateSingleField, scheduleAsyncValidation],
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

  const validateAsync = useCallback(
    async (name?: string): Promise<boolean> => {
      if (name) {
        // Sync first
        const fieldSchema = schema.fields[name];
        if (!fieldSchema) return true;
        const formMessages = schema.messages?.[name];
        const syncError = validateField(
          (values as Record<string, unknown>)[name],
          fieldSchema,
          formMessages,
        );
        setErrors((prev) => {
          const next = { ...prev };
          if (syncError) {
            next[name] = syncError;
          } else {
            delete next[name];
          }
          return next;
        });
        if (syncError) return false;

        // Then async
        const asyncError = await runAsyncValidation(name, (values as Record<string, unknown>)[name]);
        return !asyncError;
      }

      // All fields: sync first
      const formErrors = validateForm(values, schema);
      setErrors(formErrors);
      if (Object.keys(formErrors).length > 0) return false;

      // Then async for all configured fields
      const asyncEntries = Object.entries(asyncValidatorsRef.current ?? {});
      if (asyncEntries.length === 0) return true;

      const asyncResults = await Promise.all(
        asyncEntries.map(async ([fieldName]) => {
          const value = (values as Record<string, unknown>)[fieldName];
          return runAsyncValidation(fieldName, value);
        }),
      );
      return asyncResults.every((error) => error === null);
    },
    [values, schema, runAsyncValidation],
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

        // Run async validators with trigger='submit'
        const asyncEntries = Object.entries(asyncValidatorsRef.current ?? {});
        if (asyncEntries.length > 0) {
          const asyncResults = await Promise.all(
            asyncEntries.map(async ([fieldName]) => {
              const value = (values as Record<string, unknown>)[fieldName];
              // Check sync passes for this field first
              const fieldSchema = schema.fields[fieldName];
              if (fieldSchema) {
                const formMessages = schema.messages?.[fieldName];
                const syncError = validateField(value, fieldSchema, formMessages);
                if (syncError) return null; // sync already failed, skip async
              }
              return runAsyncValidation(fieldName, value);
            }),
          );
          const hasAsyncErrors = asyncResults.some((error) => error !== null);
          if (hasAsyncErrors) return;
        }

        setIsSubmitting(true);
        try {
          await handler(values as unknown as FormOutputValues<TFields>);
        } finally {
          setIsSubmitting(false);
        }
      };
    },
    [values, schema, runAsyncValidation],
  );

  const reset = useCallback(
    (newValues?: Partial<FormInputValues<TFields>>) => {
      const resetValues = newValues
        ? { ...defaultValuesRef.current, ...newValues }
        : { ...defaultValuesRef.current };
      setValues(resetValues as FormInputValues<TFields>);
      setErrors({});
      setIsDirty(false);
      setIsValidating(false);
      setTouchedFields({});
      // Cancel all pending async operations
      for (const controller of abortControllersRef.current.values()) {
        controller.abort();
      }
      abortControllersRef.current.clear();
      for (const timer of debounceTimersRef.current.values()) {
        clearTimeout(timer);
      }
      debounceTimersRef.current.clear();
      validatingFieldsRef.current.clear();
    },
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const controller of abortControllersRef.current.values()) {
        controller.abort();
      }
      for (const timer of debounceTimersRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

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
    isValidating,
    touchedFields,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    validate,
    validateAsync,
    field,
    schema,
    mode,
    defaultValues: defaultValuesRef.current,
  };
}
