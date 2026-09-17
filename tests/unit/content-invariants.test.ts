import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  aiSolutions,
  contact,
  legalNavigation,
  mailtoLink,
  navigation,
  offers,
  serviceAreas,
  site,
  whatsappLink,
} from '../../src/lib/site';

/*
 * Content invariants. These assert the founder-approved facts recorded in
 * docs/TRL_MASTER_CONTEXT.md and docs/TRL_DECISIONS.md (D-002, D-003, D-008).
 * If someone edits a price or a contact detail, CI fails rather than shipping it.
 */

describe('approved contact details (D-003)', () => {
  it('uses the approved email address', () => {
    expect(contact.email).toBe('officialtrlservice@gmail.com');
  });

  it('uses the approved WhatsApp number', () => {
    expect(contact.whatsappNumber).toBe('+92 3190091457');
    expect(contact.whatsappDigits).toBe('923190091457');
  });

  it('builds click-to-chat and mailto links from the approved details', () => {
    expect(whatsappLink('Hello')).toBe('https://wa.me/923190091457?text=Hello');
    expect(mailtoLink('Enquiry')).toBe(
      'mailto:officialtrlservice@gmail.com?subject=Enquiry',
    );
  });
});

describe('approved offer staircase (D-002)', () => {
  it('has exactly three offers in the approved order', () => {
    expect(offers.map((offer) => offer.id)).toEqual([
      'micro-audit',
      'builder-automation-setup',
      'transformation-founder-os',
    ]);
  });

  it('uses the approved names and prices', () => {
    expect(offers[0]).toMatchObject({
      name: 'TRL Micro Audit',
      price: '$35',
      priceNote: 'PKR 9,900',
    });
    expect(offers[1]).toMatchObject({
      name: 'TRL Builder Automation Setup',
      price: '$499',
    });
    expect(offers[2]).toMatchObject({
      name: 'TRL Transformation / Founder OS',
      price: '$1,297',
    });
  });

  it('states deliverables, inclusions, and exclusions for every offer', () => {
    for (const offer of offers) {
      expect(offer.deliverables.length).toBeGreaterThan(0);
      expect(offer.includes.length).toBeGreaterThan(0);
      expect(offer.excludes.length).toBeGreaterThan(0);
      expect(offer.fit.length).toBeGreaterThan(0);
    }
  });
});

describe('positioning and identity', () => {
  it('keeps the approved positioning statement', () => {
    expect(site.positioning).toBe(
      "We don't sell AI tools. We build business systems that give owners their time back.",
    );
  });

  it('keeps the approved names and founder', () => {
    expect(site.name).toBe('TRL');
    expect(site.legalName).toBe('The Right Lifestyle');
    expect(site.founder).toBe('Rashid Muhammad Amir');
    expect(site.domain).toBe('therightlifestyle.com');
  });
});

describe('navigation matches the approved first-release scope (D-008)', () => {
  it('lists the core routes', () => {
    expect(navigation.map((item) => item.href)).toEqual([
      '/',
      '/services/',
      '/ai-solutions/',
      '/offers/',
      '/about/',
      '/contact/',
    ]);
  });

  it('lists the legal routes', () => {
    expect(legalNavigation.map((item) => item.href)).toEqual(['/privacy/', '/terms/']);
  });
});

describe('catalogue content is populated', () => {
  it('describes each service area with a problem and a capability', () => {
    expect(serviceAreas.length).toBeGreaterThanOrEqual(4);
    for (const area of serviceAreas) {
      expect(area.problem.length).toBeGreaterThan(20);
      expect(area.capability.length).toBeGreaterThan(20);
      expect(area.examples.length).toBeGreaterThan(0);
    }
  });

  it('describes each AI solution with a fit statement', () => {
    expect(aiSolutions.length).toBeGreaterThanOrEqual(4);
    for (const solution of aiSolutions) {
      expect(solution.description.length).toBeGreaterThan(20);
      expect(solution.fitFor.length).toBeGreaterThan(10);
    }
  });
});

describe('no unearned social proof in page source', () => {
  const pagesDir = join(process.cwd(), 'src', 'pages');
  const sources = readdirSync(pagesDir)
    .filter((file) => file.endsWith('.astro'))
    .map((file) => ({ file, text: readFileSync(join(pagesDir, file), 'utf8') }));

  // Phrases that would imply customers, results, or credentials TRL does not have.
  const bannedPhrases = [
    'trusted by',
    'clients served',
    'customers served',
    'as featured in',
    'award-winning',
    'testimonial',
    'case study',
    'money-back guarantee',
    'most popular',
    '5-star',
    'industry leading',
    'industry-leading',
  ];

  it('contains no fabricated proof phrases', () => {
    for (const { file, text } of sources) {
      const lower = text.toLowerCase();
      for (const phrase of bannedPhrases) {
        expect(`${file}: ${lower.includes(phrase)}`).toBe(`${file}: false`);
      }
    }
  });
});
