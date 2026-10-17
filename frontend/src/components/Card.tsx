import { useId, type ReactNode } from 'react'

import type { Tone } from './status'

interface CardProps {
  title: string
  description?: string
  action?: ReactNode
  /** A control placed immediately beside the title, outside the heading text. */
  titleAccessory?: ReactNode
  children: ReactNode
  /** Heading level inside the page outline. */
  level?: 2 | 3
}

export function Card({ title, description, action, titleAccessory, children, level = 2 }: CardProps) {
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <section className="card">
      <header className="card-header">
        <div>
          <div className="card-title-row">
            <Heading>{title}</Heading>
            {titleAccessory}
          </div>
          {description ? <p className="muted card-description">{description}</p> : null}
        </div>
        {action}
      </header>
      <div className="card-body">{children}</div>
    </section>
  )
}

export interface MetricSegment {
  label: string
  value: number
  tone: Tone
}

interface MetricCardProps {
  label: string
  value: string | number
  detail: ReactNode
  /** Why the figure is what it is. Shown on hover and keyboard focus, and always available to assistive technology. */
  commentary?: string
  segments?: MetricSegment[]
}

function MetricBar({ segments }: { segments: MetricSegment[] }) {
  const summary = segments.map((segment) => `${segment.value} ${segment.label}`).join(', ')
  return (
    <div className="metric-bar" role="img" aria-label={summary}>
      {segments.map((segment) => (
        <span
          key={segment.label}
          className={`metric-segment metric-segment-${segment.value === 0 ? 'empty' : segment.tone}`}
          style={{ flexGrow: segment.value === 0 ? 0.65 : segment.value }}
        >
          {segment.value}
          <span className="visually-hidden"> {segment.label}</span>
        </span>
      ))}
    </div>
  )
}

/** Headline figure, its composition, and the reason behind the number. */
export function MetricCard({ label, value, detail, commentary, segments }: MetricCardProps) {
  const id = useId()
  return (
    // Focusable so keyboard users can reveal the commentary that hover reveals (WCAG 1.4.13).
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <section className="card metric-card" tabIndex={0} aria-labelledby={`${id}-label`} {...(commentary ? { 'aria-describedby': id } : {})}>
      <h2 id={`${id}-label`} className="metric-label">{label}</h2>
      <p className="metric-value">{value}</p>
      {segments && segments.length > 0 ? <MetricBar segments={segments} /> : null}
      <div className="metric-detail">{detail}</div>
      {commentary ? (
        <p id={id} className="metric-commentary">
          {commentary}
        </p>
      ) : null}
    </section>
  )
}
