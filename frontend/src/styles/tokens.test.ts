import css from './tokens.css?raw'

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)
  if (!match?.[1]) throw new Error(`Token --${name} not found`)
  return match[1]
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r = 0, g = 0, b = 0] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (high + 0.05) / (low + 0.05)
}

describe('design tokens', () => {
  it('keeps the CLAUDE.md brand values', () => {
    expect(token('color-midnight-navy')).toBe('#0d1b2a')
    expect(token('color-governance-indigo')).toBe('#4656e8')
    expect(token('color-mineral-teal')).toBe('#0f9d8a')
    expect(token('color-muted-gold')).toBe('#c99a3d')
  })

  // WCAG 2.2 AA: 4.5:1 for normal text.
  it.each([
    ['color-ink', 'color-white'],
    ['color-ink', 'color-cloud-grey'],
    ['color-slate', 'color-white'],
    ['color-slate', 'color-cloud-grey'],
    ['color-governance-indigo', 'color-white'],
    ['color-white', 'color-governance-indigo'],
    ['color-nav-text', 'color-midnight-navy'],
    ['color-nav-muted', 'color-midnight-navy'],
    ['color-white', 'color-nav-active-bg'],
    ['color-muted-gold', 'color-midnight-navy'],
    ['color-success-ink', 'color-success-tint'],
    ['color-warning-ink', 'color-warning-tint'],
    ['color-critical-ink', 'color-critical-tint'],
    ['color-info-ink', 'color-info-tint'],
    ['color-neutral-ink', 'color-neutral-tint'],
    ['color-evidence-ink', 'color-evidence-tint'],
    ['color-ink', 'color-evidence-tint'],
  ])('text %s on %s meets 4.5:1', (fg, bg) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5)
  })

  // WCAG 2.2 AA: 3:1 for icons, borders of controls and status indicators.
  it.each([
    ['color-success', 'color-white'],
    ['color-warning', 'color-white'],
    ['color-critical', 'color-white'],
    ['color-info', 'color-white'],
    ['color-mineral-teal', 'color-white'],
    ['color-field-border', 'color-white'],
  ])('non-text %s on %s meets 3:1', (fg, bg) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(3)
  })
})
