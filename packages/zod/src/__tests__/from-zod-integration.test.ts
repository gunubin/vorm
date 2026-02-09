import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { vo, createField, createFormSchema, validateForm } from '@vorm/core';
import { fromZod } from '../from-zod.js';

describe('fromZod 統合テスト', () => {
  it('fromZod → vo → createField → createFormSchema の一連のフロー', () => {
    const PasswordVO = vo('Password', fromZod(z.string().min(8, 'TOO_SHORT').regex(/[A-Z]/, 'NO_UPPERCASE')));

    const EmailVO = vo('Email', fromZod(z.string().email('INVALID_FORMAT')));

    const passwordField = createField(PasswordVO);
    const emailField = createField(EmailVO);

    const schema = createFormSchema({
      fields: {
        email: emailField({
          required: true,
          messages: {
            REQUIRED: 'メール必須',
            INVALID_FORMAT: 'メール形式不正',
          },
        }),
        password: passwordField({
          required: true,
          messages: {
            REQUIRED: 'パスワード必須',
            TOO_SHORT: '8文字以上',
            NO_UPPERCASE: '大文字必須',
          },
        }),
      },
    });

    // 全空
    const errors1 = validateForm({ email: '', password: '' }, schema);
    expect(errors1.email).toEqual({ code: 'REQUIRED', message: 'メール必須' });
    expect(errors1.password).toEqual({ code: 'REQUIRED', message: 'パスワード必須' });

    // 形式不正
    const errors2 = validateForm({ email: 'invalid', password: 'short' }, schema);
    expect(errors2.email).toEqual({ code: 'INVALID_FORMAT', message: 'メール形式不正' });
    expect(errors2.password).toEqual({ code: 'TOO_SHORT', message: '8文字以上' });

    // 正常
    const errors3 = validateForm({ email: 'test@example.com', password: 'Password1' }, schema);
    expect(errors3).toEqual({});
  });
});
