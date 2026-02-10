import { describe, it, expect } from 'vitest';
import { resolveMessage } from '../resolve-message.js';

describe('resolveMessage', () => {
  describe('3-level priority', () => {
    it('FormSchema messages have highest priority', () => {
      const fieldMessages = { TOO_SHORT: 'field level' };
      const formMessages = { TOO_SHORT: 'form level' };

      const message = resolveMessage('TOO_SHORT', formMessages, fieldMessages);
      expect(message).toBe('form level');
    });

    it('falls back to FieldSchema messages when not in FormSchema', () => {
      const fieldMessages = { TOO_SHORT: 'field level' };
      const formMessages = { OTHER_CODE: 'form level' };

      const message = resolveMessage('TOO_SHORT', formMessages, fieldMessages);
      expect(message).toBe('field level');
    });

    it('falls back to default message when not in either', () => {
      const message = resolveMessage('REQUIRED', {}, {});
      expect(message).toBe('This field is required');
    });

    it('falls back to code itself when no default message exists', () => {
      const message = resolveMessage('UNKNOWN_CODE', {}, {});
      expect(message).toBe('UNKNOWN_CODE');
    });
  });

  describe('Record format', () => {
    it('returns message corresponding to code', () => {
      const messages = {
        TOO_SHORT: 'Must be at least 8 characters',
        NO_UPPERCASE: 'Must contain an uppercase letter',
      };

      expect(resolveMessage('TOO_SHORT', messages)).toBe('Must be at least 8 characters');
      expect(resolveMessage('NO_UPPERCASE', messages)).toBe('Must contain an uppercase letter');
    });

    it('undefined code falls back', () => {
      const messages = { TOO_SHORT: 'At least 8 characters' };

      expect(resolveMessage('UNKNOWN', messages)).toBe('UNKNOWN');
    });
  });

  describe('function format', () => {
    it('receives code as argument and returns message', () => {
      const messageFn = ({ code }: { code: string }) => {
        if (code === 'TOO_SHORT') return 'Must be at least 8 characters';
        return 'Validation error';
      };

      expect(resolveMessage('TOO_SHORT', messageFn)).toBe('Must be at least 8 characters');
      expect(resolveMessage('UNKNOWN', messageFn)).toBe('Validation error');
    });
  });

  describe('when source is undefined', () => {
    it('skips undefined and uses next source', () => {
      const fieldMessages = { TOO_SHORT: 'field level' };

      const message = resolveMessage('TOO_SHORT', undefined, fieldMessages);
      expect(message).toBe('field level');
    });

    it('falls back to default or code when all are undefined', () => {
      expect(resolveMessage('REQUIRED', undefined, undefined)).toBe('This field is required');
      expect(resolveMessage('CUSTOM', undefined, undefined)).toBe('CUSTOM');
    });
  });
});
