/// <reference types="astro/client" />

/*
 * Runtime type for the Workers environment (src/lib/contact.ts reads it via
 * `import { env } from 'cloudflare:workers'`). The values themselves are never
 * committed: see .dev.vars.example for local development and
 * docs/TRL_DEPLOYMENT.md for the production variable list.
 */
declare module 'cloudflare:workers' {
  export const env: {
    /** Public Turnstile sitekey; rendered into the contact page's widget. */
    PUBLIC_TURNSTILE_SITEKEY?: string;
    /** Turnstile secret used for server-side token verification. */
    TURNSTILE_SECRET?: string;
    /** Resend API key for email delivery. */
    RESEND_API_KEY?: string;
    /** Approved destination address for enquiries (D-003/D-007). */
    CONTACT_TO_EMAIL?: string;
    /** Verified sender address for the delivery email. */
    RESEND_FROM_EMAIL?: string;
  };
}
