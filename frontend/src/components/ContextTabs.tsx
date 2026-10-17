import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

export interface TabLink {
  label: string
  to: string
  /** Match only the exact path (used for the default tab). */
  end?: boolean
  /** A control rendered beside the tab label, outside the navigation link. */
  accessory?: ReactNode
}

/**
 * Contextual, route-based tabs. They are links, so the browser Back button and
 * deep links behave predictably; the active tab is announced with aria-current.
 */
export function ContextTabs({ label, tabs }: { label: string; tabs: TabLink[] }) {
  return (
    <nav aria-label={label} className="context-tabs">
      <ul>
        {tabs.map((tab) => (
          <li key={tab.to} className={tab.accessory ? 'tab-with-hint' : undefined}>
            <NavLink to={tab.to} end={tab.end ?? false}>
              {tab.label}
            </NavLink>
            {tab.accessory}
          </li>
        ))}
      </ul>
    </nav>
  )
}
