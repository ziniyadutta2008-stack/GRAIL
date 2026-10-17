import { useState, type KeyboardEvent } from 'react'
import { NavLink, Outlet } from 'react-router'

import { LENS_LABELS, useLens, type Lens } from '../app/LensContext'
import { useAuth } from '../auth/AuthContext'
import { useOrganization } from '../auth/organizationName'
import { canRenameOrganization } from '../auth/permissions'
import { ROLE_LABELS, type Role } from '../auth/session'
import { DATA_AS_OF } from '../demo/demoData'
import { primaryNavFor } from '../navigation/navigation'
import { ExecutionModeNote } from '../agents/ExecutionModeNote'
import { Icon } from './Icon'

function PrimaryNav({ role, onNavigate }: { role: Role; onNavigate: () => void }) {
  return (
    <nav aria-label="Primary" className="primary-nav">
      <ul>
        {primaryNavFor(role).map((item) => (
          <li key={item.path}>
            <NavLink to={item.path} end={item.path === '/'} onClick={onNavigate}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function LensSwitch() {
  const { lens, setLens } = useLens()
  return (
    <label className="lens-switch">
      <span className="visually-hidden">Presentation lens</span>
      <select value={lens} onChange={(event) => setLens(event.target.value as Lens)}>
        {(Object.keys(LENS_LABELS) as Lens[]).map((key) => (
          <option key={key} value={key}>
            {LENS_LABELS[key]}
          </option>
        ))}
      </select>
    </label>
  )
}

export function AppShell() {
  const { session, signOut } = useAuth()
  const { name, rename } = useOrganization()
  const [navOpen, setNavOpen] = useState(false)
  const [draft, setDraft] = useState(name)
  const [syncedName, setSyncedName] = useState(name)
  if (name !== syncedName) {
    setSyncedName(name)
    setDraft(name)
  }
  if (!session) return null

  const canRename = canRenameOrganization(session.persona.role)

  const commitName = () => {
    if (!canRename) {
      setDraft(name)
      return
    }
    const next = draft.trim()
    if (!next) {
      setDraft(name)
      return
    }
    rename(next)
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <aside className={`sidebar${navOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            G
          </span>
          <div>
            <p className="brand-name">GRAIL</p>
            <p className="brand-descriptor">AI governance control plane</p>
          </div>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={navOpen}
            aria-controls="primary-navigation"
            onClick={() => setNavOpen((open) => !open)}
          >
            <Icon name="menu" />
            <span className="visually-hidden">Menu</span>
          </button>
        </div>
        <div id="primary-navigation" className="sidebar-nav">
          <PrimaryNav role={session.persona.role} onNavigate={() => setNavOpen(false)} />
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-context">
            <label className="topbar-org">
              <span>Organization</span>
              <input
                type="text"
                value={draft}
                maxLength={120}
                readOnly={!canRename}
                aria-readonly={!canRename}
                onChange={(event) => {
                  if (!canRename) return
                  setDraft(event.target.value)
                }}
                onBlur={commitName}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                }}
              />
            </label>
            <p className="muted topbar-meta">
              Data as of <time dateTime={DATA_AS_OF}>{DATA_AS_OF}</time>
              {session.synthetic ? ' · Synthetic demonstration data' : null}
            </p>
            <ExecutionModeNote />
          </div>
          <div className="topbar-actions">
            <LensSwitch />
            <div className="topbar-user">
              <p>{session.persona.display_name || 'Model owner'}</p>
              <p className="muted">
                {session.persona.title === ROLE_LABELS[session.persona.role]
                  ? ROLE_LABELS[session.persona.role]
                  : `${session.persona.title} · ${ROLE_LABELS[session.persona.role]}`}
              </p>
            </div>
            <button type="button" className="button button-secondary" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>
        <main id="main" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
