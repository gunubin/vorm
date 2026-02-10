import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { vo, createField, createFormSchema } from '@gunubin/vorm-core';
import { useVorm } from '../use-vorm-form.js';

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
      messages: { REQUIRED: 'Email is required', INVALID_FORMAT: 'Invalid email' },
    }),
    password: passwordField({
      required: true,
      messages: { REQUIRED: 'Password is required', TOO_SHORT: 'Min 8 chars' },
    }),
  },
});

describe('useVorm', () => {
  it('can use standard RHF API as-is', () => {
    const { result } = renderHook(() =>
      useVorm(loginSchema, {
        defaultValues: { email: '', password: '' },
      }),
    );

    expect(result.current.register).toBeDefined();
    expect(result.current.handleSubmit).toBeDefined();
    expect(result.current.formState).toBeDefined();
    expect(result.current.watch).toBeDefined();
    expect(result.current.setValue).toBeDefined();
    expect(result.current.getValues).toBeDefined();
    expect(result.current.reset).toBeDefined();
    expect(result.current.trigger).toBeDefined();
  });

  it('returns Branded Type values on submit', async () => {
    const onSubmit = vi.fn();

    const { result } = renderHook(() =>
      useVorm(loginSchema, {
        defaultValues: { email: '', password: '' },
      }),
    );

    act(() => {
      result.current.setValue('email', 'test@example.com');
      result.current.setValue('password', 'Password1');
    });

    await act(async () => {
      await result.current.handleSubmit(onSubmit)();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual({
      email: 'test@example.com',
      password: 'Password1',
    });
  });

  it('does not submit on validation error', async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => {
      const form = useVorm(loginSchema, {
        defaultValues: { email: '', password: '' },
      });
      // read formState.errors during render to enable RHF subscription
      const errors = form.formState.errors;
      return { ...form, errors };
    });

    await act(async () => {
      await result.current.handleSubmit(onSubmit, onError)();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);

    const errorArg = onError.mock.calls[0][0];
    expect(errorArg.email).toBeDefined();
    expect(errorArg.password).toBeDefined();
  });

  it('can use RHF ref-based control with register', () => {
    const { result } = renderHook(() =>
      useVorm(loginSchema, {
        defaultValues: { email: '', password: '' },
      }),
    );

    const emailProps = result.current.register('email');
    expect(emailProps.name).toBe('email');
    expect(emailProps.onChange).toBeDefined();
    expect(emailProps.onBlur).toBeDefined();
    expect(emailProps.ref).toBeDefined();
  });
});
