import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { EmptyState } from '../components/EmptyState'
import { useAuth } from './AuthContext'
import { hasPermission, type Permission } from './permissions'

interface RequirePermissionProps {
  permission: Permission | Permission[]
  /** When every listed permission is denied, show this instead of children. */
  children: ReactNode
  fallbackTitle?: string
  fallbackDescription?: string
}

/** Route-level gate. Prefer this over hiding a button alone. */
export function RequirePermission({
  permission,
  children,
  fallbackTitle = 'You do not have access',
  fallbackDescription = 'This action needs a different organization role. Ask a governance lead or platform administrator if you need a change.',
}: RequirePermissionProps) {
  const { session } = useAuth()
  const role = session?.persona.role
  const required = Array.isArray(permission) ? permission : [permission]
  const allowed = required.some((item) => hasPermission(role, item))
  if (!allowed) {
    return (
      <EmptyState
        title={fallbackTitle}
        nextStep={fallbackDescription}
        action={<Link to="/">Back to Overview</Link>}
      />
    )
  }
  return children
}
