import { useState } from 'react'
import { Link } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { hasPermission } from '../auth/permissions'
import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'
import {
  ETHICS_STEPS,
  advanceWorkflow,
  loadWorkflow,
  postureFromWorkflow,
  type EthicsDecision,
  type EthicsWorkflow,
  type EvidenceObject,
} from './workflow'

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function EthicalPosture({ owner, systemId }: { owner: string; systemId: string }) {
  const workflow = loadWorkflow(systemId)
  const posture = postureFromWorkflow(workflow)
  return (
    <section className="gate gate-warning" aria-label="Ethical release">
      <h2>Ethical release</h2>
      <dl className="facts">
        <div className="fact"><dt>Overall ethical risk</dt><dd>{posture.risk}</dd></div>
        <div className="fact"><dt>Release state</dt><dd>{posture.release}</dd></div>
        <div className="fact"><dt>Open Critical or High ethical findings</dt><dd>{workflow.decision === 'Reject' ? 'Decision recorded: Reject' : 'See the ethics workbench'}</dd></div>
        <div className="fact"><dt>Evidence completeness</dt><dd>{workflow.evidence.length === 0 ? 'No evidence object yet' : `${workflow.evidence.length} evidence object(s)`}</dd></div>
        <div className="fact"><dt>Next required action</dt><dd>{posture.next}</dd></div>
        <div className="fact"><dt>Accountable owner</dt><dd>{owner}</dd></div>
      </dl>
      <p>
        Use-case recommendation and release state stay separate. A deterministic policy engine can draft. It cannot approve.
        {' '}
        <Link to="ethics">Open the ethics workbench</Link>.
      </p>
    </section>
  )
}

export function EthicsWorkbench({ systemId, systemName }: { systemId: string; systemName: string }) {
  const { session } = useAuth()
  const author = session?.persona.display_name || 'Named reviewer'
  const role = session?.persona.role
  const roleLabel = session?.persona.role ?? ''
  const canRecord = hasPermission(role, 'manage_governance_program')
    || hasPermission(role, 'maintain_assigned_systems')
    || hasPermission(role, 'review_privacy')
    || hasPermission(role, 'approve_executive_decision')
  const [workflow, setWorkflow] = useState<EthicsWorkflow>(() => loadWorkflow(systemId))
  const [rationale, setRationale] = useState('')
  const [decision, setDecision] = useState<EthicsDecision>('Mitigate')
  const [condition, setCondition] = useState('')
  const step = ETHICS_STEPS[workflow.current]
  const readOnly = !canRecord

  const commit = () => {
    if (readOnly || !step) return
    void (async () => {
      const evidence: EvidenceObject[] =
        step.id === 'evidence'
          ? [
              ...workflow.evidence,
              {
                id: `EV-${crypto.randomUUID()}`,
                title: `${systemName} ethical review package`,
                documentType: 'Review package',
                source: 'Uploaded in the ethics workbench',
                owner: author,
                uploader: author,
                createdOn: new Date().toISOString().slice(0, 10),
                reviewedOn: '',
                version: '1',
                hash: await sha256Hex(`${systemId}|${rationale.trim()}`),
                expiresOn: '',
                linkedControl: 'Responsible AI assessment',
                linkedSystem: systemId,
                lifecycleStage: 'Independent validation',
                linkedFinding: '',
                validation: 'Pending',
                validator: '',
                supersededBy: '',
              },
            ]
          : workflow.evidence
      setWorkflow(
        advanceWorkflow(workflow, author, roleLabel, rationale, {
          decision: step.id === 'decision' ? decision : workflow.decision,
          conditions: step.id === 'conditions' && condition.trim() ? [...workflow.conditions, condition.trim()] : workflow.conditions,
          evidence,
        }, step.id === 'review' || step.id === 'decision' ? author : ''),
      )
      setRationale('')
      setCondition('')
    })()
  }

  return (
    <div className="stack">
      <Card title="Ethics and data workbench" description={`${systemName}. Each step records the author, time, rationale and status. This is the system record, not a separate demonstration fixture.`}>
        <ol className="home-lifecycle">
          {ETHICS_STEPS.map((item, index) => (
            <li key={item.id}>
              {index < workflow.current ? 'Recorded' : index === workflow.current ? 'Current' : 'Not started'} — {item.title}
            </li>
          ))}
        </ol>
        {step && !readOnly ? (
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault()
              commit()
            }}
          >
            <p><strong>Current step:</strong> {step.title}</p>
            {step.id === 'decision' ? (
              <label className="field">
                <span>Decision</span>
                <select value={decision} onChange={(event) => setDecision(event.target.value as EthicsDecision)}>
                  <option value="Proceed">Proceed</option>
                  <option value="Mitigate">Mitigate</option>
                  <option value="Reject">Reject</option>
                </select>
              </label>
            ) : null}
            {step.id === 'conditions' ? (
              <label className="field">
                <span>Release condition</span>
                <input value={condition} onChange={(event) => setCondition(event.target.value)} required />
              </label>
            ) : null}
            <label className="field">
              <span>Rationale</span>
              <textarea value={rationale} onChange={(event) => setRationale(event.target.value)} required minLength={8} />
            </label>
            <button type="submit" className="button button-primary">Record {step.title}</button>
          </form>
        ) : null}
        {readOnly ? <p>This role can read the workbench. It cannot record an assessment step.</p> : null}
        {!step ? <p><StatusBadge label="Complete" /> The assessment steps are recorded. Continue monitoring from the conditions below.</p> : null}
      </Card>
      {workflow.evidence.length > 0 ? (
        <Card title="Evidence objects" description="Each object has an identifier, version and hash. A label alone is not evidence.">
          <DataTable
            caption="Evidence objects"
            rows={workflow.evidence}
            rowKey={(row) => row.id}
            columns={[
              { header: 'ID', mono: true, cell: (row) => row.id },
              { header: 'Title', cell: (row) => row.title },
              { header: 'Version', cell: (row) => row.version },
              { header: 'Hash', mono: true, cell: (row) => row.hash },
              { header: 'Validation', cell: (row) => <StatusBadge label={row.validation} /> },
              { header: 'Uploader', cell: (row) => row.uploader },
            ]}
          />
        </Card>
      ) : null}
      {workflow.conditions.length > 0 ? (
        <Card title="Release conditions">
          <ul>{workflow.conditions.map((item) => <li key={item}>{item}</li>)}</ul>
        </Card>
      ) : null}
      <Card title="Status history" description="Append-only workflow record. Each event stores the workflow, step, system, status, previous status, author, role, rationale, timestamp, linked evidence and reviewer, and a recorded event is not edited. This preview keeps that record in this browser after refresh. The governance service stores the same event.">
        {workflow.events.length === 0 ? <p>No step has been recorded.</p> : (
          <DataTable
            caption="Ethics workflow history"
            rows={workflow.events}
            rowKey={(row) => row.eventId}
            columns={[
              { header: 'When (UTC)', cell: (row) => row.at.replace('T', ' ').replace(/\.\d+Z$/, 'Z').replace('Z', '') },
              { header: 'Author', cell: (row) => row.author },
              { header: 'Role', cell: (row) => row.role },
              { header: 'Step', cell: (row) => row.stepId },
              { header: 'Previous status', cell: (row) => row.previousStatus },
              { header: 'Status', cell: (row) => row.status },
              { header: 'Rationale', cell: (row) => row.rationale },
              { header: 'Evidence', mono: true, cell: (row) => row.evidenceIds.join(', ') || 'None' },
              { header: 'Reviewer', cell: (row) => row.reviewer || 'Not assigned' },
            ]}
          />
        )}
      </Card>
    </div>
  )
}
