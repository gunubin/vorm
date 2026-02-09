import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { vo, createField, createFormSchema } from '@vorm/core';
import { useForm } from '../use-form.js';

const EmailVO = vo('Email', [
  { code: 'INVALID_FORMAT', validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
]);

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
]);

const emailField = createField(EmailVO);
const passwordField = createField(PasswordVO);

const loginSchema = createFormSchema({
  fields: {
    email: emailField({
      required: true,
      messages: { REQUIRED: 'Email is required', INVALID_FORMAT: 'Invalid email format' },
    }),
    password: passwordField({
      required: true,
      messages: { REQUIRED: 'Password is required', TOO_SHORT: 'Must be at least 8 characters' },
    }),
  },
});

describe('useForm', () => {
  describe('initialization', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      expect(result.current.values).toEqual({ email: '', password: '' });
      expect(result.current.isValid).toBe(true);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.errors).toEqual({});
      expect(result.current.touchedFields).toEqual({});
    });

    it('defaults mode to onSubmit', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      expect(result.current.mode).toBe('onSubmit');
    });
  });

  describe('handleSubmit', () => {
    it('calls handler with values when validation passes', async () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
        }),
      );

      await act(async () => {
        await result.current.handleSubmit(handler)();
      });

      expect(handler).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password1',
      });
    });

    it('skips handler and sets errors when validation fails', async () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      await act(async () => {
        await result.current.handleSubmit(handler)();
      });

      expect(handler).not.toHaveBeenCalled();
      expect(result.current.errors.email).toEqual({
        code: 'REQUIRED',
        message: 'Email is required',
      });
      expect(result.current.errors.password).toEqual({
        code: 'REQUIRED',
        message: 'Password is required',
      });
    });

    it('calls preventDefault on the event', async () => {
      const preventDefault = vi.fn();
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
        }),
      );

      await act(async () => {
        await result.current.handleSubmit(() => {})({ preventDefault });
      });

      expect(preventDefault).toHaveBeenCalled();
    });

    it('sets isSubmitting to true during async submission', async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
        }),
      );

      let submitDone: Promise<void>;
      act(() => {
        submitDone = result.current.handleSubmit(async () => {
          await submitPromise;
        })() as Promise<void>;
      });

      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        resolveSubmit!();
        await submitDone;
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('resets isSubmitting even when handler throws', async () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
        }),
      );

      await act(async () => {
        try {
          await result.current.handleSubmit(() => {
            throw new Error('submit error');
          })();
        } catch {
          // expected
        }
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('reset', () => {
    it('restores defaultValues and clears errors', async () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      await act(async () => {
        await result.current.handleSubmit(() => {})();
      });
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual({ email: '', password: '' });
      expect(result.current.errors).toEqual({});
      expect(result.current.isDirty).toBe(false);
      expect(result.current.touchedFields).toEqual({});
    });

    it('accepts partial values to override defaults', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      act(() => {
        result.current.reset({ email: 'new@example.com' });
      });

      expect(result.current.values).toEqual({ email: 'new@example.com', password: '' });
    });
  });

  describe('validation mode', () => {
    it('mode: onBlur validates on blur', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onBlur',
        }),
      );

      act(() => {
        result.current.setFieldTouched('email');
      });

      expect(result.current.errors.email).toBeDefined();
    });

    it('mode: onChange validates on value change', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onChange',
        }),
      );

      act(() => {
        result.current.setFieldValue('email', 'invalid');
      });

      expect(result.current.errors.email).toBeDefined();
    });

    it('mode: onSubmit does not validate on change or blur', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onSubmit',
        }),
      );

      act(() => {
        result.current.setFieldValue('email', 'invalid');
        result.current.setFieldTouched('email');
      });

      expect(result.current.errors).toEqual({});
    });

    it('mode: onTouched validates on first blur', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onTouched',
        }),
      );

      // Before blur: no errors
      act(() => {
        result.current.setFieldValue('email', 'invalid');
      });
      expect(result.current.errors).toEqual({});

      // On blur: validates
      act(() => {
        result.current.setFieldTouched('email');
      });
      expect(result.current.errors.email).toEqual({
        code: 'INVALID_FORMAT',
        message: 'Invalid email format',
      });
    });

    it('mode: onTouched revalidates on change after touched', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onTouched',
        }),
      );

      // Touch the field first
      act(() => {
        result.current.setFieldTouched('email');
      });
      expect(result.current.errors.email).toBeDefined();

      // Now change: should revalidate
      act(() => {
        result.current.setFieldValue('email', 'test@example.com');
      });
      expect(result.current.errors.email).toBeUndefined();

      // Invalid change: should show error again
      act(() => {
        result.current.setFieldValue('email', 'invalid');
      });
      expect(result.current.errors.email).toBeDefined();
    });

    it('mode: onTouched does not revalidate untouched fields on change', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onTouched',
        }),
      );

      // Change without touching: no validation
      act(() => {
        result.current.setFieldValue('email', 'invalid');
      });
      expect(result.current.errors).toEqual({});

      act(() => {
        result.current.setFieldValue('email', '');
      });
      expect(result.current.errors).toEqual({});
    });
  });

  describe('setFieldError', () => {
    it('sets a custom error on a field', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      act(() => {
        result.current.setFieldError('email', { code: 'SERVER', message: 'Email already taken' });
      });

      expect(result.current.errors.email).toEqual({ code: 'SERVER', message: 'Email already taken' });
      expect(result.current.isValid).toBe(false);
    });

    it('overwrites existing validation error', async () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      await act(async () => {
        await result.current.handleSubmit(() => {})();
      });
      expect(result.current.errors.email?.code).toBe('REQUIRED');

      act(() => {
        result.current.setFieldError('email', { code: 'SERVER', message: 'Server error' });
      });

      expect(result.current.errors.email).toEqual({ code: 'SERVER', message: 'Server error' });
    });
  });

  describe('clearFieldError', () => {
    it('clears error on a specific field', async () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      await act(async () => {
        await result.current.handleSubmit(() => {})();
      });
      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.password).toBeDefined();

      act(() => {
        result.current.clearFieldError('email');
      });

      expect(result.current.errors.email).toBeUndefined();
      expect(result.current.errors.password).toBeDefined();
    });

    it('clears all errors when called without arguments', async () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      await act(async () => {
        await result.current.handleSubmit(() => {})();
      });
      expect(Object.keys(result.current.errors).length).toBe(2);

      act(() => {
        result.current.clearFieldError();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('validate', () => {
    it('validates a single field and returns true when valid', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: '' },
        }),
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate('email');
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors.email).toBeUndefined();
    });

    it('validates a single field and returns false when invalid', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'invalid', password: '' },
        }),
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate('email');
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.email).toEqual({
        code: 'INVALID_FORMAT',
        message: 'Invalid email format',
      });
    });

    it('validates all fields when called without arguments', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.password).toBeDefined();
    });

    it('validates all fields and returns true when all valid', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
        }),
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('clears previous error when field becomes valid', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'invalid', password: 'Password1' },
        }),
      );

      act(() => {
        result.current.validate('email');
      });
      expect(result.current.errors.email).toBeDefined();

      act(() => {
        result.current.setFieldValue('email', 'test@example.com');
      });

      act(() => {
        result.current.validate('email');
      });
      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('field()', () => {
    it('returns FieldState with current values', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
        }),
      );

      const email = result.current.field('email');
      expect(email.value).toBe('test@example.com');
      expect(email.error).toBeNull();
      expect(email.isDirty).toBe(false);
      expect(email.isTouched).toBe(false);
    });

    it('onChange updates the field value and marks dirty', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      act(() => {
        result.current.field('email').onChange('new@example.com');
      });

      expect(result.current.values.email).toBe('new@example.com');
      expect(result.current.field('email').value).toBe('new@example.com');
      expect(result.current.field('email').isDirty).toBe(true);
    });

    it('onBlur marks touched and triggers onBlur validation', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onBlur',
        }),
      );

      act(() => {
        result.current.field('email').onBlur();
      });

      expect(result.current.field('email').isTouched).toBe(true);
      expect(result.current.field('email').error).toEqual({
        code: 'REQUIRED',
        message: 'Email is required',
      });
    });

    it('onChange triggers validation in onChange mode', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onChange',
        }),
      );

      act(() => {
        result.current.field('email').onChange('invalid');
      });

      expect(result.current.field('email').error).toEqual({
        code: 'INVALID_FORMAT',
        message: 'Invalid email format',
      });
    });

    it('reflects errors after failed submit', async () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      await act(async () => {
        await result.current.handleSubmit(() => {})();
      });

      expect(result.current.field('email').error).toEqual({
        code: 'REQUIRED',
        message: 'Email is required',
      });
      expect(result.current.field('password').error).toEqual({
        code: 'REQUIRED',
        message: 'Password is required',
      });
    });

    it('resets field state after form.reset()', async () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onBlur',
        }),
      );

      act(() => {
        result.current.field('email').onChange('test@example.com');
        result.current.field('email').onBlur();
      });

      expect(result.current.field('email').isDirty).toBe(true);
      expect(result.current.field('email').isTouched).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.field('email').value).toBe('');
      expect(result.current.field('email').isDirty).toBe(false);
      expect(result.current.field('email').isTouched).toBe(false);
      expect(result.current.field('email').error).toBeNull();
    });
  });

  describe('async validation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('initializes isValidating as false', () => {
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
        }),
      );

      expect(result.current.isValidating).toBe(false);
    });

    it('skips async when sync validation fails', async () => {
      const asyncValidate = vi.fn().mockResolvedValue(null);
      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onBlur',
          asyncValidators: {
            email: { validate: asyncValidate, on: 'blur' },
          },
        }),
      );

      await act(async () => {
        result.current.setFieldTouched('email');
      });

      expect(asyncValidate).not.toHaveBeenCalled();
      expect(result.current.errors.email).toBeDefined();
    });

    it('runs async on blur when on=blur (default)', async () => {
      const asyncValidate = vi.fn().mockResolvedValue({
        code: 'TAKEN',
        message: 'Email already taken',
      });

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
          mode: 'onBlur',
          asyncValidators: {
            email: { validate: asyncValidate },
          },
        }),
      );

      await act(async () => {
        result.current.setFieldTouched('email');
      });

      expect(asyncValidate).toHaveBeenCalledWith('test@example.com');
      expect(result.current.errors.email).toEqual({
        code: 'TAKEN',
        message: 'Email already taken',
      });
    });

    it('clears async error when validation succeeds', async () => {
      const asyncValidate = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
          mode: 'onBlur',
          asyncValidators: {
            email: { validate: asyncValidate, on: 'blur' },
          },
        }),
      );

      // First set a manual error
      act(() => {
        result.current.setFieldError('email', { code: 'TAKEN', message: 'taken' });
      });
      expect(result.current.errors.email).toBeDefined();

      // Then blur triggers async that returns null
      await act(async () => {
        result.current.setFieldTouched('email');
      });

      expect(result.current.errors.email).toBeUndefined();
    });

    it('on: change triggers async on value change', async () => {
      const asyncValidate = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onChange',
          asyncValidators: {
            email: { validate: asyncValidate, on: 'change' },
          },
        }),
      );

      await act(async () => {
        result.current.setFieldValue('email', 'test@example.com');
      });

      expect(asyncValidate).toHaveBeenCalledWith('test@example.com');
    });

    it('on: blur does not trigger on change', async () => {
      const asyncValidate = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onChange',
          asyncValidators: {
            email: { validate: asyncValidate, on: 'blur' },
          },
        }),
      );

      await act(async () => {
        result.current.setFieldValue('email', 'test@example.com');
      });

      expect(asyncValidate).not.toHaveBeenCalled();
    });

    it('debounce delays async on change', async () => {
      const asyncValidate = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onChange',
          asyncValidators: {
            email: { validate: asyncValidate, on: 'change', debounceMs: 300 },
          },
        }),
      );

      act(() => {
        result.current.setFieldValue('email', 'test@example.com');
      });

      // Not called yet (debounced)
      expect(asyncValidate).not.toHaveBeenCalled();

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(asyncValidate).toHaveBeenCalledWith('test@example.com');
    });

    it('rapid input cancels previous async (debounce)', async () => {
      const asyncValidate = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          mode: 'onChange',
          asyncValidators: {
            email: { validate: asyncValidate, on: 'change', debounceMs: 300 },
          },
        }),
      );

      act(() => {
        result.current.setFieldValue('email', 'a@b.com');
      });

      vi.advanceTimersByTime(100);

      act(() => {
        result.current.setFieldValue('email', 'test@example.com');
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Only called once with the latest value
      expect(asyncValidate).toHaveBeenCalledTimes(1);
      expect(asyncValidate).toHaveBeenCalledWith('test@example.com');
    });

    it('isValidating is true during async, false after', async () => {
      let resolveAsync: (v: null) => void;
      const asyncPromise = new Promise<null>((resolve) => {
        resolveAsync = resolve;
      });
      const asyncValidate = vi.fn().mockReturnValue(asyncPromise);

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
          mode: 'onBlur',
          asyncValidators: {
            email: { validate: asyncValidate, on: 'blur' },
          },
        }),
      );

      act(() => {
        result.current.setFieldTouched('email');
        // The async is now pending
      });

      expect(result.current.isValidating).toBe(true);

      await act(async () => {
        resolveAsync!(null);
      });

      expect(result.current.isValidating).toBe(false);
    });

    it('handleSubmit runs async validators before calling handler', async () => {
      const asyncValidate = vi.fn().mockResolvedValue({
        code: 'TAKEN',
        message: 'Email already taken',
      });
      const handler = vi.fn();

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
          asyncValidators: {
            email: { validate: asyncValidate, on: 'submit' },
          },
        }),
      );

      await act(async () => {
        await result.current.handleSubmit(handler)();
      });

      expect(asyncValidate).toHaveBeenCalledWith('test@example.com');
      expect(handler).not.toHaveBeenCalled();
      expect(result.current.errors.email).toEqual({
        code: 'TAKEN',
        message: 'Email already taken',
      });
    });

    it('handleSubmit calls handler when async passes', async () => {
      const asyncValidate = vi.fn().mockResolvedValue(null);
      const handler = vi.fn();

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
          asyncValidators: {
            email: { validate: asyncValidate, on: 'blur' },
          },
        }),
      );

      await act(async () => {
        await result.current.handleSubmit(handler)();
      });

      expect(asyncValidate).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password1',
      });
    });

    it('handleSubmit skips async when sync fails', async () => {
      const asyncValidate = vi.fn().mockResolvedValue(null);
      const handler = vi.fn();

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: '', password: '' },
          asyncValidators: {
            email: { validate: asyncValidate, on: 'blur' },
          },
        }),
      );

      await act(async () => {
        await result.current.handleSubmit(handler)();
      });

      expect(asyncValidate).not.toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
    });

    it('validateAsync single field returns true on success', async () => {
      const asyncValidate = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
          asyncValidators: {
            email: { validate: asyncValidate },
          },
        }),
      );

      let isValid: boolean;
      await act(async () => {
        isValid = await result.current.validateAsync('email');
      });

      expect(isValid!).toBe(true);
      expect(asyncValidate).toHaveBeenCalledWith('test@example.com');
    });

    it('validateAsync single field returns false on async error', async () => {
      const asyncValidate = vi.fn().mockResolvedValue({
        code: 'TAKEN',
        message: 'Already taken',
      });

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
          asyncValidators: {
            email: { validate: asyncValidate },
          },
        }),
      );

      let isValid: boolean;
      await act(async () => {
        isValid = await result.current.validateAsync('email');
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.email).toEqual({
        code: 'TAKEN',
        message: 'Already taken',
      });
    });

    it('validateAsync single field returns false on sync error (skips async)', async () => {
      const asyncValidate = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'invalid', password: 'Password1' },
          asyncValidators: {
            email: { validate: asyncValidate },
          },
        }),
      );

      let isValid: boolean;
      await act(async () => {
        isValid = await result.current.validateAsync('email');
      });

      expect(isValid!).toBe(false);
      expect(asyncValidate).not.toHaveBeenCalled();
    });

    it('validateAsync all fields', async () => {
      const emailAsync = vi.fn().mockResolvedValue(null);
      const passwordAsync = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
          asyncValidators: {
            email: { validate: emailAsync },
            password: { validate: passwordAsync },
          },
        }),
      );

      let isValid: boolean;
      await act(async () => {
        isValid = await result.current.validateAsync();
      });

      expect(isValid!).toBe(true);
      expect(emailAsync).toHaveBeenCalled();
      expect(passwordAsync).toHaveBeenCalled();
    });

    it('reset cancels pending async validations', async () => {
      let resolveAsync: (v: null) => void;
      const asyncPromise = new Promise<null>((resolve) => {
        resolveAsync = resolve;
      });
      const asyncValidate = vi.fn().mockReturnValue(asyncPromise);

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
          mode: 'onBlur',
          asyncValidators: {
            email: { validate: asyncValidate, on: 'blur' },
          },
        }),
      );

      act(() => {
        result.current.setFieldTouched('email');
      });

      expect(result.current.isValidating).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isValidating).toBe(false);
      expect(result.current.errors).toEqual({});

      // Resolving after reset should not set errors
      await act(async () => {
        resolveAsync!(null);
      });

      expect(result.current.errors).toEqual({});
    });

    it('blur triggers async even without onBlur mode', async () => {
      const asyncValidate = vi.fn().mockResolvedValue({
        code: 'TAKEN',
        message: 'taken',
      });

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
          mode: 'onSubmit',
          asyncValidators: {
            email: { validate: asyncValidate, on: 'blur' },
          },
        }),
      );

      await act(async () => {
        result.current.setFieldTouched('email');
      });

      expect(asyncValidate).toHaveBeenCalledWith('test@example.com');
      expect(result.current.errors.email).toEqual({
        code: 'TAKEN',
        message: 'taken',
      });
    });

    it('concurrent async: later call aborts earlier one', async () => {
      let callCount = 0;
      const asyncValidate = vi.fn().mockImplementation(async () => {
        callCount++;
        const myCall = callCount;
        await new Promise((r) => setTimeout(r, 100));
        if (myCall === 1) {
          return { code: 'FIRST', message: 'first' };
        }
        return null;
      });

      const { result } = renderHook(() =>
        useForm(loginSchema, {
          defaultValues: { email: 'test@example.com', password: 'Password1' },
          mode: 'onBlur',
          asyncValidators: {
            email: { validate: asyncValidate, on: 'blur' },
          },
        }),
      );

      // First blur
      act(() => {
        result.current.setFieldTouched('email');
      });

      // Second blur immediately (should abort first)
      act(() => {
        result.current.setFieldTouched('email');
      });

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // The second call returned null, so no error
      expect(result.current.errors.email).toBeUndefined();
    });
  });
});
