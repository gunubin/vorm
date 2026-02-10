import type { ErrorMessages } from './types.js';

const DEFAULT_MESSAGES: Record<string, string> = {
  REQUIRED: 'This field is required',
};

export function resolveMessage(
  code: string,
  ...messageSources: (ErrorMessages | undefined)[]
): string {
  for (const source of messageSources) {
    if (!source) continue;

    if (typeof source === 'function') {
      const result = source({ code });
      if (result) return result;
    } else {
      const msg = source[code];
      if (msg) return msg;
    }
  }

  return DEFAULT_MESSAGES[code] ?? code;
}
