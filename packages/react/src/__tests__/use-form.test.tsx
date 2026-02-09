import { describe, it, expect, vi } from 'vitest';
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
});
