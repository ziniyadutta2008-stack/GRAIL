import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import { SYNTHETIC_LABEL } from '../components/SyntheticNotice'
import { useAuth } from './AuthContext'
import { useOrganization } from './organizationName'
import { usePersonas } from './personaDirectory'
import { DEMO_PERSONAS, ROLE_LABELS, type Persona } from './session'

function personaOption(persona: Persona): string {
  if (persona.perSystem) return 'Model owner, named on each AI system'
  const delegate = persona.delegate ? `, delegate ${persona.delegate}` : ''
  return `${persona.display_name}, ${persona.title}: ${ROLE_LABELS[persona.role]}${delegate}`
}

function Brand() {
  return (
    <div className="signin-brand">
      <span className="brand-mark" aria-hidden="true">
        G
      </span>
      <div>
        <p className="brand-name">GRAIL</p>
        <p className="muted">Governance, Risk, Assurance &amp; AI Lifecycle</p>
      </div>
    </div>
  )
}

export function SignInPage() {
  const { mode, signInAsPersona } = useAuth()
  const { personas } = usePersonas()
  const { name: organizationName } = useOrganization()
  const navigate = useNavigate()
  const location = useLocation()
  const [personaId, setPersonaId] = useState(DEMO_PERSONAS[1]?.id ?? '')
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const submit = (event: FormEvent) => {
    event.preventDefault()
    signInAsPersona(personaId)
    navigate(from, { replace: true })
  }

  return (
    <main id="main" className="signin">
      <div className="signin-panel card">
        <Brand />
        <h1>Sign in</h1>
        {mode === 'development-stub' ? (
          <form onSubmit={submit} className="stack">
            <p className="muted">
              Synthetic demonstration sign-in for {organizationName}. Choose a persona to review the screens.
              This is not organization authentication.
            </p>
            <p className="muted">
              Production sign-in is a separate design: Amazon Cognito or enterprise SSO, multi-factor authentication,
              tenant isolation, session expiry, role and group mapping, privileged-access logging, and API
              authorisation that does not trust the browser.
            </p>
            <label className="field">
              <span>Persona</span>
              <select value={personaId} onChange={(event) => setPersonaId(event.target.value)}>
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {personaOption(persona)}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="button button-primary">
              Continue
            </button>
            <p className="muted">
              <Link to="/">Back to homepage</Link>
            </p>
            <p className="muted">{SYNTHETIC_LABEL}</p>
          </form>
        ) : mode === 'cognito' ? (
          <p className="muted">Organization sign-in through Amazon Cognito is connected in the next release.</p>
        ) : (
          <p role="alert">Sign-in is not configured for this environment. Contact the platform administrator.</p>
        )}
      </div>
    </main>
  )
}
