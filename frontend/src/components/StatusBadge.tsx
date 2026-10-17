import { Icon } from './Icon'
import { toneFor, type Tone } from './status'

interface StatusBadgeProps {
  label: string
  tone?: Tone
  /** Extra qualifier shown after the label, for example "Evidence stale". */
  qualifier?: string | undefined
}

/** Status is always communicated by text and icon, never by colour alone. */
export function StatusBadge({ label, tone, qualifier }: StatusBadgeProps) {
  const resolved = tone ?? toneFor(label)
  return (
    <span className={`status status-${resolved}`}>
      <Icon name={resolved === 'evidence' ? 'evidence' : resolved} size={14} />
      <span>
        {label}
        {qualifier ? <span className="status-qualifier"> — {qualifier}</span> : null}
      </span>
    </span>
  )
}
