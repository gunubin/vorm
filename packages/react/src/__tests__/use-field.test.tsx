import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { vo, createField, createFormSchema } from '@gunubin/vorm-core';
import { useForm } from '../use-form.js';
import { useField } from '../use-field.js';

const EmailVO = vo('Email', [
  { code: 'INVALID_FORMAT', validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
]);

const emailFieldFactory = createField(EmailVO);

const schema = createFormSchema({
  fields: {
    email: emailFieldFactory({
      required: true,
      messages: { REQUIRED: 'Email is required', INVALID_FORMAT: 'Invalid email format' },
    }),
  },
});

describe('useField', () => {
  it('returns correct initial state', () => {
    const { result } = renderHook(() => {
      const form = useForm(schema, {
        defaultValues: { email: '' },
        mode: 'onBlur',
      });
      return useField(form, 'email');
    });

    expect(result.current.value).toBe('');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isTouched).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('onChange updates value and marks dirty', () => {
    const { result } = renderHook(() => {
      const form = useForm(schema, {
        defaultValues: { email: '' },
        mode: 'onBlur',
      });
      return useField(form, 'email');
    });

    act(() => {
      result.current.onChange('test@example.com');
    });

    expect(result.current.value).toBe('test@example.com');
    expect(result.current.isDirty).toBe(true);
  });

  it('onBlur marks touched and validates in onBlur mode', () => {
    const { result } = renderHook(() => {
      const form = useForm(schema, {
        defaultValues: { email: '' },
        mode: 'onBlur',
      });
      return useField(form, 'email');
    });

    act(() => {
      result.current.onBlur();
    });

    expect(result.current.isTouched).toBe(true);
    expect(result.current.error).toEqual({ code: 'REQUIRED', message: 'Email is required' });
  });

  it('error is null when validation passes', () => {
    const { result } = renderHook(() => {
      const form = useForm(schema, {
        defaultValues: { email: 'test@example.com' },
        mode: 'onBlur',
      });
      return useField(form, 'email');
    });

    act(() => {
      result.current.onBlur();
    });

    expect(result.current.error).toBeNull();
  });

  it('returns FieldError with code and message on validation failure', () => {
    const { result } = renderHook(() => {
      const form = useForm(schema, {
        defaultValues: { email: 'invalid' },
        mode: 'onBlur',
      });
      return useField(form, 'email');
    });

    act(() => {
      result.current.onBlur();
    });

    expect(result.current.error).toEqual({ code: 'INVALID_FORMAT', message: 'Invalid email format' });
  });
});
