import { Link, useParams } from 'react-router'

import { useAuth } from '../../auth/AuthContext'
import type { Role } from '../../auth/session'
import { assessmentsFor } from '../../assessments/catalog'
import { Card } from '../../components/Card'
import { DataTable } from '../../components/DataTable'
import { DecisionPanel } from '../../components/DecisionPanel'
import { EmptyState } from '../../components/EmptyState'
import { StatusBadge } from '../../components/StatusBadge'
import { useWorkflow } from '../../workflows/store'
import { useSystem } from './SystemLayout'

const SUBMIT_ROLES: Role[] = ['governance_lead', 'system_owner']

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function SystemAssessments() {
  const system = useSystem()
  const { overlay } = useWorkflow()
  const rows = assessmentsFor(system)
  return (
    <Card
      title="Assessments"
      description="Impact, privacy, rights, model risk, security, vendor, and regulatory applicability for this system. A framework gap assessment stays under Assess and Control. Approving a record here does not change the lifecycle gate."
    >
      <DataTable
        caption="Assessment records"
        rows={rows}
        rowKey={(row) => row.id}
        columns={[
          { header: 'Assessment', cell: (row) => <Link to={`/ai-estate/${system.id}/assessments/${row.id}`}>{row.title}</Link> },
          { header: 'Version', mono: true, cell: (row) => row.version },
          { header: 'Status', cell: (row) => <StatusBadge label={overlay(row.id, row.status).state} /> },
          { header: 'Owner', cell: (row) => row.owner },
          { header: 'Reviewer', cell: (row) => row.reviewer },
          { header: 'Due', cell: (row) => row.dueDate },
        ]}
      />
    </Card>
  )
}

export function AssessmentRecord() {
  const system = useSystem()
  const { assessmentId } = useParams()
  const { session } = useAuth()
  const { overlay, decide, submitForReview } = useWorkflow()
  const record = assessmentsFor(system).find((item) => item.id === assessmentId)
  if (!record) {
    return <EmptyState title="This assessment is not on the record" nextStep="Return to the assessments for this system." action={<Link to={`/ai-estate/${system.id}/assessments`}>All assessments</Link>} />
  }
  const item = overlay(record.id, record.status)
  const actor = session?.persona.display_name || (session?.persona.perSystem ? 'Model owner' : 'Named reviewer')
  const role = session?.persona.role
  const canSubmit = record.status === 'Draft' && item.state === 'Draft' && role !== undefined && SUBMIT_ROLES.includes(role)
  const canDecide = role === record.reviewerRole && item.state === 'In Review'
  const history = record.history.map((event) => `${event.status} by ${event.actor} on ${event.at}${event.comments ? `: ${event.comments}` : ''}`)
  return (
    <div className="stack">
      <Card
        title={record.title}
        description={`${system.name} · version ${record.version}`}
        action={<span className="button-row"><Link to={`/ai-estate/${system.id}/assessments`}>All assessments</Link><StatusBadge label={item.state} /></span>}
      >
        <dl className="facts">
          <Fact label="Owner" value={record.owner} />
          <Fact label="Reviewer" value={record.reviewer} />
          <Fact label="Version" value={record.version} />
          <Fact label="Status" value={item.state} />
          <Fact label="Due" value={record.dueDate} />
        </dl>
        <p>{record.disclaimer}</p>
      </Card>
      <Card title="Answers">
        <DataTable
          caption="Assessment answers"
          rows={record.answers}
          rowKey={(answer) => answer.question}
          columns={[
            { header: 'Question', cell: (answer) => answer.question },
            { header: 'Answer', cell: (answer) => answer.answer },
          ]}
        />
      </Card>
      <Card title="Rationale">
        <p>{record.rationale}</p>
      </Card>
      <Card title="Supporting evidence" description="A referenced source is not attached evidence. Status stays short of Approved until a file is on the record.">
        <DataTable
          caption="Supporting evidence"
          rows={record.evidence}
          rowKey={(row) => row.label}
          columns={[
            { header: 'Evidence', cell: (row) => row.label },
            { header: 'Reference', cell: (row) => row.reference },
            { header: 'Status', cell: (row) => <StatusBadge label={row.status} /> },
          ]}
        />
      </Card>
      <Card title="Approval history">
        <ul>
          {history.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Card>
      {canSubmit ? (
        <div className="button-row">
          <button type="button" className="button button-primary" onClick={() => submitForReview(record.id, actor)}>
            Submit to {record.reviewer}
          </button>
        </div>
      ) : null}
      <DecisionPanel
        approver={record.reviewer}
        actor={actor}
        canDecide={canDecide}
        closed={item.state === 'Approved' || item.state === 'Rejected'}
        reviews={item.reviews}
        onDecide={(status, comments) => decide(record.id, record.status, status, comments, actor)}
        waiting={canSubmit ? `Submit this draft to ${record.reviewer}. The reviewer decides it after submission.` : item.state === 'Draft' ? `This draft waits for the owner to submit it. ${record.reviewer} decides it after submission.` : `Waiting for ${record.reviewer}.`}
        closedNote="This decision is recorded. The lifecycle gate, findings, evidence, and legal classification are unchanged."
      />
    </div>
  )
}
