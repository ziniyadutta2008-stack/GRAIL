import { useState, type FormEvent } from 'react'

import { ExecutionModeNote } from '../agents/ExecutionModeNote'
import { COUNCIL_SECRETARIAT_PROPOSAL } from '../agents/deployedAgents'
import { DETERMINISTIC_AGENT_MODE } from '../agents/mode'
import { RunAgentButton } from '../agents/RunAgentButton'
import { config } from '../app/config'
import { useAuth } from '../auth/AuthContext'
import { canEditDirectory } from '../auth/permissions'
import { usePersonas } from '../auth/personaDirectory'
import { ROLE_LABELS, type Persona } from '../auth/session'
import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { IconButton } from '../components/IconButton'
import { auditRecords } from '../demo/demoData'
import { PRIMARY_NAV } from '../navigation/navigation'
import { AreaLayout } from './AreaLayout'

export function ReportsLayout() {
  return (
    <AreaLayout
      title="Reports and Audit"
      description="Council packs, readiness reports, exports and the immutable audit trail."
      tabs={[
        { label: 'Council packs', to: '/reports', end: true },
        { label: 'Audit trail', to: '/reports/audit-trail' },
      ]}
    />
  )
}

export function CouncilPacks() {
  return (
    <Card
      title="Council packs"
      description="The Council Secretariat Agent drafts the pack. An executive decision is recorded only when a named person decides."
      action={<RunAgentButton proposal={COUNCIL_SECRETARIAT_PROPOSAL} label="Run Council Secretariat Agent" />}
    >
      <ExecutionModeNote />
      <p>{COUNCIL_SECRETARIAT_PROPOSAL.proposedChange}</p>
      <p className="muted">{DETERMINISTIC_AGENT_MODE} No model was called. This is not a board minute or an audit opinion.</p>
    </Card>
  )
}

export function AuditTrail() {
  const { personas } = usePersonas()
  return (
    <Card title="Audit trail" description="Append-only application events. Times are UTC.">
      <DataTable
        caption="Audit events"
        rows={auditRecords}
        rowKey={(e) => e.id}
        columns={[
          { header: 'When (UTC)', cell: (e) => e.occurred_at.replace('T', ' ').replace('Z', '') },
          { header: 'Actor', cell: (e) => personas.find((p) => p.id === e.actor)?.display_name ?? 'GRAIL rule engine' },
          { header: 'Action', mono: true, cell: (e) => e.action },
          { header: 'Record', mono: true, cell: (e) => e.entity_id },
          { header: 'Reason', cell: (e) => e.reason },
        ]}
      />
    </Card>
  )
}

export function AdministrationLayout() {
  return (
    <AreaLayout
      title="Administration"
      description="Users, roles, frameworks, templates, integrations and configuration."
      tabs={[
        { label: 'Users and roles', to: '/administration', end: true },
        { label: 'Configuration', to: '/administration/configuration' },
      ]}
    />
  )
}

export function UsersAndRoles() {
  const { session } = useAuth()
  const canEdit = canEditDirectory(session?.persona.role)
  const { personas, updatePersona } = usePersonas()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ display_name: '', title: '', delegate: '' })
  const [error, setError] = useState('')

  const start = (persona: Persona) => {
    if (!canEdit) return
    setEditingId(persona.id)
    setDraft({ display_name: persona.display_name, title: persona.title, delegate: persona.delegate ?? '' })
    setError('')
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    if (!canEdit || !editingId) return
    if (!draft.display_name.trim() || !draft.title.trim()) {
      setError('Enter both a name and a title.')
      return
    }
    updatePersona(editingId, draft)
    setEditingId(null)
    setError('')
  }

  return (
    <Card
      title="Users and roles"
      description="Names and delegates are for the organization. The model owner is blank because each AI system names its own. The sign-in list uses the same names. Roles stay assigned."
    >
      <form onSubmit={save} noValidate>
        <DataTable
          caption="Demo organization users"
          rows={personas}
          rowKey={(p) => p.id}
          rowClassName={(p) => (p.perSystem ? 'is-per-system' : undefined)}
          columns={[
            {
              header: 'Name',
              cell: (p) =>
                p.perSystem ? (
                  <span className="muted">—</span>
                ) : editingId === p.id ? (
                  <>
                    <label className="visually-hidden" htmlFor={`persona-name-${p.id}`}>
                      Name for {p.display_name}
                    </label>
                    <input
                      id={`persona-name-${p.id}`}
                      value={draft.display_name}
                      onChange={(event) => setDraft({ ...draft, display_name: event.target.value })}
                      required
                    />
                  </>
                ) : (
                  p.display_name
                ),
            },
            {
              header: 'Title',
              cell: (p) =>
                editingId === p.id ? (
                  <>
                    <label className="visually-hidden" htmlFor={`persona-title-${p.id}`}>
                      Title for {p.display_name}
                    </label>
                    <input
                      id={`persona-title-${p.id}`}
                      value={draft.title}
                      onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                      required
                    />
                  </>
                ) : (
                  p.title
                ),
            },
            {
              header: 'Delegate',
              cell: (p) =>
                p.perSystem ? (
                  <span className="muted">—</span>
                ) : editingId === p.id ? (
                  <>
                    <label className="visually-hidden" htmlFor={`persona-delegate-${p.id}`}>
                      Delegate for {p.display_name}
                    </label>
                    <input
                      id={`persona-delegate-${p.id}`}
                      value={draft.delegate}
                      onChange={(event) => setDraft({ ...draft, delegate: event.target.value })}
                    />
                  </>
                ) : (
                  p.delegate || '—'
                ),
            },
            { header: 'Role', cell: (p) => ROLE_LABELS[p.role] },
            {
              header: 'Edit',
              cell: (p) =>
                !canEdit || p.perSystem ? (
                  <span className="muted">—</span>
                ) : editingId === p.id ? (
                  <span className="review-edit">
                    <button type="submit" className="button button-primary">
                      Save name and title
                    </button>
                    <button type="button" className="button button-secondary" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </span>
                ) : (
                  <IconButton label={`Edit name and title for ${p.display_name}`} onClick={() => start(p)} />
                ),
            },
          ]}
        />
        {error ? <p role="alert">{error}</p> : null}
      </form>
    </Card>
  )
}

export function Configuration() {
  const rows = [
    { setting: 'Sign-in mode', value: config.authMode === 'development-stub' ? 'Local development personas' : config.authMode === 'cognito' ? 'Organization sign-in' : 'Not configured' },
    { setting: 'AI assistance', value: 'This demonstration runs agents in deterministic mode. Production deployments can optionally use Amazon Bedrock for evidence-grounded drafting. Six workers draft reviews for a named person: Governance Intake, Framework Mapping, Evidence and Assurance, Gap and Remediation, Policy and Exception Drafting, and Council Secretariat. No model was called.' },
    { setting: 'Primary navigation areas', value: String(PRIMARY_NAV.length) },
  ]
  return (
    <Card title="Configuration">
      <DataTable caption="Environment configuration" rows={rows} rowKey={(r) => r.setting} columns={[{ header: 'Setting', cell: (r) => r.setting }, { header: 'Value', cell: (r) => r.value }]} />
    </Card>
  )
}
