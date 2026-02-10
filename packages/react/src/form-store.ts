import type {
  FieldSchema,
  FormInputValues,
  FormErrors,
  FieldError,
} from '@vorm/core';

export type FormStoreState<TFields extends Record<string, FieldSchema<any, any, boolean, any>>> = {
  values: FormInputValues<TFields>;
  errors: FormErrors;
  isDirty: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  touchedFields: Record<string, boolean>;
};

export type FieldSnapshot = {
  value: unknown;
  error: FieldError | null;
  isTouched: boolean;
};

type Listener = () => void;

export type FormStore<TFields extends Record<string, FieldSchema<any, any, boolean, any>>> = {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => FormStoreState<TFields>;
  subscribeField: (name: string, listener: Listener) => () => void;
  getFieldSnapshot: (name: string) => FieldSnapshot;
  getState: () => FormStoreState<TFields>;
  setFieldValue: (name: string, value: any) => void;
  setFieldTouched: (name: string) => void;
  setFieldError: (name: string, error: FieldError) => void;
  clearFieldError: (name?: string) => void;
  setErrors: (errors: FormErrors) => void;
  setIsSubmitting: (value: boolean) => void;
  setIsValidating: (value: boolean) => void;
  reset: (values: FormInputValues<TFields>) => void;
};

export function createFormStore<TFields extends Record<string, FieldSchema<any, any, boolean, any>>>(
  initialState: FormStoreState<TFields>,
): FormStore<TFields> {
  let state = initialState;
  let snapshot = state;
  const listeners = new Set<Listener>();
  const fieldListeners = new Map<string, Set<Listener>>();
  const fieldSnapshotCache = new Map<string, FieldSnapshot>();

  function emit(changedFields?: string[]) {
    snapshot = { ...state };
    for (const listener of listeners) {
      listener();
    }
    if (changedFields) {
      for (const name of changedFields) {
        fieldSnapshotCache.delete(name);
        const set = fieldListeners.get(name);
        if (set) {
          for (const listener of set) {
            listener();
          }
        }
      }
    } else {
      fieldSnapshotCache.clear();
      for (const [, set] of fieldListeners) {
        for (const listener of set) {
          listener();
        }
      }
    }
  }

  return {
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },

    getSnapshot() {
      return snapshot;
    },

    subscribeField(name: string, listener: Listener) {
      if (!fieldListeners.has(name)) {
        fieldListeners.set(name, new Set());
      }
      fieldListeners.get(name)!.add(listener);
      return () => { fieldListeners.get(name)!.delete(listener); };
    },

    getFieldSnapshot(name: string): FieldSnapshot {
      const cached = fieldSnapshotCache.get(name);
      if (cached) return cached;
      const snap: FieldSnapshot = {
        value: (state.values as Record<string, unknown>)[name],
        error: state.errors[name] ?? null,
        isTouched: state.touchedFields[name] ?? false,
      };
      fieldSnapshotCache.set(name, snap);
      return snap;
    },

    getState() {
      return state;
    },

    setFieldValue(name: string, value: any) {
      state = {
        ...state,
        values: { ...state.values, [name]: value } as FormInputValues<TFields>,
        isDirty: true,
      };
      emit([name]);
    },

    setFieldTouched(name: string) {
      state = {
        ...state,
        touchedFields: { ...state.touchedFields, [name]: true },
      };
      emit([name]);
    },

    setFieldError(name: string, error: FieldError) {
      state = {
        ...state,
        errors: { ...state.errors, [name]: error },
      };
      emit([name]);
    },

    clearFieldError(name?: string) {
      if (name) {
        const next = { ...state.errors };
        delete next[name];
        state = { ...state, errors: next };
        emit([name]);
      } else {
        state = { ...state, errors: {} };
        emit();
      }
    },

    setErrors(errors: FormErrors) {
      state = { ...state, errors };
      emit();
    },

    setIsSubmitting(value: boolean) {
      state = { ...state, isSubmitting: value };
      emit();
    },

    setIsValidating(value: boolean) {
      state = { ...state, isValidating: value };
      emit();
    },

    reset(values: FormInputValues<TFields>) {
      state = {
        values,
        errors: {},
        isDirty: false,
        isSubmitting: false,
        isValidating: false,
        touchedFields: {},
      };
      emit();
    },
  };
}
