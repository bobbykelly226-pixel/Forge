import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { logSupabaseError } from '@/lib/supabase/log-error';

const env = process.env as Record<string, string | undefined>;

describe('logSupabaseError', () => {
  const originalUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const originalVercelEnv = env.VERCEL_ENV;
  const originalNodeEnv = env.NODE_ENV;

  afterEach(() => {
    if (originalUrl === undefined) delete env.NEXT_PUBLIC_SUPABASE_URL;
    else env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalVercelEnv === undefined) delete env.VERCEL_ENV;
    else env.VERCEL_ENV = originalVercelEnv;
    if (originalNodeEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = originalNodeEnv;
  });

  it('logs structured fields in preview including project ref (no secrets)', () => {
    env.VERCEL_ENV = 'preview';
    env.NEXT_PUBLIC_SUPABASE_URL = 'https://uwgjdqzwcgbaaudbrvgx.supabase.co';

    const errors: unknown[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args);
    };

    try {
      logSupabaseError(
        'upsertCurrentUserProfile',
        {
          message: 'column profiles.pets_types does not exist',
          code: '42703',
          details: null,
          hint: null,
        },
        { fieldKeys: ['pets', 'pets_types'] }
      );
    } finally {
      console.error = originalError;
    }

    assert.equal(errors.length, 1);
    const [scope, payload] = errors[0] as [string, Record<string, unknown>];
    assert.equal(scope, 'upsertCurrentUserProfile:');
    assert.equal(payload.message, 'column profiles.pets_types does not exist');
    assert.equal(payload.code, '42703');
    assert.equal(payload.supabaseProjectRef, 'uwgjdqzwcgbaaudbrvgx');
    assert.deepEqual(payload.fieldKeys, ['pets', 'pets_types']);
    assert.ok(!JSON.stringify(payload).includes('eyJ'));
    assert.ok(!JSON.stringify(payload).includes('apikey'));
  });

  it('logs only the message outside preview/development', () => {
    env.VERCEL_ENV = 'production';
    env.NODE_ENV = 'production';
    env.NEXT_PUBLIC_SUPABASE_URL = 'https://uwgjdqzwcgbaaudbrvgx.supabase.co';

    const errors: unknown[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args);
    };

    try {
      logSupabaseError('upsertCurrentUserProfile', {
        message: 'column profiles.pets_types does not exist',
        code: '42703',
      });
    } finally {
      console.error = originalError;
    }

    assert.equal(errors.length, 1);
    assert.deepEqual(errors[0], [
      'upsertCurrentUserProfile:',
      'column profiles.pets_types does not exist',
    ]);
  });
});
