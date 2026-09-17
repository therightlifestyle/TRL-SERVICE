import { describe, expect, it } from 'vitest';
import {
  LIMITS,
  SERVICE_OPTIONS,
  validateContactForm,
  type ContactFieldName,
} from '../../src/lib/contact';
import { offers } from '../../src/lib/site';

/*
 * The validation matrix for the enquiry form, per the specification in
 * docs/TRL_USER_JOURNEYS.md. Boundary values are asserted exactly so an
 * off-by-one in any limit fails here rather than in production.
 */

const VALID = {
  name: 'Aisha Khan',
  email: 'aisha@example.com',
  service: 'micro-audit',
  message: 'We retype every order into two spreadsheets by hand, about ten times a week.',
  phone: '',
  business: '',
} satisfies Record<ContactFieldName, string>;

function validate(overrides: Partial<Record<ContactFieldName, string>>) {
  return validateContactForm({ ...VALID, ...overrides });
}

function expectFieldError(overrides: Partial<Record<ContactFieldName, string>>, field: ContactFieldName) {
  const result = validate(overrides);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.fieldErrors[field], `expected an error on ${field}`).toBeTruthy();
  }
}

function expectValid(overrides: Partial<Record<ContactFieldName, string>>) {
  const result = validate(overrides);
  expect(result.ok, JSON.stringify(result.ok ? null : result.fieldErrors)).toBe(true);
}

describe('service options', () => {
  it('offers exactly the approved offers plus a general option, in staircase order', () => {
    expect(SERVICE_OPTIONS.map((option) => option.value)).toEqual([
      ...offers.map((offer) => offer.id),
      'general',
    ]);
    for (const offer of offers) {
      expect(SERVICE_OPTIONS.find((option) => option.value === offer.id)?.label).toBe(
        offer.name,
      );
    }
  });
});

describe('a fully valid submission', () => {
  it('passes with only the required fields', () => {
    const result = validate({});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.serviceLabel).toBe('TRL Micro Audit');
      expect(result.value.phone).toBe('');
      expect(result.value.business).toBe('');
    }
  });

  it('passes with every optional field filled', () => {
    const result = validate({
      phone: '+92 319 0091457',
      business: 'Khan Textiles',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.phone).toBe('+92 319 0091457');
      expect(result.value.business).toBe('Khan Textiles');
    }
  });

  it('trims surrounding whitespace from every field before validating', () => {
    const result = validate({
      name: '  Aisha Khan  ',
      email: ' aisha@example.com ',
      message: `  ${'We retype every order into two spreadsheets by hand.'}  `,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Aisha Khan');
      expect(result.value.email).toBe('aisha@example.com');
      expect(result.value.message.startsWith('We ')).toBe(true);
    }
  });

  it('maps every service id to its approved label', () => {
    const labels = Object.fromEntries(
      [...offers.map((offer) => offer.id), 'general'].map((id) => {
        const result = validate({ service: id });
        return [id, result.ok ? result.value.serviceLabel : null];
      }),
    );
    expect(labels).toEqual({
      'micro-audit': 'TRL Micro Audit',
      'builder-automation-setup': 'TRL Builder Automation Setup',
      'transformation-founder-os': 'TRL Transformation / Founder OS',
      general: 'General enquiry',
    });
  });
});

describe('name', () => {
  it('is required', () => {
    expectFieldError({ name: '' }, 'name');
    expectFieldError({ name: '   ' }, 'name');
  });

  it(`allows exactly ${LIMITS.name} characters`, () => {
    expectValid({ name: 'a'.repeat(LIMITS.name) });
    expectFieldError({ name: 'a'.repeat(LIMITS.name + 1) }, 'name');
  });
});

describe('email', () => {
  it('is required', () => {
    expectFieldError({ email: '' }, 'email');
    expectFieldError({ email: '   ' }, 'email');
  });

  it('rejects malformed addresses', () => {
    for (const email of [
      'not-an-email',
      'missing@tld',
      'two@@at.signs',
      'spaces in@example.com',
      '@nolocalpart.com',
      'no-domain@',
    ]) {
      expectFieldError({ email }, 'email');
    }
  });

  it(`allows exactly ${LIMITS.email} characters`, () => {
    const email = `${'a'.repeat(LIMITS.email - '@x.xx'.length)}@x.xx`;
    expect(email).toHaveLength(LIMITS.email);
    expectValid({ email });
    const tooLong = `${'a'.repeat(LIMITS.email - '@x.xx'.length + 1)}@x.xx`;
    expectFieldError({ email: tooLong }, 'email');
  });
});

describe('service of interest', () => {
  it('must be one of the offered values', () => {
    expectFieldError({ service: '' }, 'service');
    expectFieldError({ service: 'something-else' }, 'service');
    expectFieldError({ service: 'Micro Audit' }, 'service');
  });
});

describe('message', () => {
  it('is required', () => {
    expectFieldError({ message: '' }, 'message');
    expectFieldError({ message: '   ' }, 'message');
  });

  it(`requires at least ${LIMITS.messageMin} characters and allows exactly ${LIMITS.messageMax}`, () => {
    expectFieldError({ message: 'a'.repeat(LIMITS.messageMin - 1) }, 'message');
    expectValid({ message: 'a'.repeat(LIMITS.messageMin) });
    expectValid({ message: 'a'.repeat(LIMITS.messageMax) });
    expectFieldError({ message: 'a'.repeat(LIMITS.messageMax + 1) }, 'message');
  });

  it('keeps newlines but rejects other control characters', () => {
    expectValid({ message: `line one\nline two\n\n${'a'.repeat(LIMITS.messageMin)}` });
    expectFieldError(
      { message: `good text\u0000 with a NUL${'a'.repeat(LIMITS.messageMin)}` },
      'message',
    );
    expectFieldError(
      { message: `good text\u0007 with a BEL${'a'.repeat(LIMITS.messageMin)}` },
      'message',
    );
  });
});

describe('phone (optional)', () => {
  it('accepts common phone formats', () => {
    for (const phone of ['+92 319 0091457', '0300-1234567', '(030) 123.4567', '0092 300 123 456']) {
      expectValid({ phone });
    }
  });

  it('rejects letters and symbols outside digits, spaces, and + ( ) - .', () => {
    expectFieldError({ phone: 'call me maybe' }, 'phone');
    expectFieldError({ phone: '+92 300 1234567; DROP' }, 'phone');
  });

  it(`allows exactly ${LIMITS.phone} characters`, () => {
    expectValid({ phone: '+'.padEnd(LIMITS.phone, '1') });
    expectFieldError({ phone: '+'.padEnd(LIMITS.phone + 1, '1') }, 'phone');
  });
});

describe('business name (optional)', () => {
  it(`allows exactly ${LIMITS.business} characters`, () => {
    expectValid({ business: 'b'.repeat(LIMITS.business) });
    expectFieldError({ business: 'b'.repeat(LIMITS.business + 1) }, 'business');
  });
});

describe('error set shape', () => {
  it('reports every failing field at once, never just the first', () => {
    const result = validate({ name: '', email: 'nope', service: '', message: 'short' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual([
        'email',
        'message',
        'name',
        'service',
      ]);
    }
  });

  it('never fabricates errors for optional fields left empty', () => {
    const result = validate({});
    expect(result.ok).toBe(true);
  });
});
