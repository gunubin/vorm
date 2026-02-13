import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { vo } from '@gunubin/vorm-core';
import { createField, createFormSchema } from '@gunubin/vorm-form';
import { useForm } from '../use-form.js';
import { useField } from '../use-field.js';

const EmailVO = vo('Email', [
  { code: 'INVALID_FORMAT', validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
]);

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
]);

const emailFieldFactory = createField(EmailVO);
const passwordFieldFactory = createField(PasswordVO);

const loginSchema = createFormSchema({
  fields: {
    email: emailFieldFactory({
      required: true,
      messages: { REQUIRED: 'Email is required', INVALID_FORMAT: 'Invalid email format' },
    }),
    password: passwordFieldFactory({
      required: true,
      messages: { REQUIRED: 'Password is required', TOO_SHORT: 'Must be at least 8 characters' },
    }),
  },
});

describe('login form integration', () => {
  it('full flow: input -> validation -> fix -> submit', async () => {
    const onSubmit = vi.fn();

    const { result } = renderHook(() => {
      const form = useForm(loginSchema, {
        defaultValues: { email: '', password: '' },
        mode: 'onBlur',
      });
      const email = useField(form, 'email');
      const password = useField(form, 'password');
      return { form, email, password };
    });

    // initial state: no errors
    expect(result.current.email.error).toBeNull();
    expect(result.current.password.error).toBeNull();

    // type invalid email
    act(() => {
      result.current.email.onChange('invalid');
    });

    // blur triggers validation
    act(() => {
      result.current.email.onBlur();
    });
    expect(result.current.email.error).toEqual({
      code: 'INVALID_FORMAT',
      message: 'Invalid email format',
    });

    // fix email
    act(() => {
      result.current.email.onChange('test@example.com');
    });
    act(() => {
      result.current.email.onBlur();
    });
    expect(result.current.email.error).toBeNull();

    // type password
    act(() => {
      result.current.password.onChange('Password1');
    });
    act(() => {
      result.current.password.onBlur();
    });
    expect(result.current.password.error).toBeNull();

    // submit
    await act(async () => {
      await result.current.form.handleSubmit(onSubmit)();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password1',
    });
  });

  it('error display -> fix -> error cleared (onChange mode)', () => {
    const { result } = renderHook(() => {
      const form = useForm(loginSchema, {
        defaultValues: { email: '', password: '' },
        mode: 'onChange',
      });
      const email = useField(form, 'email');
      return { form, email };
    });

    // type invalid value
    act(() => {
      result.current.email.onChange('bad');
    });
    expect(result.current.email.error).toEqual({
      code: 'INVALID_FORMAT',
      message: 'Invalid email format',
    });

    // fix value
    act(() => {
      result.current.email.onChange('test@example.com');
    });
    expect(result.current.email.error).toBeNull();
  });
});
