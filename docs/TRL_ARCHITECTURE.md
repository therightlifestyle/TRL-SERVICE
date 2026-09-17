# TRL — Architecture

## Current state

No application architecture has been implemented yet. This document records constraints and the intended decision process rather than pretending that a stack has already been selected.

## Phase 1 architecture goals

- A maintainable, responsive public company website.
- Clear service and offer presentation.
- A real contact/inquiry pathway with server-side validation when implemented.
- Payment-ready offer flow without prematurely integrating a payment provider.
- Secure environment-variable handling.
- Good SEO, accessibility, performance, and observability foundations.
- A structure that can later support additional TRL products without building fake future products now.

## Principles

1. Prefer the simplest architecture that meets the real requirements.
2. Keep public presentation, lead capture, and future service operations separable.
3. Make data flow explicit and validate at trust boundaries.
4. Use relative browser URLs and environment-based server configuration.
5. Keep secrets server-side and out of documentation, bundles, and logs.
6. Avoid dependencies and infrastructure that do not solve a current Phase 1 problem.

## Decisions still required at Gate 1

- Frontend/runtime and styling approach.
- Whether contact handling needs a backend in the first release, and where submissions are stored or forwarded.
- Data model and retention policy for inquiries.
- Hosting and deployment model.
- Error monitoring and health-check approach.
- Test strategy and CI checks.

These are intentionally open until requirements and founder constraints are reviewed. No provider, framework, database, or payment system is implied by this document.
