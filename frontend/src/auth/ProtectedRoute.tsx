import { Navigate, Outlet, useLocation } from 'react-router'

import { HomePage } from '../home/HomePage'
import { useAuth } from './AuthContext'

/**
 * Unauthenticated visitors see the public homepage at `/`.
 * Every other protected path redirects to sign-in, preserving the destination.
 * Authenticated visitors continue into the workspace shell.
 */
export function ProtectedRoute() {
  const { session } = useAuth()
  const location = useLocation()
  if (!session) {
    if (location.pathname === '/') return <HomePage />
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
