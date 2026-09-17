/**
 * Contact endpoint logic (Gate 4).
 *
 * Everything the /contact/ POST handler does is a pure, framework-free
 * function of (request, env, deps) so the entire submission pipeline —
 * including Turnstile verification and email delivery — is unit-testable with
 * injected dependencies. The .astro page is a thin adapter that maps the
 * returned result onto a redirect or a rendered form state.
 *
 * Security posture (docs/TRL_SECURITY.md):
 * - Astro's built-in `checkOrigin` (default on) already rejects form-encoded
 *   POSTs whose Origin does not match the request host before this code runs.
 * - The honeypot is checked before any network call so bots never learn
 *   anything and cost nothing.
 * - Verification and delivery fail closed: any error, missing configuration,
 *   or network failure produces the same generic user-facing outcome and
 *   never leaks internals.
 * - Logs carry outcome events only — no submitted values, no PII.
 */

import { offers } from './site';

/* ------------------------------------------------------------------ types */

export type ContactFieldName =
  | 'name'
  | 'email'
  | 'service'
  | 'message'
  | 'phone'
  | 'business';

/** Raw submitted strings, as rendered back into the form on error (Astro escapes them). */
export type RawContactValues = Record<ContactFieldName, string>;

/** Validated, trimmed submission. */
export interface ContactSubmission {
  name: string;
  email: string;
  service: string;
  serviceLabel: string;
  message: string;
  phone: string;
  business: string;
}

export type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

/** Server-side runtime configuration (subset of the Workers env). */
export interface ContactEnv {
  PUBLIC_TURNSTILE_SITEKEY?: string;
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  RESEND_FROM_EMAIL?: string;
}

/** Composed delivery email. */
export interface ComposedEmail {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  text: string;
}

export type ContactLogOutcome =
  | 'accepted'
  | 'rejected-honeypot'
  | 'rejected-turnstile'
  | 'invalid'
  | 'bad-request'
  | 'system-error';

export interface ContactLogEvent {
  event: 'contact';
  requestId: string;
  outcome: ContactLogOutcome;
  reason?:
    | 'content-type'
    | 'unparseable'
    | 'missing-token'
    | 'verification-rejected'
    | 'verification-network'
    | 'unconfigured-turnstile'
    | 'unconfigured-delivery'
    | 'delivery-failed'
    | 'delivery-network';
}

/** Injectable external effects. */
export interface ContactDeps {
  verifyTurnstile(secret: string, token: string, ip?: string): Promise<boolean>;
  sendEmail(email: ComposedEmail, apiKey: string): Promise<boolean>;
  log(event: ContactLogEvent): void;
}

/** What the page should do after processing a POST. */
export type ContactPostResult =
  | { outcome: 'redirect'; location: '/contact/sent/' }
  | {
      outcome: 'render';
      status: 400 | 403 | 415 | 422 | 503;
      /** Generic, user-facing failure kind. `undefined` never occurs with 422. */
      formError?: 'verification' | 'unavailable';
      fieldErrors?: ContactFieldErrors;
      /** Submitted values to re-render so the visitor never retypes. */
      values?: RawContactValues;
    };

/* ----------------------------------------------------------- form shape */

export const SERVICE_OPTIONS: readonly { value: string; label: string }[] = [
  ...offers.map((offer) => ({ value: offer.id, label: offer.name })),
  { value: 'general', label: 'General enquiry' },
];

const SERVICE_IDS = new Set(SERVICE_OPTIONS.map((option) => option.value));

/** Field order for the error summary matches the visual order of the form. */
export const FIELD_ORDER: readonly ContactFieldName[] = [
  'name',
  'email',
  'service',
  'message',
  'phone',
  'business',
];

/** Hidden anti-spam field. Anything that fills it is treated as a bot. */
export const HONEYPOT_FIELD = 'website';

/** Field name Turnstile injects its token under when the widget sits in the form. */
export const TURNSTILE_FIELD = 'cf-turnstile-response';

export const LIMITS = {
  name: 120,
  email: 200,
  messageMin: 20,
  messageMax: 4000,
  phone: 40,
  business: 120,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+()\-\s.\d]+$/;
/** C0 control characters except tab (9), LF (10), and CR (13). */
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

/* ----------------------------------------------------------- validation */

function str(form: Record<string, unknown>, key: string): string {
  const value = form[key];
  return typeof value === 'string' ? value : '';
}

export function emptyContactValues(): RawContactValues {
  return { name: '', email: '', service: '', message: '', phone: '', business: '' };
}

/**
 * Validates the raw form values per the specification in
 * docs/TRL_USER_JOURNEYS.md. Trims every field; optional fields come back as
 * empty strings when blank.
 */
export function validateContactForm(
  raw: Partial<Record<ContactFieldName, string>>,
): { ok: true; value: ContactSubmission } | { ok: false; fieldErrors: ContactFieldErrors } {
  const name = (raw.name ?? '').trim();
  const email = (raw.email ?? '').trim();
  const service = (raw.service ?? '').trim();
  const message = (raw.message ?? '').trim();
  const phone = (raw.phone ?? '').trim();
  const business = (raw.business ?? '').trim();

  const fieldErrors: ContactFieldErrors = {};

  if (name === '') {
    fieldErrors.name = 'Enter your name.';
  } else if (name.length > LIMITS.name) {
    fieldErrors.name = `Enter your name using ${LIMITS.name} characters or fewer.`;
  }

  if (email === '') {
    fieldErrors.email = 'Enter your email address.';
  } else if (email.length > LIMITS.email) {
    fieldErrors.email = `Enter an email address using ${LIMITS.email} characters or fewer.`;
  } else if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = 'Enter an email address in the correct format, like name@example.com.';
  }

  if (!SERVICE_IDS.has(service)) {
    fieldErrors.service = 'Choose the service you are interested in.';
  }

  if (message === '') {
    fieldErrors.message = 'Describe what you would like to change.';
  } else if (message.length < LIMITS.messageMin) {
    fieldErrors.message = `Your description should be at least ${LIMITS.messageMin} characters so we can answer usefully.`;
  } else if (message.length > LIMITS.messageMax) {
    fieldErrors.message = `Keep your description to ${LIMITS.messageMax.toLocaleString('en-US')} characters or fewer.`;
  } else if (CONTROL_CHARACTERS.test(message)) {
    fieldErrors.message = 'Your description contains characters that cannot be sent. Please remove them and try again.';
  }

  if (phone !== '') {
    if (phone.length > LIMITS.phone) {
      fieldErrors.phone = `Enter a phone number using ${LIMITS.phone} characters or fewer.`;
    } else if (!PHONE_PATTERN.test(phone)) {
      fieldErrors.phone = 'Enter a phone number using digits, spaces, and + ( ) - . only.';
    }
  }

  if (business !== '' && business.length > LIMITS.business) {
    fieldErrors.business = `Enter a business name using ${LIMITS.business} characters or fewer.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const serviceLabel =
    SERVICE_OPTIONS.find((option) => option.value === service)?.label ?? 'General enquiry';

  return {
    ok: true,
    value: { name, email, service, serviceLabel, message, phone, business },
  };
}

/* ---------------------------------------------------------- composition */

export function composeEnquiryEmail(
  submission: ContactSubmission,
  env: Pick<ContactEnv, 'CONTACT_TO_EMAIL' | 'RESEND_FROM_EMAIL'>,
  receivedAt: Date,
): ComposedEmail {
  const lines = [
    'A new enquiry was submitted through the TRL website contact form.',
    '',
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Phone / WhatsApp: ${submission.phone === '' ? 'not provided' : submission.phone}`,
    `Business: ${submission.business === '' ? 'not provided' : submission.business}`,
    `Service of interest: ${submission.serviceLabel}`,
    `Received (UTC): ${receivedAt.toISOString()}`,
    '',
    'Message:',
    submission.message,
    '',
    'Reply to this email to answer the sender; Reply-To is set to their address.',
  ];

  return {
    to: env.CONTACT_TO_EMAIL!,
    from: env.RESEND_FROM_EMAIL!,
    replyTo: submission.email,
    subject: `Website enquiry (${submission.serviceLabel}) from ${submission.name}`,
    text: lines.join('\r\n'),
  };
}

/* --------------------------------------------------------- orchestration */

/** True when the request body is a form encoding a browser could have sent. */
export function isFormContentType(contentType: string | null): boolean {
  if (contentType === null) return false;
  const mimeType = contentType.split(';')[0]?.trim().toLowerCase();
  return mimeType === 'application/x-www-form-urlencoded' || mimeType === 'multipart/form-data';
}

/**
 * Processes a POST to /contact/.
 *
 * Order matters and is asserted by tests: honeypot → Turnstile → validation →
 * delivery. Everything a user can see on failure is generic.
 */
export async function handleContactPost(
  request: Request,
  env: ContactEnv,
  deps: ContactDeps,
): Promise<ContactPostResult> {
  const requestId = crypto.randomUUID();

  if (!isFormContentType(request.headers.get('content-type'))) {
    deps.log({ event: 'contact', requestId, outcome: 'bad-request', reason: 'content-type' });
    return { outcome: 'render', status: 415, formError: 'unavailable' };
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    deps.log({ event: 'contact', requestId, outcome: 'bad-request', reason: 'unparseable' });
    return { outcome: 'render', status: 400, formError: 'unavailable' };
  }

  const record: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') record[key] = value;
  }

  const values: RawContactValues = {
    name: str(record, 'name'),
    email: str(record, 'email'),
    service: str(record, 'service'),
    message: str(record, 'message'),
    phone: str(record, 'phone'),
    business: str(record, 'business'),
  };

  // Honeypot: reject before any network call or validation hint.
  if (str(record, HONEYPOT_FIELD).trim() !== '') {
    deps.log({ event: 'contact', requestId, outcome: 'rejected-honeypot' });
    return { outcome: 'redirect', location: '/contact/sent/' };
  }

  const secret = env.TURNSTILE_SECRET?.trim() ?? '';
  if (secret === '') {
    deps.log({
      event: 'contact',
      requestId,
      outcome: 'system-error',
      reason: 'unconfigured-turnstile',
    });
    return { outcome: 'render', status: 503, formError: 'unavailable', values };
  }

  const token = str(record, TURNSTILE_FIELD).trim();
  if (token === '') {
    deps.log({ event: 'contact', requestId, outcome: 'rejected-turnstile', reason: 'missing-token' });
    return { outcome: 'render', status: 403, formError: 'verification', values };
  }

  const ip = request.headers.get('cf-connecting-ip') ?? undefined;
  const verified = await deps.verifyTurnstile(secret, token, ip);
  if (!verified) {
    deps.log({
      event: 'contact',
      requestId,
      outcome: 'rejected-turnstile',
      reason: 'verification-rejected',
    });
    return { outcome: 'render', status: 403, formError: 'verification', values };
  }

  const validation = validateContactForm(values);
  if (!validation.ok) {
    deps.log({ event: 'contact', requestId, outcome: 'invalid' });
    return {
      outcome: 'render',
      status: 422,
      fieldErrors: validation.fieldErrors,
      values,
    };
  }

  const apiKey = env.RESEND_API_KEY?.trim() ?? '';
  const to = env.CONTACT_TO_EMAIL?.trim() ?? '';
  const from = env.RESEND_FROM_EMAIL?.trim() ?? '';
  if (apiKey === '' || to === '' || from === '') {
    deps.log({
      event: 'contact',
      requestId,
      outcome: 'system-error',
      reason: 'unconfigured-delivery',
    });
    return { outcome: 'render', status: 503, formError: 'unavailable', values };
  }

  const email = composeEnquiryEmail(validation.value, { CONTACT_TO_EMAIL: to, RESEND_FROM_EMAIL: from }, new Date());
  const delivered = await deps.sendEmail(email, apiKey);
  if (!delivered) {
    deps.log({ event: 'contact', requestId, outcome: 'system-error', reason: 'delivery-failed' });
    return { outcome: 'render', status: 503, formError: 'unavailable', values };
  }

  deps.log({ event: 'contact', requestId, outcome: 'accepted' });
  return { outcome: 'redirect', location: '/contact/sent/' };
}

/* ------------------------------------------------------- real dependencies */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_SEND_URL = 'https://api.resend.com/emails';

/** Real Turnstile verification. Any failure — including a network error — fails closed. */
async function verifyTurnstileWithCloudflare(
  secret: string,
  token: string,
  ip?: string,
): Promise<boolean> {
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip !== undefined) body.set('remoteip', ip);
    const response = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: unknown };
    return result.success === true;
  } catch {
    return false;
  }
}

/** Real Resend delivery. Any failure — including a network error — reports not delivered. */
async function sendEmailWithResend(email: ComposedEmail, apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(RESEND_SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: email.from,
        to: [email.to],
        reply_to: email.replyTo,
        subject: email.subject,
        text: email.text,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Production dependencies: real Cloudflare and Resend calls, console logging. */
export function createContactDeps(): ContactDeps {
  return {
    verifyTurnstile: verifyTurnstileWithCloudflare,
    sendEmail: sendEmailWithResend,
    log: (event) => console.log(JSON.stringify(event)),
  };
}
