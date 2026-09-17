/**
 * Approved TRL facts.
 *
 * Every value here is founder-approved and recorded in docs/TRL_MASTER_CONTEXT.md
 * and docs/TRL_DECISIONS.md (D-002, D-003). Content invariant tests in
 * tests/unit assert these values, so an accidental edit fails the build pipeline.
 * Do not add prices, claims, credentials, or contact channels that are not approved.
 */

export const site = {
  name: 'TRL',
  legalName: 'The Right Lifestyle',
  founder: 'Rashid Muhammad Amir',
  positioning:
    "We don't sell AI tools. We build business systems that give owners their time back.",
  domain: 'therightlifestyle.com',
  defaultOrigin: 'https://therightlifestyle.com',
} as const;

export const contact = {
  email: 'officialtrlservice@gmail.com',
  whatsappNumber: '+92 3190091457',
  /** Digits only, E.164 without the plus, for wa.me links. */
  whatsappDigits: '923190091457',
} as const;

/** Builds a click-to-chat link with a pre-filled opening message (journey J2). */
export function whatsappLink(message: string): string {
  return `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(subject: string): string {
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}`;
}

export type Offer = {
  id: 'micro-audit' | 'builder-automation-setup' | 'transformation-founder-os';
  name: string;
  price: string;
  priceNote?: string;
  fit: string;
  summary: string;
  deliverables: string[];
  includes: string[];
  excludes: string[];
};

/** Offer staircase order is fixed: Micro Audit → Builder → Transformation (D-002). */
export const offers: readonly Offer[] = [
  {
    id: 'micro-audit',
    name: 'TRL Micro Audit',
    price: '$35',
    priceNote: 'PKR 9,900',
    fit: 'Best if you know something is slow but not yet what to fix first.',
    summary:
      'A focused analysis of one business area or workflow, ending in a written roadmap you can act on with or without us.',
    deliverables: [
      'A structured review of the workflow you nominate',
      'A written roadmap of the bottlenecks found, in priority order',
      'Recommended automation or system changes for each bottleneck',
      'A clear view of what you can do yourself and what needs build work',
    ],
    includes: [
      'One workflow or business area',
      'Written findings you keep',
      'A follow-up message thread to clarify the findings',
    ],
    excludes: [
      'Implementation or configuration work',
      'Software licences or subscriptions',
      'Ongoing support',
    ],
  },
  {
    id: 'builder-automation-setup',
    name: 'TRL Builder Automation Setup',
    price: '$499',
    fit: 'Best if you already know which process is costing you hours every week.',
    summary:
      'We design and build a working automation for an agreed process, then hand it over with documentation so your team can run it.',
    deliverables: [
      'A scoped design of the target process before any build starts',
      'A built and tested automation for that process',
      'Written handover documentation and a walkthrough',
      'A defined correction window after handover',
    ],
    includes: [
      'One agreed process end to end',
      'Configuration in tools you already own or approve',
      'Handover documentation',
    ],
    excludes: [
      'Third-party subscription or API costs',
      'Unlimited scope changes after the design is agreed',
      'A long-term managed service',
    ],
  },
  {
    id: 'transformation-founder-os',
    name: 'TRL Transformation / Founder OS',
    price: '$1,297',
    fit: 'Best if the business runs through you and that is now the constraint.',
    summary:
      'A wider engagement covering several connected workflows and the operating system around them, so the business depends less on the founder being available.',
    deliverables: [
      'A map of how work currently moves through the business',
      'A redesigned operating structure for the agreed areas',
      'Built automations and assistants for the highest-value steps',
      'Documented standard operating procedures for the new structure',
      'A handover and adoption plan for you and your team',
    ],
    includes: [
      'Several connected workflows, agreed in writing before work starts',
      'Build, documentation, and handover',
      'A defined correction window after handover',
    ],
    excludes: [
      'Third-party subscription or API costs',
      'Work outside the scope agreed at the start',
      'Staff hiring, legal, or financial advice',
    ],
  },
] as const;

export type ServiceArea = {
  id: string;
  title: string;
  problem: string;
  capability: string;
  examples: string[];
};

export const serviceAreas: readonly ServiceArea[] = [
  {
    id: 'workflow-automation',
    title: 'Workflow automation',
    problem:
      'Work moves between inbox, spreadsheet, and chat by hand, and every handover is a place where things stall.',
    capability:
      'We map the real sequence of steps, remove the ones that exist only out of habit, and connect the rest so the work moves without someone pushing it.',
    examples: [
      'Lead intake routed and acknowledged automatically',
      'Quote, invoice, and follow-up sequences',
      'Scheduled reporting assembled from the tools you already use',
    ],
  },
  {
    id: 'custom-ai-assistants',
    title: 'Custom AI assistants',
    problem:
      'Generic chatbots answer generically because they know nothing about how your business actually works.',
    capability:
      'We build assistants scoped to a specific job, grounded in your own material, with explicit limits on what they are allowed to do.',
    examples: [
      'Drafting replies in your own language and tone',
      'Answering internal questions from your documented procedures',
      'Summarising and classifying incoming requests',
    ],
  },
  {
    id: 'business-process-improvement',
    title: 'Business process improvement',
    problem:
      'A process that grew by accident is usually slower than the same process designed on purpose.',
    capability:
      'We document how the work runs now, find the delay and rework, and redesign the sequence before adding any technology to it.',
    examples: [
      'Process mapping and bottleneck analysis',
      'Rewriting a handover that keeps failing',
      'Standard operating procedures your team can follow',
    ],
  },
  {
    id: 'founder-operating-systems',
    title: 'Founder operating systems',
    problem:
      'The business runs through one person, so growth and time off both cost the same thing: the founder.',
    capability:
      'We build the structure that lets decisions, follow-up, and routine delivery happen without the founder sitting in the middle of every step.',
    examples: [
      'A single place where work, decisions, and follow-ups live',
      'Delegation structures with clear ownership',
      'Weekly operating rhythm and review',
    ],
  },
] as const;

export type Solution = {
  id: string;
  title: string;
  description: string;
  fitFor: string;
};

export const aiSolutions: readonly Solution[] = [
  {
    id: 'inbox-triage',
    title: 'Inbox and enquiry triage',
    description:
      'Incoming messages are classified, summarised, and routed, with a suggested reply drafted for a human to approve and send.',
    fitFor: 'Owners losing the first hour of every day to the inbox.',
  },
  {
    id: 'knowledge-assistant',
    title: 'Internal knowledge assistant',
    description:
      'An assistant grounded only in your documented procedures and materials, so staff questions get a consistent answer and a link to the source.',
    fitFor: 'Teams where the same questions come back to one person.',
  },
  {
    id: 'proposal-drafting',
    title: 'Proposal and quote drafting',
    description:
      'Structured inputs become a first-draft quote or proposal in your existing format and language, ready for you to review and price.',
    fitFor: 'Service businesses where quoting is the delivery bottleneck.',
  },
  {
    id: 'document-processing',
    title: 'Document and data processing',
    description:
      'Recurring documents are read, checked against expected fields, and turned into structured records in the system you already use.',
    fitFor: 'Anyone retyping the same information into a second system.',
  },
  {
    id: 'follow-up-sequences',
    title: 'Follow-up and reminder sequences',
    description:
      'Scheduled, conditional follow-ups so quotes, onboarding steps, and renewals are chased on time without a person remembering.',
    fitFor: 'Businesses losing work to silence rather than to a competitor.',
  },
  {
    id: 'reporting',
    title: 'Operational reporting',
    description:
      'A recurring summary assembled from your existing tools, delivered on a schedule, showing the few numbers a decision actually depends on.',
    fitFor: 'Owners who only find out about a problem after the month closes.',
  },
] as const;

export type Step = { title: string; body: string };

export const engagementSteps: readonly Step[] = [
  {
    title: 'You describe the problem',
    body: 'Send an enquiry or message on WhatsApp describing what is slow, manual, or dependent on you. No form-filling marathon.',
  },
  {
    title: 'We check fit honestly',
    body: 'A short conversation about the workflow, the constraints, and the budget. If TRL is not the right answer, we say so.',
  },
  {
    title: 'We agree scope in writing',
    body: 'Before any work starts you get the scope, the deliverables, the exclusions, and the price from the approved offer.',
  },
  {
    title: 'We build and hand over',
    body: 'We build the agreed system, document it, and walk you through it, with a defined window afterwards to correct anything that is off.',
  },
] as const;

/** Truthful operating principles used instead of unearned social proof. */
export const principles: readonly Step[] = [
  {
    title: 'TRL is a new firm',
    body: 'We are early, and we say so. There are no client logos, testimonials, or case studies on this site because there is nothing yet that we can honestly show.',
  },
  {
    title: 'Scope before payment',
    body: 'You see the scope, the deliverables, and the exclusions in writing before you pay for anything.',
  },
  {
    title: 'You own what we build',
    body: 'Systems are built in tools you own or approve, and handed over with documentation. Nothing is locked behind us.',
  },
  {
    title: 'We turn work down',
    body: 'If automation is not the real fix, or the budget does not match the problem, we will tell you rather than sell you the nearest offer.',
  },
] as const;

export const navigation = [
  { href: '/', label: 'Home' },
  { href: '/services/', label: 'Services' },
  { href: '/ai-solutions/', label: 'AI solutions' },
  { href: '/offers/', label: 'Offers' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const legalNavigation = [
  { href: '/privacy/', label: 'Privacy' },
  { href: '/terms/', label: 'Terms' },
] as const;
