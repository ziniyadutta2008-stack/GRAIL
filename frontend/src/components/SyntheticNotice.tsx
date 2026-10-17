import { Icon } from './Icon'

export const SYNTHETIC_LABEL = 'Synthetic demonstration data'

/** Shown on every screen that renders seeded records. */
export function SyntheticNotice() {
  return (
    <p className="synthetic-notice">
      <Icon name="info" size={16} />
      <span>
        <strong>{SYNTHETIC_LABEL}.</strong> Records are seeded from portfolio demonstrations and are not evidence that
        any organization is certified, attested or compliant.
      </span>
    </p>
  )
}
