import type { ButtonHTMLAttributes } from 'react'

import { Icon, type IconName } from './Icon'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon?: IconName
}

/** A compact icon control. The accessible name is the action, not the picture. */
export function IconButton({ label, icon = 'pen', className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button type={type} className={['icon-button', className].filter(Boolean).join(' ')} aria-label={label} {...props}>
      <Icon name={icon} />
    </button>
  )
}
