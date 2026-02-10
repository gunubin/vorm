import { useRef, useCallback, useEffect, useSyncExternalStore } from 'react';
import type {
  FormSchema,
  FieldSchema,
  FormInputValues,
  FormOutputValues,
  FormErrors,
  FieldError,
} from '@vorm/core';
import type { FieldState } from './use-field.js';
import { validateField, validateForm, buildOutputValues } from '@vorm/core';
import { createFormStore } from './form-store.js';
import type { FormStore } from './form-store.js';

type ValidationMode = 'onChange' | 'onBlur' | 'onTouched' | 'onSubmit';

type AsyncTrigger = 'blur' | 'change' | 'submit';

export type AsyncFieldValidator<TInput> = {
  validate: (value: TInput) => Promise<FieldError | null>;
  on?: AsyncTrigger;
  debounceMs?: number;
};

export type AsyncValidators<TFields extends Record<string, FieldSchema<any, any, boolean, any>>> = {
  [K in string & keyof TFields]?: AsyncFieldValidator<
    TFields[K] extends FieldSchema<infer TInput, any, any, any> ? TInput : never
  >;
};

type UseFormOptions<TFields extends Record<string, FieldSchema<any, any, boolean, any>>> = {
  defaultValues: FormInputValues<TFields>;
  mode?: ValidationMode;
  asyncValidators?: AsyncValidators<TFields>;
};

export type FormState<TFields extends Record<string, FieldSchema<any, any, boolean, any>>> = {
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
  ) => FieldState<TFields[TName] extends FieldSchema<infer TInput, any, any, any> ? TInput : never>;
  schema: FormSchema<TFields>;
  mode: ValidationMode;
  defaultValues: FormInputValues<TFields>;
  /** @internal */
  __store: FormStore<TFields>;
};

export function useForm<TFields extends Record<string, FieldSchema<any, any, boolean, any>>>(
  schema: FormSchema<TFields>,
  options: UseFormOptions<TFields>,
): FormState<TFields> {
  const { defaultValues, mode = 'onSubmit', asyncValidators } = options;

  const storeRef = useRef<FormStore<TFields>>(null!);
  if (storeRef.current === null) {
    storeRef.current = createFormStore<TFields>({
      values: { ...defaultValues },
      errors: {},
      isDirty: false,
      isSubmitting: false,
      isValidating: false,
      touchedFields: {},
    });
  }
  const store = storeRef.current;

  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  const defaultValuesRef = useRef(defaultValues);
  const asyncValidatorsRef = useRef(asyncValidators);
  asyncValidatorsRef.current = asyncValidators;
  const validatingFieldsRef = useRef(new Set<string>());
  const abortControllersRef = useRef(new Map<string, AbortController>());
  const debounceTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const isValid = Object.keys(state.errors).length === 0;

  const runAsyncValidation = useCallback(
    async (name: string, value: any): Promise<FieldError | null> => {
      const asyncValidator = asyncValidatorsRef.current?.[name];
      if (!asyncValidator) return null;

      const prevController = abortControllersRef.current.get(name);
      if (prevController) prevController.abort();

      const controller = new AbortController();
      abortControllersRef.current.set(name, controller);

      validatingFieldsRef.current.add(name);
      store.setIsValidating(true);

      try {
        const error = await asyncValidator.validate(value);
        if (controller.signal.aborted) return null;

        if (error) {
          store.setFieldError(name, error);
        } else {
          store.clearFieldError(name);
        }
        return error;
      } finally {
        if (!controller.signal.aborted) {
          validatingFieldsRef.current.delete(name);
          abortControllersRef.current.delete(name);
          if (validatingFieldsRef.current.size === 0) {
            store.setIsValidating(false);
          }
        }
      }
    },
    [store],
  );

  const scheduleAsyncValidation = useCallback(
    (name: string, value: any, trigger: AsyncTrigger) => {
      const asyncValidator = asyncValidatorsRef.current?.[name];
      if (!asyncValidator) return;

      const on = asyncValidator.on ?? 'blur';
      if (on !== trigger) return;

      const fieldSchema = schema.fields[name];
      if (fieldSchema) {
        const formMessages = schema.messages?.[name];
        const syncError = validateField(value, fieldSchema, formMessages);
        if (syncError) return;
      }

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
      if (error) {
        store.setFieldError(name, error);
      } else {
        store.clearFieldError(name);
      }
      if (!error && trigger) {
        scheduleAsyncValidation(name, value, trigger);
      }
    },
    [schema, store, scheduleAsyncValidation],
  );

  const setFieldValue = useCallback(
    (name: string, value: any) => {
      store.setFieldValue(name, value);
      if (mode === 'onChange') {
        validateSingleField(name, value, 'change');
      } else if (mode === 'onTouched' && store.getState().touchedFields[name]) {
        validateSingleField(name, value, 'change');
      }
    },
    [mode, store, validateSingleField],
  );

  const setFieldTouched = useCallback(
    (name: string) => {
      store.setFieldTouched(name);
      if (mode === 'onBlur' || mode === 'onTouched') {
        const currentValue = (store.getState().values as Record<string, unknown>)[name];
        validateSingleField(name, currentValue, 'blur');
      } else {
        const currentValue = (store.getState().values as Record<string, unknown>)[name];
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
    [mode, schema, store, validateSingleField, scheduleAsyncValidation],
  );

  const setFieldError = useCallback(
    (name: string, error: FieldError) => {
      store.setFieldError(name, error);
    },
    [store],
  );

  const clearFieldError = useCallback(
    (name?: string) => {
      store.clearFieldError(name);
    },
    [store],
  );

  const validate = useCallback(
    (name?: string): boolean => {
      const currentValues = store.getState().values;
      if (name) {
        const fieldSchema = schema.fields[name];
        if (!fieldSchema) return true;
        const formMessages = schema.messages?.[name];
        const error = validateField(
          (currentValues as Record<string, unknown>)[name],
          fieldSchema,
          formMessages,
        );
        if (error) {
          store.setFieldError(name, error);
        } else {
          store.clearFieldError(name);
        }
        return !error;
      }
      const formErrors = validateForm(currentValues, schema);
      store.setErrors(formErrors);
      return Object.keys(formErrors).length === 0;
    },
    [schema, store],
  );

  const validateAsync = useCallback(
    async (name?: string): Promise<boolean> => {
      const currentValues = store.getState().values;
      if (name) {
        const fieldSchema = schema.fields[name];
        if (!fieldSchema) return true;
        const formMessages = schema.messages?.[name];
        const syncError = validateField(
          (currentValues as Record<string, unknown>)[name],
          fieldSchema,
          formMessages,
        );
        if (syncError) {
          store.setFieldError(name, syncError);
        } else {
          store.clearFieldError(name);
        }
        if (syncError) return false;

        const asyncError = await runAsyncValidation(name, (currentValues as Record<string, unknown>)[name]);
        return !asyncError;
      }

      const formErrors = validateForm(currentValues, schema);
      store.setErrors(formErrors);
      if (Object.keys(formErrors).length > 0) return false;

      const asyncEntries = Object.entries(asyncValidatorsRef.current ?? {});
      if (asyncEntries.length === 0) return true;

      const asyncResults = await Promise.all(
        asyncEntries.map(async ([fieldName]) => {
          const value = (currentValues as Record<string, unknown>)[fieldName];
          return runAsyncValidation(fieldName, value);
        }),
      );
      return asyncResults.every((error) => error === null);
    },
    [schema, store, runAsyncValidation],
  );

  const handleSubmit = useCallback(
    (handler: (values: FormOutputValues<TFields>) => void | Promise<void>) => {
      return async (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();
        const currentValues = store.getState().values;
        const formErrors = validateForm(currentValues, schema);
        store.setErrors(formErrors);

        if (Object.keys(formErrors).length > 0) {
          return;
        }

        const asyncEntries = Object.entries(asyncValidatorsRef.current ?? {});
        if (asyncEntries.length > 0) {
          const asyncResults = await Promise.all(
            asyncEntries.map(async ([fieldName]) => {
              const value = (currentValues as Record<string, unknown>)[fieldName];
              const fieldSchema = schema.fields[fieldName];
              if (fieldSchema) {
                const formMessages = schema.messages?.[fieldName];
                const syncError = validateField(value, fieldSchema, formMessages);
                if (syncError) return null;
              }
              return runAsyncValidation(fieldName, value);
            }),
          );
          const hasAsyncErrors = asyncResults.some((error) => error !== null);
          if (hasAsyncErrors) return;
        }

        store.setIsSubmitting(true);
        try {
          const outputValues = buildOutputValues(
            currentValues as Record<string, unknown>,
            schema.fields,
          );
          await handler(outputValues as FormOutputValues<TFields>);
        } finally {
          store.setIsSubmitting(false);
        }
      };
    },
    [schema, store, runAsyncValidation],
  );

  const reset = useCallback(
    (newValues?: Partial<FormInputValues<TFields>>) => {
      const resetValues = newValues
        ? { ...defaultValuesRef.current, ...newValues }
        : { ...defaultValuesRef.current };
      store.reset(resetValues as FormInputValues<TFields>);
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
    [store],
  );

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
    type TValue = TFields[TName] extends FieldSchema<infer T, any, any, any> ? T : never;
    const value = (state.values as Record<string, unknown>)[name as string] as TValue;
    const error = state.errors[name as string] ?? null;
    const fieldIsDirty = value !== (defaultValuesRef.current as Record<string, unknown>)[name as string];
    const isTouched = state.touchedFields[name as string] ?? false;

    const fieldSchema = schema.fields[name] as FieldSchema<TValue, any, boolean, any>;
    const formatFn = fieldSchema?.format;
    const parseFn = fieldSchema?.parse;
    const formattedValue = formatFn ? formatFn(value) : String(value ?? '');

    return {
      value,
      formattedValue,
      error,
      isDirty: fieldIsDirty,
      isTouched,
      onChange: (raw: string) => {
        const parsed = parseFn ? parseFn(raw) : raw;
        setFieldValue(name as string, parsed);
      },
      onBlur: () => { setFieldTouched(name as string); },
    };
  };

  return {
    values: state.values,
    errors: state.errors,
    isValid,
    isDirty: state.isDirty,
    isSubmitting: state.isSubmitting,
    isValidating: state.isValidating,
    touchedFields: state.touchedFields,
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
    __store: store,
  };
}
