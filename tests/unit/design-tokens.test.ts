import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * The token layer is the implementation of docs/TRL_DESIGN_SYSTEM.md (D-009).
 * These tests pin the token values to the documented ones and recompute the
 * contrast ratios, so a palette edit that breaks WCAG 2.2 AA fails in CI.
 */

const tokensCss = readFileSync(
  join(process.cwd(), 'src', 'styles', 'tokens.css'),
  'utf8',
);

function token(name: string): string {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`token --${name} is not defined`);
  return match[1].trim();
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const palette = {
  canvas: '#f7f4ec',
  surface: '#ffffff',
  surfaceMuted: '#ece8de',
  ink: '#132a3a',
  textMuted: '#405463',
  action: '#1c607a',
  actionHover: '#124a60',
  accentSoft: '#dcecf1',
  border: '#6f7f89',
  focus: '#176b87',
  success: '#246b4d',
  danger: '#9c3434',
} as const;

describe('semantic palette matches the design system', () => {
  it.each([
    ['color-canvas', palette.canvas],
    ['color-surface', palette.surface],
    ['color-surface-muted', palette.surfaceMuted],
    ['color-ink', palette.ink],
    ['color-text-muted', palette.textMuted],
    ['color-action', palette.action],
    ['color-action-hover', palette.actionHover],
    ['color-accent-soft', palette.accentSoft],
    ['color-border', palette.border],
    ['color-focus', palette.focus],
    ['color-success', palette.success],
    ['color-danger', palette.danger],
  ])('--%s is %s', (name, value) => {
    expect(token(name)).toBe(value);
  });
});

describe('documented contrast ratios still hold', () => {
  const documented: [string, string, string, number][] = [
    ['ink on canvas', palette.ink, palette.canvas, 13.46],
    ['muted text on canvas', palette.textMuted, palette.canvas, 7.17],
    ['white on action', palette.surface, palette.action, 6.99],
    ['action on soft accent', palette.action, palette.accentSoft, 5.76],
    ['border against white', palette.border, palette.surface, 4.14],
    ['border against canvas', palette.border, palette.canvas, 3.77],
    ['border against muted surface', palette.border, palette.surfaceMuted, 3.38],
    ['border against soft accent', palette.border, palette.accentSoft, 3.41],
    ['focus on canvas', palette.focus, palette.canvas, 5.48],
    ['inverse focus on ink', palette.canvas, palette.ink, 13.46],
    ['white on success', palette.surface, palette.success, 6.39],
    ['white on danger', palette.surface, palette.danger, 7.11],
    ['ink on white surface', palette.ink, palette.surface, 14.79],
    ['white on action hover', palette.surface, palette.actionHover, 9.66],
    ['soft accent on ink', palette.accentSoft, palette.ink, 12.19],
    ['action on canvas', palette.action, palette.canvas, 6.36],
    ['focus on white surface', palette.focus, palette.surface, 6.02],
    ['focus on muted surface', palette.focus, palette.surfaceMuted, 4.92],
  ];

  it.each(documented)('%s is %s', (_label, a, b, expected) => {
    expect(contrast(a, b)).toBeCloseTo(expected, 1);
  });
});

describe('WCAG 2.2 AA thresholds for the pairings actually used', () => {
  const normalText: [string, string, string][] = [
    ['ink on canvas', palette.ink, palette.canvas],
    ['ink on surface', palette.ink, palette.surface],
    ['ink on muted surface', palette.ink, palette.surfaceMuted],
    ['ink on soft accent', palette.ink, palette.accentSoft],
    ['muted text on canvas', palette.textMuted, palette.canvas],
    ['muted text on surface', palette.textMuted, palette.surface],
    ['muted text on muted surface', palette.textMuted, palette.surfaceMuted],
    ['action on canvas', palette.action, palette.canvas],
    ['action on surface', palette.action, palette.surface],
    ['action on muted surface', palette.action, palette.surfaceMuted],
    ['action on soft accent', palette.action, palette.accentSoft],
    ['action hover on canvas', palette.actionHover, palette.canvas],
    ['white on action', palette.surface, palette.action],
    ['white on action hover', palette.surface, palette.actionHover],
    ['canvas on ink', palette.canvas, palette.ink],
    ['soft accent on ink', palette.accentSoft, palette.ink],
    ['danger on canvas', palette.danger, palette.canvas],
    ['danger on surface', palette.danger, palette.surface],
    ['success on surface', palette.success, palette.surface],
  ];

  it.each(normalText)('%s meets 4.5:1', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  const nonText: [string, string, string][] = [
    ['border on canvas', palette.border, palette.canvas],
    ['border on surface', palette.border, palette.surface],
    ['border on muted surface', palette.border, palette.surfaceMuted],
    ['border on soft accent', palette.border, palette.accentSoft],
    ['focus ring on canvas', palette.focus, palette.canvas],
    ['focus ring on surface', palette.focus, palette.surface],
    ['focus ring on muted surface', palette.focus, palette.surfaceMuted],
    ['focus ring on soft accent', palette.focus, palette.accentSoft],
    ['inverse focus ring on ink', palette.canvas, palette.ink],
    ['action rule on surface', palette.action, palette.surface],
  ];

  it.each(nonText)('%s meets 3:1', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('structural tokens match the design system', () => {
  it.each([
    ['space-1', '0.25rem'],
    ['space-4', '1rem'],
    ['space-24', '6rem'],
    ['radius-sm', '0.375rem'],
    ['radius-md', '0.75rem'],
    ['container-wide', '80rem'],
    ['container-content', '72rem'],
    ['measure-body', '65ch'],
    ['measure-lead', '52ch'],
    ['control-height', '48px'],
    ['target-min', '44px'],
    ['duration-default', '160ms'],
    ['duration-complex', '240ms'],
    ['ease-default', 'cubic-bezier(0.2, 0.7, 0.2, 1)'],
    ['focus-width', '3px'],
    ['focus-offset', '3px'],
    ['text-body', '1rem'],
    ['text-small', '0.875rem'],
    ['text-label', '0.75rem'],
  ])('--%s is %s', (name, value) => {
    expect(token(name)).toBe(value);
  });

  it('defines the fluid type steps with clamp so text can still be resized', () => {
    for (const name of ['text-hero', 'text-display', 'text-h2', 'text-h3', 'text-lead']) {
      expect(token(name)).toMatch(/^clamp\(/);
      expect(token(name)).toContain('rem');
    }
  });

  it('self-hosts both families and requests no third-party font', () => {
    expect(tokensCss).toContain("url('/fonts/newsreader-latin-500-normal.woff2')");
    expect(tokensCss).toContain("url('/fonts/manrope-latin-wght-normal.woff2')");
    expect(tokensCss).not.toMatch(/https?:\/\//);
  });

  it('keeps the documented fallback stacks', () => {
    expect(token('font-display')).toContain('Georgia');
    expect(token('font-body')).toContain('Inter');
  });
});

describe('global stylesheet honours the interaction contract', () => {
  const globalCss = readFileSync(
    join(process.cwd(), 'src', 'styles', 'global.css'),
    'utf8',
  );

  it('provides a visible focus replacement wherever the outline is styled', () => {
    expect(globalCss).toContain(':focus-visible');
    expect(globalCss).toContain('outline: var(--focus-width) solid var(--color-focus)');
  });

  it('honours prefers-reduced-motion', () => {
    expect(globalCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(globalCss).toContain('scroll-behavior: auto');
  });

  it('retains borders and focus cues in forced-colors mode', () => {
    expect(globalCss).toContain('@media (forced-colors: active)');
  });
});
