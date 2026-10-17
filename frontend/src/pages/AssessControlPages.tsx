import { Link, useParams } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { DecisionPanel } from '../components/DecisionPanel'
import { useWorkflow } from '../workflows/store'

import { EVIDENCE_ASSURANCE_PROPOSAL, FRAMEWORK_MAPPING_PROPOSAL } from '../agents/deployedAgents'
import { RunAgentButton } from '../agents/RunAgentButton'
import type { AgentProposal } from '../intake/registry'
import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { Soc2EvidencePanel, Soc2InfoButton, Soc2ScopePanel } from '../controls/Soc2ScopePanel'
import { tscCategory } from '../controls/soc2Scope'
import { evidenceQualifier, isoRecords, soc2Records, systemById, systems } from '../demo/demoData'
import { EvidenceManager } from '../evidence/EvidenceManager'
import { evidenceSummary, useEvidence } from '../evidence/store'
import { useRegistry } from '../intake/registry'
import { useRaci } from '../raci/store'
import { AreaLayout } from './AreaLayout'

export function AssessControlLayout() {
  return (
    <AreaLayout
      title="Assess and Control"
      description="Assessments, RACI, controls, evidence, framework mappings, laws, policies, and responsible AI ethics."
      tabs={[
        { label: 'RACI', to: '/assess', end: true },
        { label: 'ISO/IEC 42001', to: '/assess/iso42001' },
        { label: 'SOC 2 readiness', to: '/assess/soc2', accessory: <Soc2InfoButton /> },
        { label: 'Laws and frameworks', to: '/assess/laws' },
        { label: 'Policies', to: '/assess/policies' },
        { label: 'Ethics and data', to: '/assess/ethics' },
      ]}
    />
  )
}

export function RaciIndex() {
  const { matrices } = useRaci()
  return (
    <Card title="RACI matrices" description="Approved versions are immutable. A submitted matrix waits for the Executive Approver.">
      <DataTable
        caption="RACI matrices"
        rows={matrices}
        rowKey={(m) => m.id}
        columns={[
          { header: 'Matrix', cell: (m) => <Link to={`/ai-estate/${m.ai_system_id}/raci`}>{m.title}</Link> },
          { header: 'Version', mono: true, cell: (m) => `v${m.version}` },
          { header: 'Tasks', cell: (m) => m.tasks.length },
          { header: 'State', cell: (m) => <StatusBadge label={m.status} qualifier={m.status === 'Submitted' ? 'awaiting Executive Approver' : undefined} /> },
        ]}
      />
    </Card>
  )
}

function listedSystems(extra: { id: string; name: string }[]) {
  const seeded = systems.map((system) => ({ id: system.id, name: system.name }))
  return [...extra.filter((system) => !seeded.some((item) => item.id === system.id)), ...seeded]
}

export function IsoIndex() {
  const { packages } = useRegistry()
  const rows = listedSystems(packages.map((item) => ({ id: item.systemId, name: item.systemName })))
  const mappingsFor = (systemId: string) => [
    ...isoRecords.filter((mapping) => mapping.ai_system_id === systemId),
    ...(packages.find((item) => item.systemId === systemId)?.iso ?? []),
  ]
  return (
    <Card
      title="ISO/IEC 42001 control mappings"
      description="Each AI system has its own mappings. A newly registered system is mapped automatically and stays Gap or Partial until evidence is reviewed. A mapping is not certification."
    >
      <DataTable
        caption="ISO/IEC 42001 by AI system"
        rows={rows}
        rowKey={(system) => system.id}
        columns={[
          { header: 'AI system', cell: (system) => <Link to={`/assess/iso42001/${system.id}`}>{system.name}</Link> },
          { header: 'Controls', cell: (system) => mappingsFor(system.id).length },
          { header: 'Gap', cell: (system) => mappingsFor(system.id).filter((mapping) => mapping.status === 'Gap').length },
          { header: 'Partial', cell: (system) => mappingsFor(system.id).filter((mapping) => mapping.status === 'Partial').length },
          { header: 'Implemented', cell: (system) => mappingsFor(system.id).filter((mapping) => mapping.status === 'Implemented').length },
        ]}
      />
    </Card>
  )
}

function mappingProposal(system: { id: string; name: string }, rows: { control_ref: string }[]): AgentProposal {
  if (system.id === 'financeguard-ai') return FRAMEWORK_MAPPING_PROPOSAL
  const refs = rows.map((row) => row.control_ref).join(', ')
  return {
    id: `proposal-${system.id}-mapping`,
    agent: 'Framework Mapping Agent',
    task: `Map ${system.name} to the controls recorded for it`,
    systemName: system.name,
    sources: rows.map((row) => row.control_ref),
    assumptions: ['Candidate mappings are not exact equivalence and are not certification.'],
    proposedChange: refs
      ? `Candidate controls for ${system.name}: ${refs}. These are candidates, not certification.`
      : `No ISO/IEC 42001 controls are mapped for ${system.name}.`,
    validation: 'This demonstration runs agents in deterministic mode. Production deployments can optionally use Amazon Bedrock for evidence-grounded drafting. No model was called. This is not an approval.',
    status: 'Draft',
    reviewerRole: 'governance_lead',
  }
}

function evidenceProposal(system: { id: string; name: string }, rows: { id: string; control_ref: string; status: string; evidence_note: string }[]): AgentProposal {
  if (system.id === 'financeguard-ai') return EVIDENCE_ASSURANCE_PROPOSAL
  return {
    id: `proposal-${system.id}-evidence`,
    agent: 'Evidence and Assurance Agent',
    task: `Review evidence recorded for ${system.name}`,
    systemName: system.name,
    sources: rows.map((row) => row.id),
    assumptions: ['Apparent sufficiency is not a validation result.'],
    proposedChange: rows.length
      ? rows.map((row) => `${row.control_ref} is ${row.status}. ${row.evidence_note}`).join(' ')
      : `No evidence notes are recorded for ${system.name}.`,
    validation: 'This demonstration runs agents in deterministic mode. Production deployments can optionally use Amazon Bedrock for evidence-grounded drafting. No model was called. This is not an approval.',
    status: 'Draft',
    reviewerRole: 'control_owner',
  }
}

export function IsoSystem() {
  const { systemId } = useParams()
  const { packages } = useRegistry()
  const { forSubject } = useEvidence()
  const pack = packages.find((item) => item.systemId === systemId)
  const system = systemById(systemId)
  const name = system?.name ?? pack?.systemName
  if (!name || !systemId) {
    return <EmptyState title="This AI system is not in the estate" nextStep="Return to the ISO/IEC 42001 list." action={<Link to="/assess/iso42001">All ISO/IEC 42001 mappings</Link>} />
  }
  const rows = [...isoRecords.filter((mapping) => mapping.ai_system_id === systemId), ...(pack?.iso ?? [])].map((mapping) => ({
    id: mapping.id,
    control_ref: mapping.control_ref,
    control_title: mapping.control_title,
    status: mapping.status,
    evidence_note: mapping.evidence_note,
    owner: mapping.owner,
    qualifier: 'provenance' in mapping ? evidenceQualifier(mapping) : 'Evidence missing',
  }))
  const subject = system ?? { id: systemId, name }
  return (
    <Card
      title={`ISO/IEC 42001: ${name}`}
      description="Implemented requires current evidence and a completed validation. This is not certification. Open a control to link evidence. Accepting that evidence does not mark the control Implemented."
      action={
        <span className="button-row">
          <Link to="/assess/iso42001">All systems</Link>
          <RunAgentButton proposal={mappingProposal(subject, rows)} label="Run Framework Mapping Agent" />
          <RunAgentButton proposal={evidenceProposal(subject, rows)} label="Run Evidence and Assurance Agent" />
        </span>
      }
    >
      <DataTable
        caption={`ISO/IEC 42001 control mappings for ${name}`}
        rows={rows}
        rowKey={(mapping) => mapping.id}
        empty={<EmptyState title="No controls mapped" nextStep="This system has no ISO/IEC 42001 mappings in the demonstration records." />}
        columns={[
          { header: 'Control', mono: true, cell: (mapping) => <Link to={`/assess/iso42001/${systemId}/controls/${mapping.id}`}>{mapping.control_ref}</Link> },
          { header: 'Title', cell: (mapping) => <Link to={`/assess/iso42001/${systemId}/controls/${mapping.id}`}>{mapping.control_title}</Link> },
          { header: 'Status and evidence', cell: (mapping) => <StatusBadge label={mapping.status} qualifier={mapping.qualifier} /> },
          { header: 'Evidence record', cell: (mapping) => evidenceSummary(forSubject(mapping.id)) },
          { header: 'Evidence note', cell: (mapping) => mapping.evidence_note },
          { header: 'Owner', cell: (mapping) => mapping.owner },
        ]}
      />
    </Card>
  )
}

export function ControlRecord() {
  const { systemId, mappingId } = useParams()
  const { session } = useAuth()
  const { packages } = useRegistry()
  const { overlay, decide } = useWorkflow()
  const pack = packages.find((item) => item.systemId === systemId)
  const mapping = isoRecords.find((item) => item.id === mappingId) ?? pack?.iso.find((item) => item.id === mappingId)
  const name = systemById(systemId)?.name ?? pack?.systemName
  if (!mapping || !systemId) {
    return <EmptyState title="This control mapping is not on the record" nextStep="Return to the system mappings." action={<Link to={systemId ? `/assess/iso42001/${systemId}` : '/assess/iso42001'}>Control mappings</Link>} />
  }
  const item = overlay(mapping.id, mapping.status)
  const actor = session?.persona.display_name || 'Named reviewer'
  return (
    <div className="stack">
      <Card
        title={`${mapping.control_ref}: ${mapping.control_title}`}
        description={`${name ?? systemId}. A mapping is not certification. Approving records the control owner's review. It does not mark the control Implemented.`}
        action={<span className="button-row"><Link to={`/assess/iso42001/${systemId}`}>All mappings</Link><StatusBadge label={mapping.status} /></span>}
      >
        <p>{mapping.evidence_note}</p>
        <p>Owner: {mapping.owner}. Named approver: Control Owner.</p>
      </Card>
      <EvidenceManager subjectId={mapping.id} subjectLabel={`${mapping.control_ref} on ${name ?? systemId}`} />
      <DecisionPanel
        approver="Control Owner"
        actor={actor}
        canDecide={session?.persona.role === 'control_owner' && item.state !== 'Approved' && item.state !== 'Rejected'}
        closed={item.state === 'Approved' || item.state === 'Rejected'}
        reviews={item.reviews}
        onDecide={(status, comments) => decide(mapping.id, mapping.status, status, comments, actor)}
        closedNote="The review is recorded. The mapping status above stays as it was."
      />
    </div>
  )
}

export function Soc2Index() {
  const { packages } = useRegistry()
  const rows = listedSystems(packages.map((item) => ({ id: item.systemId, name: item.systemName })))
  const assessmentFor = (systemId: string) => soc2Records.find((item) => item.ai_system_id === systemId) ?? packages.find((item) => item.systemId === systemId)?.soc2
  return (
    <div className="stack">
    <Soc2ScopePanel />
    <Card
      title="SOC 2 readiness"
      titleAccessory={<Soc2InfoButton />}
      description="Each AI system has its own readiness assessment against Security and Confidentiality. A newly registered system is assessed automatically for Internal Audit and the AI Governance Lead. This is not an auditor opinion or a SOC 2 report."
    >
      <DataTable
        caption="SOC 2 readiness by AI system"
        rows={rows}
        rowKey={(system) => system.id}
        columns={[
          { header: 'AI system', cell: (system) => <Link to={`/assess/soc2/${system.id}`}>{system.name}</Link> },
          {
            header: 'As of',
            cell: (system) => assessmentFor(system.id)?.as_of ?? 'Not assessed',
          },
          {
            header: 'Recommendation',
            cell: (system) => {
              const assessment = assessmentFor(system.id)
              return assessment ? <StatusBadge label={assessment.expected_recommendation} /> : <StatusBadge label="Not assessed" />
            },
          },
          {
            header: 'Criteria',
            cell: (system) => assessmentFor(system.id)?.criteria.length ?? 0,
          },
        ]}
      />
    </Card>
    </div>
  )
}

export function Soc2System() {
  const { systemId } = useParams()
  const { packages } = useRegistry()
  const pack = packages.find((item) => item.systemId === systemId)
  const system = systemById(systemId)
  const name = system?.name ?? pack?.systemName
  if (!name) {
    return <EmptyState title="This AI system is not in the estate" nextStep="Return to the SOC 2 list." action={<Link to="/assess/soc2">All SOC 2 assessments</Link>} />
  }
  const assessment = soc2Records.find((item) => item.ai_system_id === systemId) ?? pack?.soc2
  if (!assessment) {
    return (
      <Card title={`SOC 2 readiness: ${name}`} titleAccessory={<Soc2InfoButton />} description="Internal readiness assessment. Not an auditor opinion or SOC 2 report." action={<Link to="/assess/soc2">All systems</Link>}>
        <EmptyState title="No readiness assessment" nextStep="This system has no SOC 2 readiness record in the demonstration data." />
      </Card>
    )
  }
  return (
    <div className="stack">
    <Card
      title={`SOC 2 readiness: ${name}`}
      titleAccessory={<Soc2InfoButton />}
      description={`Internal readiness assessment as of ${assessment.as_of}. Security is the Common Criteria. Confidentiality is the C category. Not an auditor opinion or SOC 2 report.`}
      action={
        <span className="button-row">
          <Link to="/assess/soc2">All systems</Link>
          <StatusBadge label={assessment.expected_recommendation} />
        </span>
      }
    >
          <DataTable
            caption="Trust Services Criteria readiness results"
            rows={assessment.criteria}
            rowKey={(c) => c.criterion_id}
            columns={[
              { header: 'Criterion', mono: true, cell: (c) => c.criterion_id },
              { header: 'TSC category', cell: (c) => tscCategory(c) },
              { header: 'Control', cell: (c) => c.name },
              { header: 'Result', cell: (c) => <StatusBadge label={c.result} qualifier={c.blocking ? 'Blocking' : undefined} /> },
              { header: 'Observation', cell: (c) => c.note },
            ]}
          />
          {assessment.mandatory_conditions.length > 0 || assessment.criteria.some((c) => 'conditional_path' in c) ? (
            <div className="conditions">
              <h3>Conditions before fieldwork</h3>
              <ul>
                {[...assessment.criteria.flatMap((c) => ('conditional_path' in c ? c.conditional_path : [])), ...assessment.mandatory_conditions].map((condition) => (
                  <li key={condition.id}>
                    {condition.description} <span className="muted">Owner: {condition.owner}. Due {condition.due_date}. Evidence: {condition.required_evidence}.</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="card-footnote">A blocking Fail with no conditional path produces No-Go.</p>
          )}
    </Card>
    <Soc2EvidencePanel criteria={assessment.criteria} />
    </div>
  )
}

