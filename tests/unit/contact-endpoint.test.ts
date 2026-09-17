import { describe, expect, it } from 'vitest';
import {
  composeEnquiryEmail,
  handleContactPost,
  isFormContentType,
  HONEYPOT_FIELD,
  TURNSTILE_FIELD,
  type ComposedEmail,
  type ContactDeps,
  type ContactEnv,
  type ContactLogEvent,
} from '../../src/lib/contact';

/*
 * The full POST pipeline with every external effect injected: Turnstile
 * verification, email delivery, and logging are fakes so the whole decision
 * tree — including ordering, fail-closed behaviour, log hygiene, and the exact
 * email contract — is asserted without a network. The real browser path is
 * covered by tests/e2e/contact-form.spec.ts.
 */

const URL = 'https://therightlifestyle.com/contact/';

const ENV: ContactEnv = {
  TURNSTILE_SECRET: 'turnstile-secret',
  RESEND_API_KEY: 'resend-api-key',
  CONTACT_TO_EMAIL: 'officialtrlservice@gmail.com',
  RESEND_FROM_EMAIL: 'onboarding@resend.dev',
};

const SUBMISSION = {
  name: 'Aisha Khan',
  email: 'aisha@example.com',
  service: 'builder-automation-setup',
  message:
    'We retype every order into two spreadsheets by hand, about ten times a week, and it costs us an afternoon.',
  phone: '+92 319 0091457',
  business: 'Khan Textiles',
};

interface Calls {
  turnstile: { secret: string; token: string; ip?: string }[];
  emails: { email: ComposedEmail; apiKey: string }[];
  logs: ContactLogEvent[];
}

function makeDeps(
  behaviour: { turnstile?: boolean; deliver?: boolean } = {},
): { deps: ContactDeps; calls: Calls } {
  const calls: Calls = { turnstile: [], emails: [], logs: [] };
  return {
    calls,
    deps: {
      verifyTurnstile: async (secret, token, ip) => {
        calls.turnstile.push({ secret, token, ip });
        return behaviour.turnstile ?? true;
      },
      sendEmail: async (email, apiKey) => {
        calls.emails.push({ email, apiKey });
        return behaviour.deliver ?? true;
      },
      log: (event) => calls.logs.push(event),
    },
  };
}

function formPost(
  fields: Record<string, string>,
  headers: Record<string, string> = {},
): Request {
  return new Request(URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin: 'https://therightlifestyle.com',
      ...headers,
    },
    body: new URLSearchParams(fields).toString(),
  });
}

function validFields(overrides: Record<string, string> = {}): Record<string, string> {
  return { ...SUBMISSION, [TURNSTILE_FIELD]: 'turnstile-token-value', ...overrides };
}

describe('content-type handling', () => {
  it('accepts both form encodings with parameters', () => {
    expect(isFormContentType('application/x-www-form-urlencoded')).toBe(true);
    expect(isFormContentType('application/x-www-form-urlencoded; charset=UTF-8')).toBe(true);
    expect(isFormContentType('multipart/form-data; boundary=xyz')).toBe(true);
    expect(isFormContentType('application/json')).toBe(false);
    expect(isFormContentType('text/plain')).toBe(false);
    expect(isFormContentType(null)).toBe(false);
  });

  it('rejects non-form bodies with 415 before any parsing', async () => {
    const { deps, calls } = makeDeps();
    const result = await handleContactPost(
      new Request(URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(SUBMISSION),
      }),
      ENV,
      deps,
    );

    expect(result).toEqual({ outcome: 'render', status: 415, formError: 'unavailable' });
    expect(calls.turnstile).toHaveLength(0);
    expect(calls.emails).toHaveLength(0);
    expect(calls.logs[0]?.outcome).toBe('bad-request');
  });

  it('rejects unparseable form bodies with 400', async () => {
    const { deps } = makeDeps();
    const result = await handleContactPost(
      new Request(URL, {
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data; boundary=xyz' },
        body: 'this is not a multipart body',
      }),
      ENV,
      deps,
    );

    expect(result).toEqual({ outcome: 'render', status: 400, formError: 'unavailable' });
  });
});

describe('honeypot', () => {
  it('rejects a filled honeypot as a silent success before any network call', async () => {
    const { deps, calls } = makeDeps();
    const result = await handleContactPost(
      formPost(validFields({ [HONEYPOT_FIELD]: 'http://spam.example' })),
      ENV,
      deps,
    );

    expect(result).toEqual({ outcome: 'redirect', location: '/contact/sent/' });
    expect(calls.turnstile).toHaveLength(0);
    expect(calls.emails).toHaveLength(0);
    expect(calls.logs.map((log) => log.outcome)).toEqual(['rejected-honeypot']);
  });

  it('treats a whitespace-only honeypot as empty', async () => {
    const { deps, calls } = makeDeps();
    const result = await handleContactPost(
      formPost(validFields({ [HONEYPOT_FIELD]: '   ' })),
      ENV,
      deps,
    );

    expect(result.outcome).toBe('redirect');
    expect(calls.logs.map((log) => log.outcome)).toEqual(['accepted']);
  });

  it('takes precedence over invalid fields', async () => {
    const { deps, calls } = makeDeps();
    const result = await handleContactPost(
      formPost(validFields({ name: '', [HONEYPOT_FIELD]: 'x' })),
      ENV,
      deps,
    );

    expect(result.outcome).toBe('redirect');
    expect(calls.logs.map((log) => log.outcome)).toEqual(['rejected-honeypot']);
  });
});

describe('turnstile verification', () => {
  it('fails closed with 503 when no secret is configured', async () => {
    const { deps, calls } = makeDeps();
    const { TURNSTILE_SECRET: _unused, ...noSecret } = ENV;
    const result = await handleContactPost(formPost(validFields()), noSecret, deps);

    expect(result).toMatchObject({
      outcome: 'render',
      status: 503,
      formError: 'unavailable',
    });
    expect(calls.turnstile).toHaveLength(0);
    expect(calls.logs[0]).toMatchObject({ outcome: 'system-error', reason: 'unconfigured-turnstile' });
  });

  it('rejects a missing token with 403 and preserves the input', async () => {
    const { deps, calls } = makeDeps();
    const fields = validFields();
    delete fields[TURNSTILE_FIELD];
    const result = await handleContactPost(formPost(fields), ENV, deps);

    expect(result).toMatchObject({
      outcome: 'render',
      status: 403,
      formError: 'verification',
      values: { name: SUBMISSION.name, email: SUBMISSION.email },
    });
    expect(calls.turnstile).toHaveLength(0);
    expect(calls.logs[0]).toMatchObject({ outcome: 'rejected-turnstile', reason: 'missing-token' });
  });

  it('rejects a failed verification with 403 and preserves the input', async () => {
    const { deps, calls } = makeDeps({ turnstile: false });
    const result = await handleContactPost(formPost(validFields()), ENV, deps);

    expect(result).toMatchObject({ outcome: 'render', status: 403, formError: 'verification' });
    expect(calls.turnstile).toEqual([
      { secret: 'turnstile-secret', token: 'turnstile-token-value', ip: undefined },
    ]);
    expect(calls.emails).toHaveLength(0);
    expect(calls.logs[0]).toMatchObject({
      outcome: 'rejected-turnstile',
      reason: 'verification-rejected',
    });
  });

  it('forwards the visitor IP when the platform provides one', async () => {
    const { deps, calls } = makeDeps();
    await handleContactPost(
      formPost(validFields(), { 'cf-connecting-ip': '198.51.100.7' }),
      ENV,
      deps,
    );

    expect(calls.turnstile[0]).toMatchObject({ ip: '198.51.100.7' });
  });

  it('runs before validation so bots never learn which fields are wrong', async () => {
    const { deps, calls } = makeDeps({ turnstile: false });
    const result = await handleContactPost(formPost(validFields({ email: 'nope' })), ENV, deps);

    expect(result).toMatchObject({ status: 403, formError: 'verification' });
    expect(calls.turnstile).toHaveLength(1);
    expect(calls.logs.map((log) => log.outcome)).toEqual(['rejected-turnstile']);
  });
});

describe('validation', () => {
  it('returns 422 with per-field errors and preserved values', async () => {
    const { deps, calls } = makeDeps();
    const result = await handleContactPost(
      formPost(validFields({ name: '', email: 'nope', message: 'short' })),
      ENV,
      deps,
    );

    expect(result.outcome).toBe('render');
    if (result.outcome === 'render') {
      expect(result.status).toBe(422);
      expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual([
        'email',
        'message',
        'name',
      ]);
      expect(result.values?.phone).toBe(SUBMISSION.phone);
    }
    expect(calls.emails).toHaveLength(0);
    expect(calls.logs.map((log) => log.outcome)).toEqual(['invalid']);
  });

  it('ignores non-string (file) entries instead of crashing', async () => {
    const { deps } = makeDeps();
    const form = new FormData();
    form.set('name', SUBMISSION.name);
    form.set('email', SUBMISSION.email);
    form.set('service', SUBMISSION.service);
    form.set('message', SUBMISSION.message);
    form.set('attachment', new File(['x'], 'x.txt', { type: 'text/plain' }));
    form.set(TURNSTILE_FIELD, 'turnstile-token-value');

    const result = await handleContactPost(
      new Request(URL, { method: 'POST', body: form }),
      ENV,
      deps,
    );

    expect(result.outcome).toBe('redirect');
  });
});

describe('delivery', () => {
  it('sends the composed email with the API key and redirects on success', async () => {
    const { deps, calls } = makeDeps();
    const result = await handleContactPost(formPost(validFields()), ENV, deps);

    expect(result).toEqual({ outcome: 'redirect', location: '/contact/sent/' });
    expect(calls.emails).toHaveLength(1);

    const { email, apiKey } = calls.emails[0]!;
    expect(apiKey).toBe('resend-api-key');
    expect(email.to).toBe('officialtrlservice@gmail.com');
    expect(email.from).toBe('onboarding@resend.dev');
    expect(email.replyTo).toBe('aisha@example.com');
    expect(email.subject).toBe(
      'Website enquiry (TRL Builder Automation Setup) from Aisha Khan',
    );
    expect(email.text).toContain(SUBMISSION.message);
    expect(email.text).toContain('Phone / WhatsApp: +92 319 0091457');
    expect(email.text).toContain('Business: Khan Textiles');
    expect(calls.logs.map((log) => log.outcome)).toEqual(['accepted']);
  });

  it('omits optional lines cleanly when not provided', () => {
    const email = composeEnquiryEmail(
      {
        name: 'A',
        email: 'a@example.com',
        service: 'general',
        serviceLabel: 'General enquiry',
        message: 'x'.repeat(30),
        phone: '',
        business: '',
      },
      { CONTACT_TO_EMAIL: ENV.CONTACT_TO_EMAIL!, RESEND_FROM_EMAIL: ENV.RESEND_FROM_EMAIL! },
      new Date('2026-09-17T12:00:00Z'),
    );
    expect(email.text).toContain('Phone / WhatsApp: not provided');
    expect(email.text).toContain('Business: not provided');
    expect(email.text).toContain('Received (UTC): 2026-09-17T12:00:00.000Z');
    expect(email.subject).toBe('Website enquiry (General enquiry) from A');
  });

  it.each(['RESEND_API_KEY', 'CONTACT_TO_EMAIL', 'RESEND_FROM_EMAIL'])(
    'fails closed with 503 when %s is not configured',
    async (missing) => {
      const { deps, calls } = makeDeps();
      const env = { ...ENV, [missing]: undefined };
      const result = await handleContactPost(formPost(validFields()), env, deps);

      expect(result).toMatchObject({ outcome: 'render', status: 503, formError: 'unavailable' });
      expect(calls.emails).toHaveLength(0);
      expect(calls.logs[0]).toMatchObject({
        outcome: 'system-error',
        reason: 'unconfigured-delivery',
      });
    },
  );

  it('fails closed with 503 when the provider rejects the send', async () => {
    const { deps, calls } = makeDeps({ deliver: false });
    const result = await handleContactPost(formPost(validFields()), ENV, deps);

    expect(result).toMatchObject({ outcome: 'render', status: 503, formError: 'unavailable' });
    expect(result.outcome === 'render' && result.values?.message).toBe(SUBMISSION.message);
    expect(calls.logs[0]).toMatchObject({ outcome: 'system-error', reason: 'delivery-failed' });
  });

  it('treats whitespace-only configuration as unconfigured', async () => {
    const { deps, calls } = makeDeps();
    const result = await handleContactPost(
      formPost(validFields()),
      { ...ENV, RESEND_API_KEY: '   ' },
      deps,
    );

    expect(result).toMatchObject({ status: 503, formError: 'unavailable' });
    expect(calls.emails).toHaveLength(0);
  });
});

describe('log hygiene', () => {
  it('never logs submitted values or PII on any path', async () => {
    const secrets = [
      SUBMISSION.name,
      SUBMISSION.email,
      SUBMISSION.phone,
      SUBMISSION.business,
      SUBMISSION.message,
      'turnstile-secret',
      'resend-api-key',
      'turnstile-token-value',
    ];

    const scenarios = [
      formPost(validFields()),
      formPost(validFields({ name: '' })),
      formPost(validFields({ [HONEYPOT_FIELD]: 'spam' })),
      formPost(validFields({ [TURNSTILE_FIELD]: '' })),
      formPost(validFields(), { 'cf-connecting-ip': '198.51.100.7' }),
    ];

    for (const [index, request] of scenarios.entries()) {
      const behaviours = [{}, { turnstile: false }, { deliver: false }];
      for (const behaviour of behaviours) {
        const { deps, calls } = makeDeps(behaviour);
        await handleContactPost(request, ENV, deps);
        expect(calls.logs.length, `scenario ${index}`).toBeGreaterThan(0);
        for (const log of calls.logs) {
          const serialized = JSON.stringify(log);
          for (const secret of secrets) {
            expect(serialized, `scenario ${index} leaked "${secret}"`).not.toContain(secret);
          }
        }
      }
    }
  });

  it('logs exactly one outcome event per request with a request id', async () => {
    const { deps, calls } = makeDeps();
    await handleContactPost(formPost(validFields()), ENV, deps);

    expect(calls.logs).toHaveLength(1);
    expect(calls.logs[0]).toMatchObject({
      event: 'contact',
      outcome: 'accepted',
      requestId: expect.stringMatching(/^[\da-f-]{36}$/),
    });
  });
});
